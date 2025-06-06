// 📁 app/monitor/agenda/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface SessaoMonitoriaAgrupada {
  id_representativo: number;
  nome_disciplina: string;
  conteudo_programatico: string;
  status: string;
  data_agendamento: string;
  nomes_alunos: string; // String com nomes dos alunos separados por vírgula
  nome_monitor: string;
}
interface AgendamentoDoMonitorAPI {
  id_agendamento: number;
  data_agendada: string;
  status: string;
  disciplina: string; // CORRIGIDO: Espera 'disciplina' da API
  room_name: string;
  aluno?: string; // Nome do aluno associado ao agendamento
  observacoes?: string; // Vem de m.conteúdo_programático
}

// Interface para exibição da lista de meetings no frontend
type Meeting = {
  id: number;          
  roomName: string;
  date: string;
  disciplina: string;  
  // turma?: string;
  status: string;
  aluno?: string;
  observacoes?: string;
};


// Interface para o estado do select no frontend
type MentoriaParaSelecao = {
  id_mentoria: number;
  textoDisplay: string; 
};


export default function AgendaMonitor() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mentoriasParaSelecao, setMentoriasParaSelecao] = useState<MentoriaParaSelecao[]>([]);
  const [idMentoriaSelecionada, setIdMentoriaSelecionada] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [turmaInput, setTurmaInput] = useState<string>(""); // Mantido para o input, mas não salvo pela API /agendamentos

  const [loadingMentoriasDropdown, setLoadingMentoriasDropdown] = useState(true);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [errorAgendamentos, setErrorAgendamentos] = useState<string | null>(null);
  const [errorMentoriasDropdown, setErrorMentoriasDropdown] = useState<string | null>(null);


