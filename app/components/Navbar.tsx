// 📁 app/components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Removido - router não é mais usado aqui
import { usePathname } from 'next/navigation'; // Mantido para link ativo
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, User as TipoUserDoAuthContext } from '../context/AuthContext'; // Ajuste o caminho
import ThemeToggleButton from './ThemeToggleButton';

type LinkItem = {
  href?: string; // CORRIGIDO: href agora é opcional
  label: string;
  action?: () => void;
  extraClasses?: string;
};

type UserRoleOrGuest = 'admin' | 'monitor' | 'student' | 'guest';

const Navbar: React.FC = () => {
  // const router = useRouter(); // Removido
  const pathname = usePathname();
  // CORRIGIDO: authLoading removido da desestruturação se não for usado
  const { user, logout: authLogout } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false); // Fecha o menu ao mudar de rota
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  let currentRole: UserRoleOrGuest = 'guest';
  if (user) {
    const roleFromContext = (user as TipoUserDoAuthContext).role;
    if (roleFromContext === "admin") currentRole = "admin";
    else if (roleFromContext === "monitor") currentRole = "monitor";
    else if (roleFromContext === "aluno") currentRole = "student"; 
  }

  const getNavbarColor = () => {
    switch (currentRole) {
      case 'admin': return 'bg-gray-900'; 
      case 'monitor': return 'bg-red-800';  
      case 'student': return 'bg-blue-700'; 
      case 'guest':
      default: return 'bg-gray-900'; 
    }
  };
  
  const getSidebarTitle = () => {
    if (user && user.nome) {
        return user.nome;
    }
    switch (currentRole) {
      case 'admin': return 'Administração'; // Ajustado para nomes mais completos
      case 'monitor': return 'Monitor';
      case 'student': return 'Aluno';
      default: return 'Menu';
    }
  };

  // Definições dos links
  const links: Record<UserRoleOrGuest, LinkItem[]> = {
    admin: [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/cadastro', label: 'Cadastrar Usuários' },
      { href: '/admin/feedbacks', label: 'Feedbacks' },
      { href: '/admin/monitoria', label: 'Cadastrar Monitorias' },
      { href: '/admin/Forum', label: 'Fórum' },
      // 'href' não é mais obrigatório aqui por causa da alteração em LinkItem
      { label: 'Sair', action: authLogout, extraClasses: 'mt-auto text-red-300 hover:bg-red-700 hover:text-white'},
    ],
    monitor: [
      { href: '/monitor/dashboard', label: 'Dashboard' },
      { href: '/monitor/agenda', label: 'Agenda' },
      { href: '/monitor/monitoria', label: 'Minhas Monitorias' },
      { href: '/monitor/Forum', label: 'Fórum' },
      { label: 'Sair', action: authLogout, extraClasses: 'mt-auto text-red-300 hover:bg-red-700 hover:text-white' },
    ],
    student: [ 
      { href: '/User/dashboard', label: 'Dashboard' }, 
      { href: '/User/monitoria', label: 'Minhas Monitorias' },
      { href: '/User/Forum', label: 'Fórum' },
      { label: 'Sair', action: authLogout, extraClasses: 'mt-auto text-red-300 hover:bg-red-700 hover:text-white' },
    ],
    guest: [ 
      { href: '/#funcionalidades', label: 'Funcionalidades' }, 
      { href: '/#documentacao', label: 'Documentação' },
      { href: '/login', label: 'Login / Cadastro', extraClasses: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold' }, 
    ],
  };

  const activeLinks = links[currentRole] || links['guest'];

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60]">
        <div className={`${getNavbarColor()} flex justify-between items-center p-4 shadow-md`}>
          <div className="flex-1">
            {(user || currentRole === 'guest') && (activeLinks && activeLinks.length > 0) && ( // Só mostra botão se houver links
                <button 
                  onClick={toggleMenu} 
                  className="p-2 rounded-lg text-white hover:bg-black/25 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu className="w-6 h-6" />
                </button>
            )}
          </div>
          <div className="flex-1 text-center">
            <Link href={user ? (currentRole === 'admin' ? '/admin/dashboard' : currentRole === 'monitor' ? '/monitor/dashboard' : currentRole === 'student' ? '/User/dashboard' : '/') : '/'} className="text-white text-xl font-bold hover:opacity-80 transition-opacity">
              Monitoria Digital
            </Link>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-3">
            <ThemeToggleButton />
            {user && (
                 <span className="hidden sm:block text-sm text-white/90">
                    Olá, {user.nome.split(' ')[0]} 
                 </span>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (user || currentRole === 'guest') && (activeLinks && activeLinks.length > 0) && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleMenu}
            />
            <motion.div
              className={`fixed top-0 left-0 w-64 h-full z-[80] text-white ${getNavbarColor()} shadow-2xl flex flex-col`} // Reduzido w-72 para w-64
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              aria-label="Menu lateral"
            >
              <div className="flex justify-between items-center px-4 py-4 border-b border-white/10"> {/* Padding ajustado */}
                <h3 className="text-lg font-semibold truncate pr-2" title={getSidebarTitle()}> {/* Reduzido text-xl para text-lg */}
                  {getSidebarTitle()}
                </h3>
                <button
                  onClick={toggleMenu}
                  className="p-2 -mr-2 rounded-lg text-white/70 hover:bg-black/25 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" /> {/* Reduzido ícone X */}
                </button>
              </div>
              
              <nav className="flex flex-col flex-grow pt-2 overflow-y-auto">
                {activeLinks.map(({ href, label, action, extraClasses = '' }, index) => {
                  const isActive = pathname === href && (href && href !== '#'); // Adicionado verificação de href
                  const baseLinkClasses = "block px-4 py-2 text-white text-left transition-colors duration-200 text-sm"; // Reduzido py e text-base para text-sm
                  const hoverClasses = extraClasses.includes('hover:bg-red-700') || extraClasses.includes('hover:bg-blue-700') ? '' : 'hover:bg-gray-800'; 
                  const activeClass = isActive ? 'bg-black/30' : ''; 

                  if (action) {
                    return (
                      <button
                        key={`${label}-${index}`} // Chave mais robusta
                        onClick={() => { action(); toggleMenu(); }}
                        className={`${baseLinkClasses} ${hoverClasses} ${extraClasses} w-full ${activeClass} ${label === 'Sair' ? 'mt-auto' : ''}`}
                      >
                        {label}
                      </button>
                    );
                  }
                  return (
                    <Link
                      key={`${label}-${index}`} // Chave mais robusta
                      href={href || '#'} // Garante que href sempre tem um valor
                      onClick={toggleMenu}
                      className={`${baseLinkClasses} ${hoverClasses} ${extraClasses} ${activeClass}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
              {user && (
                <div className="p-4 border-t border-white/10 text-xs"> {/* Reduzido padding e text-sm para text-xs */}
                    <p className="font-semibold truncate" title={user.nome}>{user.nome}</p>
                    <p className="text-white/70 truncate" title={user.email}>{user.email}</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* O espaçador pt-16 ou pt-[68px] deve estar no layout da PÁGINA que usa este Navbar, não aqui. */}
    </>
  );
};

export default Navbar;