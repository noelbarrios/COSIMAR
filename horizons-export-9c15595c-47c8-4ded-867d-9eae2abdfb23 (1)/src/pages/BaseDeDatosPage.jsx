import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { AuthContext } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { format, differenceInSeconds, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download, Database } from 'lucide-react';
import Pagination from '@/components/database/Pagination';
import DataTable from '@/components/database/DataTable';
import DataFilters from '@/components/database/DataFilters';
import { supabase } from '@/lib/supabaseClient'; 
import { cn } from '@/lib/utils';

const BaseDeDatosPage = () => {
  const { embarcacionesRegistradas, users: allUsers, personasObservadas } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBasificacion, setFilterBasificacion] = useState(currentUser?.role === 'Operador' ? currentUser.basificacion : (currentUser?.role === 'Visualizador' && currentUser.basificacion !== 'Todas' ? currentUser.basificacion : ''));
  const [filterFechaDesde, setFilterFechaDesde] = useState(null);
  const [filterFechaHasta, setFilterFechaHasta] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'fecha_hora_salida', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getUsernameById = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? user.username : 'N/A';
  };

  const isPersonaObservada = (ci) => {
    if (!ci || !personasObservadas) return false;
    return personasObservadas.some(p => p.ci_pasaporte === ci);
  };

  const calculateTiempoExcedido = (embarcacion) => {
    if (embarcacion.estado === 'En puerto' && embarcacion.fecha_hora_entrada && embarcacion.fecha_hora_salida && embarcacion.tiempo_despacho) {
      const salida = new Date(embarcacion.fecha_hora_salida);
      const entrada = new Date(embarcacion.fecha_hora_entrada);
      const tiempoAutorizadoSegundos = embarcacion.tiempo_despacho; 

      const tiempoRealEnMarSegundos = differenceInSeconds(entrada, salida);
      
      if (tiempoRealEnMarSegundos > tiempoAutorizadoSegundos) {
        const excedidoSegundos = tiempoRealEnMarSegundos - tiempoAutorizadoSegundos;
        return formatDistanceStrict(0, excedidoSegundos * 1000, { locale: es, unit: 'hour', addSuffix: false }) + " excedido";
      }
    }
    return 'N/A';
  };


  const filteredAndSortedData = useMemo(() => {
    let data = embarcacionesRegistradas ? [...embarcacionesRegistradas] : [];

    if (currentUser?.role === 'Operador') {
        data = data.filter(item => item.basificacion === currentUser.basificacion);
    } else if (currentUser?.role === 'Visualizador' && currentUser.basificacion !== 'Todas') {
        data = data.filter(item => item.basificacion === currentUser.basificacion);
    }


    if (searchTerm) {
      data = data.filter(item =>
        Object.entries(item).some(([key, val]) => {
          if (key === 'tripulantes' || key === 'pasajeros') {
            return val.some(p => Object.values(p).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase())));
          }
          return String(val).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    if (filterBasificacion && filterBasificacion !== 'Todas') {
      data = data.filter(item => item.basificacion && item.basificacion.toLowerCase().includes(filterBasificacion.toLowerCase()));
    }

    if (filterFechaDesde) {
      data = data.filter(item => new Date(item.fecha_hora_salida) >= filterFechaDesde);
    }
    if (filterFechaHasta) {
      const hasta = new Date(filterFechaHasta);
      hasta.setHours(23, 59, 59, 999); 
      data = data.filter(item => new Date(item.fecha_hora_salida) <= hasta);
    }
    
    if (sortConfig.key) {
      data.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (['fecha_hora_salida', 'fecha_hora_entrada'].includes(sortConfig.key)) {
          valA = valA ? new Date(valA).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity) ;
          valB = valB ? new Date(valB).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity) ;
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        } else if (typeof valA === 'number') {
           valA = valA || 0;
           valB = valB || 0;
        } else if (valA === null || valA === undefined) {
           valA = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        }
         if (valB === null || valB === undefined) {
           valB = sortConfig.direction === 'ascending' ? Infinity : -Infinity;
        }


        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [embarcacionesRegistradas, searchTerm, filterBasificacion, filterFechaDesde, filterFechaHasta, sortConfig, currentUser]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); 
  };

  const exportToExcel = () => {
    const dataToExport = filteredAndSortedData.map(item => {
      const propietarioDocs = `Doc: ${item.propietario_documento_salida || 'N/A'}, Perm: ${item.propietario_numero_permiso || 'N/A'}`;
      const patronDocs = `Doc: ${item.patron_documento_salida || 'N/A'}, Perm: ${item.patron_numero_permiso || 'N/A'}`;
      return {
        "Nombre Embarcación": item.nombre_embarcacion,
        "Folio": item.folio,
        "Basificación (Atraque)": item.basificacion,
        "Zona Despacho (Destino)": item.zona_despacho,
        "Tiempo Despacho Autorizado": `${item.tiempo_despacho / (item.unidad_tiempo_despacho === 'dias' ? 86400 : 3600)} ${item.unidad_tiempo_despacho}`,
        "Tiempo Excedido": calculateTiempoExcedido(item),
        "Fecha Salida": item.fecha_hora_salida ? format(new Date(item.fecha_hora_salida), 'dd/MM/yyyy HH:mm', { locale: es }) : '',
        "Propulsión": item.propulsion === 'otros' ? item.otra_propulsion : item.propulsion,
        
        "Propietario Nombre": item.propietario_nombre,
        "Propietario CI": item.propietario_ci,
        "Propietario Teléfono": item.propietario_telefono,
        "Propietario Documentos": propietarioDocs,
        "Propietario Observado": isPersonaObservada(item.propietario_ci) ? 'SÍ' : 'NO',
        
        "Patrón Nombre": item.patron_nombre,
        "Patrón CI": item.patron_ci,
        "Patrón Teléfono": item.patron_telefono,
        "Patrón Documentos": patronDocs,
        "Patrón Observado": isPersonaObservada(item.patron_ci) ? 'SÍ' : 'NO',

        "Tripulantes": item.tripulantes?.map(t => `${t.nombre_apellidos} (CI: ${t.ci}, Tel: ${t.telefono || 'N/A'}, Doc: ${t.documento_salida || 'N/A'}, Perm: ${t.numero_permiso || 'N/A'}, Obs: ${isPersonaObservada(t.ci) ? 'SÍ' : 'NO'})`).join('; ') || 'N/A',
        "Pasajeros": item.pasajeros?.map(p => `${p.nombre_apellidos} (CI/Pas: ${p.ci_pasaporte}, Tel: ${p.telefono || 'N/A'}, Doc: ${p.documento_salida || 'N/A'}, Perm: ${p.numero_permiso || 'N/A'}, Obs: ${isPersonaObservada(p.ci_pasaporte) ? 'SÍ' : 'NO'})`).join('; ') || 'N/A',
        
        "Comunicación a Bordo": item.comunicacion_abordo,
        "Fecha Entrada": item.fecha_hora_entrada ? format(new Date(item.fecha_hora_entrada), 'dd/MM/yyyy HH:mm', { locale: es }) : 'No ha entrado',
        "Observaciones Entrada": item.observaciones_entrada,
        "Estado": item.estado,
        "Registró Salida": getUsernameById(item.usuario_registro_salida_id),
        "Registró Entrada": item.usuario_registro_entrada_id ? getUsernameById(item.usuario_registro_entrada_id) : 'N/A',
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DatosEmbarcaciones");
    XLSX.writeFile(workbook, "DatosEmbarcaciones.xlsx");
  };

  const columns = [
    { key: 'nombre_embarcacion', label: 'Nombre Embarcación' },
    { key: 'folio', label: 'Folio' },
    { key: 'basificacion', label: 'Basificación' },
    { key: 'zona_despacho', label: 'Zona Despacho' },
    { key: 'fecha_hora_salida', label: 'Fecha Salida' },
    { key: 'propulsion', label: 'Propulsión' },
    { 
      key: 'propietario_nombre', 
      label: 'Propietario',
      render: (item) => (
        <span className={cn(currentUser?.role === 'Administrador' && isPersonaObservada(item.propietario_ci) && 'text-red-500 font-bold')}>
          {item.propietario_nombre || 'N/A'}
        </span>
      )
    },
    { 
      key: 'patron_nombre', 
      label: 'Patrón',
      render: (item) => (
        <span className={cn(currentUser?.role === 'Administrador' && isPersonaObservada(item.patron_ci) && 'text-red-500 font-bold')}>
          {item.patron_nombre || 'N/A'}
        </span>
      )
    },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha_hora_entrada', label: 'Fecha Entrada' },
    { key: 'tiempo_excedido', label: 'Tiempo Excedido', render: (item) => calculateTiempoExcedido(item)},
    { key: 'usuario_registro_salida_id', label: 'Registró Salida', render: (item) => getUsernameById(item.usuario_registro_salida_id)},
    { key: 'usuario_registro_entrada_id', label: 'Registró Entrada', render: (item) => item.usuario_registro_entrada_id ? getUsernameById(item.usuario_registro_entrada_id) : 'N/A'},
  ];

  const basificacionesUnicas = useMemo(() => {
    if (currentUser?.role === 'Administrador' || (currentUser?.role === 'Visualizador' && currentUser.basificacion === 'Todas')) {
      const zonas = new Set(embarcacionesRegistradas.map(e => e.basificacion).filter(Boolean));
      return ['Todas', ...Array.from(zonas)];
    } else if (currentUser?.basificacion && currentUser.basificacion !== 'Todas') {
      return [currentUser.basificacion];
    }
    return [];
  }, [embarcacionesRegistradas, currentUser]);

  return (
    <motion.div 
      className="container mx-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center flex items-center justify-center">
        <Database className="mr-3 h-10 w-10" />
        Base de Datos de Embarcaciones
      </h1>

      <DataFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        basificacionesUnicas={basificacionesUnicas}
        filterBasificacion={filterBasificacion}
        setFilterBasificacion={setFilterBasificacion}
        filterFechaDesde={filterFechaDesde}
        setFilterFechaDesde={setFilterFechaDesde}
        filterFechaHasta={filterFechaHasta}
        setFilterFechaHasta={setFilterFechaHasta}
        onFilterChange={() => setCurrentPage(1)} 
        currentUser={currentUser}
      />

      <div className="mb-4 flex justify-end">
        <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="mr-2 h-4 w-4" /> Exportar a Excel
        </Button>
      </div>

      { paginatedData.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-lg">No hay datos que coincidan con los filtros aplicados.</p>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedData}
          sortConfig={sortConfig}
          requestSort={requestSort}
          currentUser={currentUser}
          isPersonaObservada={isPersonaObservada}
        />
      )}
      

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </motion.div>
  );
};

export default BaseDeDatosPage;