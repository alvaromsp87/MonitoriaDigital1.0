'use client';

import { useState, useEffect } from "react";
import Navbar from '../../components/Navbar';
import Link from 'next/link';

type Meeting = {
  id: number;
  roomName: string;
  date: string;
  turma?: string;
  status: string;
};

type Mentoria = {
  id_mentoria: number;
  disciplina: string;
};

type AgendamentoAPI = {
  id_agendamento: number;
  data_agendada: string;
  turma?: string;
  status: string;
};

export default function Agenda() {
  const userType: 'admin' | 'monitor' | 'student' = 'monitor';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mentorias, setMentorias] = useState<Mentoria[]>([]);
  const [idMentoria, setIdMentoria] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [turma, setTurma] = useState<string>("");

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

  useEffect(() => {
    const fetchAgendamentos = async () => {
      const hoje = new Date().toISOString().split('T')[0];

      try {
        const response = await fetch(`/api/agendamentos?data=${hoje}`);
        const dados: AgendamentoAPI[] = await response.json();

        const formatados: Meeting[] = dados.map((item) => ({
          id: item.id_agendamento,
          roomName: `meeting-${item.id_agendamento}`,
          date: new Date(item.data_agendada).toLocaleString(),
          turma: item.turma || "",
          status: item.status,
        }));

        setMeetings(formatados);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      }
    };

    fetchAgendamentos();
  }, []);

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
        status: "PENDENTE",
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

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/agendamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.mensagem || "Erro ao atualizar status");

      setMeetings((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );

    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Erro ao atualizar status da reunião.");
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
            <option value="">
              {mentorias.length === 0 ? "Nenhuma mentoria disponível" : "Selecione uma mentoria"}
            </option>
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
              <li
                key={meeting.id}
                className="bg-white p-4 rounded shadow-md flex justify-between items-center"
              >
                <div>
                  <p><strong>📆 Data:</strong> {meeting.date}</p>
                  {meeting.turma && <p><strong>🏫 Turma:</strong> {meeting.turma}</p>}
                  <p><strong>🔗 Sala:</strong> {meeting.roomName}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <select
                      value={meeting.status}
                      onChange={(e) => handleStatusChange(meeting.id, e.target.value)}
                      className="mt-1 border p-1 rounded"
                    >
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="CONFIRMADO">CONFIRMADO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </p>
                  <Link
                    href={`/monitor/monitoria?room=${meeting.roomName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline block mt-2"
                  >
                    👉 Entrar na reunião
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
