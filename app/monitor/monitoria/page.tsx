// 📁 app/monitor/monitoria/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Video, RefreshCcw, Loader2, AlertTriangle } from "lucide-react"; 
import Link from 'next/link'; 
import Navbar from "../../components/Navbar"; 
import { useAuth, User } from "../../context/AuthContext"; 
import { JitsiMeeting as OfficialJitsiMeeting } from '@jitsi/react-sdk';
// Se você quiser tipar 'externalApi' em handleJitsiApiReady corretamente, importe o tipo do SDK:
// import type { IJitsiMeetExternalApi } from '@jitsi/react-sdk';

// JAAS_APP_ID é usado para construir o roomName para o JaaS
const JAAS_APP_ID = "vpaas-magic-cookie-def7a752b0214eeeb6c8ee7cabfb2a6b";
const JAAS_DOMAIN = "8x8.vc";

interface AgendamentoResumo {
  id_agendamento: number;
  data_agendada: string;
  aluno?: string;
  disciplina?: string;
  status?: string;
  observacoes?: string;
  room_name?: string | null; 
}

// Interface para os dados brutos da API /api/agendamentos
interface AgendamentoFromAPIRaw {
    id_agendamento: number;
    data_agendada: string;
    disciplina?: string;
    aluno?: string;
    monitor_nome?: string; 
    status?: string;
    room_name?: string | null;
    observacoes?: string;
}

