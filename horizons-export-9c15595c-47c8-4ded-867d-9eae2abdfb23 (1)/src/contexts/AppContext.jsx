import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { AuthContext } from '@/contexts/AuthContext';

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [embarcacionesRegistradas, setEmbarcacionesRegistradas] = useState([]);
  const [embarcacionesProhibidas, setEmbarcacionesProhibidas] = useState([]);
  const [personasProhibidas, setPersonasProhibidas] = useState([]);
  const [personasObservadas, setPersonasObservadas] = useState([]);
  const [users, setUsers] = useState([]);
  const [mensajesEnviados, setMensajesEnviados] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const { toast } = useToast();
  const authContext = useContext(AuthContext); // Use useContext at the top level

  const clearLocalData = () => {
    setEmbarcacionesRegistradas([]);
    setEmbarcacionesProhibidas([]);
    setPersonasProhibidas([]);
    setPersonasObservadas([]);
    setUsers([]);
    setMensajesEnviados([]);
  };
  
  const fetchData = async () => {
    // Access session and currentUser from authContext
    if (!authContext || !authContext.session || loadingData) return;
    setLoadingData(true);
    console.log("AppContext: Fetching all application data...");

    try {
      const [
        embarcacionesRes,
        prohibidasEmbRes,
        prohibidasPerRes,
        observadasPerRes,
        usersRes,
        mensajesRes
      ] = await Promise.all([
        supabase.from('embarcaciones').select('*, tripulantes(*), pasajeros(*)'),
        supabase.from('embarcaciones_prohibidas').select('*'),
        supabase.from('personas_prohibidas').select('*'),
        supabase.from('personas_observadas').select('*'),
        supabase.from('usuarios').select('*'),
        supabase.from('mensajes').select('*').order('created_at', { ascending: false })
      ]);

      if (embarcacionesRes.error) console.error('AppContext: Error fetching embarcaciones:', embarcacionesRes.error);
      else setEmbarcacionesRegistradas(embarcacionesRes.data || []);

      if (prohibidasEmbRes.error) console.error('AppContext: Error fetching embarcaciones prohibidas:', prohibidasEmbRes.error);
      else setEmbarcacionesProhibidas(prohibidasEmbRes.data || []);

      if (prohibidasPerRes.error) console.error('AppContext: Error fetching personas prohibidas:', prohibidasPerRes.error);
      else setPersonasProhibidas(prohibidasPerRes.data || []);

      if (observadasPerRes.error) console.error('AppContext: Error fetching personas observadas:', observadasPerRes.error);
      else setPersonasObservadas(observadasPerRes.data || []);
      
      if (usersRes.error) console.error('AppContext: Error fetching users:', usersRes.error);
      else setUsers(usersRes.data || []);

      if (mensajesRes.error) console.error('AppContext: Error fetching mensajes:', mensajesRes.error);
      else setMensajesEnviados(mensajesRes.data || []);
      
      console.log("AppContext: Application data fetched.");
      toast({ title: "Datos Actualizados", description: "La información de la aplicación ha sido cargada.", duration: 2000});

    } catch (error) {
      console.error("AppContext: Error fetching data in parallel:", error);
      toast({ variant: "destructive", title: "Error de Carga", description: "No se pudieron cargar todos los datos de la aplicación." });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    // Access session and currentUser from authContext
    if (authContext && authContext.session && authContext.currentUser) {
      fetchData();
      const channels = [];
      
      const tablesToSubscribe = [
        'embarcaciones', 'usuarios', 'embarcaciones_prohibidas', 
        'personas_prohibidas', 'mensajes', 'personas_observadas'
      ];

      tablesToSubscribe.forEach(tableName => {
        const channel = supabase
          .channel(`public:${tableName}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
            console.log(`AppContext: Change received for ${tableName}!`, payload);
            toast({ title: `Actualización en ${tableName}`, description: "Los datos se han actualizado.", duration: 2000 });
            fetchData(); 
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log(`AppContext: Subscribed to ${tableName}`);
            }
            if (status === 'CHANNEL_ERROR') {
              console.error(`AppContext: Error subscribing to ${tableName}:`, err);
            }
          });
        channels.push(channel);
      });

      return () => {
        channels.forEach(channel => supabase.removeChannel(channel).catch(err => console.error("AppContext: Error removing channel:", err)));
      };
    }
  }, [authContext]); // Depend on authContext

  return (
    <AppContext.Provider value={{ 
      embarcacionesRegistradas, 
      embarcacionesProhibidas,
      personasProhibidas, 
      personasObservadas,
      users,
      mensajesEnviados,
      fetchData,
      loadingData,
      clearLocalData
    }}>
      {children}
    </AppContext.Provider>
  );
};