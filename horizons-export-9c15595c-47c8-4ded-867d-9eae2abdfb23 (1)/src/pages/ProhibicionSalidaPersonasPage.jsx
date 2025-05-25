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
import { SearchSlash as UserSlashIcon, Edit, Trash2, Search, ShieldAlert } from 'lucide-react'; // Renamed UserSlash to UserSlashIcon
import { supabase } from '@/lib/supabaseClient';

const ProhibicionSalidaPersonasPage = () => {
  const { personasProhibidas, fetchData } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(null);
  const [formData, setFormData] = useState({ nombre_completo: '', ci: '', motivo: '', entidad_prohibe: '' });
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
    if (!formData.ci.trim()) newErrors.ci = 'El CI/Pasaporte es obligatorio.';
    else if (!isEditing && personasProhibidas.some(pp => pp.ci.toLowerCase() === formData.ci.toLowerCase().trim())) {
      newErrors.ci = 'Ya existe una prohibición para este CI/Pasaporte.';
    } else if (isEditing && currentPersona && currentPersona.ci.toLowerCase() !== formData.ci.toLowerCase().trim() && personasProhibidas.some(pp => pp.ci.toLowerCase() === formData.ci.toLowerCase().trim())) {
      newErrors.ci = 'Ya existe una prohibición para este nuevo CI/Pasaporte.';
    }
    if (!formData.motivo.trim()) newErrors.motivo = 'El motivo de la prohibición es obligatorio.';
    if (!formData.entidad_prohibe.trim()) newErrors.entidad_prohibe = 'La entidad que prohíbe es obligatoria.';
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
      setFormData({ nombre_completo: '', ci: '', motivo: '', entidad_prohibe: '' });
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
        .from('personas_prohibidas')
        .update(dataToSubmit)
        .eq('id', currentPersona.id);
      error = updateError;
      if (!error) toast({ title: "Prohibición Actualizada", description: `La prohibición para ${formData.nombre_completo} ha sido actualizada.` });
    } else {
      const { error: insertError } = await supabase
        .from('personas_prohibidas')
        .insert(dataToSubmit);
      error = insertError;
      if (!error) toast({ title: "Prohibición Guardada", description: `La prohibición para ${formData.nombre_completo} ha sido guardada.` });
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
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo el administrador o el usuario que creó la prohibición pueden eliminarla." });
        return;
    }
    setPersonaToDelete(persona);
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (personaToDelete) {
       if (currentUser.role !== 'Administrador' && personaToDelete.creado_por_id !== currentUser.id) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo el administrador o el usuario que creó la prohibición pueden eliminarla." });
        setShowConfirmDeleteModal(false);
        setPersonaToDelete(null);
        return;
      }
      const { error } = await supabase
        .from('personas_prohibidas')
        .delete()
        .eq('id', personaToDelete.id);

      if (error) {
        toast({ variant: "destructive", title: "Error al Eliminar", description: error.message });
      } else {
        toast({ title: "Prohibición Eliminada", description: `La prohibición para ${personaToDelete.nombre_completo} ha sido eliminada.` });
        fetchData();
      }
    }
    setShowConfirmDeleteModal(false);
    setPersonaToDelete(null);
  };
  
  const filteredPersonasProhibidas = personasProhibidas.filter(pp => 
    pp.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pp.ci.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pp.entidad_prohibe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="container mx-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center">
        <UserSlashIcon className="inline-block mr-3 h-10 w-10 text-red-500" />
        Personas con Prohibición de Salida
      </h1>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Buscar por nombre, CI o entidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <Button onClick={() => handleOpenFormModal()} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
          <UserSlashIcon className="mr-2 h-4 w-4" /> Registrar Nueva Prohibición
        </Button>
      </div>

      <div className="overflow-x-auto bg-card dark:bg-slate-800 p-4 rounded-lg shadow-md">
        {filteredPersonasProhibidas.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No hay personas con prohibición de salida registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>CI/Pasaporte</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Entidad que Prohíbe</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonasProhibidas.map((pp) => (
                <TableRow key={pp.id}>
                  <TableCell className="font-medium">{pp.nombre_completo}</TableCell>
                  <TableCell>{pp.ci}</TableCell>
                  <TableCell className="max-w-xs truncate">{pp.motivo}</TableCell>
                  <TableCell>{pp.entidad_prohibe}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenFormModal(pp)} className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {(currentUser.role === 'Administrador' || pp.creado_por_id === currentUser.id) && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenConfirmDeleteModal(pp)} className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
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
            <DialogTitle>{isEditing ? 'Editar Prohibición de Persona' : 'Registrar Nueva Prohibición de Persona'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div>
              <Label htmlFor="nombreCompletoProhibicion">Nombre Completo</Label>
              <Input id="nombreCompletoProhibicion" name="nombre_completo" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} className={errors.nombre_completo ? 'border-red-500' : ''} />
              {errors.nombre_completo && <p className="text-sm text-red-500 mt-1">{errors.nombre_completo}</p>}
            </div>
            <div>
              <Label htmlFor="ciProhibicion">CI/Pasaporte</Label>
              <Input id="ciProhibicion" name="ci" value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className={errors.ci ? 'border-red-500' : ''} />
              {errors.ci && <p className="text-sm text-red-500 mt-1">{errors.ci}</p>}
            </div>
            <div>
              <Label htmlFor="motivoPersonaProhibicion">Motivo</Label>
              <Textarea id="motivoPersonaProhibicion" name="motivo" value={formData.motivo} onChange={(e) => setFormData({...formData, motivo: e.target.value})} className={errors.motivo ? 'border-red-500' : ''} />
              {errors.motivo && <p className="text-sm text-red-500 mt-1">{errors.motivo}</p>}
            </div>
            <div>
              <Label htmlFor="entidadPersonaProhibicion">Entidad que Prohíbe</Label>
              <Input id="entidadPersonaProhibicion" name="entidad_prohibe" value={formData.entidad_prohibe} onChange={(e) => setFormData({...formData, entidad_prohibe: e.target.value})} className={errors.entidad_prohibe ? 'border-red-500' : ''} />
              {errors.entidad_prohibe && <p className="text-sm text-red-500 mt-1">{errors.entidad_prohibe}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>Cancelar</Button>
              <Button type="submit" className="bg-red-500 hover:bg-red-600">{isEditing ? 'Actualizar Prohibición' : 'Guardar Prohibición'}</Button>
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
            ¿Estás seguro de que deseas quitar la prohibición para la persona "{personaToDelete?.nombre_completo}" (CI/Pasaporte: {personaToDelete?.ci})?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDeleteModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">Eliminar Prohibición</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default ProhibicionSalidaPersonasPage;