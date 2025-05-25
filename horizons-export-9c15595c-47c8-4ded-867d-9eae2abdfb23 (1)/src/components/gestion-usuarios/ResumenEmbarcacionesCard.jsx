import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { BarChartHorizontalBig } from 'lucide-react';

const ResumenEmbarcacionesCard = () => {
  const { embarcacionesRegistradas } = useContext(AppContext);
  const [resumen, setResumen] = useState({});

  useEffect(() => {
    const calcResumen = () => {
      const summary = {};
      embarcacionesRegistradas.forEach(emb => {
        if (!emb.basificacion) return;
        if (!summary[emb.basificacion]) {
          summary[emb.basificacion] = { despachadas: 0, enPuerto: 0 };
        }
        if (emb.estado === 'Despachada') {
          summary[emb.basificacion].despachadas++;
        } else {
          summary[emb.basificacion].enPuerto++;
        }
      });
      setResumen(summary);
    };
    if (embarcacionesRegistradas) {
        calcResumen();
    }
  }, [embarcacionesRegistradas]);

  return (
    <div className="bg-card dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-primary dark:text-primary-foreground mb-4 flex items-center">
        <BarChartHorizontalBig className="mr-2 h-6 w-6" />
        Resumen de Embarcaciones por Basificación
      </h3>
      {Object.keys(resumen).length === 0 ? (
        <p className="text-muted-foreground">No hay datos de embarcaciones para mostrar resumen.</p>
      ) : (
        <ul className="space-y-1 text-muted-foreground">
          {Object.entries(resumen).map(([basif, counts]) => (
            <li key={basif}>{basif}: {counts.despachadas} Despachadas, {counts.enPuerto} En Puerto</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResumenEmbarcacionesCard;