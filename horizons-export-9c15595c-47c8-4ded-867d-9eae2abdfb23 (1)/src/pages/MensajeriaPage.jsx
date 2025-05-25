import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { AuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import MensajeriaForm from '@/components/mensajeria/MensajeriaForm';
import HistorialMensajes from '@/components/mensajeria/HistorialMensajes';
import { supabase } from '@/lib/supabaseClient';

const MensajeriaPage = () => {
  const { embarcacionesRegistradas, mensajesEnviados, fetchData } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const { toast } = useToast();

  const [selectedEmbarcacionesFolios, setSelectedEmbarcacionesFolios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: '', description: '' });
  
  const [historialSearchTerm, setHistorialSearchTerm] = useState('');
  const [historialDateFilter, setHistorialDateFilter] = useState('');

  const embarcacionesDespachadas = useMemo(() => {
    if (!embarcacionesRegistradas) return [];
    return embarcacionesRegistradas.filter(emb => {
        const esDespachada = emb.estado === 'Despachada';
        if (currentUser?.role === 'Administrador') return esDespachada;
        if (currentUser?.role === 'Operador') return esDespachada && emb.basificacion === currentUser.basificacion;
        return false; 
    });
  }, [embarcacionesRegistradas, currentUser]);

  const handleToggleEmbarcacionSelection = (folio) => {
    setSelectedEmbarcacionesFolios(prevSelected =>
      prevSelected.includes(folio)
        ? prevSelected.filter(f => f !== folio)
        : [...prevSelected, folio]
    );
  };

  const handleSelectAllEmbarcaciones = () => {
    if (selectedEmbarcacionesFolios.length === embarcacionesDespachadas.length) {
      setSelectedEmbarcacionesFolios([]);
    } else {
      setSelectedEmbarcacionesFolios(embarcacionesDespachadas.map(emb => emb.folio));
    }
  };

  const getAllNumerosFromEmbarcacion = (embarcacion) => {
    const numeros = new Set();
    if (embarcacion.comunicacion_abordo) numeros.add(embarcacion.comunicacion_abordo.split(',')[0].trim()); 
    if (embarcacion.propietario_telefono) numeros.add(embarcacion.propietario_telefono);
    if (embarcacion.patron_telefono) numeros.add(embarcacion.patron_telefono);
    embarcacion.tripulantes?.forEach(t => { if (t.telefono) numeros.add(t.telefono); });
    embarcacion.pasajeros?.forEach(p => { if (p.telefono) numeros.add(p.telefono); });
    return Array.from(numeros);
  };

  const formatPhoneNumber = (number) => {
    let cleanNumber = String(number).replace(/\D/g, '');
    if (cleanNumber.startsWith('53')) {
      return `+${cleanNumber}`;
    }
    return `+53${cleanNumber}`;
  };

  const handleSendMessage = async () => { 
    if (selectedEmbarcacionesFolios.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Seleccione al menos una embarcación." });
      return;
    }
    if (!mensaje.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El mensaje no puede estar vacío." });
      return;
    }

    setIsSending(true);
    let smsEnviadosCount = 0;
    const destinatariosInfo = [];

    for (const folio of selectedEmbarcacionesFolios) {
      const embarcacion = embarcacionesRegistradas.find(emb => emb.folio === folio);
      if (!embarcacion) continue;

      destinatariosInfo.push({ nombre: embarcacion.nombre_embarcacion, folio: embarcacion.folio });

      const numerosEmbarcacion = getAllNumerosFromEmbarcacion(embarcacion);
      const numerosUnicos = new Set(numerosEmbarcacion.map(formatPhoneNumber));
      
      numerosUnicos.forEach(numero => {
        const smsLink = `sms:${numero}?body=${encodeURIComponent(mensaje)}`;
        window.open(smsLink, '_blank'); 
        smsEnviadosCount++;
      });
      
      if (numerosUnicos.size > 0) {
        const { error } = await supabase.from('mensajes').insert({
          fecha: new Date().toISOString(),
          destinatario_info: { nombre: embarcacion.nombre_embarcacion, folio: embarcacion.folio },
          metodo_envio: 'SMS',
          texto: mensaje,
          enviado_por_id: currentUser?.id
        });
        if (error) {
          console.error("Error guardando mensaje SMS en Supabase:", error);
          toast({ variant: "destructive", title: "Error DB", description: "No se pudo guardar el mensaje en el historial."});
        }
      }
    }
    
    if (smsEnviadosCount > 0) {
      setConfirmModalContent({ title: "Intento de Envío SMS Múltiple", description: `Se intentó abrir la aplicación de mensajería para ${smsEnviadosCount} número(s) único(s) de las embarcaciones seleccionadas. Por favor, confirme los envíos en su dispositivo.` });
      fetchData(); 
    } else {
      toast({ variant: "destructive", title: "Error SMS", description: "Ninguna de las embarcaciones seleccionadas tiene números de teléfono válidos para enviar SMS." });
      setIsSending(false);
      return;
    }

    setIsSending(false);
    setMensaje('');
    setSelectedEmbarcacionesFolios([]);
    setShowConfirmModal(true);
  };

  const filteredHistorial = useMemo(() => {
    if (!mensajesEnviados) return [];
    return mensajesEnviados.filter(msg => {
      const destinatarioNombre = msg.destinatario_info?.nombre || '';
      const searchTermMatch = historialSearchTerm ? destinatarioNombre.toLowerCase().includes(historialSearchTerm.toLowerCase()) || msg.texto.toLowerCase().includes(historialSearchTerm.toLowerCase()) : true;
      const dateMatch = historialDateFilter ? new Date(msg.fecha).toISOString().slice(0,10) === historialDateFilter : true;
      
      if (currentUser?.role === 'Operador') {
         const embFolio = msg.destinatario_info?.folio;
         const embarcacion = embarcacionesRegistradas.find(e => e.folio === embFolio);
         return searchTermMatch && dateMatch && embarcacion && embarcacion.basificacion === currentUser.basificacion;
      }
      return searchTermMatch && dateMatch;
    });
  }, [mensajesEnviados, historialSearchTerm, historialDateFilter, currentUser, embarcacionesRegistradas]);


  return (
    <motion.div
      className="container mx-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center">
        <MessageCircle className="inline-block mr-3 h-10 w-10" />
        Mensajería Urgente (SMS)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <MensajeriaForm
          embarcacionesDespachadas={embarcacionesDespachadas}
          selectedEmbarcacionesFolios={selectedEmbarcacionesFolios}
          handleToggleEmbarcacionSelection={handleToggleEmbarcacionSelection}
          handleSelectAllEmbarcaciones={handleSelectAllEmbarcaciones}
          mensaje={mensaje}
          setMensaje={setMensaje}
          isSending={isSending}
          handleSendMessage={handleSendMessage}
        />
        <motion.div 
          className="lg:col-span-1 bg-card dark:bg-slate-800 p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
           <h2 className="text-2xl font-semibold text-primary dark:text-primary-foreground mb-6">Información Adicional</h2>
           <p className="text-muted-foreground text-sm">
             Esta sección permite enviar mensajes urgentes por SMS a las embarcaciones que se encuentran actualmente despachadas.
           </p>
           <ul className="list-disc list-inside text-muted-foreground text-sm mt-4 space-y-1">
            <li>Seleccione una o varias embarcaciones de la lista, o use "Seleccionar Todas".</li>
            <li>Escriba el mensaje que desea enviar.</li>
            <li>El envío por SMS intentará usar la app de mensajería de su dispositivo para todos los números de contacto registrados en las embarcaciones seleccionadas (propietario, patrón, tripulantes, pasajeros, comunicación a bordo). Cada número único recibirá el intento de SMS.</li>
           </ul>
        </motion.div>
      </div>
      
      <HistorialMensajes
        filteredHistorial={filteredHistorial}
        historialSearchTerm={historialSearchTerm}
        setHistorialSearchTerm={setHistorialSearchTerm}
        historialDateFilter={historialDateFilter}
        setHistorialDateFilter={setHistorialDateFilter}
      />

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmModalContent.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            {confirmModalContent.description}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setShowConfirmModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MensajeriaPage;