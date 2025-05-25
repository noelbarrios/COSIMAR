import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Home, Ship, Clock, Database, MessageSquare, BarChart2, Users, Ban, SearchSlash as UserSlash, LogOut as LogOutIcon, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const QuickAccessPage = () => {
  const { logout, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const allQuickAccessItems = [
    { name: 'Inicio (App)', icon: Home, path: '/dashboard', color: 'text-sky-500', roles: ['Administrador', 'Operador', 'Operador Propietario', 'Visualizador'] },
    { name: 'Registro de Embarcaciones', icon: Ship, path: '/registro-embarcaciones', color: 'text-blue-500', roles: ['Administrador', 'Operador', 'Operador Propietario'] },
    { name: 'Embarcaciones Despachadas', icon: Clock, path: '/embarcaciones-despachadas', color: 'text-indigo-500', roles: ['Administrador', 'Operador', 'Operador Propietario', 'Visualizador'] },
    { name: 'Base de Datos', icon: Database, path: '/base-de-datos', color: 'text-purple-500', roles: ['Administrador', 'Operador', 'Visualizador'] },
    { name: 'Mensajería', icon: MessageSquare, path: '/mensajeria', color: 'text-pink-500', roles: ['Administrador', 'Operador'] },
    { name: 'Estadísticas y Resúmenes', icon: BarChart2, path: '/estadisticas', color: 'text-red-500', roles: ['Administrador', 'Visualizador', 'Operador'] },
    { name: 'Gestión de Usuarios', icon: Users, path: '/gestion-usuarios', color: 'text-orange-500', roles: ['Administrador'] },
    { name: 'Emb. con Prohibición Salida', icon: Ban, path: '/prohibicion-salida-embarcaciones', color: 'text-yellow-500', roles: ['Administrador', 'Operador'] },
    { name: 'Pers. con Prohibición Salida', icon: UserSlash, path: '/prohibicion-salida-personas', color: 'text-lime-500', roles: ['Administrador', 'Operador'] },
    { name: 'Personas con Observación', icon: AlertTriangle, path: '/personas-observadas', color: 'text-teal-500', roles: ['Administrador', 'Operador'] },
  ];

  const quickAccessItems = allQuickAccessItems.filter(item => item.roles.includes(currentUser?.role));


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-4 sm:mb-0">Acceso Rápido</h1>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickAccessItems.map((item) => (
            <motion.div
              key={item.name}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
              className="bg-card dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center text-center"
            >
              <Link to={item.path} className="w-full h-full flex flex-col items-center justify-center">
                <item.icon className={`h-12 w-12 mb-4 ${item.color}`} strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-foreground dark:text-slate-200">{item.name}</h2>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cierre de Sesión</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-4">
            ¿Estás seguro de que deseas cerrar sesión?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutModal(false)}>Cancelar</Button>
            <Button onClick={confirmLogout} className="bg-red-500 hover:bg-red-600">Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickAccessPage;