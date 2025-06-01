// app/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import {
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ChevronDownIcon, // Para o dropdown
} from "@heroicons/react/24/outline";
// import { Sun, Moon } from "lucide-react"; // Removido se ThemeToggleButton já os usa
// import { useTheme } from "./context/ThemeContext"; // Removido se ThemeToggleButton gerencia tudo
import ThemeToggleButton from "./components/ThemeToggleButton"; // Certifique-se que este componente existe e funciona

// Definição das seções para os botões expansíveis
const featureSections = [
  {
    id: "usuarios",
    title: "Aulas síncronas com alunos",
    description: "As aulas são agendadas e ao vivo, possibilitando sanar dúvidas durante a aula.",
  },
  {
    id: "administrador",
    title: "Controle total de administração",
    description: "Monitoramento de desempenho dos alunos e controle de aulas.",
  },
  {
    id: "monitor",
    title: "Planeje suas aulas",
    description: "Faça seus horários e crie suas aulas com facilidade.",
  },
];

export default function Page() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    usuarios: true, // O primeiro começa expandido
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTechDropdownOpen, setMobileTechDropdownOpen] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      // ...prev, // Para manter outros expandidos, se essa for a lógica desejada.
                  // Se quiser que apenas um fique aberto por vez, a lógica seria diferente.
      [sectionId]: !prev[sectionId],
    }));
  };

  // const { darkMode } = useTheme(); // Removido - o ThemeToggleButton deve gerenciar isso globalmente

  return (
    <div className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-300`}>
      {/* Barra de Navegação Aprimorada */}
      <nav className="bg-[var(--card)] text-[var(--card-foreground)] shadow-lg sticky top-0 z-50 py-3 px-4 sm:px-6">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
            Monitoria Digital
          </Link>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <div className="relative group">
              <button 
                className="flex items-center space-x-1.5 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-opacity-75 rounded-md px-3 py-2 text-sm font-medium"
              >
                <span>Tecnologias</span>
                <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div 
                className="absolute left-0 mt-2 w-56 bg-[var(--popover)] text-[var(--popover-foreground)] rounded-md shadow-xl border border-[var(--border)] opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 ease-out z-30"
              >
                <div className="py-1">
                  <Link href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                    Next.js
                  </Link>
                  <Link href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                    JavaScript
                  </Link>
                  <Link href="https://www.mysql.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                    MySQL
                  </Link>
                </div>
              </div>
            </div>
            <ThemeToggleButton />
            <Link 
              href="#documentacao" // Certifique-se que este ID existe na página
              className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Documentação
            </Link>
            <Link
              href="/login"
              className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-md text-sm font-semibold transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--background)] shadow-sm"
            >
              Login
            </Link>
          </div>

          <button
            className="md:hidden text-[var(--foreground)] p-2 rounded-md hover:bg-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu-panel"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menu Mobile Aprimorado */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm dark:bg-slate-900/70" onClick={() => setMobileMenuOpen(false)}></div>
            <div id="mobile-menu-panel" className="fixed inset-y-0 right-0 w-full max-w-sm bg-[var(--background)] text-[var(--foreground)] px-6 py-6 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-xl font-bold" onClick={() => setMobileMenuOpen(false)}>Monitoria Digital</Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors"
                  aria-label="Fechar menu"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <nav className="space-y-2">
                <div>
                  <button
                    onClick={() => setMobileTechDropdownOpen(!mobileTechDropdownOpen)}
                    className="flex items-center justify-between w-full py-2 text-lg font-medium hover:text-[var(--primary)] transition-colors"
                    aria-expanded={mobileTechDropdownOpen}
                    aria-controls="mobile-tech-dropdown"
                  >
                    <span>Tecnologias</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        mobileTechDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div 
                    id="mobile-tech-dropdown"
                    className={`mt-2 space-y-1 pl-4 transition-all duration-300 ease-in-out ${
                      mobileTechDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <Link href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="block py-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      Next.js
                    </Link>
                    <Link href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noopener noreferrer" className="block py-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      JavaScript
                    </Link>
                    <Link href="https://www.mysql.com/" target="_blank" rel="noopener noreferrer" className="block py-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                      MySQL
                    </Link>
                  </div>
                </div>
                <Link href="#documentacao" className="block py-2 text-lg font-medium hover:text-[var(--primary)] transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Documentação
                </Link>
                 <div className="pt-6 mt-6 border-t border-[var(--border)]">
                    <ThemeToggleButton />
                 </div>
                <div className="pt-6 border-t border-[var(--border)]">
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:opacity-80 transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </nav>

      {/* Seção Hero Aprimorada */}
      <header className="bg-gradient-to-b from-[var(--background)] to-[var(--secondary)] text-[var(--foreground)] py-20 sm:py-28 lg:py-36 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                Transforme a <span className="text-[var(--primary)]">Monitoria Acadêmica</span>
              </h1>
              <p className="text-lg sm:text-xl text-[var(--muted-foreground)] mb-10 max-w-xl mx-auto lg:mx-0">
                Nossa plataforma conecta alunos e monitores, facilitando o agendamento de aulas, o acompanhamento de desempenho e a criação de um ambiente de aprendizado colaborativo e eficiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/login" // Idealmente para /cadastro ou /saiba-mais
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-base font-semibold shadow-lg hover:opacity-80 transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--background)]"
                >
                  Comece Agora
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </Link>
                <Link
                  href="#funcionalidades"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg bg-[var(--card)] text-[var(--card-foreground)] text-base font-semibold shadow-lg border border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--background)]"
                >
                  Saiba Mais
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 mt-12 lg:mt-0">
              <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-[var(--primary)]/20 p-2 bg-[var(--card)]">
                <Image
                  src={"/tela-aluno.png"} // Substitua pelo caminho real da sua imagem
                  width={1280} 
                  height={800}
                  alt="Plataforma de Monitoria Digital em Ação"
                  className="object-cover w-full h-auto rounded-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Seção de Recursos (Accordion) Aprimorada */}
      <section id="funcionalidades" className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[var(--background)] text-[var(--foreground)]">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Funcionalidades Poderosas</h2>
            <p className="mt-4 text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Descubra como nossa plataforma pode transformar a experiência de monitoria para todos.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
            <div className="lg:w-1/2 space-y-4">
              {featureSections.map((section) => (
                <div key={section.id} className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)] text-[var(--card-foreground)] shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <button
                    className="w-full text-left px-6 py-5 flex justify-between items-center text-lg font-semibold hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors duration-150 focus:outline-none focus-visible:bg-[var(--accent)]"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={expandedSections[section.id] || false}
                    aria-controls={`section-content-${section.id}`}
                  >
                    <span>{section.title}</span>
                    {expandedSections[section.id] ? (
                      <MinusIcon className="h-5 w-5 text-[var(--primary)] transform transition-transform duration-200" />
                    ) : (
                      <PlusIcon className="h-5 w-5 text-[var(--primary)] transform transition-transform duration-200" />
                    )}
                  </button>
                  <div
                    id={`section-content-${section.id}`}
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      expandedSections[section.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0' 
                      // Aumentado max-h para garantir que o conteúdo caiba. Ajuste se necessário.
                    }`}
                  >
                    <div className="px-6 pb-5 pt-3 border-t border-[var(--border)] text-[var(--muted-foreground)]">
                      <p>{section.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:w-1/2 mt-8 lg:mt-0 sticky top-24"> {/* Sticky para a imagem */}
              <div className="bg-[var(--card)] p-2 rounded-xl border border-[var(--border)] shadow-2xl">
                <Image 
                  src={"/Homepage_2.png"} // Substitua pelo caminho real da sua imagem
                  alt="Visão geral da Plataforma Monitoria Digital" 
                  width={1200} 
                  height={800} 
                  className="rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de CTA (Call to Action) Aprimorada */}
      <section className="w-full py-20 sm:py-28 lg:py-32 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark,theme(colors.blue.700))] text-white">
        {/* Use var(--primary-dark) se definido, senão um fallback como theme(colors.blue.700) */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
            Pronto para Elevar Seus Estudos?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Junte-se à comunidade Monitoria Digital. Conecte-se, aprenda e cresça com o suporte de monitores dedicados e uma plataforma projetada para o seu sucesso acadêmico.
          </p>
          <Link
            href="/login" // Ou /cadastro
            className="inline-flex items-center justify-center px-10 py-4 rounded-lg bg-white text-[var(--primary)] text-base font-bold shadow-2xl hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
          >
            Acesse a Plataforma
            <svg className="ml-2.5 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Rodapé Aprimorado */}
      <footer className="bg-[var(--card-alt,var(--secondary))] text-[var(--card-alt-foreground,var(--secondary-foreground))] py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-[var(--border)]">
        {/* Use var(--card-alt) se definido, ou fallback para var(--secondary) */}
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
            <div>
              <h3 className="text-xl font-bold text-[var(--heading-foreground)] mb-4">Monitoria Digital</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Soluções de engajamento acadêmico para instituições modernas.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://github.com/alvaromsp87/MonitoriaDigital1.0.git" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="GitHub"
                  className="p-2 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-opacity-80 transition-colors"
                >
                  <FaGithub className="h-5 w-5"/>
                </a>
                {/* Adicione outros ícones de redes sociais aqui */}
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--heading-foreground)] mb-5">Recursos</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#funcionalidades" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Funcionalidades</Link></li>
                <li><Link href="/blog" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Blog</Link></li>
                <li><Link href="/suporte" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Suporte</Link></li>
                <li><Link href="#documentacao" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Documentação</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--heading-foreground)] mb-5">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/termos" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Termos de Serviço</Link></li>
                <li><Link href="/privacidade" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Política de Privacidade</Link></li>
                 <li><Link href="/cookies" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Política de Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--heading-foreground)] mb-5">Mantenha-se Atualizado</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Inscreva-se para receber as últimas notícias e dicas.
              </p>
              <form className="flex w-full max-w-sm">
                <label htmlFor="footer-email" className="sr-only">Email</label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Seu e-mail"
                  className="px-4 py-2.5 rounded-l-md w-full border border-[var(--border)] bg-[var(--input)] text-[var(--input-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] outline-none text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-r-md hover:opacity-80 transition-opacity text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--background)]"
                >
                  Inscrever
                </button>
              </form>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
            <p>&copy; {new Date().getFullYear()} Monitoria Digital. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}