// ✅ SEU NOVO CÓDIGO - Cole este bloco no lugar do anterior

  useEffect(() => {
    const fetchMentoriasAgrupadasParaDropdown = async () => {
      setLoadingMentoriasDropdown(true);
      setErrorMentoriasDropdown(null);
      try {
        // 1. MUDANÇA: Buscando da nova rota que retorna dados agrupados
        const res = await fetch("/api/monitorias-agrupadas");

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Falha ao carregar opções de mentoria" }));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }
        
        // 2. MUDANÇA: Os dados agora vêm no formato da interface 'SessaoMonitoriaAgrupada'
        const data: SessaoMonitoriaAgrupada[] = await res.json();

        // 3. MUDANÇA: A formatação agora cria um texto de exibição para o GRUPO
        const formatado: MentoriaParaSelecao[] = data.map(sessao => ({
          // O 'value' da opção será o ID que representa o grupo
          id_mentoria: sessao.id_representativo,
          // O texto exibido agora é muito mais limpo e informativo
          textoDisplay: `${sessao.nome_disciplina} - ${sessao.conteudo_programatico} (Monitor: ${sessao.nome_monitor}) - Alunos: ${sessao.nomes_alunos.split(',').length}`
        }));

        setMentoriasParaSelecao(formatado);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao carregar opções de mentoria:", error);
        setErrorMentoriasDropdown(`Falha ao carregar mentorias: ${message}`);
      } finally {
        setLoadingMentoriasDropdown(false);
      }
    };
    fetchMentoriasAgrupadasParaDropdown();
  }, []);

  const fetchAgendamentosDoMonitor = useCallback(async () => {
    setLoadingAgendamentos(true);
    setErrorAgendamentos(null);
    try {
      const response = await fetch(`/api/agendamentos?resumo=true`); 
      if (!response.ok) {
        const errData = await response.json().catch(() => ({error: "Erro desconhecido ao buscar agendamentos"}));
        throw new Error(errData.error || `Falha ao carregar seus agendamentos: ${response.statusText}`);
      }
      const dadosApi: AgendamentoDoMonitorAPI[] = await response.json();

      const formatados: Meeting[] = dadosApi.map((item) => ({
        id: item.id_agendamento,
        roomName: item.room_name || `monitoria-${item.id_agendamento}`,
        date: new Date(item.data_agendada).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'}),
        disciplina: item.disciplina || "Não especificada", // CORRIGIDO: Usa item.disciplina
        // turma: item.turma || undefined, // 'turma' não é mais esperada da AgendamentoDoMonitorAPI
        status: item.status.toUpperCase(),
        aluno: item.aluno,
        observacoes: item.observacoes
      }));
      setMeetings(formatados);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorAgendamentos(`Erro ao buscar seus agendamentos: ${message}`);
      console.error("Erro ao buscar seus agendamentos:", err);
    } finally {
      setLoadingAgendamentos(false);
    }
  }, []); 

  useEffect(() => {
    fetchAgendamentosDoMonitor(); 
  }, [fetchAgendamentosDoMonitor]);


  const handleSchedule = async () => {
    if (!idMentoriaSelecionada || !meetingDate.trim()) {
      alert("Selecione a mentoria e a data/hora para o agendamento.");
      return;
    }
    try {
      const payload = {
        id_mentoria: parseInt(idMentoriaSelecionada),
        data_agendada: meetingDate,
        status: "PENDENTE", 
      };

      const response = await fetch("/api/agendamentos", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Erro ao agendar");
      
      alert(data.message || "Reunião agendada com sucesso!");
      
      fetchAgendamentosDoMonitor(); 
      // Opcional: rebuscar mentorias para dropdown se o status delas muda após agendamento
      // fetchMentoriasDisponiveisParaDropdown(); 

      setMeetingDate("");
      setIdMentoriaSelecionada("");
      setTurmaInput(""); 

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Detalhes indisponíveis";
      console.error("Erro ao agendar:", err);
      alert(`Erro ao agendar reunião: ${message}`);
    }
  };

  const handleStatusChange = async (idAgendamento: number, newStatus: string) => {
    try {
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
      <Navbar /> 
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">📅 Minha Agenda de Monitorias</h2>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">📌 Agendar Nova Monitoria</h3>
          
          {loadingMentoriasDropdown ? <p className="text-gray-500 dark:text-gray-400">Carregando opções de mentoria...</p> :
           errorMentoriasDropdown ? <p className="text-red-500 dark:text-red-400">{errorMentoriasDropdown}</p> :
            <div className="mb-4">
              <label htmlFor="idMentoriaSelecionada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mentoria Disponível*</label>
              <select
                id="idMentoriaSelecionada"
                value={idMentoriaSelecionada}
                onChange={(e) => setIdMentoriaSelecionada(e.target.value)}
                className="block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">
                  {mentoriasParaSelecao.length === 0 ? "Nenhuma mentoria disponível para agendar" : "Selecione a mentoria"}
                </option>
                {mentoriasParaSelecao.map((m) => (
                  <option key={m.id_mentoria} value={m.id_mentoria}>
                    {m.textoDisplay}
                  </option>
                ))}
              </select>
            </div>
          }

          <div className="mb-4">
            <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data e Hora do Agendamento*</label>
            <input
              id="meetingDate"
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="block w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="mb-6"> 
            <label htmlFor="turmaInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turma (Opcional, informativo)</label>
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
            disabled={loadingMentoriasDropdown || loadingAgendamentos}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ClockIcon className="h-5 w-5" />
            Agendar Monitoria
          </button>
        </div>

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
                      <p className="font-semibold text-lg text-indigo-600 dark:text-indigo-400">{meeting.disciplina}</p> {/* ESTA LINHA AGORA DEVE FUNCIONAR CORRETAMENTE */}
                      {meeting.aluno && <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Aluno:</strong> {meeting.aluno}</p> }
                      <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Data:</strong> {meeting.date}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Sala:</strong> {meeting.roomName}</p>
                      {meeting.observacoes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Obs: {meeting.observacoes}</p>}
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
                          > <CheckCircleIcon className="h-4 w-4" /> Confirmar </button>
                          <button
                            onClick={() => handleStatusChange(meeting.id, "CANCELADO")}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                          > <XCircleIcon className="h-4 w-4" /> Cancelar </button>
                        </>
                      )}
                      {meeting.status === 'CONFIRMADO' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(meeting.id, "REALIZADA")}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                          > <CheckCircleIcon className="h-4 w-4" /> Realizada </button>
                          <button
                              onClick={() => handleStatusChange(meeting.id, "CANCELADO")}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                            > <XCircleIcon className="h-4 w-4" /> Cancelar </button>
                           <Link
                              href={`/monitor/monitoria?room=${meeting.roomName}`} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold py-2 px-3 rounded-md shadow-sm transition flex items-center gap-1 w-full sm:w-auto justify-center"
                            > Entrar na Sala </Link>
                        </>
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