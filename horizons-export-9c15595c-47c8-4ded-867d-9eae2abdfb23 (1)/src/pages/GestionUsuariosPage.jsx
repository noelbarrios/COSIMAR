import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { AuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { UserPlus, Users, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import UserForm from '@/components/gestion-usuarios/UserForm';
import UsersTable from '@/components/gestion-usuarios/UsersTable';
import ResumenEmbarcacionesCard from '@/components/gestion-usuarios/ResumenEmbarcacionesCard';

const GestionUsuariosPage = () => {
  const { users, fetchData: fetchAppContextData, embarcacionesRegistradas } = useContext(AppContext);
  const { currentUser: adminUser, fetchUserProfile } = useContext(AuthContext);
  const { toast } = useToast();

  const initialNewUserState = {
    username: '', 
    password: '', 
    role: 'Visualizador',
    basificacion: 'Todas', 
    nombre_embarcacion_propietario: '',
    folio_embarcacion_propietario: '',
  };

  const [newUserData, setNewUserData] = useState(initialNewUserState);
  const [editingUser, setEditingUser] = useState(null); 
  const [userToDelete, setUserToDelete] = useState(null); 
  const [formErrors, setFormErrors] = useState({});

  const [allBasificaciones, setAllBasificaciones] = useState([]);
  useEffect(() => {
    const uniqueBasificaciones = ['Todas', ...new Set(embarcacionesRegistradas.map(e => e.basificacion).filter(Boolean))];
    setAllBasificaciones(uniqueBasificaciones);
  }, [embarcacionesRegistradas]);

  const validateUserForm = (userData, isEdit = false) => {
    const newErrors = {};
    if (!userData.username.trim()) newErrors.username = 'El nombre de usuario (email) es obligatorio.';
    else if (!/\S+@\S+\.\S+/.test(userData.username)) newErrors.username = 'El formato del email no es válido.';
    
    if (!isEdit && !userData.password) newErrors.password = 'La contraseña es obligatoria.';
    else if (!isEdit && userData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    else if (isEdit && userData.password && userData.password.length < 6) newErrors.password = 'La nueva contraseña debe tener al menos 6 caracteres.';

    const existingUser = users.find(user => user.username.toLowerCase() === userData.username.toLowerCase().trim());
    if (existingUser && (!isEdit || (isEdit && existingUser.id !== userData.id))) {
      newErrors.username = 'Este nombre de usuario (email) ya existe.';
    }

    if (!userData.role) newErrors.role = 'El rol es obligatorio.';
    if (userData.role === 'Operador' && (!userData.basificacion || userData.basificacion === 'Todas')) {
       newErrors.basificacion = 'La basificación específica es obligatoria para Operadores.';
    }
    if (userData.role === 'Operador Propietario') {
      if (!userData.basificacion || userData.basificacion === 'Todas') newErrors.basificacion = 'La basificación específica es obligatoria para Operador Propietario.';
      if (!userData.nombre_embarcacion_propietario?.trim()) newErrors.nombre_embarcacion_propietario = 'El nombre de la embarcación es obligatorio para este rol.';
      if (!userData.folio_embarcacion_propietario?.trim()) newErrors.folio_embarcacion_propietario = 'El folio de la embarcación es obligatorio para este rol.';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!validateUserForm(newUserData)) {
      toast({ variant: "destructive", title: "Error de validación", description: "Por favor, corrija los errores." });
      return;
    }

    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: newUserData.username,
      password: newUserData.password,
    });

    if (authError) {
      toast({ variant: "destructive", title: "Error al crear usuario (Auth)", description: authError.message });
      return;
    }

    if (authUser.user) {
      const profileData = { 
        id: authUser.user.id,
        username: newUserData.username, 
        password_hash: 'Auth handled by Supabase', // Not storing actual hash here
        role: newUserData.role,
        basificacion: newUserData.basificacion,
        nombre_embarcacion_propietario: newUserData.role === 'Operador Propietario' ? newUserData.nombre_embarcacion_propietario : null,
        folio_embarcacion_propietario: newUserData.role === 'Operador Propietario' ? newUserData.folio_embarcacion_propietario : null,
      };
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert([profileData]);

      if (profileError) {
        toast({ variant: "destructive", title: "Error al crear perfil de usuario", description: profileError.message });
      } else {
        toast({ title: "Usuario Creado", description: `El usuario ${newUserData.username} ha sido creado con éxito. Por favor, verifique el email.` });
        setNewUserData(initialNewUserState);
        fetchAppContextData(); 
      }
    }
  };

  const handleEditUserClick = (user) => {
    setEditingUser({ ...user, password: '' }); 
    setFormErrors({});
  };

  const handleSaveEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser || !validateUserForm(editingUser, true)) {
      toast({ variant: "destructive", title: "Error de validación", description: "Por favor, corrija los errores." });
      return;
    }

    const updatesToProfile = {
      username: editingUser.username, // This is the email
      role: editingUser.role,
      basificacion: editingUser.basificacion,
      nombre_embarcacion_propietario: editingUser.role === 'Operador Propietario' ? editingUser.nombre_embarcacion_propietario : null,
      folio_embarcacion_propietario: editingUser.role === 'Operador Propietario' ? editingUser.folio_embarcacion_propietario : null,
    };
    
    let authUpdates = {};
    const originalUser = users.find(u => u.id === editingUser.id);

    // Check if email (username in our table) has changed
    if (originalUser && originalUser.username !== editingUser.username) {
      authUpdates.email = editingUser.username;
    }
    if (editingUser.password) { // If a new password is provided
      authUpdates.password = editingUser.password;
    }

    // Update Supabase Auth if email or password changed
    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabase.auth.updateUser(authUpdates);
      if (authUpdateError) {
         toast({ variant: "destructive", title: "Error al actualizar Auth", description: authUpdateError.message });
         return; 
      }
    }

    // Update user profile in 'usuarios' table
    const { error: profileError } = await supabase
      .from('usuarios')
      .update(updatesToProfile)
      .eq('id', editingUser.id);

    if (profileError) {
      toast({ variant: "destructive", title: "Error al actualizar perfil", description: profileError.message });
    } else {
      toast({ title: "Usuario Actualizado", description: `El usuario ${editingUser.username} ha sido actualizado.` });
      setEditingUser(null);
      fetchAppContextData();
      if (adminUser.id === editingUser.id) { 
        fetchUserProfile(editingUser.id); 
      }
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    // Attempt to delete from public.usuarios first
    const { error: profileDeleteError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userToDelete.id);

    if (profileDeleteError) {
      toast({ variant: "destructive", title: "Error al eliminar perfil", description: profileDeleteError.message });
    } else {
      // Deleting from auth.users is more complex and usually requires admin privileges on Supabase.
      // For now, we'll assume this is handled or noted.
      // If you have an admin client, you could call supabase.auth.admin.deleteUser(userToDelete.id)
      toast({ title: "Usuario Eliminado", description: `El perfil del usuario ${userToDelete.username} ha sido eliminado. La cuenta de autenticación puede requerir eliminación manual en Supabase.` });
      fetchAppContextData();
    }
    setUserToDelete(null);
  };
  
  if (adminUser?.role !== 'Administrador') {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2">No tiene permisos para acceder a esta página.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto p-4 md:p-8 bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 rounded-xl shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-8 text-center">
        <Users className="inline-block mr-3 h-10 w-10" />
        Gestión de Usuarios
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          className="bg-card dark:bg-slate-800 p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-primary dark:text-primary-foreground mb-6 flex items-center">
            <UserPlus className="mr-2 h-7 w-7" />
            Registrar Nuevo Usuario
          </h2>
          <UserForm 
            userData={newUserData}
            setUserData={setNewUserData}
            errors={formErrors}
            allBasificaciones={allBasificaciones}
            handleSubmit={handleAddUserSubmit}
            isEdit={false}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ResumenEmbarcacionesCard />
        </motion.div>
      </div>

      <motion.div 
        className="mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-primary dark:text-primary-foreground mb-6 flex items-center"><Users className="mr-2 h-7 w-7"/>Lista de Usuarios</h2>
        <div className="overflow-x-auto bg-card dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <UsersTable 
            users={users}
            adminUserId={adminUser.id}
            onEditUser={handleEditUserClick}
            onSetUserToDelete={setUserToDelete}
          />
        </div>
      </motion.div>

    {editingUser && (
      <Dialog open={!!editingUser} onOpenChange={() => { setEditingUser(null); setFormErrors({}); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario: {editingUser.username}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <UserForm 
              userData={editingUser}
              setUserData={setEditingUser}
              errors={formErrors}
              allBasificaciones={allBasificaciones}
              handleSubmit={handleSaveEditUserSubmit}
              isEdit={true}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingUser(null); setFormErrors({}); }}>Cancelar</Button>
            {/* Submit button is inside UserForm */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

    {userToDelete && (
         <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Eliminación</DialogTitle>
                    <DialogDescription>
                        ¿Está seguro de que desea eliminar al usuario {userToDelete.username}? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDeleteUser}>Eliminar Usuario</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    </motion.div>
  );
};

export default GestionUsuariosPage;