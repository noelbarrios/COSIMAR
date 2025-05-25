import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarPlus as CalendarIcon, Ship, Anchor, HelpCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DetallesEmbarcacionForm = ({ formData, handleChange, handleSelectChange, handleDateChange, errors, currentUser }) => {
  return (
    <>
      <h2 className="text-xl font-semibold text-primary dark:text-primary-foreground mb-4 border-b pb-2 flex items-center">
        <Ship className="mr-2 h-6 w-6" /> Detalles de la Embarcación
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="nombreEmbarcacion">Nombre de la Embarcación</Label>
          <Input 
            id="nombreEmbarcacion" 
            name="nombreEmbarcacion" 
            value={formData.nombreEmbarcacion} 
            onChange={handleChange} 
            className={errors.nombreEmbarcacion ? 'border-red-500' : ''} 
            readOnly={currentUser?.role === 'Operador Propietario' && formData.nombreEmbarcacion !== ''}
          />
          {errors.nombreEmbarcacion && <p className="text-sm text-red-500 mt-1">{errors.nombreEmbarcacion}</p>}
        </div>
        <div>
          <Label htmlFor="folio">Folio</Label>
          <Input 
            id="folio" 
            name="folio" 
            value={formData.folio} 
            onChange={handleChange} 
            className={errors.folio ? 'border-red-500' : ''} 
            readOnly={currentUser?.role === 'Operador Propietario' && formData.folio !== ''}
          />
          {errors.folio && <p className="text-sm text-red-500 mt-1">{errors.folio}</p>}
        </div>
        <div>
          <Label htmlFor="basificacion" className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-blue-500" />Basificación (Lugar de Atraque)</Label>
          <Input 
            id="basificacion" 
            name="basificacion" 
            value={formData.basificacion} 
            onChange={handleChange} 
            className={errors.basificacion ? 'border-red-500' : ''}
            readOnly={(currentUser?.role === 'Operador' || currentUser?.role === 'Operador Propietario') && formData.basificacion !== ''}
            placeholder="Ej: Muelle Guardacostas Varadero"
          />
          {errors.basificacion && <p className="text-sm text-red-500 mt-1">{errors.basificacion}</p>}
        </div>
        <div>
          <Label htmlFor="zonaDespacho" className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-green-500" />Zona de Despacho (Destino)</Label>
          <Input id="zonaDespacho" name="zonaDespacho" value={formData.zonaDespacho} onChange={handleChange} className={errors.zonaDespacho ? 'border-red-500' : ''} placeholder="Ej: Cayo Blanco, Pesca al claro"/>
          {errors.zonaDespacho && <p className="text-sm text-red-500 mt-1">{errors.zonaDespacho}</p>}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor="tiempoDespacho">Tiempo de Despacho</Label>
            <Input id="tiempoDespacho" name="tiempoDespacho" type="number" value={formData.tiempoDespacho} onChange={handleChange} className={errors.tiempoDespacho ? 'border-red-500' : ''} />
            {errors.tiempoDespacho && <p className="text-sm text-red-500 mt-1">{errors.tiempoDespacho}</p>}
          </div>
          <Select name="unidadTiempoDespacho" value={formData.unidadTiempoDespacho} onValueChange={(value) => handleSelectChange('unidadTiempoDespacho', value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horas">Horas</SelectItem>
              <SelectItem value="dias">Días</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fechaHoraSalida">Fecha y Hora de Salida</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.fechaHoraSalida && "text-muted-foreground",
                  errors.fechaHoraSalida && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.fechaHoraSalida ? format(formData.fechaHoraSalida, "PPP HH:mm") : <span>Seleccione fecha y hora</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.fechaHoraSalida}
                onSelect={(date) => {
                  const now = new Date();
                  const selectedDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes()) : null;
                  handleDateChange(selectedDate);
                }}
                initialFocus
              />
              <div className="p-2 border-t border-border">
                <Label htmlFor="time">Hora:</Label>
                <Input type="time" id="time" defaultValue={formData.fechaHoraSalida ? format(formData.fechaHoraSalida, "HH:mm") : format(new Date(), "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newDate = formData.fechaHoraSalida ? new Date(formData.fechaHoraSalida) : new Date();
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    handleDateChange(newDate);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
          {errors.fechaHoraSalida && <p className="text-sm text-red-500 mt-1">{errors.fechaHoraSalida}</p>}
        </div>
        <div>
          <Label htmlFor="propulsion" className="flex items-center"><Anchor className="mr-2 h-5 w-5"/>Propulsión</Label>
          <Select name="propulsion" value={formData.propulsion} onValueChange={(value) => handleSelectChange('propulsion', value)}>
            <SelectTrigger className={errors.propulsion ? 'border-red-500' : ''}><SelectValue placeholder="Seleccione propulsión" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="remo">Remo</SelectItem>
              <SelectItem value="vela">Vela</SelectItem>
              <SelectItem value="motor">Motor</SelectItem>
              <SelectItem value="otros">Otros (especificar)</SelectItem>
            </SelectContent>
          </Select>
          {errors.propulsion && <p className="text-sm text-red-500 mt-1">{errors.propulsion}</p>}
        </div>
        {formData.propulsion === 'otros' && (
          <div>
            <Label htmlFor="otraPropulsion" className="flex items-center"><HelpCircle className="mr-2 h-5 w-5"/>Especificar Propulsión</Label>
            <Input id="otraPropulsion" name="otraPropulsion" value={formData.otraPropulsion} onChange={handleChange} className={errors.otraPropulsion ? 'border-red-500' : ''}/>
            {errors.otraPropulsion && <p className="text-sm text-red-500 mt-1">{errors.otraPropulsion}</p>}
          </div>
        )}
      </div>
    </>
  );
};

export default DetallesEmbarcacionForm;