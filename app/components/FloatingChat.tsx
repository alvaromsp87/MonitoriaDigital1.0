// 📁 app/components/FloatingChat.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth, User as TipoUserDoAuthContext } from "@monitoriadigital/app/context/AuthContext"; // Ajuste o caminho
import { MessageCircle, Send, X, ArrowLeft } from "lucide-react"; // Ícones adicionais

// Interface para as mensagens do chat
interface MensagemChat {
  id_mensagem: number;
  id_remetente: string;
  id_destinatario: string;
  conteudo: string;
  data_envio: string;
}

// Interface para os itens na lista de usuários selecionáveis
interface UserListItem {
  id: string;
  nome: string;
}

export default function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false); // Controla se o widget de chat está aberto

  // Estados do chat interno (semelhantes ao ChatPage.tsx)
  const [inputMensagem, setInputMensagem] = useState("");
  const [mensagensChat, setMensagensChat] = useState<MensagemChat[]>([]);
  const [carregando, setCarregando] = useState(false); // Estado de carregamento unificado
  const [erroApi, setErroApi] = useState<string | null>(null);

  const [availableUsers, setAvailableUsers] = useState<UserListItem[]>([]);
  const [idConversaAtualCom, setIdConversaAtualCom] = useState<string | null>(null);
  const [nomeConversaAtualCom, setNomeConversaAtualCom] = useState<string | null>(null);

  const mensagensEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Para focar no input

  const scrollToBottom = useCallback(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [mensagensChat]);

  // Efeito para buscar usuários disponíveis quando o chat é aberto e o usuário está logado
  useEffect(() => {
    if (isOpen && user && availableUsers.length === 0 && !idConversaAtualCom) { // Busca apenas se não tiver usuários e nenhuma conversa ativa
      const typedUser = user as TipoUserDoAuthContext;
      if (!typedUser.id) {
        console.error("FloatingChat: ID do usuário logado não encontrado.");
        setErroApi("Falha ao obter ID do usuário para buscar contatos.");
        return;
      }

      const fetchAvailableUsers = async () => {
        setCarregando(true);
        setErroApi(null);
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
          console.error("FloatingChat: Falha ao carregar lista de usuários:", e);
          setErroApi(msg);
        } finally {
          setCarregando(false);
        }
      };
      fetchAvailableUsers();
    }
  }, [isOpen, user, availableUsers.length, idConversaAtualCom]); // Adicionado idConversaAtualCom e availableUsers.length para controle

  // Efeito para buscar mensagens da conversa atual
  useEffect(() => {
    if (!isOpen || !user || !idConversaAtualCom) {
      // Não limpa mensagensChat aqui para permitir reabrir a conversa anterior
      if (!idConversaAtualCom) setMensagensChat([]); // Limpa apenas se voltou para lista
      return;
    }

    const typedUser = user as TipoUserDoAuthContext;
    const userIdLogado = typedUser.id;

    if (!userIdLogado) {
      console.error("FloatingChat: ID do usuário logado não encontrado ao buscar mensagens.");
      setErroApi("Não foi possível identificar o usuário para buscar mensagens.");
      return;
    }

    const buscarMensagens = async () => {
      setCarregando(true);
      setErroApi(null);
      try {
        const response = await fetch(
          `/api/messages?idUsuarioLogado=${userIdLogado}&idOutroUsuario=${idConversaAtualCom}`
        );
        if (!response.ok) {
          let errorData;
          try { errorData = (await response.json()) as { error?: string; details?: string; }; }
          catch (parseErr) { 
            console.warn('FloatingChat: Falha JSON (buscar mensagens):', parseErr);
            throw new Error(`Falha (buscar): ${response.status} ${response.statusText}`);
          }
          throw new Error(errorData?.error || errorData?.details || `Falha (buscar): ${response.status}`);
        }
        const data: MensagemChat[] = await response.json();
        setMensagensChat(data);
        setTimeout(() => inputRef.current?.focus(), 0); // Foca no input após carregar mensagens
      } catch (e: unknown) {
        let msg = "Não carregou mensagens.";
        if (e instanceof Error) msg = e.message;
        console.error("FloatingChat: Falha ao carregar mensagens:", e);
        setErroApi(msg);
      } finally {
        setCarregando(false);
      }
    };
    buscarMensagens();
  }, [isOpen, user, idConversaAtualCom]); // Executa se chat aberto, user logado, e conversa selecionada

  const handleIniciarConversa = (outroUsuario: UserListItem) => {
    const typedUser = user as TipoUserDoAuthContext;
    if (typedUser.id === outroUsuario.id) {
        setErroApi("Você não pode iniciar uma conversa consigo mesmo.");
        return;
    }
    setIdConversaAtualCom(outroUsuario.id);
    setNomeConversaAtualCom(outroUsuario.nome);
    setMensagensChat([]); // Limpa mensagens do chat anterior
    setErroApi(null);
  };

  const handleVoltarParaListaDeUsuarios = () => {
    setIdConversaAtualCom(null);
    setNomeConversaAtualCom(null);
    setMensagensChat([]);
    setErroApi(null);
    // Re-buscar lista de usuários caso ela possa ter mudado ou para resetar estado.
    // Para simplificar, podemos assumir que a lista não muda frequentemente enquanto o chat está aberto.
    // Se precisar de atualização constante, o useEffect de buscar usuários pode ser ajustado.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const typedUser = user as TipoUserDoAuthContext;
    if (!inputMensagem.trim() || !typedUser?.id || !idConversaAtualCom) return;

    const userIdLogado = typedUser.id;
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
    inputRef.current?.focus(); // Mantém o foco no input

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
          console.warn('FloatingChat: Falha JSON (enviar msg):', parseErr);
          throw new Error(`Falha (enviar): ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData?.error || errorData?.details || `Falha (enviar): ${response.status}`);
      }
      const mensagemSalva: MensagemChat = await response.json();
      setMensagensChat((prev) => prev.map((msg) => msg.id_mensagem === idOtimista ? mensagemSalva : msg));
    } catch (e: unknown) {
      let msg = "Não enviou msg."; 
      if (e instanceof Error) msg = e.message;
      setErroApi(msg); // Mostra erro brevemente
      setMensagensChat((prev) => prev.filter((msg) => msg.id_mensagem !== idOtimista));
      setInputMensagem(mensagemParaEnviar.conteudo); // Devolve mensagem ao input
      setTimeout(() => setErroApi(null), 3000); // Limpa erro da API após 3s
    }
  };

  if (!user) return null; // Não renderiza nada se não houver usuário logado

  const typedUserCurrent = user as TipoUserDoAuthContext; // Para usar no JSX

  return (
    <div className="fixed bottom-4 right-4 z-[1000]"> {/* Aumentado z-index */}
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[500px] flex flex-col bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700">
          {/* Cabeçalho do Chat */}
          <div className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
            {idConversaAtualCom && (
              <button onClick={handleVoltarParaListaDeUsuarios} className="p-1 hover:bg-blue-600 rounded-full">
                <ArrowLeft size={20} />
              </button>
            )}
            <span className="font-semibold text-lg">
              {idConversaAtualCom 
                ? (nomeConversaAtualCom || idConversaAtualCom) 
                : "Conversar com"}
            </span>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-blue-600 rounded-full">
                <X size={20} />
            </button>
          </div>

          {/* Corpo do Chat: Lista de Usuários ou Mensagens */}
          <div className="flex-grow overflow-y-auto p-1 sm:p-2 bg-gray-50 dark:bg-gray-700">
            {erroApi && <div className="p-2 text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/50 rounded m-1">{erroApi}</div>}

            {!idConversaAtualCom ? (
              // LISTA DE USUÁRIOS
              carregando ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Carregando usuários...</p>
              ) : availableUsers.length === 0 && !erroApi ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum usuário disponível.</p>
              ) : (
                <ul className="space-y-1">
                  {availableUsers.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => handleIniciarConversa(u)}
                        className="w-full text-left p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <p className="font-medium text-gray-900 dark:text-gray-100">{u.nome}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              // MENSAGENS DA CONVERSA
              carregando ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Carregando mensagens...</p>
              ) : mensagensChat.length === 0 && !erroApi ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma mensagem. Envie uma!</p>
              ) : (
                <div className="space-y-2 p-2">
                {mensagensChat.map((msg) => (
                  <div
                    key={msg.id_mensagem}
                    className={`flex ${msg.id_remetente === typedUserCurrent.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] py-2 px-3 rounded-xl shadow ${
                        msg.id_remetente === typedUserCurrent.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.conteudo}</p>
                      <p className={`text-xs mt-1 ${msg.id_remetente === typedUserCurrent.id ? 'text-blue-200 text-right' : 'text-gray-500 dark:text-gray-400 text-left'}`}>
                        {new Date(msg.data_envio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={mensagensEndRef} />
                </div>
              )
            )}
          </div>
          
          {/* Formulário de Envio (apenas se uma conversa estiver ativa) */}
          {idConversaAtualCom && (
            <form onSubmit={handleSubmit} className="flex p-3 gap-2 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <input
                ref={inputRef}
                value={inputMensagem}
                onChange={(e) => setInputMensagem(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Digite sua mensagem..."
                disabled={carregando}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                disabled={!inputMensagem.trim() || carregando}
              >
                <Send size={20} />
              </button>
            </form>
          )}
        </div>
      ) : (
        // Botão para Abrir o Chat
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Abrir chat"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}