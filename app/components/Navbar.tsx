'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggleButton from './ThemeToggleButton';

type NavbarProps = {
  userType: 'admin' | 'monitor' | 'student';
};

type LinkItem = {
  href: string;
  label: string;
  extra?: string;
};

const Navbar: React.FC<NavbarProps> = ({ userType }) => {
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen((prev) => !prev);

  const getNavbarColor = () => {
    switch (userType) {
      case 'admin': return 'bg-gray-900';
      case 'monitor': return 'bg-red-800';
      case 'student': return 'bg-blue-700';
      default: return 'bg-gray-900';
    }
  };

  // Lista de links
  const links: Record<'admin' | 'monitor' | 'student', LinkItem[]> = {
    admin: [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/cadastro', label: 'Cadastro de Usuários' },
      { href: '/admin/feedbacks', label: 'Feedbacks' },
      { href: '/admin/monitoria', label: 'Cadastrar Monitorias' },
      { href: '/admin/Forum', label: 'Forum' },
      { href: '#', label: 'Sair', extra: 'mt-4 hover:bg-red-600' },
    ],
    monitor: [
      { href: '/monitor/dashboard', label: 'Dashboard' },
      { href: '/monitor/agenda', label: 'Agenda' },
      { href: '/monitor/monitoria', label: 'Monitorias' },
      { href: '/monitor/Forum', label: 'Forum' },
      { href: '#', label: 'Sair', extra: 'mt-4 hover:bg-red-600' },
    ],
    student: [
      { href: '/User/dashboard', label: 'Dashboard' },
      { href: '/User/agenda', label: 'Agenda' },
      { href: '/User/monitoria', label: 'Monitorias' },
      { href: '/User/Forum', label: 'Forum' },
      { href: '#', label: 'Sair', extra: 'mt-4 hover:bg-red-600' },
    ],
  };

  const renderLinks = () => {
    return links[userType].map(({ href, label, extra }, index) => (
      <Link
        key={index}
        href={href}
        onClick={(e) => {
          if (label === 'Sair') {
            e.preventDefault();
            logout();
            router.push('/login');
          }
        }}
        className={`block px-4 py-2 text-white ${extra || 'hover:bg-gray-800'}`}
      >
        {label}
      </Link>
    ));
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <div className={`${getNavbarColor()} flex justify-between items-center p-4`}>
          <div className="flex-1">
            <button 
              onClick={toggleMenu} 
              className="nav-toggle-btn p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-white text-xl font-bold">Monitoria Digital</h1>
          </div>
          <div className="flex-1 flex justify-end">
            <ThemeToggleButton />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
            />

            <motion.div
              className={`fixed top-0 left-0 w-64 h-full z-50 text-white ${getNavbarColor()} shadow-xl`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-black/10 dark:border-white/10">
                <h3 className="text-xl font-semibold">
                  {userType === 'admin' ? 'ADM' : userType === 'monitor' ? 'Monitor' : 'Aluno'}
                </h3>
                <button
                  onClick={toggleMenu}
                  className="nav-toggle-btn p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200"
                  aria-label="Fechar menu"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <nav className="flex flex-col w-full py-2">
                {links[userType].map(({ href, label, extra }, index) => (
                  <Link
                    key={index}
                    href={href}
                    onClick={(e) => {
                      if (label === 'Sair') {
                        e.preventDefault();
                        logout();
                        router.push('/login');
                      }
                    }}
                    className={`w-full px-6 py-3 text-white text-left transition-colors duration-200 hover:bg-black/10 dark:hover:bg-white/10 ${
                      label === 'Sair' ? 'mt-4 text-red-300 hover:text-red-100 hover:bg-red-500/20' : ''
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;