const FeedbackForm = ({ onSubmit }: { onSubmit: (feedback: string, rating: number) => void }) => {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0); 
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
        alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
        return;
    }
    onSubmit(feedback, rating);
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); /* Permite novo feedback se necessário */}, 3000);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[120]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md mx-4 text-gray-800 dark:text-gray-100" 
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h3 className="text-xl font-semibold mb-5 text-center">Avaliação da Monitoria</h3>
          <div className="mb-4">
            <label htmlFor="feedback-rating" className="block text-sm font-medium mb-1">Sua nota (obrigatório):</label>
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <motion.button
                  type="button"
                  key={num}
                  onClick={() => setRating(num)}
                  className={`cursor-pointer text-3xl transition-colors duration-150 focus:outline-none p-1 ${
                    num <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Dar ${num} estrelas`}
                >
                  ★
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="mb-5">
            <label htmlFor="feedback-text" className="block text-sm font-medium mb-1">Seu feedback (opcional):</label>
            <textarea
              id="feedback-text"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[100px]"
              placeholder="Deixe seu comentário sobre a monitoria..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button
                onClick={() => { onSubmit("",0); /* Para fechar o modal sem submeter */ }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
            >
                Fechar
            </button>
            <button
                onClick={handleSubmit}
                disabled={submitted || rating === 0} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {submitted && rating > 0 ? <><CheckCircle size={20} /> Enviado!</> : "Enviar Feedback"}
            </button>
          </div>

          <AnimatePresence>
          {submitted && rating > 0 && (
            <motion.div 
              className="mt-4 text-green-600 flex items-center justify-center gap-2 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CheckCircle size={18} /> Feedback enviado com sucesso!
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Monitoria() {
  const { user, loading: authLoading } = useAuth(); 
  const [meetings, setMeetings] = useState<AgendamentoResumo[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [errorMeetings, setErrorMeetings] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<AgendamentoResumo | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [meetingEndedSummary, setMeetingEndedSummary] = useState<AgendamentoResumo | null>(null);
  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined); 
  // Linha 143 (aproximadamente): Use 'any' temporariamente, idealmente importe IJitsiMeetExternalApi do SDK
  const jitsiApiRef = useRef<any>(null); 

  const fetchMeetings = useCallback(async () => {
    if (!user) {
        setMeetings([]);
        setLoadingMeetings(false);
        return;
    }
    setLoadingMeetings(true);
    setErrorMeetings(null);
    try {
      const apiUrl = "/api/agendamentos?resumo=true&status=confirmado"; 
      const res = await fetch(apiUrl); 
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Falha ao buscar agendamentos" })); 
        console.error("Falha ao buscar agendamentos:", errorData.error || res.statusText);
        setErrorMeetings(errorData.error || `Erro ${res.status} ao buscar agendamentos.`);
        setMeetings([]); 
        return;
      }
      const data = await res.json();
      const formattedMeetings = (Array.isArray(data) ? data : []).map((item: AgendamentoFromAPIRaw) => ({
        id_agendamento: item.id_agendamento,
        data_agendada: item.data_agendada,
        disciplina: item.disciplina || "Não especificada",
        aluno: item.aluno || "Não especificado",      
        status: item.status,
        observacoes: item.observacoes,
        room_name: item.room_name, 
      }));
      setMeetings(formattedMeetings);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      setErrorMeetings("Erro de conexão ao buscar agendamentos.");
      setMeetings([]); 
    } finally {
        setLoadingMeetings(false);
    }
  }, [user]); 

  const fetchJwtForMeeting = async (roomNameBase: string) => {
    if (!user) {
        console.error("Usuário não logado, não é possível gerar JWT.");
        return undefined;
    }
    try {
        const typedUser = user as User;
        const response = await fetch("/api/auth/jitsi-jwt", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId: typedUser.id, 
                userName: typedUser.nome,
                userEmail: typedUser.email,
                roomName: roomNameBase, 
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({error: "Erro desconhecido ao buscar JWT"}));
            throw new Error(errorData.error || `Falha ao obter JWT do servidor: ${response.statusText}`);
        }
        const data = await response.json();
        return data.jwt; 
    } catch (error) {
        console.error("Erro ao buscar JWT:", error);
        alert("Não foi possível obter o token de autenticação para a reunião. Algumas funcionalidades podem estar limitadas.");
        return undefined;
    }
  };

  useEffect(() => {
    if (user) { 
        fetchMeetings();
    }
  }, [user, fetchMeetings]); 

  const handleStartMeeting = async (meeting: AgendamentoResumo) => {
    const roomNameBase = meeting.room_name || `Sala-${meeting.id_agendamento}`; 
    const token = await fetchJwtForMeeting(roomNameBase);
    
    setJwtToken(token); 
    setSelectedMeeting(meeting);
    setMeetingEndedSummary(null); 
    setShowFeedback(false); 
  };
  
  // Linha 232 (aproximadamente): Use 'any' temporariamente para externalApi
  const handleJitsiApiReady = (externalApi: any) => { 
    jitsiApiRef.current = externalApi;
    console.log("Jitsi API (React SDK) está pronta!");
    if (externalApi && typeof externalApi.addEventListener === 'function') {
      externalApi.addEventListener('videoConferenceLeft', () => {
        console.log("Jitsi event: videoConferenceLeft (usuário local saiu)");
        handleEndMeeting(); 
      });
    }
  };
  
  const handleEndMeeting = () => {
    console.log("handleEndMeeting chamado");
    if (jitsiApiRef.current && typeof jitsiApiRef.current.dispose === 'function') {
        console.log("Dispondo da API Jitsi...");
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
    }
    if (selectedMeeting) {
        setMeetingEndedSummary(selectedMeeting); 
    }
    setSelectedMeeting(null); 
    setJwtToken(undefined); 
    setShowFeedback(true);  
  };

  const handleSubmitFeedback = async (feedback: string, rating: number) => {
    if (!meetingEndedSummary) return;
    const typedUserSubmit = user as User; // Garante que user não é null aqui
    const feedbackData = { 
        id_agendamento: meetingEndedSummary.id_agendamento,
        id_monitor_avaliador: typedUserSubmit?.id,
        avaliacao_geral: rating, 
        comentario_geral: feedback, 
        data_feedback: new Date().toISOString() 
    };
    console.log("Feedback para enviar:", feedbackData);
    // TODO: Implementar envio real
    alert("Feedback enviado com sucesso (simulado)!");
    setShowFeedback(false);
    setMeetingEndedSummary(null); 
    fetchMeetings();
  };

  // Linha 289: authLoading agora está definido
  if (authLoading && !user) { 
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="ml-4 text-gray-700 dark:text-gray-300">Carregando dados do usuário...</p>
      </div>
    );
  }

  if (!user) { 
    return <div className="text-center p-10">Usuário não autenticado. Redirecionando...</div>;
  }
  const typedUser = user as User; 
  if (typedUser.role !== 'monitor') {
    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar /> 
            <main className="flex-1 p-6 mt-16 flex flex-col items-center justify-center text-center">
                 <AlertTriangle className="mx-auto h-16 w-16 text-orange-400" />
                <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Acesso Restrito</h1>
                <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                    Esta página é destinada apenas para monitores.
                </p>
                <Link href="/" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
                    Voltar para Home
                </Link>
            </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-6 pt-20 md:pt-24">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
          Monitorias Disponíveis para Videochamada ({typedUser.nome})
        </h2>
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={fetchMeetings}
            disabled={loadingMeetings}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-70"
          >
            {loadingMeetings ? <Loader2 className="h-5 w-5 animate-spin"/> : <RefreshCcw size={18} />} 
            {loadingMeetings ? "Atualizando..." : "Atualizar Lista"}
          </button>
        </div>

        {loadingMeetings && meetings.length === 0 && (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400"/>
                <p className="ml-3 text-gray-600 dark:text-gray-300">Carregando monitorias...</p>
             </div>
        )}
        {!loadingMeetings && errorMeetings && (
            <p className="text-center text-red-500 dark:text-red-400 py-10 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                Erro ao carregar monitorias: {errorMeetings}
            </p>
        )}
        {!loadingMeetings && !errorMeetings && meetings.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                Nenhuma monitoria confirmada disponível para você iniciar no momento.
            </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting, index) => ( 
            <motion.div
              key={meeting.id_agendamento || index} 
              className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg hover:shadow-xl border dark:border-gray-700 transition-all hover:scale-[1.02]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (index * 0.05) }} 
            >
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-1 truncate" title={meeting.disciplina}>
                {meeting.disciplina || "Disciplina não especificada"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <strong>Aluno(a):</strong> {meeting.aluno || "Não especificado"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <strong>Data:</strong> {new Date(meeting.data_agendada).toLocaleString("pt-BR", {dateStyle: 'short', timeStyle: 'short'})}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">
                <strong>Sala:</strong> {meeting.room_name || `Sala-${meeting.id_agendamento}`}
              </p>
              {meeting.observacoes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md italic truncate" title={meeting.observacoes}>
                  <strong>Obs:</strong> {meeting.observacoes}
                </p>
              )}
              <button
                onClick={() => handleStartMeeting(meeting)}
                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2 justify-center font-semibold"
              >
                <Video size={18} /> Iniciar Reunião
              </button>
            </motion.div>
          ))}
        </div>

        {selectedMeeting && (
          <div className="fixed inset-0 bg-black z-[100]" style={{ width: '100vw', height: '100vh' }}>
            <OfficialJitsiMeeting
                roomName={`${JAAS_APP_ID}/${selectedMeeting.room_name || `Sala-${selectedMeeting.id_agendamento}`}`} // JAAS_APP_ID usado aqui
                jwt={jwtToken}
                domain={JAAS_DOMAIN}
                configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: true,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                }}
                interfaceConfigOverwrite={{
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_BRAND_WATERMARK: false,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'select-background', 'download', 'help', 'mute-everyone', 'security'
                    ],
                    SETTINGS_SECTIONS: [ 'devices', 'language', 'moderator', 'profile', 'calendar' ],
                }}
                userInfo={{
                    displayName: typedUser?.nome || "Monitor",
                    email: typedUser?.email
                }}
                // Linha 405 (aproximadamente): Corrigido para 'any' por enquanto, idealmente IJitsiMeetExternalApi do SDK
                onApiReady={(externalApi: any) => handleJitsiApiReady(externalApi) } 
                getIFrameRef={(iframeRef) => {
                    if (iframeRef) {
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                    }
                }}
                spinner={() => <div className="flex justify-center items-center h-full w-full bg-black text-white"><Loader2 className="h-8 w-8 animate-spin" /> Carregando Sala...</div>}
            />
             <button
                onClick={handleEndMeeting}
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg text-xs sm:text-sm font-semibold z-[101]"
                title="Sair da reunião (botão customizado)"
            >
                <XCircle size={18} /> Sair
            </button>
          </div>
        )}
        {showFeedback && meetingEndedSummary && (
            <FeedbackForm onSubmit={handleSubmitFeedback} />
        )}
      </div>
    </div>
  );
}