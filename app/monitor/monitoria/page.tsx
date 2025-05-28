"use client";
import { useState, useEffect, useRef } from "react";

interface AgendamentoResumo {
  id_agendamento: number;
  data_agendada: string;
}

// Componente JitsiMeeting
const JitsiMeeting = ({ roomName, onEnd }: { roomName: string; onEnd: () => void }) => {
  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.JitsiMeetExternalAPI) {
      const JitsiMeetExternalAPI = window.JitsiMeetExternalAPI;

      const options = {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        configOverwrite: { startWithAudioMuted: true, startWithVideoMuted: true },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: ["microphone", "camera", "desktop",  "chat", "settings"],
        },
      };

      const api = new JitsiMeetExternalAPI("meet.jit.si", options);

      api.addEventListener("readyToClose", () => {
        onEnd();
      });

      return () => {
        api.dispose();
      };
    }
  }, [roomName, onEnd]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <div ref={jitsiContainerRef} className="w-full h-full"></div>
      <button
        onClick={onEnd}
        className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        Sair da Reunião
      </button>
    </div>
  );
};

// Componente FeedbackForm
const FeedbackForm = ({ onSubmit }: { onSubmit: (feedback: string, rating: number) => void }) => {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);

  const handleSubmit = () => {
    onSubmit(feedback, rating);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h3 className="text-lg font-semibold mb-4">Avaliação da Reunião</h3>
        <textarea
          className="w-full p-2 border rounded mb-3"
          placeholder="Deixe seu feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        ></textarea>
        <div className="mb-3">
          <label className="mr-2">Nota:</label>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
          Enviar Feedback
        </button>
      </div>
    </div>
  );
};

// Componente principal Monitoria
export default function Monitoria() {
  const [meetings, setMeetings] = useState<{ roomName: string; date: string }[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch("/api/agendamentos?resumo=true");
        const data = await res.json();

        const formatted = (data as AgendamentoResumo[]).map((item) => ({
          roomName: `Sala-${item.id_agendamento}`,
          date: new Date(item.data_agendada).toLocaleString("pt-BR"),
        }));

        setMeetings(formatted);
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
      }
    };

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
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Monitoria - Videochamada</h2>

      <h3 className="text-xl font-semibold mt-6">Selecione uma reunião</h3>

      <ul className="mt-4 space-y-2">
        {meetings.map((meeting) => (
          <li key={meeting.roomName} className="bg-white p-4 rounded shadow-md">
            <p><strong>Data:</strong> {meeting.date}</p>
            <p><strong>Sala:</strong> {meeting.roomName}</p>
            <button
              onClick={() => setSelectedMeeting(meeting.roomName)}
              className="mt-2 block bg-blue-500 text-white px-4 py-2 rounded"
            >
              Iniciar Reunião
            </button>
          </li>
        ))}
      </ul>

      {selectedMeeting && <JitsiMeeting roomName={selectedMeeting} onEnd={handleEndMeeting} />}
      {showFeedback && <FeedbackForm onSubmit={handleSubmitFeedback} />}
    </div>
  );
}
