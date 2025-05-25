import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { Send, MessageCircle, Loader2, CheckSquare, Square, Ship } from 'lucide-react';

const MensajeriaForm = ({
  embarcacionesDespachadas,
  selectedEmbarcacionesFolios,
  handleToggleEmbarcacionSelection,
  handleSelectAllEmbarcaciones,
  mensaje,
  setMensaje,
  isSending,
  handleSendMessage
}) => {
  return (
    <motion.div 
      className="lg:col-span-2 bg-card dark:bg-slate-800 p-6 rounded-xl shadow-lg"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="text-2xl font-semibold text-primary dark:text-primary-foreground mb-6">Enviar Nuevo Mensaje</h2>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="embarcacionDestino">Seleccionar Embarcación(es)</Label>
            <Button variant="link" size="sm" onClick={handleSelectAllEmbarcaciones} className="text-primary dark:text-primary-foreground">
              {selectedEmbarcacionesFolios.length === embarcacionesDespachadas.length && embarcacionesDespachadas.length > 0 ? <CheckSquare className="mr-1 h-4 w-4" /> : <Square className="mr-1 h-4 w-4" />}
              {selectedEmbarcacionesFolios.length === embarcacionesDespachadas.length && embarcacionesDespachadas.length > 0 ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
            </Button>
          </div>
          <ScrollArea className="h-48 w-full rounded-md border p-2 bg-background/50 dark:bg-slate-700/50">
            {embarcacionesDespachadas.length > 0 ? embarcacionesDespachadas.map(emb => (
              <div 
                key={emb.folio} 
                onClick={() => handleToggleEmbarcacionSelection(emb.folio)}
                className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors ${selectedEmbarcacionesFolios.includes(emb.folio) ? 'bg-primary/20 dark:bg-primary/30' : ''}`}
              >
                {selectedEmbarcacionesFolios.includes(emb.folio) ? <CheckSquare className="mr-2 h-5 w-5 text-primary" /> : <Square className="mr-2 h-5 w-5 text-muted-foreground" />}
                <Ship className="mr-2 h-5 w-5 text-indigo-500" />
                <span className="font-medium">{emb.nombreEmbarcacion}</span>
                <span className="ml-2 text-xs text-muted-foreground">({emb.folio})</span>
              </div>
            )) : <p className="text-sm text-muted-foreground p-2">No hay embarcaciones despachadas para seleccionar.</p>}
          </ScrollArea>
          {selectedEmbarcacionesFolios.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{selectedEmbarcacionesFolios.length} embarcacion(es) seleccionada(s).</p>
          )}
        </div>

        <div>
          <Label htmlFor="mensajeTexto">Mensaje</Label>
          <Textarea 
            id="mensajeTexto" 
            value={mensaje} 
            onChange={(e) => setMensaje(e.target.value)} 
            placeholder="Escriba su mensaje aquí..." 
            rows={5}
            className="resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => handleSendMessage('SMS')} 
            disabled={isSending || selectedEmbarcacionesFolios.length === 0 || !mensaje.trim()}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
          >
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar por SMS
          </Button>
          <Button 
            onClick={() => handleSendMessage('WhatsApp')} 
            disabled={isSending || selectedEmbarcacionesFolios.length === 0 || !mensaje.trim()}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
            Enviar por WhatsApp (Simulado)
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default MensajeriaForm;