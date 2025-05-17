// app/pages/LandingPage.tsx
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

export default function LandingPage() {
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
      <div className="absolute top-4 right-4">
        <ThemeToggleButton />
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
              <button className="hover:text-destaque transition focus:outline-none">
                Tecnologias
                <svg
                  className="ml-1 h-4 w-4 inline-block"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-40 bg-fundo shadow-lg rounded hidden group-hover:block">
                <Link href="/tecnologia/nextjs" className="block px-4 py-2 hover:bg-gray-50">
                  Next.js
                </Link>
                <Link href="/tecnologia/javascript" className="block px-4 py-2 hover:bg-gray-50">
                  JavaScript
                </Link>
                <Link href="/tecnologia/mysql" className="block px-4 py-2 hover:bg-gray-50">
                  MySQL
                </Link>
              </div>
            </div>

            <Link href="#documentacao" className="hover:text-destaque transition">
              Documentação
            </Link>
          </div>

          {/* Botões de Login e Início */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="bg-botao text-textoBotao px-4 py-2 rounded-md hover:bg-destaque transition"
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
          <div className="md:hidden mt-4 py-4 bg-fundo border-t border-secundario">
            <div className="flex flex-col space-y-4 px-6">
              {/* Dropdown para Tecnologias na versão mobile */}
              <div>
                <button
                  onClick={() => setMobileTechDropdownOpen(!mobileTechDropdownOpen)}
                  className="w-full text-left px-4 py-3 hover:text-destaque transition"
                >
                  Tecnologias
                </button>
                {mobileTechDropdownOpen && (
                  <div className="pl-4">
                    <Link
                      href="/tecnologia/nextjs"
                      className="block px-4 py-2 hover:text-destaque transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Next.js
                    </Link>
                    <Link
                      href="/tecnologia/javascript"
                      className="block px-4 py-2 hover:text-destaque transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      JavaScript
                    </Link>
                    <Link
                      href="/tecnologia/mysql"
                      className="block px-4 py-2 hover:text-destaque transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      MySQL
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="#documentacao"
                className="hover:text-destaque transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentação
              </Link>
              <div className="pt-4 border-t border-secundario flex flex-col space-y-4">
                <Link
                  href="/login"
                  className="bg-botao text-textoBotao px-4 py-2 rounded-md hover:bg-destaque transition text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Seção do Hero */}
      <section className="bg-[var(--background)] py-16 px-6">
        <div className="container mx-auto">
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
              {/* Placeholder para imagem - substitua pelo URL correto */}
              <div className="rounded-lg overflow-hidden shadow-xl">
                {/* TODO: Substituir pelo componente de imagem/vídeo real */}
                <div className="bg-[var(--card)] h-64 md:h-80 flex items-center justify-center">
                  {/* Substituir por uma imagem real */}
                  <Image src={"/tela-aluno.png"} width={600} height={400} alt="Aula ao vivo" className="object-cover"/>
                  {/* Exemplo: <Image src="/hero-image.jpg" alt="Plataforma Monitoria Digital" width={600} height={400} /> */}
                </div>
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
      <section className="py-16 px-6 bg-[var(--primary)] text-[var(--primary-foreground)]">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Transforme seus estudos agora
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Conecte-se com seus alunos e monitores em potenciais e em tempo real, aumente seu desempenho acadêmico e acelere o seu aprendizado.
          </p>
          <Link
            href="/login"
            className="bg-[var(--card)] text-[var(--primary)] px-8 py-4 rounded-md hover:opacity-90 transition inline-block text-lg font-medium"
          >
            Conecte-se agora
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