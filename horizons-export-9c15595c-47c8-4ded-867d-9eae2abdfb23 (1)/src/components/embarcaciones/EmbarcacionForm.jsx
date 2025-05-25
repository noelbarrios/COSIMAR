import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Users, Phone } from 'lucide-react';
import PersonaFormFields from '@/components/embarcaciones/PersonaFormFields';
import DetallesEmbarcacionForm from '@/components/embarcaciones/DetallesEmbarcacionForm';

const EmbarcacionForm = ({ formData, setFormData, errors, setErrors, onSubmit, currentUser }) => {
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (name === 'propulsion' && value !== 'otros') {
      setFormData(prev => ({ ...prev, otraPropulsion: '' }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, fechaHoraSalida: date }));
    if (errors.fechaHoraSalida) {
      setErrors(prev => ({ ...prev, fechaHoraSalida: null }));
    }
  };

  const handlePersonaChange = (type, index, field, value) => {
     setFormData(prev => {
      const list = [...prev[type]];
      if (index === null) { // Propietario o Patrón
        return { ...prev, [field]: value };
      }
      // Tripulantes o Pasajeros
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [type]: list };
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleNestedSelectChange = (type, index, field, value) => {
    setFormData(prev => {
      const list = [...prev[type]];
      if (index === null) { 
        return { ...prev, [field]: value };
      }
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [type]: list };
    });
     if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };


  const addNestedItem = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { nombreApellidos: '', ci: '', telefono: '', documentoSalida: '', numeroPermiso: '' }]
    }));
  };

  const removeNestedItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 mb-12">
      <DetallesEmbarcacionForm
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleDateChange={handleDateChange}
        errors={errors}
        currentUser={currentUser}
      />

      <h2 className="text-xl font-semibold text-primary dark:text-primary-foreground mt-8 mb-4 border-b pb-2 flex items-center">
        <Users className="mr-2 h-6 w-6" /> Información de Personas
      </h2>
      {errors.propietarioPatron && <p className="text-sm text-red-500 mb-4">{errors.propietarioPatron}</p>}

      <PersonaFormFields
        formData={formData}
        onPersonaChange={handlePersonaChange}
        onNestedSelectChange={handleNestedSelectChange}
        addNestedItem={addNestedItem}
        removeNestedItem={removeNestedItem}
        errors={errors}
      />

      <div>
        <Label htmlFor="comunicacionAbordo" className="flex items-center"><Phone className="mr-2 h-5 w-5" />Comunicación a Bordo (Teléfono/VHF - Número/Canal)</Label>
        <Input id="comunicacionAbordo" name="comunicacionAbordo" value={formData.comunicacionAbordo} onChange={handleChange} />
      </div>

      <motion.div
        whileHover={{ scale: 1.02, boxShadow: "0px 5px 15px rgba(59, 130, 246, 0.4)" }}
        whileTap={{ scale: 0.98 }}
      >
        <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold py-3 text-lg shadow-xl transition-all duration-300 ease-in-out mt-6">
          Registrar Salida
        </Button>
      </motion.div>
    </form>
  );
};

export default EmbarcacionForm;