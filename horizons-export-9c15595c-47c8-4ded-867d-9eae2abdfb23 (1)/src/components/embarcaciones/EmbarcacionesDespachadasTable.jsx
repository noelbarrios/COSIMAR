import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const EmbarcacionesDespachadasTable = ({ embarcaciones, activeTimers, onRegistrarEntrada }) => {
  const formatTime = (totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) return "-";
    if (totalSeconds === 0) return "Vencido";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getTimeColor = (totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) return '';
    if (totalSeconds === 0) return 'text-red-500 animate-pulse font-bold';
    if (totalSeconds <= 3600) return 'text-yellow-500 font-semibold';
    return 'text-green-500';
  };

  const displayedEmbarcaciones = embarcaciones.filter(emb => emb.estado === 'Despachada');

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-primary dark:text-primary-foreground mb-6">Embarcaciones Despachadas Actualmente</h2>
      <div className="overflow-x-auto bg-card dark:bg-slate-800 p-4 rounded-lg shadow-md">
        {displayedEmbarcaciones.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No hay embarcaciones despachadas actualmente.</p>
        ) : (
          <Table className="w-full min-w-[1000px] text-sm text-left text-foreground dark:text-slate-300">
            <TableHeader className="text-xs uppercase bg-muted dark:bg-slate-700">
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Folio</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Zona Despacho</TableHead>
                <TableHead>Propietario/Patrón</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Tiempo Restante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedEmbarcaciones.map((emb) => (
                <TableRow key={emb.id || emb.folio} className="border-b dark:border-slate-700 hover:bg-accent dark:hover:bg-slate-700/50 transition-colors">
                  <TableCell className="font-medium">{emb.nombreEmbarcacion}</TableCell>
                  <TableCell>{emb.folio}</TableCell>
                  <TableCell>{format(new Date(emb.fechaHoraSalida), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell>{emb.zonaDespacho}</TableCell>
                  <TableCell>
                    {emb.propietarioNombre ? `${emb.propietarioNombre} (CI: ${emb.propietarioCI})` : `${emb.patronNombre} (CI: ${emb.patronCI})`}
                  </TableCell>
                  <TableCell>{`${emb.documentoSalida} - ${emb.numeroPermiso}`}</TableCell>
                  <TableCell className={getTimeColor(activeTimers[emb.folio])}>
                    {formatTime(activeTimers[emb.folio])}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emb.estado === 'Despachada' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                      {emb.estado}
                    </span>
                  </TableCell>
                  <TableCell>
                    {emb.estado === 'Despachada' && (
                      <Button size="sm" onClick={() => onRegistrarEntrada(emb.folio)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        Registrar Entrada
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default EmbarcacionesDespachadasTable;