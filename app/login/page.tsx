// 📁 app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext"; // Verifique se este caminho está correto
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
// Se você não estiver usando useTheme diretamente aqui, pode remover o import
// import { useTheme } from "../context/ThemeContext"; 
import ThemeToggleButton from "../components/ThemeToggleButton"; // Verifique se este caminho está correto

// Interface para a RESPOSTA da API /api/login
// Deve corresponder ao responsePayload da sua API /api/login/route.ts
interface ApiResponseData {
  success: boolean;
  message: string;
  userId: number; // API retorna ID como número
  role: "admin" | "monitor" | "aluno";
  userName: string;
  email: string; // Adicionado, pois a API de login agora deve retornar o email
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  // const { darkMode } = useTheme(); // Removido se não for usado diretamente
  const router = useRouter();
  const { login } = useAuth(); // Função login do AuthContext

  const validateEmail = (emailToValidate: string): boolean => // Adicionado tipo de retorno
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToValidate);

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
      const response = await axios.post<ApiResponseData>("/api/login", {
        email,
        password,
      });

      const apiData = response.data; 

      if (apiData.success) {
        // Monta o objeto userData para o AuthContext.login()
        // A função login do AuthContext agora espera: id (number), nome (string), email (string), role
        login({ 
          id: apiData.userId,       // Passa como número
          nome: apiData.userName,   // Passa como string
          email: apiData.email,     // Passa como string (deve vir da API)
          role: apiData.role        // Passa como string
        });

        // Redirecionamento baseado no role
        if (apiData.role === "admin") router.push("/admin/dashboard");
        else if (apiData.role === "monitor") router.push("/monitor/dashboard");
        else if (apiData.role === "aluno") router.push("/User/dashboard"); // Considere padronizar o casing da rota
      } else {
        setError(apiData.message || "Falha no login.");
      }
    } catch (err) { 
        if (axios.isAxiosError(err) && err.response) {
            setError(err.response.data.error || "E-mail ou senha inválidos!");
        } else {
            setError("Ocorreu um erro ao tentar fazer login. Tente novamente.");
        }
        console.error("Erro de login:", err);
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
    } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
            setError(err.response.data.error || "Erro ao tentar recuperar a senha.");
        } else {
            setError("Erro ao tentar recuperar a senha. Tente novamente mais tarde.");
        }
        console.error("Erro na recuperação de senha:", err);
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
        className={`relative p-6 sm:p-8 rounded-3xl w-full max-w-md
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

        <div className="flex justify-center mb-6">
          <Image
            src="/logo-monitoria-digital.png" 
            alt="Logo Monitoria Digital"
            width={140}
            height={140}
            priority // Bom para LCP
            className="brightness-100 dark:brightness-90"
          />
        </div>

        {!showReset ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--titulo)] dark:text-[var(--titulo-dark)]">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className={`w-full p-3 border rounded-md mt-1 focus:ring-2 focus:ring-[#0070F3] focus:outline-none
                  bg-[var(--card-input)] text-[var(--foreground-input)] border-[var(--border)] placeholder-[var(--placeholder-input)]
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                `}
                required
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--titulo)] dark:text-[var(--titulo-dark)]">
                Senha
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className={`w-full p-3 border rounded-md mt-1 focus:ring-2 focus:ring-[#0070F3] focus:outline-none pr-10
                  bg-[var(--card-input)] text-[var(--foreground-input)] border-[var(--border)] placeholder-[var(--placeholder-input)]
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                `}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 mt-3 text-[#0070F3] dark:text-blue-400 p-0 m-0 bg-transparent border-none focus:outline-none"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-600 dark:text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full bg-destaque text-textoBotao py-3 rounded-md hover:bg-botao transition duration-300 disabled:opacity-60 shadow-[0_0_10px_2px_var(--destaque)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!email || !password || loading}
            >
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Carregando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => { setShowReset(true); setError(''); setResetSent(false); }}
                className="text-[#0070F3] dark:text-blue-400 hover:underline p-0 m-0 bg-transparent border-none focus:outline-none"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        ) : (
          // Formulário de Reset de Senha
          <div className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-[var(--titulo)] dark:text-[var(--titulo-dark)]">
                Digite seu e-mail para redefinir a senha
              </label>
              <input
                type="email"
                id="reset-email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@dominio.com"
                className="w-full p-3 border rounded-md mt-1 focus:ring-2 focus:ring-[var(--destaque)] focus:outline-none bg-[var(--card-input)] text-[var(--foreground-input)] border-[var(--border)] placeholder-[var(--placeholder-input)] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                required
                autoComplete="email"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-600 dark:text-red-400 text-sm text-center">
                  {error}
                </motion.div>
              )}
              {resetSent && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-green-500 dark:text-green-400 text-sm text-center">
                  Instruções de recuperação enviadas para o e-mail.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={() => {setShowReset(false); setError(""); setResetSent(false);}}
                className="w-full sm:w-auto flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 py-3 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Voltar para Login
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={!email || loading}
                className="w-full sm:w-auto flex-1 bg-destaque text-textoBotao py-3 rounded-md hover:bg-botao transition disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}