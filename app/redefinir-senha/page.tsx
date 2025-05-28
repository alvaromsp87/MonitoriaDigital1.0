// app/redefinir-senha/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import ThemeToggleButton from "../components/ThemeToggleButton";
import Image from "next/image";

export default function RedefinirSenha() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null); // null: verificando, true: válido, false: inválido

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Pega o token da URL
  const { darkMode } = useTheme();

  useEffect(() => {
    // Verifica a validade do token ao carregar a página
    async function verifyToken() {
      if (!token) {
        setTokenValid(false);
        setMessage("Token de redefinição de senha não encontrado na URL.");
        return;
      }
      try {
        setLoading(true);
        // Chama a API para validar o token
        await axios.post("/api/validar-token-senha", { token });
        setTokenValid(true);
      } catch (err: any) {
        console.error("Erro ao validar token:", err);
        setTokenValid(false); // Define como false se houver erro na validação
        setMessage(err.response?.data?.error || "Token inválido ou expirado.");
      } finally {
        setLoading(false);
      }
    }
    verifyToken();
  }, [token]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (password.length < 6) { // Exemplo de requisito de senha
      setMessage("A senha deve ter no mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    if (!token) {
        setMessage("Token de redefinição não encontrado.");
        setLoading(false);
        return;
    }

    try {
      // Chama a API para redefinir a senha
      await axios.post("/api/redefinir-senha", { token, newPassword: password });
      setMessage("Senha redefinida com sucesso!");
      setTimeout(() => {
        router.push("/login"); // Redireciona para o login
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      setMessage(error.response?.data?.error || "Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && tokenValid === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-blue-100"}`}>
        <p className={`${darkMode ? "text-white" : "text-gray-900"}`}>Verificando token...</p>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-blue-100"}`}>
        <div className={`p-6 rounded-3xl shadow-2xl w-full max-w-md text-center ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
          <h3 className="text-2xl font-semibold mb-4">Token Inválido ou Expirado</h3>
          <p className="text-red-500 mb-4">{message}</p>
          <Link href="/recuperar-senha" className="text-blue-500 hover:underline">
            Solicitar nova recuperação de senha
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-blue-100"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative p-6 rounded-3xl shadow-2xl w-full max-w-md ${
          darkMode
            ? "bg-gray-800 text-white shadow-gray-900/50"
            : "bg-white text-gray-900 shadow-gray-300/50"
        }`}
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
            className={darkMode ? "brightness-90" : "brightness-100"}
          />
        </div>

        <h3 className="text-center text-2xl font-semibold mb-6">
          Redefinir Senha
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="password" className="block font-medium">
              Nova Senha
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua nova senha"
              className={`w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-300 focus:outline-none pr-10 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black placeholder-gray-500"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-2 top-[38px] ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
              tabIndex={-1}
              aria-label="Mostrar ou ocultar nova senha"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <label htmlFor="confirm-password" className="block font-medium">
              Confirmar Nova Senha
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
              className={`w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-300 focus:outline-none pr-10 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black placeholder-gray-500"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={`absolute right-2 top-[38px] ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
              tabIndex={-1}
              aria-label="Mostrar ou ocultar confirmar nova senha"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-sm text-center ${
                  message.includes("sucesso") ? "text-green-500" : "text-red-500"
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 disabled:opacity-50"
            // Condição ajustada para satisfazer o TypeScript
            disabled={!password || !confirmPassword || loading || tokenValid !== true}
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
                Redefinindo...
              </div>
            ) : (
              "Redefinir Senha"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
