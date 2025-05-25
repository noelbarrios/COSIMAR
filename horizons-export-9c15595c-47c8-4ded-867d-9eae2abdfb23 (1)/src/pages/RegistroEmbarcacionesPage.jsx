import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { AuthContext } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Ship, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EmbarcacionForm from '@/components/embarcaciones/EmbarcacionForm';
import EmbarcacionesDespachadasTable from '@/components/embarcaciones/EmbarcacionesDespachadasTable';
import { initialFormData, validateFormLogic, checkProhibicionesLogic } from '@/lib/embarcacionesUtils';
import { supabase } from '@/lib/supabaseClient';
import { differenceInSeconds } from 'date-fns';

const RegistroEmbarcacionesPage = () => {
  const { fetchData, embarcacionesRegistradas } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState(() => {
    const baseData = { ...initialFormData };
    if (currentUser?.role === 'Operador') {
      baseData.basificacion = currentUser.basificacion;
    } else if (currentUser?.role === 'Operador Propietario') {
      baseData.basificacion = currentUser.basificacion;
      baseData.nombreEmbarcacion = currentUser.nombre_embarcacion_propietario;
      baseData.folio = currentUser.folio_embarcacion_propietario;
    }
    return baseData;
  });

  const [errors, setErrors] = useState({});
  const [showProhibicionModal, setShowProhibicionModal] = useState(false);
  const [prohibicionMessage, setProhibicionMessage] = useState('');
  const [showConfirmacionModal, setShowConfirmacionModal] = useState(false);
  const [activeTimers, setActiveTimers] = useState({});

  useEffect(() => {
    const now = Date.now();
    const updatedTimers = {};

    embarcacionesRegistradas?.forEach(emb => {
      if (emb.estado === 'Despachada' && emb.fecha_hora_salida && emb.tiempo_despacho) { 
        const salidaTime = new Date(emb.fecha_hora_salida).getTime();
        const endTime = salidaTime + emb.tiempo_despacho * 1000;
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        
        if (timeLeft >= 0) { 
          updatedTimers[emb.folio] = timeLeft;
        }
      }
    });
    setActiveTimers(updatedTimers);
  }, [embarcacionesRegistradas]);


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
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateFormLogic(formData, currentUser);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.propietarioPatron) {
        setProhibicionMessage(validationErrors.propietarioPatron);
        setShowProhibicionModal(true);
      }
      toast({ variant: "destructive", title: "Error de validación", description: "Por favor, corrija los errores en el formulario." });
      return;
    }
    setErrors({});

    const prohibicion = await checkProhibicionesLogic(formData, supabase);
    if (prohibicion) {
      setProhibicionMessage(prohibicion.message);
      setShowProhibicionModal(true);
      return;
    }
    setShowConfirmacionModal(true);
  };

  const handleConfirmRegistro = async () => {
    const tiempoDespachoEnSegundos = parseFloat(formData.tiempoDespacho) * (formData.unidadTiempoDespacho === 'dias' ? 24 * 3600 : 3600);
    
    const embarcacionData = {
      nombre_embarcacion: formData.nombreEmbarcacion,
      folio: formData.folio,
      basificacion: formData.basificacion,
      zona_despacho: formData.zonaDespacho,
      tiempo_despacho: tiempoDespachoEnSegundos,
      unidad_tiempo_despacho: formData.unidadTiempoDespacho,
      fecha_hora_salida: formData.fechaHoraSalida.toISOString(),
      propulsion: formData.propulsion,
      otra_propulsion: formData.propulsion === 'otros' ? formData.otraPropulsion : null,
      
      propietario_nombre: formData.propietarioNombre || null,
      propietario_ci: formData.propietarioCI || null,
      propietario_telefono: formData.propietarioTelefono || null,
      propietario_documento_salida: formData.propietarioDocumentoSalida || null,
      propietario_numero_permiso: formData.propietarioNumeroPermiso || null,
      
      patron_nombre: formData.patronNombre || null,
      patron_ci: formData.patronCI || null,
      patron_telefono: formData.patronTelefono || null,
      patron_documento_salida: formData.patronDocumentoSalida || null,
      patron_numero_permiso: formData.patronNumeroPermiso || null,
      
      comunicacion_abordo: formData.comunicacionAbordo || null,
      estado: 'Despachada',
      usuario_registro_salida_id: currentUser?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: nuevaEmbarcacion, error: insertError } = await supabase
      .from('embarcaciones')
      .insert([embarcacionData])
      .select()
      .single();

    if (insertError) {
      toast({ variant: "destructive", title: "Error al registrar", description: insertError.message });
      setShowConfirmacionModal(false);
      return;
    }

    if (formData.tripulantes.length > 0) {
      const tripulantesData = formData.tripulantes.map(t => ({
        embarcacion_id: nuevaEmbarcacion.id,
        nombre_apellidos: t.nombreApellidos,
        ci: t.ci,
        telefono: t.telefono || null,
        documento_salida: t.documentoSalida || null,
        numero_permiso: t.numeroPermiso || null,
        created_at: new Date().toISOString(),
      }));
      const { error: tripError } = await supabase.from('tripulantes').insert(tripulantesData);
      if (tripError) console.error("Error insertando tripulantes:", tripError);
    }

    if (formData.pasajeros.length > 0) {
      const pasajerosData = formData.pasajeros.map(p => ({
        embarcacion_id: nuevaEmbarcacion.id,
        nombre_apellidos: p.nombreApellidos,
        ci_pasaporte: p.ciPasaporte,
        telefono: p.telefono || null,
        documento_salida: p.documentoSalida || null,
        numero_permiso: p.numeroPermiso || null,
        created_at: new Date().toISOString(),
      }));
      const { error: pasError } = await supabase.from('pasajeros').insert(pasajerosData);
      if (pasError) console.error("Error insertando pasajeros:", pasError);
    }
    
    fetchData(); 
    setActiveTimers(prev => ({ ...prev, [nuevaEmbarcacion.folio]: tiempoDespachoEnSegundos }));
    toast({ title: "Registro Exitoso", description: `${formData.nombreEmbarcacion} ha sido registrada para salida.` });
    
    const resetFormData = { ...initialFormData };
     if (currentUser?.role === 'Operador') {
      resetFormData.basificacion = currentUser.basificacion;
    } else if (currentUser?.role === 'Operador Propietario') {
      resetFormData.basificacion = currentUser.basificacion;
      resetFormData.nombreEmbarcacion = currentUser.nombre_embarcacion_propietario;
      resetFormData.folio = currentUser.folio_embarcacion_propietario;
    }
    setFormData(resetFormData);
    setShowConfirmacionModal(false);
  };
  
  const handleRegistrarEntrada = async (folio) => {
    const embarcacionTarget = embarcacionesRegistradas.find(e => e.folio === folio);
    if (!embarcacionTarget) {
        toast({ variant: "destructive", title: "Error", description: "Embarcación no encontrada."});
        return;
    }

    if (currentUser?.role === 'Operador Propietario' && folio !== currentUser.folio_embarcacion_propietario) {
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
        fecha_hora_entrada: new Date().toISOString(),
        usuario_registro_entrada_id: currentUser?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('folio', folio);

    if (error) {
      toast({ variant: "destructive", title: "Error al registrar entrada", description: error.message });
    } else {
      fetchData(); 
      setActiveTimers(prev => {
        const newTimers = {...prev};
        delete newTimers[folio];
        return newTimers;
      });
      toast({ title: "Entrada Registrada", description: `La embarcación con folio ${folio} ha regresado a puerto.` });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 rounded-xl shadow-2xl">
      <motion.h1 
        className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Ship className="inline-block mr-3 h-10 w-10" />
        Registro de Embarcaciones
      </motion.h1>

      <EmbarcacionForm 
        formData={formData} 
        setFormData={setFormData} 
        errors={errors}
        setErrors={setErrors}
        onSubmit={handleSubmit} 
        currentUser={currentUser}
      />

      <Dialog open={showProhibicionModal} onOpenChange={setShowProhibicionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600"><AlertTriangle className="mr-2 h-6 w-6" />Alerta de Prohibición o Error</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4 text-base">
            {prohibicionMessage}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setShowProhibicionModal(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmacionModal} onOpenChange={setShowConfirmacionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Registro de Salida</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            ¿Está seguro de que desea registrar la salida de la embarcación "{formData.nombreEmbarcacion}" (Folio: {formData.folio})?
            Se iniciará un temporizador de {formData.tiempoDespacho} {formData.unidadTiempoDespacho}.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmacionModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmRegistro} className="bg-green-500 hover:bg-green-600">Confirmar y Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmbarcacionesDespachadasTable
        embarcaciones={embarcacionesRegistradas?.filter(e => e.estado === 'Despachada')}
        activeTimers={activeTimers}
        onRegistrarEntrada={handleRegistrarEntrada}
        currentUser={currentUser}
      />
    </div>
  );
};

export default RegistroEmbarcacionesPage;