import React, { useState, useContext } from 'react';
import { AppContext, AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const PersonasObservadasPage = () => {
  const { personasObservadas, fetchData } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(null);
  const [formData, setFormData] = useState({ nombre_completo: '', ci_pasaporte: '', motivo_observacion: '' });
  const [errors, setErrors] = useState({});
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  if (currentUser?.role !== 'Administrador' && currentUser?.role !== 'Operador') {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">No tiene permisos para acceder a esta página.</p>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre_completo.trim()) newErrors.nombre_completo = 'El nombre completo es obligatorio.';
    if (!formData.ci_pasaporte.trim()) newErrors.ci_pasaporte = 'El CI/Pasaporte es obligatorio.';
    else if (!isEditing && personasObservadas.some(po => po.ci_pasaporte.toLowerCase() === formData.ci_pasaporte.toLowerCase().trim())) {
      newErrors.ci_pasaporte = 'Ya existe una observación para este CI/Pasaporte.';
    } else if (isEditing && currentPersona && currentPersona.ci_pasaporte.toLowerCase() !== formData.ci_pasaporte.toLowerCase().trim() && personasObservadas.some(po => po.ci_pasaporte.toLowerCase() === formData.ci_pasaporte.toLowerCase().trim())) {
      newErrors.ci_pasaporte = 'Ya existe una observación para este nuevo CI/Pasaporte.';
    }
    if (!formData.motivo_observacion.trim()) newErrors.motivo_observacion = 'El motivo de la observación es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenFormModal = (persona = null) => {
    if (persona) {
      setIsEditing(true);
      setCurrentPersona(persona);
      setFormData({ ...persona });
    } else {
      setIsEditing(false);
      setCurrentPersona(null);
      setFormData({ nombre_completo: '', ci_pasaporte: '', motivo_observacion: '' });
    }
    setErrors({});
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ variant: "destructive", title: "Error de validación", description: "Por favor, corrija los errores." });
      return;
    }

    let error;
    const dataToSubmit = { ...formData, creado_por_id: currentUser.id };

    if (isEditing && currentPersona) {
      const { error: updateError } = await supabase
        .from('personas_observadas')
        .update(dataToSubmit)
        .eq('id', currentPersona.id);
      error = updateError;
      if (!error) toast({ title: "Observación Actualizada", description: `La observación para ${formData.nombre_completo} ha sido actualizada.` });
    } else {
      const { error: insertError } = await supabase
        .from('personas_observadas')
        .insert(dataToSubmit);
      error = insertError;
      if (!error) toast({ title: "Observación Guardada", description: `La observación para ${formData.nombre_completo} ha sido guardada.` });
    }

    if (error) {
      toast({ variant: "destructive", title: "Error en Base de Datos", description: error.message });
    } else {
      fetchData();
      setShowFormModal(false);
    }
  };

  const handleOpenConfirmDeleteModal = (persona) => {
    if (currentUser.role !== 'Administrador' && persona.creado_por_id !== currentUser.id) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo el administrador o el usuario que creó la observación pueden eliminarla." });
        return;
    }
    setPersonaToDelete(persona);
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (personaToDelete) {
      if (currentUser.role !== 'Administrador' && personaToDelete.creado_por_id !== currentUser.id) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo el administrador o el usuario que creó la observación pueden eliminarla." });
        setShowConfirmDeleteModal(false);
        setPersonaToDelete(null);
        return;
      }

      const { error } = await supabase
        .from('personas_observadas')
        .delete()
        .eq('id', personaToDelete.id);

      if (error) {
        toast({ variant: "destructive", title: "Error al Eliminar", description: error.message });
      } else {
        toast({ title: "Observación Eliminada", description: `La observación para ${personaToDelete.nombre_completo} ha sido eliminada.` });
        fetchData();
      }
    }
    setShowConfirmDeleteModal(false);
    setPersonaToDelete(null);
  };
  
  const filteredPersonasObservadas = personasObservadas.filter(po => 
    po.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.ci_pasaporte.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.motivo_observacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="container mx-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center">
        <Eye className="inline-block mr-3 h-10 w-10 text-amber-500" />
        Personas con Observación
      </h1>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Buscar por nombre, CI o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <Button onClick={() => handleOpenFormModal()} className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" /> Registrar Nueva Observación
        </Button>
      </div>

      <div className="overflow-x-auto bg-card dark:bg-slate-800 p-4 rounded-lg shadow-md">
        {filteredPersonasObservadas.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No hay personas con observación registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>CI/Pasaporte</TableHead>
                <TableHead>Motivo de Observación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonasObservadas.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.nombre_completo}</TableCell>
                  <TableCell>{po.ci_pasaporte}</TableCell>
                  <TableCell className="max-w-xs truncate">{po.motivo_observacion}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenFormModal(po)} className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {(currentUser.role === 'Administrador' || po.creado_por_id === currentUser.id) && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenConfirmDeleteModal(po)} className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Observación de Persona' : 'Registrar Nueva Observación de Persona'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div>
              <Label htmlFor="nombreCompletoObservacion">Nombre Completo</Label>
              <Input id="nombreCompletoObservacion" name="nombre_completo" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className={errors.nombre_completo ? 'border-red-500' : ''} />
              {errors.nombre_completo && <p className="text-sm text-red-500 mt-1">{errors.nombre_completo}</p>}
            </div>
            <div>
              <Label htmlFor="ciObservacion">CI/Pasaporte</Label>
              <Input id="ciObservacion" name="ci_pasaporte" value={formData.ci_pasaporte} onChange={(e) => setFormData({...formData, ci_pasaporte: e.target.value})} className={errors.ci_pasaporte ? 'border-red-500' : ''} />
              {errors.ci_pasaporte && <p className="text-sm text-red-500 mt-1">{errors.ci_pasaporte}</p>}
            </div>
            <div>
              <Label htmlFor="motivoObservacion">Motivo de Observación</Label>
              <Textarea id="motivoObservacion" name="motivo_observacion" value={formData.motivo_observacion} onChange={(e) => setFormData({...formData, motivo_observacion: e.target.value})} className={errors.motivo_observacion ? 'border-red-500' : ''} />
              {errors.motivo_observacion && <p className="text-sm text-red-500 mt-1">{errors.motivo_observacion}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>Cancelar</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600">{isEditing ? 'Actualizar Observación' : 'Guardar Observación'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDeleteModal} onOpenChange={setShowConfirmDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            ¿Estás seguro de que deseas quitar la observación para la persona "{personaToDelete?.nombre_completo}" (CI/Pasaporte: {personaToDelete?.ci_pasaporte})?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDeleteModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">Eliminar Observación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default PersonasObservadasPage;