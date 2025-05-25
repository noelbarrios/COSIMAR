import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { User, Users, Trash2, PlusCircle, FileText, Hash } from 'lucide-react';

const PersonaIndividualFields = ({ type, persona, index, onPersonaChange, onNestedSelectChange, onRemove, errors }) => (
  <motion.div 
    key={`${type}-${index}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="p-4 border rounded-md bg-card/50 dark:bg-card/80 space-y-3 mb-3"
  >
    <div className="flex justify-between items-center">
      <Label className="text-sm font-medium capitalize">{type === 'tripulantes' ? 'Tripulante' : (type === 'pasajeros' ? 'Pasajero' : (type.charAt(0).toUpperCase() + type.slice(1)))} {index !== null ? index + 1 : ''}</Label>
      {type !== 'propietario' && type !== 'patron' && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(type, index)} className="text-red-500 hover:text-red-700">
          <Trash2 size={16} />
        </Button>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor={`${type}NombreApellidos_${index === null ? type : index}`}>Nombre y Apellidos</Label>
        <Input 
            id={`${type}NombreApellidos_${index === null ? type : index}`} 
            name={index === null ? `${type}Nombre` : 'nombreApellidos'} 
            value={index === null ? persona[`${type}Nombre`] : persona.nombreApellidos} 
            onChange={(e) => onPersonaChange(type, index, index === null ? `${type}Nombre` : 'nombreApellidos', e.target.value)} 
        />
         {errors && errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}Nombre` : 'nombreApellidos'}`] && <p className="text-sm text-red-500 mt-1">{errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}Nombre` : 'nombreApellidos'}`]}</p>}
      </div>
      <div>
        <Label htmlFor={`${type}CI_${index === null ? type : index}`}>{type === 'pasajeros' ? 'CI o Pasaporte' : 'CI'}</Label>
        <Input 
            id={`${type}CI_${index === null ? type : index}`} 
            name={index === null ? `${type}CI` : (type === 'pasajeros' ? 'ciPasaporte' : 'ci')} 
            value={index === null ? persona[`${type}CI`] : (type === 'pasajeros' ? persona.ciPasaporte : persona.ci)} 
            onChange={(e) => onPersonaChange(type, index, index === null ? `${type}CI` : (type === 'pasajeros' ? 'ciPasaporte' : 'ci'), e.target.value)} 
        />
        {errors && errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}CI` : (type === 'pasajeros' ? 'ciPasaporte' : 'ci')}`] && <p className="text-sm text-red-500 mt-1">{errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}CI` : (type === 'pasajeros' ? 'ciPasaporte' : 'ci')}`]}</p>}
      </div>
      <div>
        <Label htmlFor={`${type}Telefono_${index === null ? type : index}`}>Teléfono (opcional)</Label>
        <Input 
            id={`${type}Telefono_${index === null ? type : index}`} 
            name={index === null ? `${type}Telefono` : 'telefono'} 
            type="tel" 
            value={index === null ? persona[`${type}Telefono`] : persona.telefono} 
            onChange={(e) => onPersonaChange(type, index, index === null ? `${type}Telefono` : 'telefono', e.target.value)} 
        />
        {errors && errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}Telefono` : 'telefono'}`] && <p className="text-sm text-red-500 mt-1">{errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}Telefono` : 'telefono'}`]}</p>}
      </div>
      <div>
        <Label htmlFor={`${type}DocumentoSalida_${index === null ? type : index}`} className="flex items-center"><FileText className="mr-2 h-4 w-4" />Documento que Autoriza Salida</Label>
        <Select 
            name={index === null ? `${type}DocumentoSalida` : 'documentoSalida'} 
            value={index === null ? persona[`${type}DocumentoSalida`] || '' : persona.documentoSalida || ''} 
            onValueChange={(value) => onNestedSelectChange(type, index, index === null ? `${type}DocumentoSalida` : 'documentoSalida', value)}
        >
          <SelectTrigger className={errors && errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}DocumentoSalida` : 'documentoSalida'}`] ? 'border-red-500' : ''}><SelectValue placeholder="Seleccione documento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CI">CI (Cédula de Identidad)</SelectItem>
            <SelectItem value="Carne de Mar">Carne de Mar</SelectItem>
            <SelectItem value="Carne de Pesca Profesional">Carne de Pesca Profesional</SelectItem>
            <SelectItem value="PCE">PCE</SelectItem>
            <SelectItem value="Permiso Especial de Navegacion">Permiso Especial de Navegación</SelectItem>
            <SelectItem value="Pasaporte">Pasaporte</SelectItem>
          </SelectContent>
        </Select>
        {errors && errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}DocumentoSalida` : 'documentoSalida'}`] && <p className="text-sm text-red-500 mt-1">{errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}DocumentoSalida` : 'documentoSalida'}`]}</p>}
      </div>
      <div className="md:col-span-2">
        <Label htmlFor={`${type}NumeroPermiso_${index === null ? type : index}`} className="flex items-center"><Hash className="mr-2 h-4 w-4" />Número del Permiso/Documento</Label>
        <Input 
            id={`${type}NumeroPermiso_${index === null ? type : index}`} 
            name={index === null ? `${type}NumeroPermiso` : 'numeroPermiso'} 
            value={index === null ? persona[`${type}NumeroPermiso`] || '' : persona.numeroPermiso || ''} 
            onChange={(e) => onPersonaChange(type, index, index === null ? `${type}NumeroPermiso` : 'numeroPermiso', e.target.value)} 
            className={errors && errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}NumeroPermiso` : 'numeroPermiso'}`] ? 'border-red-500' : ''}
        />
        {errors && errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}NumeroPermiso` : 'numeroPermiso'}`] && <p className="text-sm text-red-500 mt-1">{errors[`${type}${index !== null ? `_${index}` : ''}_${index === null ? `${type}NumeroPermiso` : 'numeroPermiso'}`]}</p>}
      </div>
    </div>
  </motion.div>
);


const PersonaFormFields = ({ formData, onPersonaChange, onNestedSelectChange, addNestedItem, removeNestedItem, errors }) => {
  return (
    <>
      <div className="space-y-6">
        <div className="p-4 border rounded-md bg-card/50 dark:bg-card/80 space-y-3">
          <Label className="text-lg font-medium flex items-center"><User className="mr-2 h-5 w-5" />Propietario (Opcional si Patrón está presente)</Label>
          <PersonaIndividualFields type="propietario" persona={formData} index={null} onPersonaChange={onPersonaChange} onNestedSelectChange={onNestedSelectChange} errors={errors} />
        </div>

        <div className="p-4 border rounded-md bg-card/50 dark:bg-card/80 space-y-3">
          <Label className="text-lg font-medium flex items-center"><User className="mr-2 h-5 w-5" />Patrón (Opcional si Propietario está presente)</Label>
          <PersonaIndividualFields type="patron" persona={formData} index={null} onPersonaChange={onPersonaChange} onNestedSelectChange={onNestedSelectChange} errors={errors} />
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium flex items-center"><Users className="mr-2 h-5 w-5" />Tripulantes (Opcional)</h3>
          <Button type="button" size="sm" onClick={() => addNestedItem('tripulantes')} className="bg-green-500 hover:bg-green-600 text-white">
            <PlusCircle size={18} className="mr-1" /> Añadir Tripulante
          </Button>
        </div>
        <motion.div layout>
          {formData.tripulantes.map((tripulante, index) => 
            <PersonaIndividualFields key={`tripulante-${index}`} type="tripulantes" persona={tripulante} index={index} onPersonaChange={onPersonaChange} onNestedSelectChange={onNestedSelectChange} onRemove={removeNestedItem} errors={errors} />
          )}
        </motion.div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium flex items-center"><Users className="mr-2 h-5 w-5" />Pasajeros (Opcional)</h3>
          <Button type="button" size="sm" onClick={() => addNestedItem('pasajeros')} className="bg-green-500 hover:bg-green-600 text-white">
            <PlusCircle size={18} className="mr-1" /> Añadir Pasajero
          </Button>
        </div>
        <motion.div layout>
          {formData.pasajeros.map((pasajero, index) => 
            <PersonaIndividualFields key={`pasajero-${index}`} type="pasajeros" persona={pasajero} index={index} onPersonaChange={onPersonaChange} onNestedSelectChange={onNestedSelectChange} onRemove={removeNestedItem} errors={errors} />
          )}
        </motion.div>
      </div>
    </>
  );
};

export default PersonaFormFields;