// app/recuperar-senha/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import ThemeToggleButton from "../components/ThemeToggleButton";
import Image from "next/image";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const router = useRouter();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!validateEmail(email)) {
      setMessage("Por favor, digite um e-mail válido.");
      setLoading(false);
      return;
    }

    try {
      // Chama a API que enviará o e-mail
      const response = await axios.post("/api/recuperar-senha", { email });
      
      setMessage(response.data.message || "Instruções enviadas. Verifique seu e-mail.");
      
      // Opcional: Redirecionar para o login após um tempo
      setTimeout(() => {
        router.push("/login");
      }, 3000); 
      
    } catch (error: any) {
      console.error("Erro ao solicitar recuperação:", error);
      setMessage(error.response?.data?.error || "Erro ao tentar recuperar a senha. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

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
          Recuperação de Senha
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block font-medium">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className={`w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-blue-300 focus:outline-none ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black placeholder-gray-500"
              }`}
              required
            />
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-sm text-center ${
                  message.includes("enviadas") || message.includes("sucesso") ? "text-green-500" : "text-red-500"
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-300 disabled:opacity-50"
            disabled={!email || loading}
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
                Enviando...
              </div>
            ) : (
              "Enviar Instruções"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-blue-500 hover:underline text-sm">
            Voltar para o Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
