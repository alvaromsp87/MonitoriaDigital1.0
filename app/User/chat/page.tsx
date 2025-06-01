// 📁 app/admin/chat/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
// Certifique-se de que o caminho para AuthContext está correto e que User é exportado dele
import { useAuth, User as TipoUserDoAuthContext } from "../../context/AuthContext"; 

// Interface para as mensagens do chat
interface MensagemChat {
  id_mensagem: number;
  id_remetente: number; // Deve ser string para corresponder ao user.id
  id_destinatario: number; // Deve ser string
  conteudo: string;
  data_envio: string; // Data como string ISO vinda da API
}

// Interface para os itens na lista de usuários selecionáveis
// Deve corresponder ao que a API /api/users retorna
interface UserListItem {
  id: number;
  nome: string;
}

export default function ChatPage() {
  const { user, logout } = useAuth(); 
  const router = useRouter();

  const [inputMensagem, setInputMensagem] = useState("");
  const [mensagensChat, setMensagensChat] = useState<MensagemChat[]>([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [erroApi, setErroApi] = useState<string | null>(null);

  // Estados para seleção de usuário e conversa
  const [availableUsers, setAvailableUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true); // Inicia como true para carregar na montagem
  const [idConversaAtualCom, setIdConversaAtualCom] = useState<number | null>(null);
  const [nomeConversaAtualCom, setNomeConversaAtualCom] = useState<string | null>(null);

  const mensagensEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [mensagensChat]);

  // Efeito para buscar a lista de usuários disponíveis para chat
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Assegura que user é do tipo esperado e tem a propriedade 'id'
    const typedUser = user as TipoUserDoAuthContext;
    if (!typedUser.id) {
        console.error("ID do usuário logado não encontrado no objeto user do AuthContext.");
        setErroApi("Falha ao obter ID do usuário logado para buscar lista de contatos.");
        setLoadingUsers(false);
        return;
    }

    const fetchAvailableUsers = async () => {
      setLoadingUsers(true);
      setErroApi(null); // Limpa erros anteriores ao tentar buscar
      try {
        const response = await fetch(`/api/users?currentUserId=${typedUser.id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao buscar lista de usuários.");
        }
        const data: UserListItem[] = await response.json();
        setAvailableUsers(data);
      } catch (e: unknown) {
        let msg = "Não foi possível carregar a lista de usuários.";
        if (e instanceof Error) msg = e.message;
        console.error("Falha ao carregar lista de usuários:", e);
        setErroApi(msg);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchAvailableUsers();
  }, [user, router]); // Executa quando 'user' ou 'router' mudam


  // Efeito para buscar mensagens da conversa ATUAL
  useEffect(() => {
    if (!user || !idConversaAtualCom) {
      setMensagensChat([]);
      if (user && !idConversaAtualCom) setCarregandoMensagens(false);
      return;
    }

    const typedUser = user as TipoUserDoAuthContext;
    const userIdLogado = typedUser.id; 

    if (!userIdLogado) {
      console.error("ID do usuário logado não encontrado ao buscar mensagens.");
      setErroApi("Não foi possível identificar o usuário logado para buscar mensagens.");
      setCarregandoMensagens(false);
      return;
    }

    const buscarMensagens = async () => {
      setCarregandoMensagens(true);
      setErroApi(null);
      try {
        const response = await fetch(
          `/api/messages?idUsuarioLogado=${userIdLogado}&idOutroUsuario=${idConversaAtualCom}`
        );
        if (!response.ok) {
          let errorData;
          try { errorData = (await response.json()) as { error?: string; details?: string; }; }
          catch (parseErr) { 
            console.warn('Falha ao analisar JSON da resposta de erro (buscar mensagens):', parseErr);
            throw new Error(`Falha ao buscar mensagens: ${response.status} ${response.statusText}`);
          }
          throw new Error(errorData?.error || errorData?.details || `Falha ao buscar mensagens: ${response.status}`);
        }
        const data: MensagemChat[] = await response.json();
        setMensagensChat(data);
      } catch (e: unknown) {
        let msg = "Não foi possível carregar as mensagens.";
        if (e instanceof Error) msg = e.message;
        console.error("Falha ao carregar mensagens:", e);
        setErroApi(msg);
        setMensagensChat([]);
      } finally {
        setCarregandoMensagens(false);
      }
    };
    buscarMensagens();
  }, [user, router, idConversaAtualCom]);

  const handleIniciarConversa = (outroUsuario: UserListItem) => {
    if (user && (user as TipoUserDoAuthContext).id === outroUsuario.id) {
        setErroApi("Você não pode iniciar uma conversa consigo mesmo.");
        return;
    }
    setIdConversaAtualCom(outroUsuario.id);
    setNomeConversaAtualCom(outroUsuario.nome);
    setErroApi(null);
    setMensagensChat([]);
    setCarregandoMensagens(true);
  };

  const handleVoltarParaListaDeUsuarios = () => {
    setIdConversaAtualCom(null);
    setNomeConversaAtualCom(null);
    setMensagensChat([]);
    setErroApi(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setErroApi("Usuário não autenticado."); return; }

    const typedUser = user as TipoUserDoAuthContext;
    const userIdLogado = typedUser.id;

    if (!userIdLogado) { 
        console.error("ID do usuário logado não encontrado ao enviar mensagem.");
        setErroApi("Não foi possível identificar o remetente.");
        return; 
    }

    if (inputMensagem.trim() && idConversaAtualCom) {
      setErroApi(null);
      const mensagemParaEnviar = {
        conteudo: inputMensagem.trim(),
        id_remetente: userIdLogado,
        id_destinatario: idConversaAtualCom,
      };
      
      const idOtimista = Date.now();
      const previaMensagem: MensagemChat = {
        ...mensagemParaEnviar,
        id_mensagem: idOtimista,
        data_envio: new Date().toISOString(),
      };
      setMensagensChat((prev) => [...prev, previaMensagem]);
      setInputMensagem("");
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mensagemParaEnviar),
        });
        if (!response.ok) {
          let errorData;
          try { errorData = (await response.json()) as { error?: string; details?: string; }; }
          catch (parseErr) { 
            console.warn('Falha ao analisar JSON da resposta de erro (enviar mensagem):', parseErr);
            throw new Error(`Erro do servidor: ${response.status} ${response.statusText}. Não foi possível obter detalhes do erro.`);
          }
          throw new Error(errorData?.error || errorData?.details || `Falha ao enviar mensagem: ${response.status}`);
        }
        const mensagemSalva: MensagemChat = await response.json();
        setMensagensChat((prev) => prev.map((msg) => msg.id_mensagem === idOtimista ? mensagemSalva : msg ));
      } catch (e: unknown) {
        let msg = "Não foi possível enviar a mensagem."; 
        if (e instanceof Error) {
          msg = e.message;
        }
        console.error("Falha ao enviar mensagem:", e);
        setErroApi(msg);
        setMensagensChat((prev) => prev.filter((msg) => msg.id_mensagem !== idOtimista));
        setInputMensagem(mensagemParaEnviar.conteudo);
      }
    }
  };

  if (!user) {
    // O useEffect já faz o redirect, mas podemos manter um fallback
    return <p className="text-center mt-10">Redirecionando para o login...</p>;
  }
  
  // Garante que user.id seja acessado de forma segura
  const typedUserRender = user as TipoUserDoAuthContext;
  const userIdAtual = typedUserRender.id; 

  return (
    <main className="max-w-xl mx-auto p-4 flex flex-col h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {idConversaAtualCom 
            ? `Chat com ${nomeConversaAtualCom || idConversaAtualCom}` 
            : "Escolha um usuário para conversar"}
        </h1>
        {idConversaAtualCom && (
             <button 
                onClick={handleVoltarParaListaDeUsuarios} 
                className="text-sm text-blue-600 hover:underline px-2">
                Trocar Usuário
            </button>
        )}
        <button onClick={logout} className="text-red-500 underline hover:text-red-700 ml-auto pl-4">
          Sair
        </button>
      </div>

      {erroApi && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{erroApi}</span>
        </div>
      )}

      {!idConversaAtualCom ? (
        // SEÇÃO DE LISTA DE USUÁRIOS
        <div className="flex-grow overflow-y-auto border p-4 rounded-lg bg-gray-50">
          {loadingUsers ? (
            <p className="text-gray-500 text-center">Carregando usuários...</p>
          ) : availableUsers.length === 0 && !erroApi ? (
            <p className="text-gray-500 text-center">Nenhum usuário disponível para chat.</p>
          ) : (
            <ul className="space-y-2">
              {availableUsers.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => handleIniciarConversa(u)}
                    className="w-full text-left p-3 bg-white hover:bg-gray-100 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                  >
                    <p className="font-medium text-gray-800">{u.nome}</p>
                    <p className="text-xs text-gray-500">ID: {u.id}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        // SEÇÃO DE CHAT
        <>
          <div className="border p-4 rounded-lg min-h-[200px] h-64 overflow-y-auto bg-gray-100 mb-4 flex-grow shadow-inner">
            {carregandoMensagens ? (
              <p className="text-gray-500 text-center">Carregando mensagens...</p>
            ) : mensagensChat.length === 0 && !erroApi ? (
              <p className="text-gray-500 text-center">Nenhuma mensagem nesta conversa ainda. Comece uma!</p>
            ) : (
              mensagensChat.map((msg) => (
                <div
                  key={msg.id_mensagem}
                  className={`mb-3 p-3 rounded-lg shadow-sm text-sm break-words max-w-[85%] ${
                    userIdAtual && msg.id_remetente === userIdAtual 
                      ? "bg-blue-500 text-white ml-auto text-left"
                      : "bg-gray-200 text-gray-800 mr-auto text-left"
                  }`}
                >
                  <p>{msg.conteudo}</p>
                  <p
                    className={`text-xs mt-1 ${
                      userIdAtual && msg.id_remetente === userIdAtual 
                        ? "text-blue-200"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(msg.data_envio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
            )}
            <div ref={mensagensEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 mt-auto pb-4">
            <input
              value={inputMensagem}
              onChange={(e) => setInputMensagem(e.target.value)}
              className="flex-1 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite uma mensagem..."
              disabled={carregandoMensagens || !idConversaAtualCom}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={!inputMensagem.trim() || carregandoMensagens || !idConversaAtualCom}
            >
              Enviar
            </button>
          </form>
        </>
      )}
    </main>
  );
}