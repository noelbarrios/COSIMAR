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
import { Ban, Edit, Trash2, Search, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const ProhibicionSalidaEmbarcacionesPage = () => {
  const { embarcacionesProhibidas, fetchData } = useContext(AppContext);
  const { currentUser } = useContext(AuthContext);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [currentProhibicion, setCurrentProhibicion] = useState(null);
  const [formData, setFormData] = useState({ nombre_embarcacion: '', folio: '', motivo: '', entidad_prohibe: '' });
  const [errors, setErrors] = useState({});
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [prohibicionToDelete, setProhibicionToDelete] = useState(null);
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
    if (!formData.nombre_embarcacion.trim()) newErrors.nombre_embarcacion = 'El nombre de la embarcación es obligatorio.';
    if (!formData.folio.trim()) newErrors.folio = 'El folio es obligatorio.';
    else if (!isEditing && embarcacionesProhibidas.some(ep => ep.folio.toLowerCase() === formData.folio.toLowerCase().trim())) {
      newErrors.folio = 'Ya existe una prohibición para este folio.';
    } else if (isEditing && currentProhibicion && currentProhibicion.folio.toLowerCase() !== formData.folio.toLowerCase().trim() && embarcacionesProhibidas.some(ep => ep.folio.toLowerCase() === formData.folio.toLowerCase().trim())) {
      newErrors.folio = 'Ya existe una prohibición para este nuevo folio.';
    }
    if (!formData.motivo.trim()) newErrors.motivo = 'El motivo de la prohibición es obligatorio.';
    if (!formData.entidad_prohibe.trim()) newErrors.entidad_prohibe = 'La entidad que prohíbe es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenFormModal = (prohibicion = null) => {
    if (prohibicion) {
      setIsEditing(true);
      setCurrentProhibicion(prohibicion);
      setFormData({ ...prohibicion });
    } else {
      setIsEditing(false);
      setCurrentProhibicion(null);
      setFormData({ nombre_embarcacion: '', folio: '', motivo: '', entidad_prohibe: '' });
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

    if (isEditing && currentProhibicion) {
      const { error: updateError } = await supabase
        .from('embarcaciones_prohibidas')
        .update(dataToSubmit)
        .eq('id', currentProhibicion.id);
      error = updateError;
      if (!error) toast({ title: "Prohibición Actualizada", description: `La prohibición para ${formData.nombre_embarcacion} ha sido actualizada.` });
    } else {
      const { error: insertError } = await supabase
        .from('embarcaciones_prohibidas')
        .insert(dataToSubmit);
      error = insertError;
      if (!error) toast({ title: "Prohibición Guardada", description: `La prohibición para ${formData.nombre_embarcacion} ha sido guardada.` });
    }

    if (error) {
      toast({ variant: "destructive", title: "Error en Base de Datos", description: error.message });
    } else {
      fetchData();
      setShowFormModal(false);
    }
  };

  const handleOpenConfirmDeleteModal = (prohibicion) => {
     if (currentUser.role !== 'Administrador' && prohibicion.creado_por_id !== currentUser.id) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo el administrador o el usuario que creó la prohibición pueden eliminarla." });
        return;
    }
    setProhibicionToDelete(prohibicion);
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (prohibicionToDelete) {
      if (currentUser.role !== 'Administrador' && prohibicionToDelete.creado_por_id !== currentUser.id) {
        toast({ variant: "destructive", title: "Acción no permitida", description: "Solo el administrador o el usuario que creó la prohibición pueden eliminarla." });
        setShowConfirmDeleteModal(false);
        setProhibicionToDelete(null);
        return;
      }
      const { error } = await supabase
        .from('embarcaciones_prohibidas')
        .delete()
        .eq('id', prohibicionToDelete.id);

      if (error) {
        toast({ variant: "destructive", title: "Error al Eliminar", description: error.message });
      } else {
        toast({ title: "Prohibición Eliminada", description: `La prohibición para ${prohibicionToDelete.nombre_embarcacion} ha sido eliminada.` });
        fetchData();
      }
    }
    setShowConfirmDeleteModal(false);
    setProhibicionToDelete(null);
  };
  
  const filteredEmbarcacionesProhibidas = embarcacionesProhibidas.filter(ep => 
    ep.nombre_embarcacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.entidad_prohibe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="container mx-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center">
        <ShieldAlert className="inline-block mr-3 h-10 w-10 text-red-500" />
        Embarcaciones con Prohibición de Salida
      </h1>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Buscar por nombre, folio o entidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <Button onClick={() => handleOpenFormModal()} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
          <Ban className="mr-2 h-4 w-4" /> Registrar Nueva Prohibición
        </Button>
      </div>

      <div className="overflow-x-auto bg-card dark:bg-slate-800 p-4 rounded-lg shadow-md">
        {filteredEmbarcacionesProhibidas.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No hay embarcaciones con prohibición de salida registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Embarcación</TableHead>
                <TableHead>Folio</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Entidad que Prohíbe</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmbarcacionesProhibidas.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell className="font-medium">{ep.nombre_embarcacion}</TableCell>
                  <TableCell>{ep.folio}</TableCell>
                  <TableCell className="max-w-xs truncate">{ep.motivo}</TableCell>
                  <TableCell>{ep.entidad_prohibe}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenFormModal(ep)} className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {(currentUser.role === 'Administrador' || ep.creado_por_id === currentUser.id) && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenConfirmDeleteModal(ep)} className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
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
            <DialogTitle>{isEditing ? 'Editar Prohibición' : 'Registrar Nueva Prohibición'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div>
              <Label htmlFor="nombreProhibicion">Nombre Embarcación</Label>
              <Input id="nombreProhibicion" name="nombre_embarcacion" value={formData.nombre_embarcacion} onChange={(e) => setFormData({...formData, nombre_embarcacion: e.target.value})} className={errors.nombre_embarcacion ? 'border-red-500' : ''} />
              {errors.nombre_embarcacion && <p className="text-sm text-red-500 mt-1">{errors.nombre_embarcacion}</p>}
            </div>
            <div>
              <Label htmlFor="folioProhibicion">Folio</Label>
              <Input id="folioProhibicion" name="folio" value={formData.folio} onChange={(e) => setFormData({...formData, folio: e.target.value})} className={errors.folio ? 'border-red-500' : ''} />
              {errors.folio && <p className="text-sm text-red-500 mt-1">{errors.folio}</p>}
            </div>
            <div>
              <Label htmlFor="motivoProhibicion">Motivo</Label>
              <Textarea id="motivoProhibicion" name="motivo" value={formData.motivo} onChange={(e) => setFormData({...formData, motivo: e.target.value})} className={errors.motivo ? 'border-red-500' : ''} />
              {errors.motivo && <p className="text-sm text-red-500 mt-1">{errors.motivo}</p>}
            </div>
            <div>
              <Label htmlFor="entidadProhibicion">Entidad que Prohíbe</Label>
              <Input id="entidadProhibicion" name="entidad_prohibe" value={formData.entidad_prohibe} onChange={(e) => setFormData({...formData, entidad_prohibe: e.target.value})} className={errors.entidad_prohibe ? 'border-red-500' : ''} />
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
            ¿Estás seguro de que deseas quitar la prohibición para la embarcación "{prohibicionToDelete?.nombre_embarcacion}" (Folio: {prohibicionToDelete?.folio})?
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

export default ProhibicionSalidaEmbarcacionesPage;