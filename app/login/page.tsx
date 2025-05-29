// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTheme } from "../context/ThemeContext";
import ThemeToggleButton from "../components/ThemeToggleButton";
import Link from "next/link"; // Adicionado para o link de recuperar senha

interface LoginResponse {
  role: "admin" | "monitor" | "aluno";
  message?: string; // Adicionado para capturar mensagens de erro da API
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // `resetSent` e `showReset` não são mais necessários se /recuperar-senha é uma página separada
  // const [resetSent, setResetSent] = useState(false);
  // const [showReset, setShowReset] = useState(false);
  const { darkMode } = useTheme();
  const router = useRouter();
  const { login } = useAuth();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateEmail(email)) {
      setError("E-mail inválido.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post<LoginResponse>("/api/login", {
        email,
        password,
      });

      const { role } = response.data;
      login({ email, role });

      if (role === "admin") router.push("/admin/dashboard"); // Caminho para o dashboard do Admin
      else if (role === "monitor") router.push("/Monitor/dashboard"); // Caminho para o dashboard do Monitor
      else if (role === "aluno") router.push("/User/dashboard"); // Caminho para o dashboard do Aluno
    } catch (err: any) {
      console.error("Erro no login:", err);
      // Pega a mensagem de erro da API se disponível (err.response?.data), senão usa uma genérica
      setError(err.response?.data || "E-mail ou senha inválidos!"); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        min-h-screen flex items-center justify-center transition-colors duration-300
        bg-blue-50 dark:bg-[var(--fundo)]
      `}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative p-6 rounded-3xl w-full max-w-md
          bg-[var(--card)]
          text-[var(--foreground)]
          border-2 border-black/10
          shadow-[0_0_40px_10px_rgba(255,221,51,0.32)]
          dark:shadow-[0_0_32px_6px_rgba(0,112,243,0.32)]
        `}
      >
        <div className="absolute top-4 right-4">
          <ThemeToggleButton />
        </div>

        <div className="flex justify-center mb-4">
          <Image
            src="/logo-monitoria-digital.png"
            alt="Logo Monitoria Digital"
            width={140}
            height={140}
            className="brightness-100 dark:brightness-90"
          />
        </div>

        {/* Formulário de Login */}
        {/* Removido o bloco !showReset ? (...) : (...) pois a recuperação de senha é uma página separada */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-medium text-[var(--titulo)] dark:text-[var(--titulo-dark)]">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className={`w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-[#0070F3] focus:outline-none
                bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] placeholder-[var(--paragrafo)]
              `}
              required
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block font-medium text-[var(--titulo)] dark:text-[var(--titulo-dark)]">
              Senha
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className={`w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-[#0070F3] focus:outline-none pr-10
                bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] placeholder-[var(--paragrafo)]
              `}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-[#0070F3] p-0 m-0 bg-transparent border-none focus:outline-none"
              tabIndex={-1}
              aria-label="Mostrar ou ocultar senha"
              style={{margin:0,padding:0}}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-terciario text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full bg-destaque text-textoBotao py-2 rounded hover:bg-botao transition duration-300 disabled:opacity-50 shadow-[0_0_10px_2px_var(--destaque)]"
            disabled={!email || !password || loading}
          >
            {loading ? (
              <div className="flex justify-center items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Carregando...
              </div>
            ) : (
              "Entrar"
            )}
          </button>

          <div className="text-center mt-0">
            {/* Link para a página de recuperação de senha separada */}
            <Link href="/recuperar-senha" className="text-[#0070F3] hover:underline text-sm p-0 m-0 bg-transparent border-none focus:outline-none" style={{margin:0,padding:0}}>
              Esqueceu sua senha?
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
