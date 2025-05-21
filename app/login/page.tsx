// 📁 app/login/page.tsx
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

interface LoginResponse {
  role: "admin" | "monitor" | "aluno";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
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

      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "monitor") router.push("/monitor/dashboard");
      else if (role === "aluno") router.push("/User/dashboard");
    } catch {
      setError("E-mail ou senha inválidos!");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetSent(false);

    if (!validateEmail(email)) {
      setError("Digite um e-mail válido para recuperar a senha.");
      return;
    }

    try {
      await axios.post("/api/recuperar-senha", { email });
      setResetSent(true);
    } catch {
      setError("Erro ao tentar recuperar a senha. Tente novamente mais tarde.");
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

        {!showReset ? (
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
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-[#0070F3] hover:underline text-sm p-0 m-0 bg-transparent border-none focus:outline-none"
                style={{margin:0,padding:0}}
              >
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block font-medium text-[var(--titulo)] dark:text-[var(--titulo-dark)]">
                Digite seu e-mail para redefinir a senha
              </label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@dominio.com"
                className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-[var(--destaque)] focus:outline-none bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] placeholder-[var(--paragrafo)]"
                required
              />
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
              {resetSent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-green-500 text-sm text-center"
                >
                  Instruções de recuperação enviadas para o e-mail.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between gap-2">
              <button
                onClick={() => setShowReset(false)}
                className="w-1/2 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 transition"
              >
                Voltar
              </button>
              <button
                onClick={handleForgotPassword}
                className="w-1/2 bg-destaque text-textoBotao py-2 rounded hover:bg-botao transition"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
