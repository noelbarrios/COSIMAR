import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, CalendarPlus as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DataFilters = ({ 
  searchTerm, setSearchTerm,
  filterBasificacion, setFilterBasificacion,
  filterFechaDesde, setFilterFechaDesde,
  filterFechaHasta, setFilterFechaHasta,
  onFilterChange 
}) => {
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    if (onFilterChange) onFilterChange();
  };

  const handleBasificacionChange = (e) => {
    setFilterBasificacion(e.target.value);
    if (onFilterChange) onFilterChange();
  };

  const handleFechaDesdeChange = (date) => {
    setFilterFechaDesde(date);
    if (onFilterChange) onFilterChange();
  };

  const handleFechaHastaChange = (date) => {
    setFilterFechaHasta(date);
    if (onFilterChange) onFilterChange();
  };


  return (
    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="dbSearchTerm" className="text-sm font-medium">Buscar</Label>
          <div className="relative">
            <Input
              id="dbSearchTerm"
              type="text"
              placeholder="Nombre, folio, etc..."
              value={searchTerm}
              onChange={handleSearchTermChange}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <Label htmlFor="dbFilterBasificacion" className="text-sm font-medium">Filtrar por Basificación</Label>
          <Input
            id="dbFilterBasificacion"
            type="text"
            placeholder="Ej: Zona Norte"
            value={filterBasificacion}
            onChange={handleBasificacionChange}
          />
        </div>
        <div>
          <Label htmlFor="dbFilterFechaDesde" className="text-sm font-medium">Fecha Salida Desde</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterFechaDesde ? format(filterFechaDesde, 'PPP', { locale: es }) : <span>Seleccione fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={filterFechaDesde} onSelect={handleFechaDesdeChange} initialFocus locale={es} />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="dbFilterFechaHasta" className="text-sm font-medium">Fecha Salida Hasta</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filterFechaHasta ? format(filterFechaHasta, 'PPP', { locale: es }) : <span>Seleccione fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={filterFechaHasta} onSelect={handleFechaHastaChange} initialFocus locale={es} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default DataFilters;