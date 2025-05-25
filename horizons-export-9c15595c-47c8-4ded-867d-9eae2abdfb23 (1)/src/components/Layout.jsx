import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, Menu, LogOut, Home, LayoutDashboard, Ship, Database, MessageSquare, BarChart2, Users, SearchSlash as UserSlash, ShieldAlert, Eye, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";


const NavLink = ({ to, icon: Icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <SheetClose asChild>
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md dark:bg-sky-600 dark:text-white' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                    }`}
      >
        <Icon className={`mr-3 h-5 w-5 ${isActive ? '' : 'text-primary dark:text-sky-400'}`} />
        {children}
      </Link>
    </SheetClose>
  );
};

const Layout = ({ children }) => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate('/login');
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión exitosamente.",
      className: "bg-green-500 text-white dark:bg-green-700",
    });
  };

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home, roles: ['all'] },
    { path: '/dashboard', label: 'Acceso Rápido', icon: LayoutDashboard, roles: ['Administrador', 'Operador', 'Operador Propietario', 'Visualizador'] },
    { path: '/registro-embarcaciones', label: 'Registro de Embarcaciones', icon: Ship, roles: ['Administrador', 'Operador', 'Operador Propietario'] },
    { path: '/embarcaciones-despachadas', label: 'Embarcaciones Despachadas', icon: Ship, roles: ['Administrador', 'Operador', 'Operador Propietario', 'Visualizador'] },
    { path: '/base-de-datos', label: 'Base de Datos', icon: Database, roles: ['Administrador', 'Operador', 'Visualizador'] },
    { path: '/mensajeria', label: 'Mensajería', icon: MessageSquare, roles: ['Administrador', 'Operador'] },
    { path: '/estadisticas', label: 'Estadísticas', icon: BarChart2, roles: ['Administrador', 'Operador', 'Visualizador'] },
    { path: '/gestion-usuarios', label: 'Gestión de Usuarios', icon: Users, roles: ['Administrador'] },
    { path: '/prohibicion-salida-embarcaciones', label: 'Prohibición Salida (Emb.)', icon: ShieldAlert, roles: ['Administrador', 'Operador'] },
    { path: '/prohibicion-salida-personas', label: 'Prohibición Salida (Per.)', icon: UserSlash, roles: ['Administrador', 'Operador'] },
    { path: '/personas-observadas', label: 'Personas con Observación', icon: AlertTriangle, roles: ['Administrador', 'Operador'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    isAuthenticated && (item.roles.includes('all') || (currentUser && item.roles.includes(currentUser.role)))
  );
  
  const showHeader = location.pathname !== '/login';

  return (
    <div className={`min-h-screen flex flex-col bg-background dark:bg-slate-950 text-foreground dark:text-slate-100 transition-colors duration-300`}>
      {showHeader && isAuthenticated && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:supports-[backdrop-filter]:bg-slate-900/60 shadow-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-primary dark:text-sky-400">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-background dark:bg-slate-900 p-0">
                <ScrollArea className="h-full p-6">
                  <div className="mb-6">
                    <Link to="/" className="flex items-center space-x-2">
                      <Ship className="h-8 w-8 text-primary dark:text-sky-400" />
                      <span className="text-xl font-bold text-primary dark:text-sky-400">CONSIMAR</span>
                    </Link>
                  </div>
                  <nav className="space-y-2">
                    {filteredNavItems.map(item => (
                      <NavLink key={item.path} to={item.path} icon={item.icon}>
                        {item.label}
                      </NavLink>
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <div className="hidden lg:flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2">
                <Ship className="h-8 w-8 text-primary dark:text-sky-400" />
                <span className="text-xl font-bold text-primary dark:text-sky-400">CONSIMAR</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Sun className={`h-5 w-5 ${theme === 'light' ? 'text-yellow-500' : 'text-slate-500'}`} />
                <Switch
                  id="theme-toggle-header"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle theme"
                />
                <Moon className={`h-5 w-5 ${theme === 'dark' ? 'text-sky-400' : 'text-slate-500'}`} />
              </div>
              <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30" title="Cerrar Sesión">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Cierre de Sesión</DialogTitle>
                    <DialogDescription>
                      ¿Estás seguro de que deseas cerrar sesión?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowLogoutModal(false)}>Cancelar</Button>
                    <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600">Aceptar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>
      )}

      {showHeader && isAuthenticated && (
        <div className="hidden lg:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 border-r bg-background dark:bg-slate-900 p-4 transition-transform duration-300 ease-in-out z-30">
          <ScrollArea className="flex-grow">
            <nav className="space-y-2">
              {filteredNavItems.map(item => (
                <NavLink key={item.path} to={item.path} icon={item.icon}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>
        </div>
      )}
      
      <main className={`flex-1 ${showHeader && isAuthenticated ? 'lg:ml-64' : ''} p-4 sm:p-6 lg:p-8`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {showHeader && isAuthenticated && (
         <footer className={`border-t py-4 text-center text-xs text-muted-foreground ${isAuthenticated ? 'lg:ml-64' : ''}`}>
          © {new Date().getFullYear()} CONSIMAR. Todos los derechos reservados.
        </footer>
      )}
       {!showHeader && (
         <footer className={`py-4 text-center text-xs text-slate-200 dark:text-slate-400`}>
          © {new Date().getFullYear()} CONSIMAR. Todos los derechos reservados.
        </footer>
      )}
    </div>
  );
};

export default Layout;