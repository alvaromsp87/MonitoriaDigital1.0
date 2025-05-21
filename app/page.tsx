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
} from "@heroicons/react/24/outline";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./context/ThemeContext";
import ThemeToggleButton from "./components/ThemeToggleButton";

// Definição das seções para os botões expansíveis
const featureSections = [
  {
    id: "usuarios",
    title: "Aulas sincronas com alunos",
    description: "As aulas são agendas e são ao vivo, possibilitando sanar dúvidas durante a aula",
    expanded: true, // Inicia expandido por padrão
  },
  {
    id: "administrador",
    title: "Controle total de admimistração",
    description: "Monitoramento de desempenho dos alunos e Controle de aulas",
  },
  {
    id: "monitor",
    title: "Planeje suas aulas",
    description: "Faça seus horarios e crie suas aulas com facilidade",
  },
];

// Componente para os resultados com métricas
/*const ResultMetric = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="text-destaque text-5xl font-bold mb-2">{value}</div>
    <div className="text-paragrafo">{label}</div>
  </div>
);*/

export default function Page() {
  // Estados para controlar a expansão das seções e menu móvel
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    usuarios: true, // Apenas o primeiro começa expandido
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Novo estado para o dropdown de tecnologias na versão mobile
  const [mobileTechDropdownOpen, setMobileTechDropdownOpen] = useState(false);

  // Função para alternar a expansão da seção
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const { darkMode } = useTheme();
  return (
    <div className={`min-h-screen bg-[var(--background)] text-[var(--foreground)]`}>
      <div className="absolute top-4 right-4 z-50">
        
      </div>

      {/* Barra de Navegação */}
      <nav className="bg-[var(--card)] text-[var(--card-foreground)] shadow-md py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <h1 className="text-2xl font-bold">Monitoria Digital</h1>

          {/* Menu Desktop */}
          <div className="hidden md:flex space-x-6 items-center">
            {/* Dropdown Tecnologias */}
            <div className="relative group">
              <button 
                className="flex items-center space-x-1 
                bg-[var(--background)] text-[var(--foreground)]
                hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] 
                transition-colors duration-200 
                focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-opacity-50 
                rounded-md px-3 py-2"
              >
                <span>Tecnologias</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-[var(--card)] rounded-md shadow-soft-lg border border-[var(--border)] opacity-0 translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  <Link href="/tecnologia/nextjs" className="block px-4 py-2 text-sm text-[var(--card-foreground)] hover:bg-[var(--accent)] transition-colors">
                    Next.js
                  </Link>
                  <Link href="/tecnologia/javascript" className="block px-4 py-2 text-sm text-[var(--card-foreground)] hover:bg-[var(--accent)] transition-colors">
                    JavaScript
                  </Link>
                  <Link href="/tecnologia/mysql" className="block px-4 py-2 text-sm text-[var(--card-foreground)] hover:bg-[var(--accent)] transition-colors">
                    MySQL
                  </Link>
                </div>
              </div>
            </div>
           <ThemeToggleButton />
            <Link 
              href="#documentacao" 
              className="flex items-center space-x-1 
                bg-[var(--background)] text-[var(--foreground)]
                hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] 
                transition-colors duration-200 
                focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-opacity-50 
                rounded-md px-3 py-2"
            >
              Documentação
            </Link>
          </div>

          {/* Botões de Login e Início */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="bg-botao text-textoBotao px-4 py-2 rounded-md transition hover:bg-destaque 
             shadow-[0_0_10px_var(--primary)] hover:shadow-[0_0_15px_var(--accent)]"
            >
              Login
            </Link>
          </div>

          {/* Botão do Menu Mobile */}
          <button
            className="md:hidden text-titulo"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Overlay de fundo */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-slate-900/80" onClick={() => setMobileMenuOpen(false)}></div>
            
            {/* Painel de navegação */}
            <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[var(--background)] px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <nav className="space-y-6">
                {/* Dropdown Tecnologias */}
                <div>
                  <button
                    onClick={() => setMobileTechDropdownOpen(!mobileTechDropdownOpen)}
                    className="flex items-center justify-between w-full py-2 text-[var(--foreground)] hover:text-[var(--primary)]"
                  >
                    <span>Tecnologias</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        mobileTechDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`mt-2 space-y-2 transition-all duration-200 ${
                    mobileTechDropdownOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}>
                    <Link
                      href="/tecnologia/nextjs"
                      className="block pl-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Next.js
                    </Link>
                    <Link
                      href="/tecnologia/javascript"
                      className="block pl-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      JavaScript
                    </Link>
                    <Link
                      href="/tecnologia/mysql"
                      className="block pl-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      MySQL
                    </Link>
                  </div>
                </div>

                <Link
                  href="#documentacao"
                  className="block py-2 text-[var(--foreground)] hover:text-[var(--primary)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Documentação
                </Link>

                <div className="pt-6 border-t border-[var(--border)]">
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </nav>

      {/* Seção do Hero */}
      <section className="bg-[var(--background)] py-16 px-6">
        <div className="container mx-auto rounded-2xl shadow-lg bg-[var(--card)] p-8">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Textos do Hero - Lado Esquerdo */}
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] leading-tight mb-6">
              Bem-vindo a Monitoria Digital, uma plataforma para gerenciar monitorias.
              </h1>
              <p className="text-[var(--muted-foreground)] text-lg mb-8">
              Faça o acompanhamento e controle de o desempenho dos alunos e agende suas atividades. 
              Nosso sistema oferece uma experiência intuitiva e eficiente para monitores e alunos.
              </p>
            </div>

            {/* Imagem do Hero - Lado Direito */}
            <div className="lg:w-1/2 lg:pl-10">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-[var(--card)] p-4">
                <Image
                  src={"/tela-aluno.png"}
                  width={600}
                  height={400}
                  alt="Aula ao vivo"
                  className="object-cover w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Recursos com Botões Expansíveis */}
      <section className="py-16 px-6 bg-[var(--secondary)]">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row">
            {/* Coluna de Botões Expansíveis */}
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <div className="space-y-4">
                {featureSections.map((section) => (
                  <div key={section.id} className="border border-[var(--border)] rounded-md overflow-hidden bg-[var(--card)] shadow-sm">
                    <button
                      className="w-full text-left px-4 py-3 flex justify-between items-center font-medium text-[var(--foreground)] hover:bg-[var(--accent)] transition"
                      onClick={() => toggleSection(section.id)}
                    >
                      <span>{section.title}</span>
                      {expandedSections[section.id] ? (
                        <MinusIcon className="h-5 w-5 text-[var(--primary)]" />
                      ) : (
                        <PlusIcon className="h-5 w-5 text-[var(--primary)]" />
                      )}
                    </button>
                    {expandedSections[section.id] && (
                      <div className="px-4 py-3 border-t border-[var(--border)] text-[var(--muted-foreground)]">
                        <p>{section.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna de Imagem/iframe */}
            <div className="lg:w-1/2 lg:pl-10">
              {/* Placeholder/sombra para screenshot do sistema */}
              <div className="bg-[var(--card)] p-2 rounded-lg border border-[var(--border)] shadow-lg">
                <Image src={"/Homepage_2.png"} alt="Plataforma Monitoria Digital" width={600} height={400} className="rounded-lg"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de CTA */}
      <section className="w-full py-20 bg-blue-500">
        <div className="max-w-full px-0 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
            Transforme seus estudos agora
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Conecte-se com seus alunos e monitores em potenciais e em tempo real, aumente seu desempenho acadêmico e acelere o seu aprendizado.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-white text-blue-700 font-semibold shadow-soft-lg hover:bg-opacity-90 transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
          >
            Conecte-se agora
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="bg-[var(--card)] text-[var(--card-foreground)] py-12 px-6 border-t border-[var(--border)]">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Coluna 1 - Logo e Informações */}
            <div>
              <h3 className="text-xl font-bold mb-4">Monitoria Digital</h3>
              <p className="mb-4">
                Soluções de engajamento de acadêmico para instituições modernas.
              </p>
              <div className="flex space-x-4">
                {/* Ícones de Redes Sociais */}
                <a href="https://github.com/alvaromsp87/MonitoriaDigital1.0.git" className="hover:text-destaque transition">
                  <div className="h-6 w-6 bg-fundo rounded-full">
                  <FaGithub className="h-6 w-6 bg-black rounded-full"/>
                  </div>
                </a>
              </div>
            </div>

            {/* Coluna 2 - Links Rápidos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#sobre" className="hover:text-destaque transition">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="#funcionalidades" className="hover:text-destaque transition">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link href="#precos" className="hover:text-destaque transition">
                    Seja um monitor
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coluna 4 - Inscrição na Newsletter */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Atualizações</h3>
              <p className="mb-4">
                Inscreva-se para receber as últimas notícias e atualizações.
              </p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="px-4 py-2 rounded-l-md w-full text-titulo"
                />
                <button
                  type="submit"
                  className="bg-destaque px-4 py-2 rounded-r-md hover:bg-botao transition"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}