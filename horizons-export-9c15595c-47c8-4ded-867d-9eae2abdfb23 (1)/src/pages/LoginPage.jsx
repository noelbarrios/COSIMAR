import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { LogIn, Moon, Sun, Eye, EyeOff, Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const LoginPage = () => {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Por favor, ingrese su usuario y contraseña.');
      toast({ variant: "destructive", title: "Campos incompletos", description: "Por favor, ingrese su usuario y contraseña." });
      return;
    }
    
    setIsLoading(true);
    // 'identifier' será el email que se pasará a Supabase Auth.
    const success = await login(identifier, password); 
    setIsLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      // El toast de error específico de Supabase se maneja en AuthContext.
      // Aquí podemos poner un error genérico si login devuelve false por otra razón, o si no queremos depender del toast de AuthContext.
      setError('Usuario o contraseña incorrectos. Verifique sus credenciales.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 dark:from-slate-800 dark:via-slate-900 dark:to-black p-4 transition-colors duration-500">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <Sun className="h-6 w-6 text-yellow-300" />
        <Switch
          id="theme-toggle-login"
          checked={theme === 'dark'}
          onCheckedChange={toggleTheme}
          aria-label="Toggle theme"
        />
        <Moon className="h-6 w-6 text-slate-400" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl"
      >
        <div className="text-center">
          <motion.h1 
            className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 dark:from-sky-400 dark:to-indigo-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            CONSIMAR
          </motion.h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Conocimiento de la Situación Marítima
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="identifier" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              Usuario (Ingrese su Email)
            </Label>
            <Input
              id="identifier"
              name="identifier"
              type="email" // Type set to email for better validation/keyboard on mobile
              autoComplete="email" 
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="suemail@ejemplo.com" 
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!identifier && error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </Label>
            <div className="mt-1 relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!password && error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <motion.div
            whileHover={{ scale: isLoading ? 1 : 1.03 }}
            whileTap={{ scale: isLoading ? 1 : 0.97 }}
          >
            <Button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-md font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out disabled:opacity-75"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
          </motion.div>
        </form>

        <div className="text-center">
          <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-sky-400 dark:hover:text-sky-300 transition-colors">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </motion.div>
      <p className="mt-8 text-center text-sm text-slate-200 dark:text-slate-400">
        © {new Date().getFullYear()} CONSIMAR. Todos los derechos reservados.
      </p>
    </div>
  );
};

export default LoginPage;