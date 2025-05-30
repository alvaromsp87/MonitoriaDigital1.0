"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Video, RefreshCcw } from "lucide-react";
import Navbar from "../../components/Navbar";

interface AgendamentoResumo {
  id_agendamento: number;
  data_agendada: string;
  aluno?: string;
  disciplina?: string;
  status?: string;
  observacoes?: string;
}

const JitsiMeeting = ({
  roomName,
  onEnd,
  meetingDetails,
}: {
  roomName: string;
  onEnd: () => void;
  meetingDetails: AgendamentoResumo;
}) => {
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.JitsiMeetExternalAPI) {
      const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        configOverwrite: { startWithAudioMuted: true, startWithVideoMuted: true },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ["microphone", "camera", "desktop", "chat", "settings"],
        },
      });

      api.addEventListener("readyToClose", () => {
        onEnd();
      });

      return () => {
        api.dispose();
      };
    }
  }, [roomName, onEnd]);

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div ref={jitsiContainerRef} className="w-full h-full"></div>

      {/* Info da Reunião */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-xl p-4 shadow-xl">
        <p><strong>Aluno:</strong> {meetingDetails.aluno}</p>
        <p><strong>Disciplina:</strong> {meetingDetails.disciplina}</p>
        <p><strong>Data:</strong> {new Date(meetingDetails.data_agendada).toLocaleString("pt-BR")}</p>
      </div>

      {/* Botão de sair */}
      <button
        onClick={() => setShowConfirmExit(true)}
        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-lg"
      >
        Sair da Reunião
      </button>

      {/* Modal de confirmação */}
      <AnimatePresence>
        {showConfirmExit && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 shadow-xl"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="text-lg font-semibold mb-4">Deseja realmente sair da reunião?</h2>
              <div className="flex gap-4">
                <button
                  onClick={onEnd}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <XCircle size={18} /> Sair
                </button>
                <button
                  onClick={() => setShowConfirmExit(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ⭐ Feedback com estrelas
const FeedbackForm = ({ onSubmit }: { onSubmit: (feedback: string, rating: number) => void }) => {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmit(feedback, rating);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white p-6 rounded-xl shadow-xl w-96"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold mb-4">Avaliação da Reunião</h3>
          <textarea
            className="w-full p-2 border rounded mb-3"
            placeholder="Deixe seu feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          ></textarea>

          <div className="mb-3">
            <label className="mr-2">Nota:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <span
                  key={num}
                  onClick={() => setRating(num)}
                  className={`cursor-pointer text-2xl ${
                    num <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Enviar Feedback
          </button>

          {submitted && (
            <div className="mt-3 text-green-600 flex items-center gap-2">
              <CheckCircle size={18} /> Feedback enviado!
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Monitoria() {
  const [meetings, setMeetings] = useState<AgendamentoResumo[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<AgendamentoResumo | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/agendamentos?resumo=true");
      const data = await res.json();
      setMeetings(data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleEndMeeting = () => {
    setSelectedMeeting(null);
    setShowFeedback(true);
  };

  const handleSubmitFeedback = (feedback: string, rating: number) => {
    const feedbacks = JSON.parse(localStorage.getItem("feedbacks") || "[]");
    feedbacks.push({ feedback, rating, date: new Date().toLocaleString() });
    localStorage.setItem("feedbacks", JSON.stringify(feedbacks));
    setShowFeedback(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Navbar />
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Monitoria - Videochamada</h2>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Reuniões Disponíveis</h3>
        <button
          onClick={fetchMeetings}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <RefreshCcw size={18} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.map((meeting) => (
          <motion.div
            key={meeting.id_agendamento}
            className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p><strong>Data:</strong> {new Date(meeting.data_agendada).toLocaleString("pt-BR")}</p>
            <p><strong>Sala:</strong> Sala-{meeting.id_agendamento}</p>
            {meeting.aluno && <p><strong>Aluno:</strong> {meeting.aluno}</p>}
            {meeting.disciplina && <p><strong>Disciplina:</strong> {meeting.disciplina}</p>}
            {meeting.status && (
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded ${
                    meeting.status === "Confirmado"
                      ? "bg-green-200 text-green-800"
                      : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {meeting.status}
                </span>
              </p>
            )}
            {meeting.observacoes && <p><strong>Obs:</strong> {meeting.observacoes}</p>}

            <button
              onClick={() => setSelectedMeeting(meeting)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full flex items-center gap-2 justify-center"
            >
              <Video size={18} /> Iniciar Reunião
            </button>
          </motion.div>
        ))}
      </div>

      {selectedMeeting && (
        <JitsiMeeting
          roomName={`Sala-${selectedMeeting.id_agendamento}`}
          onEnd={handleEndMeeting}
          meetingDetails={selectedMeeting}
        />
      )}
      {showFeedback && <FeedbackForm onSubmit={handleSubmitFeedback} />}
    </div>
  );
}
