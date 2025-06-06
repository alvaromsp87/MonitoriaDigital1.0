// app/User/monitoria/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Video, RefreshCcw, Loader2, AlertTriangle } from "lucide-react"; 
import Link from 'next/link'; 
import Navbar from "../../components/Navbar"; 
import { useAuth, User } from "../../context/AuthContext"; 
import { JitsiMeeting as OfficialJitsiMeeting } from '@jitsi/react-sdk';

// JAAS_APP_ID é usado para construir o roomName para o JaaS
const JAAS_APP_ID_CONST = "vpaas-magic-cookie-def7a752b0214eeeb6c8ee7cabfb2a6b"; // Use seu App ID real aqui
const JAAS_DOMAIN = "8x8.vc";

interface AlunoAgendamentoFromAPI {
  id_agendamento: number;
  data_agendada: string;
  disciplina_nome: string;
  monitor_nome: string;   
  status: string;         
  room_name: string | null;
  observacoes?: string;
  id_monitor_responsavel?: number; 
}

interface MeetingParaAluno {
  id_agendamento: number;
  data_agendada: string; 
  disciplina: string;
  monitor: string;
  status?: string;
  room_name: string | null;
  observacoes?: string;
  id_monitor_responsavel?: number;
}

const FeedbackForm = ({ 
    onSubmit, 
    onClose 
}: { 
    onSubmit: (feedback: string, rating: number) => void, 
    onClose: () => void 
}) => {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0); 
  const [submitted, setSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    setIsSubmittingFeedback(true);
    await onSubmit(feedback, rating); // onSubmit agora pode ser async
    setIsSubmittingFeedback(false);
    setSubmitted(true);
    // setTimeout(() => { setSubmitted(false); onClose(); }, 3000); // Pode ser útil para resetar
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[120] p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md text-gray-800 dark:text-gray-100" 
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()} 
        >
          <h3 className="text-xl font-semibold mb-5 text-center">Avaliação da Monitoria</h3>
          {!submitted || rating === 0 ? ( // Mostrar formulário se não enviado ou se fechado e reaberto
            <>
              <div className="mb-4">
                <label htmlFor="feedback-rating" className="block text-sm font-medium mb-1">Sua nota (obrigatório):</label>
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <motion.button
                      type="button" key={num} onClick={() => setRating(num)}
                      className={`cursor-pointer text-3xl transition-colors duration-150 focus:outline-none p-1 ${
                        num <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300 dark:text-gray-600 dark:hover:text-yellow-400"
                      }`}
                      whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                      aria-label={`Dar ${num} estrelas`}
                    >★</motion.button>
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
                    onClick={onClose}
                    type="button"
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2"
                > Fechar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmittingFeedback || rating === 0} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isSubmittingFeedback ? <Loader2 className="h-5 w-5 animate-spin"/> : (submitted && rating > 0 ? <CheckCircle size={20} /> : null) } 
                    {isSubmittingFeedback ? "Enviando..." : (submitted && rating > 0 ? "Enviado!" : "Enviar Feedback")}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-green-600 dark:text-green-400">Feedback enviado com sucesso!</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Obrigado por avaliar esta monitoria.</p>
              <button
                onClick={() => {setSubmitted(false); setRating(0); setFeedback(""); onClose();}} // Reset e fecha
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
              >
                Fechar
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function AlunoMonitoriaPage() {
  const { user, loading: authLoading } = useAuth(); 
  const [meetings, setMeetings] = useState<MeetingParaAluno[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [errorMeetings, setErrorMeetings] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingParaAluno | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [meetingEndedSummary, setMeetingEndedSummary] = useState<MeetingParaAluno | null>(null);
  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined); 
const jitsiApiRef = useRef<any>(null);
  // Corrigido: Usar a constante local
  const APP_ID_JAAS = JAAS_APP_ID_CONST;

  const fetchMeetingsForAluno = useCallback(async () => {
    if (!user) {
        setMeetings([]);
        setLoadingMeetings(false);
        return;
    }
    setLoadingMeetings(true);
    setErrorMeetings(null);
    try {
        const apiUrl = `/api/aluno/agendamentos?status=confirmado`;
        const res = await fetch(apiUrl); 
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Falha ao buscar seus agendamentos" })); 
            console.error("Falha ao buscar agendamentos do aluno:", errorData.error || res.statusText);
            setErrorMeetings(errorData.error || `Erro ${res.status} ao buscar seus agendamentos.`);
            setMeetings([]); 
            return;
        }
        const data: AlunoAgendamentoFromAPI[] = await res.json();
        const formattedMeetings = (Array.isArray(data) ? data : []).map((item) => ({
            id_agendamento: item.id_agendamento,
            data_agendada: new Date(item.data_agendada).toLocaleString("pt-BR", {dateStyle: 'short', timeStyle: 'short'}),
            disciplina: item.disciplina_nome || "Não especificada",
            monitor: item.monitor_nome || "Não especificado",        
            status: item.status?.toUpperCase(),
            room_name: item.room_name, 
            observacoes: item.observacoes,
            id_monitor_responsavel: item.id_monitor_responsavel,
        }));
        setMeetings(formattedMeetings);
    } catch (error) {
        console.error("Erro ao buscar agendamentos do aluno:", error);
        setErrorMeetings("Erro de conexão ao buscar seus agendamentos. Verifique se a API está implementada.");
        setMeetings([]); 
    } finally {
        setLoadingMeetings(false);
    }
  }, [user]); 

  useEffect(() => {
    if (user && !authLoading) {
        fetchMeetingsForAluno();
    }
  }, [user, authLoading, fetchMeetingsForAluno]); 

  const fetchJwtForMeeting = async (roomNameBase: string) => {
    if (!user) return undefined;
    try {
        const response = await fetch("/api/auth/jitsi-jwt", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId: user.id, 
                userName: user.nome,
                userEmail: user.email, 
                roomName: roomNameBase, 
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({error: "Erro desconhecido ao buscar JWT"}));
            throw new Error(errorData.error || `Falha ao obter JWT: ${response.statusText}`);
        }
        const data = await response.json();
        return data.jwt; 
    } catch (error) {
        console.error("Erro ao buscar JWT:", error);
        alert("Não foi possível autenticar para a reunião. Algumas funcionalidades podem estar limitadas.");
        return undefined;
    }
  };

  const handleStartMeeting = async (meeting: MeetingParaAluno) => {
    const roomNameBase = meeting.room_name || `MonitoriaDigital-${meeting.id_agendamento}`; 
    const token = await fetchJwtForMeeting(roomNameBase);
    setJwtToken(token); 
    setSelectedMeeting(meeting);
    setMeetingEndedSummary(null); 
    setShowFeedback(false); 
  };
  
  const handleJitsiApiReady = (externalApi: any) => { 
    jitsiApiRef.current = externalApi;
    console.log("Jitsi API (React SDK) está pronta!");
    if (externalApi && typeof externalApi.addEventListener === 'function') {
      externalApi.addEventListener('videoConferenceLeft', () => {
        console.log("Jitsi event: videoConferenceLeft (usuário local saiu)");
        if (jitsiApiRef.current && typeof jitsiApiRef.current.dispose === 'function') {
            jitsiApiRef.current.dispose();
            jitsiApiRef.current = null;
        }
        if (selectedMeeting) setMeetingEndedSummary(selectedMeeting); 
        setSelectedMeeting(null); 
        setJwtToken(undefined); 
        setShowFeedback(true);  
      });
    }
  };
  
  const handleEndMeetingButtonClick = () => { 
    if (jitsiApiRef.current && typeof jitsiApiRef.current.executeCommand === 'function') {
        jitsiApiRef.current.executeCommand('hangup'); 
    } else { 
        if (selectedMeeting) setMeetingEndedSummary(selectedMeeting); 
        setSelectedMeeting(null); 
        setJwtToken(undefined); 
        setShowFeedback(true);  
    }
  };

  const handleSubmitFeedback = async (feedback: string, rating: number) => {
    if (!meetingEndedSummary || !user) {
        alert("Não foi possível identificar a sessão da monitoria ou o usuário para enviar o feedback.");
        return;
    }
    const feedbackData = { 
        id_agendamento: meetingEndedSummary.id_agendamento,
        id_aluno_avaliador: user.id, 
        id_monitor_avaliado: meetingEndedSummary.id_monitor_responsavel, 
        avaliacao_nota: rating, 
        comentario: feedback, 
        data_feedback: new Date().toISOString() 
    };

    console.log("Feedback para enviar:", feedbackData);
    try {
        const response = await fetch('/api/feedbacks', { // !! IMPORTANTE: Crie este endpoint !!
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({error: "Erro ao enviar feedback"}));
            throw new Error(errorData.error || `Falha ao enviar feedback: ${response.statusText}`);
        }
        // Não precisa de await response.json() se o backend só retorna status 200/201
        // A lógica de 'submitted' no FeedbackForm já dá o feedback visual.
        // Se quiser fechar o modal após um tempo:
        // setTimeout(() => { setShowFeedback(false); setMeetingEndedSummary(null); }, 3000);
    } catch (error) {
        console.error("Erro ao enviar feedback:", error);
        alert(error instanceof Error ? error.message : "Ocorreu um erro ao enviar seu feedback.");
    }
  };

  if (authLoading && !user) { 
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="ml-4 text-gray-700 dark:text-gray-300">Carregando dados do usuário...</p>
      </div>
    );
  }

  if (!user) { 
    useEffect(() => {
      // Idealmente, usar router.push do Next Navigation se estiver em um componente cliente que pode usá-lo
      if (typeof window !== "undefined") window.location.href = '/login'; 
    }, []);
    return <div className="text-center p-10">Usuário não autenticado. Redirecionando para login...</div>;
  }
 
  // Verificar se o usuário é um aluno
  if (user.role !== 'aluno') {
    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar /> 
            <main className="flex-1 p-6 mt-16 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="mx-auto h-16 w-16 text-orange-400" />
                <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Acesso Restrito</h1>
                <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                    Esta página é destinada apenas para alunos.
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
          Minhas Monitorias Agendadas ({user.nome})
        </h2>
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={fetchMeetingsForAluno}
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
               <p className="ml-3 text-gray-600 dark:text-gray-300">Carregando suas monitorias...</p>
             </div>
        )}
        {!loadingMeetings && errorMeetings && (
            <p className="text-center text-red-500 dark:text-red-400 py-10 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                Erro ao carregar monitorias: {errorMeetings}
            </p>
        )}
        {!loadingMeetings && !errorMeetings && meetings.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
                Você não tem nenhuma monitoria confirmada agendada no momento.
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
                {meeting.disciplina}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <strong>Monitor(a):</strong> {meeting.monitor}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <strong>Data:</strong> {meeting.data_agendada}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">
                <strong>Sala:</strong> {meeting.room_name || `A definir`}
              </p>
              {meeting.observacoes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md italic truncate" title={meeting.observacoes}>
                  <strong>Obs:</strong> {meeting.observacoes}
                </p>
              )}
              <button
                onClick={() => handleStartMeeting(meeting)}
                disabled={!meeting.room_name || selectedMeeting !== null} // Desabilita se já estiver em uma sala
                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg shadow hover:shadow-md transition-all flex items-center gap-2 justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Video size={18} /> Entrar na Monitoria
              </button>
            </motion.div>
          ))}
        </div>

        {selectedMeeting && APP_ID_JAAS && (
          <div className="fixed inset-0 bg-black z-[100]" style={{ width: '100vw', height: '100vh', top: 0, left: 0 }}>
            <OfficialJitsiMeeting
                roomName={`${APP_ID_JAAS}/${selectedMeeting.room_name || `MonitoriaDigital-${selectedMeeting.id_agendamento}`}`}
                jwt={jwtToken}
                domain={JAAS_DOMAIN}
                configOverwrite={{
                    startWithAudioMuted: false, 
                    startWithVideoMuted: true,
                    prejoinPageEnabled: true, 
                    disableDeepLinking: true,
                }}
                interfaceConfigOverwrite={{
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_BRAND_WATERMARK: false,
                    APP_NAME: "Monitoria Digital",
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 
                        'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'select-background', 
                    ],
                    SETTINGS_SECTIONS: [ 'devices', 'language', 'profile', 'sounds' ],
                    MOBILE_APP_PROMO: false,
                }}
                userInfo={{
                    displayName: user?.nome || "Aluno", // User não é null aqui por causa das verificações anteriores
                    email: user?.email
                }}
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
                onClick={handleEndMeetingButtonClick} 
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg text-xs sm:text-sm font-semibold z-[101] flex items-center gap-1"
                title="Sair da reunião"
            >
                <XCircle size={18} className="mr-1 sm:mr-0" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}
        {showFeedback && meetingEndedSummary && (
            <FeedbackForm 
                onSubmit={handleSubmitFeedback} 
                onClose={() => { setShowFeedback(false); setMeetingEndedSummary(null); }} 
            />
        )}
      </div>
    </div>
  );
}