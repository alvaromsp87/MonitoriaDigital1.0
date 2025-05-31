"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";

const ThemeToggleButton = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <motion.button
      onClick={toggleDarkMode}
      className="nav-toggle-btn flex items-center justify-center p-2.5 rounded-full shadow-md bg-white/10 backdrop-blur-sm"
      aria-label="Alternar tema"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
    >
      {darkMode ? (
        <motion.div
          key="sun"
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Sun className="w-5 h-5 text-yellow-400" />
        </motion.div>
      ) : (
        <motion.div
          key="moon"
          initial={{ rotate: 90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="w-5 h-5 text-slate-800" />
        </motion.div>
      )}
    </motion.button>
  );
};

export default ThemeToggleButton;