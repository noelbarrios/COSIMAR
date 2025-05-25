import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { AppContext } from '@/contexts/AppContext'; // Assuming AppContext provides clearLocalData

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { toast } = useToast();
  const appContext = useContext(AppContext); // Get the whole context

  const fetchUserProfile = async (userId, authUserObj = null) => {
    console.log("AuthContext: Fetching profile for user ID:", userId);
    const { data: profile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('AuthContext: Error fetching user profile or profile not found:', error);
      const userToProcess = authUserObj || (session?.user); // Prioritize passed authUserObj

      if (userToProcess && userToProcess.email) { // Ensure email is present
        console.log("AuthContext: Attempting to create a default profile for new user:", userToProcess.email);
        // If the user is noelbarriospacheco@gmail.com, assign Administrador role.
        const roleForNewUser = userToProcess.email === 'noelbarriospacheco@gmail.com' ? 'Administrador' : 'Visualizador';
        const basificacionForNewUser = userToProcess.email === 'noelbarriospacheco@gmail.com' ? 'Todas' : 'Todas';

        const { data: newUserProfile, error: createUserProfileError } = await supabase
          .from('usuarios')
          .insert({
            id: userToProcess.id,
            username: userToProcess.email, 
            password_hash: 'managed_by_supabase_auth',
            role: roleForNewUser,
            basificacion: basificacionForNewUser,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createUserProfileError) {
          console.error('AuthContext: Error creating default user profile:', createUserProfileError);
          toast({ variant: "destructive", title: "Error Crítico", description: "No se pudo cargar ni crear el perfil. Contacte soporte." });
          await logout(); 
        } else {
          console.log(`AuthContext: Default profile created for ${userToProcess.email} with role ${roleForNewUser}:`, newUserProfile);
          setCurrentUser(newUserProfile);
          toast({ title: "Perfil Creado", description: `Se ha creado un perfil de ${roleForNewUser} por defecto.` });
        }
      } else {
        console.error("AuthContext: Cannot create profile, user email is missing.");
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el perfil del usuario (falta email)." });
        if (session) await logout(); // Avoid logging out if there's no session (e.g. initial load)
      }
    } else {
      console.log("AuthContext: Profile fetched successfully:", profile);
      // If fetched profile for noelbarriospacheco@gmail.com is not Administrador, update it.
      if (profile.username === 'noelbarriospacheco@gmail.com' && profile.role !== 'Administrador') {
        const { data: updatedAdminProfile, error: updateAdminError } = await supabase
          .from('usuarios')
          .update({ role: 'Administrador', basificacion: 'Todas', updated_at: new Date().toISOString() })
          .eq('id', profile.id)
          .select()
          .single();
        if (updateAdminError) {
          console.error("AuthContext: Error updating admin profile to Administrador role:", updateAdminError);
        } else {
          console.log("AuthContext: Admin profile role updated to Administrador:", updatedAdminProfile);
          setCurrentUser(updatedAdminProfile);
          return; // Exit early as currentUser is set
        }
      }
      setCurrentUser(profile);
    }
  };

  useEffect(() => {
    setLoadingAuth(true);
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id, currentSession.user).finally(() => setLoadingAuth(false));
      } else {
        setLoadingAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setLoadingAuth(true);
        setSession(newSession);
        if (newSession?.user) {
          fetchUserProfile(newSession.user.id, newSession.user).finally(() => setLoadingAuth(false));
        } else {
          setCurrentUser(null);
          setLoadingAuth(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const login = async (identifier, password) => {
    // 'identifier' is the email.
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    if (error) {
      toast({ variant: "destructive", title: "Error de inicio de sesión", description: "Usuario o contraseña incorrectos." });
      console.error("Login error:", error.message);
      return false;
    }
    
    if (loginData.user) {
      // fetchUserProfile will be called by onAuthStateChange listener.
      toast({ title: "Inicio de sesión exitoso", description: `Bienvenido.` });
      return true;
    }
    return false; // Should not happen if no error and no user
  };
  
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Error al cerrar sesión", description: error.message });
    } else {
      setCurrentUser(null);
      setSession(null); 
      if (appContext && appContext.clearLocalData) { // Check if appContext and clearLocalData exist
        appContext.clearLocalData(); 
      }
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
    }
  };

  const isAuthenticated = !!session && !!currentUser;

  return (
    <AuthContext.Provider value={{ session, currentUser, login, logout, isAuthenticated, loadingAuth, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};