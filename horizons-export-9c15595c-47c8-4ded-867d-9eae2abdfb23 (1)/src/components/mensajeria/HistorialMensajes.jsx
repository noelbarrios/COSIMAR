import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HistorialMensajes = ({
  filteredHistorial,
  historialSearchTerm,
  setHistorialSearchTerm,
  historialDateFilter,
  setHistorialDateFilter
}) => {
  return (
    <motion.div 
      className="mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-2xl font-semibold text-primary dark:text-primary-foreground mb-6">Historial de Mensajes Enviados</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg shadow">
        <div className="relative flex-grow">
          <Input 
            type="text" 
            placeholder="Buscar por destinatario o mensaje..." 
            value={historialSearchTerm}
            onChange={(e) => setHistorialSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <div className="relative">
          <Input 
            type="date" 
            value={historialDateFilter}
            onChange={(e) => setHistorialDateFilter(e.target.value)}
            className="pr-10"
          />
           <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="overflow-x-auto bg-card dark:bg-slate-800 p-4 rounded-lg shadow-md">
        {filteredHistorial.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No hay mensajes en el historial que coincidan con su búsqueda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Enviado Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistorial.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell>{format(new Date(msg.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}</TableCell>
                  <TableCell>{msg.destinatario} ({msg.folioDestinatario})</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${msg.metodoEnvio === 'SMS' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                      {msg.metodoEnvio}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{msg.texto}</TableCell>
                  <TableCell>{msg.enviadoPor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </motion.div>
  );
};

export default HistorialMensajes;