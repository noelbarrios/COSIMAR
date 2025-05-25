import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const HomePage = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img  
          className="object-cover w-full h-full filter brightness-50" 
          alt="Boats on the sea at sunset"
         src="https://images.unsplash.com/photo-1695107974477-6eb05d4cb9c2" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
      </div>
      
      <div className="wave-animation">
        <div></div>
        <div></div>
      </div>

      <motion.div 
        className="relative z-10 text-center p-8 bg-black/30 dark:bg-black/50 backdrop-blur-sm rounded-xl shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1 
          className="text-5xl md:text-7xl font-extrabold mb-3 text-white drop-shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
        >
          CONSIMAR
        </motion.h1>
        <motion.p
          className="text-md md:text-lg text-gray-300 dark:text-gray-400 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          (Conocimiento de la Situación Marítima)
        </motion.p>
        <motion.p 
          className="text-lg md:text-xl text-gray-200 dark:text-gray-300 mb-10 max-w-2xl mx-auto drop-shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Gestione eficientemente las embarcaciones en su puerto con nuestra moderna plataforma.
        </motion.p>
        <div className="space-y-4 sm:space-y-0 sm:space-x-6 flex flex-col sm:flex-row justify-center">
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(59, 130, 246, 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Button asChild size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <Link to="/login">Acceder</Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(34, 197, 94, 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <Link to="/#">Registrarse</Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;