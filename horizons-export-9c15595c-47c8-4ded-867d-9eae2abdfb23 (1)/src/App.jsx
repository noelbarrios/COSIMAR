import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import QuickAccessPage from '@/pages/QuickAccessPage';
import RegistroEmbarcacionesPage from '@/pages/RegistroEmbarcacionesPage';
import BaseDeDatosPage from '@/pages/BaseDeDatosPage';
import GestionUsuariosPage from '@/pages/GestionUsuariosPage';
import MensajeriaPage from '@/pages/MensajeriaPage';
import EmbarcacionesDespachadasPage from '@/pages/EmbarcacionesDespachadasPage';
import EstadisticasPage from '@/pages/EstadisticasPage';
import ProhibicionSalidaEmbarcacionesPage from '@/pages/ProhibicionSalidaEmbarcacionesPage';
import ProhibicionSalidaPersonasPage from '@/pages/ProhibicionSalidaPersonasPage';
import PersonasObservadasPage from '@/pages/PersonasObservadasPage';
import Layout from '@/components/Layout';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, AuthContext } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';

function AppContent() {
  const { isAuthenticated, currentUser, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold text-foreground">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <QuickAccessPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/registro-embarcaciones" 
            element={isAuthenticated && (currentUser?.role === 'Administrador' || currentUser?.role === 'Operador' || currentUser?.role === 'Operador Propietario') ? <RegistroEmbarcacionesPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route 
            path="/embarcaciones-despachadas" 
            element={isAuthenticated ? <EmbarcacionesDespachadasPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/base-de-datos" 
            element={isAuthenticated && (currentUser?.role === 'Administrador' || currentUser?.role === 'Operador' || currentUser?.role === 'Visualizador') ? <BaseDeDatosPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route 
            path="/mensajeria" 
            element={isAuthenticated && (currentUser?.role === 'Administrador' || currentUser?.role === 'Operador') ? <MensajeriaPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route 
            path="/estadisticas" 
            element={isAuthenticated && (currentUser?.role === 'Administrador' || currentUser?.role === 'Visualizador' || currentUser?.role === 'Operador') ? <EstadisticasPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route 
            path="/gestion-usuarios" 
            element={isAuthenticated && currentUser?.role === 'Administrador' ? <GestionUsuariosPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route 
            path="/prohibicion-salida-embarcaciones" 
            element={isAuthenticated && (currentUser?.role === 'Administrador' || currentUser?.role === 'Operador') ? <ProhibicionSalidaEmbarcacionesPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route 
            path="/prohibicion-salida-personas" 
            element={isAuthenticated && (currentUser?.role === 'Administrador' || currentUser?.role === 'Operador') ? <ProhibicionSalidaPersonasPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route 
            path="/personas-observadas" 
            element={isAuthenticated && (currentUser?.role === 'Administrador' || currentUser?.role === 'Operador') ? <PersonasObservadasPage /> : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider> {/* AppProvider needs to be within AuthProvider if it depends on AuthContext */}
        <AuthProvider>
            <AppContent />
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;