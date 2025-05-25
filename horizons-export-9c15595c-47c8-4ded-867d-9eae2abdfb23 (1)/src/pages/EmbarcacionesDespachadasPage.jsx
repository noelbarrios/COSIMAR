import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Ship, Clock, Search, CalendarCheck2 } from 'lucide-react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';

const EmbarcacionesDespachadasPage = () => {
  const { embarcacionesRegistradas, fetchData } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTimers, setActiveTimers] = useState({});
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [entradaData, setEntradaData] = useState({ folio: null, fechaHoraLlegada: new Date(), observaciones: '' });

  const embarcacionesFiltradasYDespachadas = useMemo(() => {
    if (!embarcacionesRegistradas) return [];
    return embarcacionesRegistradas.filter(emb => {
      const esDespachada = emb.estado === 'Despachada';
      let coincideRestricciones = true;

      if (currentUser?.role === 'Operador') {
        coincideRestricciones = emb.basificacion === currentUser.basificacion;
      } else if (currentUser?.role === 'Operador Propietario') {
        coincideRestricciones = emb.folio === currentUser.folio_embarcacion_propietario;
      }
      
      const coincideBusqueda = searchTerm 
        ? emb.nombre_embarcacion.toLowerCase().includes(searchTerm.toLowerCase()) || 
          emb.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emb.zona_despacho.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return esDespachada && coincideRestricciones && coincideBusqueda;
    });
  }, [embarcacionesRegistradas, currentUser, searchTerm]);


  useEffect(() => {
    const now = Date.now();
    const updatedTimers = {};

    embarcacionesFiltradasYDespachadas.forEach(emb => {
      if (emb.estado === 'Despachada' && emb.fecha_hora_salida && emb.tiempo_despacho) { // tiempo_despacho está en segundos
        const salidaTime = new Date(emb.fecha_hora_salida).getTime();
        const endTime = salidaTime + emb.tiempo_despacho * 1000;
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        updatedTimers[emb.folio] = timeLeft;
      }
    });
    setActiveTimers(updatedTimers);
  }, [embarcacionesFiltradasYDespachadas]);


  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(currentTimers => {
        const newTimers = { ...currentTimers };
        let changed = false;
        Object.keys(newTimers).forEach(folio => {
          if (newTimers[folio] > 0) {
            newTimers[folio] -= 1;
            changed = true;
          }
        });
        return changed ? newTimers : currentTimers;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // No dependencies, so it runs once and cleans up on unmount

  const formatTime = (totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null) return "Calculando...";
    if (totalSeconds <= 0) return "Vencido";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getTimeColor = (totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null) return 'text-gray-500';
    if (totalSeconds <= 0) return 'text-red-500 animate-pulse font-bold';
    if (totalSeconds <= 3600) return 'text-yellow-500 font-semibold'; 
    return 'text-green-500';
  };

  const handleOpenEntradaModal = (folio) => {
    setEntradaData({ folio, fechaHoraLlegada: new Date(), observaciones: '' });
    setShowEntradaModal(true);
  };

  const handleRegistrarEntrada = async () => {
    if (!entradaData.folio || !currentUser) return;

    const embarcacionTarget = embarcacionesRegistradas.find(e => e.folio === entradaData.folio);
    if (!embarcacionTarget) {
        toast({ variant: "destructive", title: "Error", description: "Embarcación no encontrada."});
        return;
    }

    if (currentUser?.role === 'Operador Propietario' && entradaData.folio !== currentUser.folio_embarcacion_propietario) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo puede registrar la entrada de su propia embarcación."});
        return;
    }
     if (currentUser?.role === 'Operador' && embarcacionTarget.basificacion !== currentUser.basificacion) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo puede registrar la entrada de embarcaciones de su basificación."});
        return;
    }


    const { error } = await supabase
      .from('embarcaciones')
      .update({ 
        estado: 'En puerto', 
        fecha_hora_entrada: entradaData.fechaHoraLlegada.toISOString(),
        observaciones_entrada: entradaData.observaciones,
        usuario_registro_entrada_id: currentUser.id
      })
      .eq('folio', entradaData.folio);

    if (error) {
      toast({ variant: "destructive", title: "Error al registrar entrada", description: error.message });
    } else {
      setActiveTimers(prev => {
        const newTimers = {...prev};
        delete newTimers[entradaData.folio];
        return newTimers;
      });
      toast({ title: "Entrada Registrada", description: `La embarcación con folio ${entradaData.folio} ha regresado a puerto.` });
      setShowEntradaModal(false);
      fetchData(); // Refresh data from AppContext
    }
  };

  return (
    <motion.div
      className="container mx-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center">
        <Clock className="inline-block mr-3 h-10 w-10" />
        Embarcaciones Despachadas
      </h1>

      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg shadow">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar por nombre, folio o destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-full">
          <TableHeader className="bg-slate-100 dark:bg-slate-800">
            <TableRow>
              <TableHead>Nombre Embarcación</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha/Hora Salida</TableHead>
              <TableHead>Destino (Zona)</TableHead>
              <TableHead>Tiempo Restante</TableHead>
              <TableHead>Basificación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {embarcacionesFiltradasYDespachadas.length > 0 ? embarcacionesFiltradasYDespachadas.map((emb) => (
              <TableRow key={emb.id || emb.folio} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <TableCell className="font-medium">{emb.nombre_embarcacion}</TableCell>
                <TableCell>{emb.folio}</TableCell>
                <TableCell>{format(parseISO(emb.fecha_hora_salida), 'dd/MM/yy HH:mm', { locale: es })}</TableCell>
                <TableCell>{emb.zona_despacho}</TableCell>
                <TableCell className={getTimeColor(activeTimers[emb.folio])}>
                  {formatTime(activeTimers[emb.folio])}
                </TableCell>
                <TableCell>{emb.basificacion}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenEntradaModal(emb.folio)} 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    title="Registrar Entrada"
                  >
                    <CalendarCheck2 className="mr-1 h-4 w-4" /> Registrar Entrada
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay embarcaciones despachadas que coincidan con los filtros o sus permisos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showEntradaModal} onOpenChange={setShowEntradaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CalendarCheck2 className="mr-2 h-6 w-6 text-emerald-500" />
              Registrar Entrada de Embarcación
            </DialogTitle>
            <DialogDescription>
              Folio: {entradaData.folio}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fechaHoraLlegada">Fecha y Hora de Llegada</Label>
              <Input 
                id="fechaHoraLlegada" 
                type="datetime-local" 
                value={format(entradaData.fechaHoraLlegada, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setEntradaData(prev => ({ ...prev, fechaHoraLlegada: new Date(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Textarea 
                id="observaciones"
                value={entradaData.observaciones}
                onChange={(e) => setEntradaData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Añada cualquier observación relevante..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntradaModal(false)}>Cancelar</Button>
            <Button onClick={handleRegistrarEntrada} className="bg-emerald-500 hover:bg-emerald-600">Confirmar Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default EmbarcacionesDespachadasPage;