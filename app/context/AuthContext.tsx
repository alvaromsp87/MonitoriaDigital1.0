// 📁 app/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter } from "next/navigation"; // Para redirecionamento no logout

export interface User {
  id: number;       
  nome: string;     
  email: string;       
  role: "admin" | "monitor" | "aluno"; 
}

interface LoginData {
  id: number;
  nome: string;
  email: string;
  role: "admin" | "monitor" | "aluno";
}

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>; 
  login: (userData: LoginData) => void;
  logout: () => Promise<void>; // Logout agora é async para chamar API
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Tenta carregar usuário do localStorage ou verificar sessão com backend
  useEffect(() => {
    const verifyUserSession = async () => {
      console.log("AuthProvider: Verificando sessão do usuário.");
      // Em produção, idealmente você faria uma chamada a uma API /api/auth/me ou /api/auth/status
      // que verificaria o cookie httpOnly e retornaria os dados do usuário se a sessão for válida.
      // Exemplo conceitual:
      // try {
      //   const response = await fetch('/api/auth/me');
      //   if (response.ok) {
      //     const userData = await response.json();
      //     if (userData && userData.id) { // Supondo que a API retorna o objeto User
      //        setUser(userData as User);
      //        localStorage.setItem("user", JSON.stringify(userData)); // Opcional, se quiser manter no localStorage também
      //        console.log("AuthProvider: Sessão verificada e usuário definido via API:", userData);
      //        setLoading(false);
      //        return;
      //     }
      //   }
      // } catch (apiError) {
      //   console.warn("AuthProvider: Falha ao verificar sessão com API, tentando localStorage.", apiError);
      // }

      // Fallback para localStorage se a verificação da API falhar ou não for implementada
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          if (
            typeof parsedUser.id === 'number' &&
            typeof parsedUser.nome === 'string' &&
            typeof parsedUser.email === 'string' &&
            (parsedUser.role === "admin" || parsedUser.role === "monitor" || parsedUser.role === "aluno")
          ) {
            setUser(parsedUser);
            console.log("AuthProvider: Usuário carregado do localStorage:", parsedUser);
          } else {
            console.warn("AuthProvider: Usuário no localStorage com formato inválido. Removendo.");
            localStorage.removeItem("user");
          }
        } catch (error) {
          console.error("AuthProvider: Erro ao parsear usuário do localStorage:", error);
          localStorage.removeItem("user");
        }
      } else {
          console.log("AuthProvider: Nenhum usuário encontrado no localStorage ou via API.");
      }
      setLoading(false);
    };

    verifyUserSession();
  }, []);

  const login = (userData: LoginData) => {
    const userToSet: User = {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        role: userData.role,
    };
    setUser(userToSet);
    localStorage.setItem("user", JSON.stringify(userToSet)); // Persiste para reidratação rápida
    console.log("AuthProvider: Usuário logado e salvo:", userToSet);
  };

  const logout = async () => {
    console.log("AuthProvider: Iniciando logout...");
    try {
      // Chama uma API de logout no backend para invalidar a sessão do lado do servidor
      // (ex: limpar httpOnly cookies)
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        console.warn("AuthProvider: API de logout falhou ou não encontrada, prosseguindo com logout do cliente.");
      } else {
        console.log("AuthProvider: Logout na API bem-sucedido.");
      }
    } catch (error) {
      console.error("AuthProvider: Erro ao chamar API de logout:", error);
    }
    
    setUser(null);
    localStorage.removeItem("user");
    console.log("AuthProvider: Usuário deslogado do cliente.");
    // Redireciona para a página de login após o logout
    router.push("/login"); 
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};