import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Logo from "@/assets/clipealo-logo.svg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <motion.img
        src={Logo}
        alt="Clipealo"
        className="h-12 mb-8 logo-glow"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      />
      
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-6xl font-bold gradient-text mb-4"
      >
        404
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-muted-foreground mb-8"
      >
        ¡Oops! Página no encontrada
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link 
          to="/" 
          className="gradient-text-pink-purple font-semibold hover:underline"
        >
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
