'use client';

import { useState, useEffect } from "react";
import Navbar from '../../components/Navbar';
import Link from 'next/link';

type Meeting = {
  id: number;
  roomName: string;
  date: string;
  turma?: string;
};

type Mentoria = {
  id_mentoria: number;
  disciplina: string;
};

export default function Agenda() {
  const userType: 'admin' | 'monitor' | 'student' = 'monitor';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mentorias, setMentorias] = useState<Mentoria[]>([]);
  const [idMentoria, setIdMentoria] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [turma, setTurma] = useState<string>("");

  // Buscar mentorias disponíveis
  useEffect(() => {
    const fetchMentorias = async () => {
      try {
        const res = await fetch("/api/mentorias");
        const data = await res.json();
        setMentorias(data);
      } catch (error) {
        console.error("Erro ao carregar mentorias:", error);
      }
    };
    fetchMentorias();
  }, []);

  // Buscar agendamentos do dia atual
  useEffect(() => {
    const fetchAgendamentos = async () => {
      const hoje = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

      try {
        const response = await fetch(`/api/agendamentos?data=${hoje}`);
        const dados = await response.json();

        const formatados: Meeting[] = dados.map((item: any) => ({
          id: item.id_agendamento,
          roomName: `meeting-${item.id_agendamento}`,
          date: new Date(item.data_agendada).toLocaleString(),
          turma: item.turma || "",
        }));

        setMeetings(formatados);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      }
    };

    fetchAgendamentos();
  }, []);

  // Agendar nova monitoria
  const handleSchedule = async () => {
    if (!idMentoria || !meetingDate.trim()) {
      alert("Selecione a mentoria e a data.");
      return;
    }

    try {
      const response = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_mentoria: parseInt(idMentoria),
          data_agendada: meetingDate,
          status: "PENDENTE",
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.mensagem || "Erro ao agendar");

      alert("Reunião agendada com sucesso!");

      const novaReuniao: Meeting = {
        id: data.id,
        roomName: `meeting-${data.id}`,
        date: new Date(meetingDate).toLocaleString(),
        turma: turma.trim() || undefined,
      };

      setMeetings([...meetings, novaReuniao]);
      setMeetingDate("");
      setIdMentoria("");
      setTurma("");

    } catch (err) {
      console.error("Erro ao agendar:", err);
      alert("Erro ao agendar reunião.");
    }
  };

  // Excluir reunião
  const handleDeleteMeeting = async (id: number) => {
    try {
      const response = await fetch(`/api/agendamentos/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.mensagem || "Erro ao excluir");

      alert("Reunião excluída com sucesso!");
      setMeetings(meetings.filter((m) => m.id !== id));

    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir reunião.");
    }
  };

  return (
    <div className="flex">
      <Navbar userType={userType} />
      <div className="container mx-auto px-4 py-6 flex-1">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📅 Agenda de Monitorias</h2>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">📌 Agendar Nova Reunião</h3>

          <select
            value={idMentoria}
            onChange={(e) => setIdMentoria(e.target.value)}
            className="block w-full p-2 border rounded mb-4"
            required
          >
            <option value="">Selecione uma mentoria</option>
            {mentorias.map((m) => (
              <option key={m.id_mentoria} value={m.id_mentoria}>
                Mentoria #{m.id_mentoria} - {m.disciplina}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="block w-full p-2 border rounded mb-4"
          />

          <input
            type="text"
            placeholder="Turma (opcional)"
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
            className="block w-full p-2 border rounded mb-4"
          />

          <button
            onClick={handleSchedule}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
          >
            Agendar Reunião
          </button>
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-4">📋 Reuniões Agendadas</h3>
        {meetings.length === 0 ? (
          <p className="text-gray-600">Nenhuma reunião agendada.</p>
        ) : (
          <ul className="space-y-4">
            {meetings.map((meeting) => (
              <li key={meeting.id} className="bg-white p-4 rounded shadow-md flex justify-between items-center">
                <div>
                  <p><strong>📆 Data:</strong> {meeting.date}</p>
                  {meeting.turma && <p><strong>🏫 Turma:</strong> {meeting.turma}</p>}
                  <p><strong>🔗 Sala:</strong> {meeting.roomName}</p>
                  <Link
                    href={`./Monitoria?room=${meeting.roomName}`}
                    target="_blank"
                    className="text-blue-500 underline"
                  >
                    👉 Entrar na reunião
                  </Link>
                </div>
                <button
                  onClick={() => handleDeleteMeeting(meeting.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

