'use client';

import { useState, useEffect, useCallback } from "react";
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

// Interface para os dados que a API GET /api/monitor/agendamentos retorna
interface AgendamentoDoMonitorAPI {
  id_agendamento: number;
  data_agendada: string;
  status: string;
  turma: string | null;
  disciplina_nome: string; // Vem da API /api/monitor/agendamentos
  room_name: string;
}

// Interface para exibição da lista de meetings no frontend
type Meeting = {
  id: number;          // id_agendamento
  roomName: string;
  date: string;
  disciplina: string;  // Nome da disciplina
  turma?: string;
  status: string;
};

// Interface para o que /api/mentorias retorna (para o dropdown de agendamento)
// Esta API precisa retornar 'id_mentoria' e um campo para nome da disciplina.
interface MentoriaApiData {
  id_mentoria: number;
  nome_disciplina?: string; // Priorizar se existir
  disciplina?: string;    // Fallback
}

type MentoriaParaSelecao = {
  id_mentoria: number;
  disciplina: string; 
};


export default function AgendaMonitor() { // Renomeado de Agenda para AgendaMonitor
  const userType: 'admin' | 'monitor' | 'student' = 'monitor';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mentoriasParaSelecao, setMentoriasParaSelecao] = useState<MentoriaParaSelecao[]>([]);
  const [idMentoriaSelecionada, setIdMentoriaSelecionada] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [turmaInput, setTurmaInput] = useState<string>(""); // turmaInput será usado

  const [loadingMentorias, setLoadingMentorias] = useState(true);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [errorAgendamentos, setErrorAgendamentos] = useState<string | null>(null);
  
  // O ID do monitor logado será obtido pela API do backend via cookies.
  // Não precisamos mais do estado monitorIdLogado e setMonitorIdLogado aqui para este fetch.

  // Fetch para o dropdown de "mentorias" (para agendar uma nova)
  useEffect(() => {
    const fetchMentoriasDisponiveis = async () => { // Renomeado para clareza
      setLoadingMentorias(true);
      try {
        const res = await fetch("/api/mentorias"); // Este endpoint deve listar mentorias com disciplina
        if (!res.ok) throw new Error("Falha ao carregar opções de mentoria/disciplina");
        
        const data: MentoriaApiData[] = await res.json(); // Corrigido: let para const, e tipado

        const formatado: MentoriaParaSelecao[] = data.map(m => ({
          id_mentoria: m.id_mentoria,
          // A API /api/mentorias (geral) que ajustamos retorna nome_disciplina
          disciplina: m.nome_disciplina || m.disciplina || "Disciplina Desconhecida"
        }));
        setMentoriasParaSelecao(formatado);
      } catch (error) {
        console.error("Erro ao carregar opções de mentoria:", error);
        // Poderia setar um estado de erro para o select de mentorias
      } finally {
        setLoadingMentorias(false);
      }
    };
    fetchMentoriasDisponiveis();
  }, []);

  // Fetch para a lista de agendamentos DO MONITOR LOGADO
  const fetchAgendamentosDoMonitor = useCallback(async () => {
    setLoadingAgendamentos(true);
    setErrorAgendamentos(null);
    try {
      // Chamando o endpoint correto que busca agendamentos do monitor e já inclui nomes
      const response = await fetch(`/api/agendamentos`); 
      if (!response.ok) {
        const errData = await response.json().catch(() => ({error: "Erro desconhecido ao buscar agendamentos"}));
        throw new Error(errData.error || `Falha ao carregar seus agendamentos: ${response.statusText}`);
      }
      const dados: AgendamentoDoMonitorAPI[] = await response.json();

      const formatados: Meeting[] = dados.map((item) => ({
        id: item.id_agendamento,
        roomName: item.room_name || `monitoria-${item.id_agendamento}-${new Date(item.data_agendada).getTime()}`,
        date: new Date(item.data_agendada).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'}),
        disciplina: item.disciplina_nome || "Não especificada", // Usa o nome da disciplina da API
        turma: item.turma || undefined,
        status: item.status.toUpperCase(),
      }));
      setMeetings(formatados);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorAgendamentos(`Erro ao buscar seus agendamentos: ${message}`);
      console.error("Erro ao buscar seus agendamentos:", err);
    } finally {
      setLoadingAgendamentos(false);
    }
  }, []); // Removidas dependências de monitorIdLogado e mentoriasParaSelecao

  useEffect(() => {
    fetchAgendamentosDoMonitor(); // Busca agendamentos na montagem e quando a função é recriada (raro com useCallback e deps vazias)
  }, [fetchAgendamentosDoMonitor]);


  const handleSchedule = async () => {
    if (!idMentoriaSelecionada || !meetingDate.trim()) {
      alert("Selecione a mentoria/disciplina e a data/hora para o agendamento.");
      return;
    }
    try {
      const payload = {
        id_mentoria: parseInt(idMentoriaSelecionada),
        data_agendada: meetingDate,
        status: "PENDENTE",
        turma: turmaInput.trim() || null, // turmaInput é usado aqui
        // room_name é opcional, o backend (/api/monitor/agendamentos POST) irá gerar se não enviado
      };

      // POST para a API /api/monitor/agendamentos (que você forneceu e que lida com 'turma')
      const response = await fetch("/api/agendamentos", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Erro ao agendar");
      
      alert(data.message || "Reunião agendada com sucesso!");
      
      // Rebuscar a lista para mostrar o novo agendamento
      fetchAgendamentosDoMonitor(); 

      setMeetingDate("");
      setIdMentoriaSelecionada("");
      setTurmaInput(""); // Reset do turmaInput

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Detalhes indisponíveis";
      console.error("Erro ao agendar:", err);
      alert(`Erro ao agendar reunião: ${message}`);
    }
  };

  const handleStatusChange = async (idAgendamento: number, newStatus: string) => {
    try {
      // Este PATCH deve ir para uma rota que possa identificar o agendamento.
      // Se você criou app/api/monitor/agendamentos/[id]/route.ts, use esse caminho.
      // Caso contrário, use app/api/agendamentos/[id]/route.ts se ele verifica permissões.
      const response = await fetch(`/api/agendamentos/${idAgendamento}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || "Erro ao atualizar status");
      
      setMeetings((prevMeetings) =>
        prevMeetings.map((m) => (m.id === idAgendamento ? { ...m, status: newStatus.toUpperCase() } : m))
      );
      alert(result.message || `Status da reunião atualizado para ${newStatus.toUpperCase()}!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Detalhes indisponíveis";
      console.error("Erro ao atualizar status:", err);
      alert(`Erro ao atualizar status da reunião: ${message}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar userType={userType} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">📅 Minha Agenda de Monitorias</h2>

        {/* Seção de Agendar Nova Reunião */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">📌 Agendar Nova Monitoria</h3>
          
          {loadingMentorias ? <p className="text-gray-500 dark:text-gray-400">Carregando opções de mentoria...</p> :
            <div className="mb-4">
              <label htmlFor="idMentoriaSelecionada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mentoria/Disciplina*</label>
              <select
                id="idMentoriaSelecionada"
                value={idMentoriaSelecionada}
                onChange={(e) => setIdMentoriaSelecionada(e.target.value)}
                className="block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">
                  {mentoriasParaSelecao.length === 0 ? "Nenhuma mentoria para selecionar" : "Selecione a mentoria/disciplina"}
                </option>
                {mentoriasParaSelecao.map((m) => (
                  <option key={m.id_mentoria} value={m.id_mentoria}>
                    {m.disciplina} (ID: {m.id_mentoria})
                  </option>
                ))}
              </select>
            </div>
          }

          <div className="mb-4">
            <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data e Hora*</label>
            <input
              id="meetingDate"
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="mb-6"> {/* Div para o input de turma */}
            <label htmlFor="turmaInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turma (Opcional)</label>
            <input
              id="turmaInput"
              type="text"
              placeholder="Identificador da turma, se aplicável"
              value={turmaInput}
              onChange={(e) => setTurmaInput(e.target.value)}
              className="block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleSchedule}
            disabled={loadingMentorias || loadingAgendamentos}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ClockIcon className="h-5 w-5" />
            Agendar Monitoria
          </button>
        </div>

        {/* Seção de Reuniões Agendadas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">📋 Minhas Reuniões Agendadas</h3>
          {loadingAgendamentos ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Carregando seus agendamentos...</p>
          ) : errorAgendamentos ? (
            <p className="text-red-500 dark:text-red-400 text-center py-4">{errorAgendamentos}</p>
          ) : meetings.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma reunião agendada para você no momento.</p>
          ) : (
            <ul className="space-y-6">
              {meetings.map((meeting) => (
                <li
                  key={meeting.id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-md transition-shadow hover:shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-grow">
                      <p className="font-semibold text-lg text-indigo-600 dark:text-indigo-400">{meeting.disciplina}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Data:</strong> {meeting.date}</p>
                      {meeting.turma && <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Turma:</strong> {meeting.turma}</p>}
                      <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Sala:</strong> {meeting.roomName}</p>
                      <p className="text-sm font-medium mt-2">
                        <strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${meeting.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' : 
                            meeting.status === 'CONFIRMADO' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 
                            meeting.status === 'CANCELADO' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                            meeting.status === 'REALIZADA' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                          {meeting.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 items-center mt-3 sm:mt-0 w-full sm:w-auto">
                      {meeting.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(meeting.id, "CONFIRMADO")}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                          >
                            <CheckCircleIcon className="h-4 w-4" /> Confirmar
                          </button>
                          <button
                            onClick={() => handleStatusChange(meeting.id, "CANCELADO")}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                          >
                            <XCircleIcon className="h-4 w-4" /> Cancelar
                          </button>
                        </>
                      )}
                      {meeting.status === 'CONFIRMADO' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(meeting.id, "REALIZADA")}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                          >
                            <CheckCircleIcon className="h-4 w-4" /> Realizada
                          </button>
                          <button
                              onClick={() => handleStatusChange(meeting.id, "CANCELADO")}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                            >
                             <XCircleIcon className="h-4 w-4" /> Cancelar
                          </button>
                        </>
                      )}
                       {(meeting.status === 'CONFIRMADO' ) && ( 
                         <Link
                            href={`/monitor/monitoria?room=${meeting.roomName}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                          >
                            Entrar na Sala
                          </Link>
                       )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}