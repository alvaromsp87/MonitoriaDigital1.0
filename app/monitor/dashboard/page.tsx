// 📁 app/monitor/dashboard/page.tsx
"use client";

import Navbar from '../../components/Navbar';
import React, { useEffect, useRef, useState, useCallback } from "react";
import Chart from "chart.js/auto";
import { BarChart3, PieChart, ListChecks, AlertTriangle, CalendarDays, Loader2 } from "lucide-react";
import { useAuth, User as TipoUserDoAuthContext } from "../../context/AuthContext";
import Link from "next/link";

// Interfaces: Mantenha as interfaces aqui, já que não estamos separando o componente
interface MonitorPerformanceItem {
  disciplina: string;
  nota: number;
}
interface MonitorMeetingItem { // Agendamentos do monitor (para uso no frontend)
  id: number | string;
  date: string; // Será a string ISO da API (ex: "2025-06-20T09:48:00Z")
  disciplina: string;
  aluno_nome?: string; 
  status?: string; 
  observacoes?: string; 
  room_name?: string; 
}
interface AgendamentoMonitorAPIItem { // Como os dados vêm da API de agendamentos do monitor
  id_agendamento: number | string;
  data_agendada: string;
  disciplina?: string;
  aluno?: string; 
  status?: string; 
  observacoes?: string; 
  room_name?: string; 
}
interface StatusResumoMonitorItem {
  status: string;
  quantidade: number;
}

const getChartColors = (numColors: number): string[] => {
  const baseColors = [
    'rgba(59, 130, 246, 0.7)', 
    'rgba(16, 185, 129, 0.7)', 
    'rgba(239, 68, 68, 0.7)', 
    'rgba(245, 158, 11, 0.7)', 
    'rgba(139, 92, 246, 0.7)', 
    'rgba(236, 72, 153, 0.7)', 
  ];
  const colors: string[] = [];
  for (let i = 0; i < numColors; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

export default function MonitorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as TipoUserDoAuthContext | null;
  
  const monitorPerformanceChartRef = useRef<HTMLCanvasElement | null>(null);
  const monitorPerformanceChartInstanceRef = useRef<Chart<'bar'> | null>(null);
  const [monitorPerformanceData, setMonitorPerformanceData] = useState<MonitorPerformanceItem[]>([]);
  const [monitorUserName, setMonitorUserName] = useState<string>('');
  const [loadingMonitorPerformance, setLoadingMonitorPerformance] = useState(true);
  const [errorMonitorPerformance, setErrorMonitorPerformance] = useState<string | null>(null);

  const monitorStatusChartRef = useRef<HTMLCanvasElement | null>(null);
  const monitorStatusChartInstanceRef = useRef<Chart<'doughnut'> | null>(null);
  const [monitorStatusResumo, setMonitorStatusResumo] = useState<StatusResumoMonitorItem[]>([]);
  const [loadingMonitorStatus, setLoadingMonitorStatus] = useState(true);
  const [errorMonitorStatus, setErrorMonitorStatus] = useState<string | null>(null);

  const [monitorMeetings, setMonitorMeetings] = useState<MonitorMeetingItem[]>([]);
  const [loadingMonitorMeetings, setLoadingMonitorMeetings] = useState(true);
  const [errorMonitorMeetings, setErrorMonitorMeetings] = useState<string | null>(null);
  
  // =========================================================================================================
  // ESTADOS E LÓGICA DO FILTRO DE AGENDAMENTOS (DUPLICADO)
  // =========================================================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [filteredMonitorMeetings, setFilteredMonitorMeetings] = useState<MonitorMeetingItem[]>([]);

  useEffect(() => {
    // console.log("------------------------------------------");
    // console.log("useEffect de Filtro de Agendamentos (MonitorDashboard) ativado!");
    // console.log("monitorMeetings (base) recebido:", monitorMeetings);
    // console.log("searchTerm atual:", searchTerm);
    // console.log("statusFilter atual:", statusFilter);

    if (monitorMeetings && monitorMeetings.length > 0) {
      let currentFiltered = monitorMeetings;

      // 1. Aplicar filtro de status
      if (statusFilter !== 'TODOS') {
        // console.log(`Aplicando filtro de status: ${statusFilter}`);
        currentFiltered = currentFiltered.filter(meeting => meeting.status === statusFilter);
        // console.log("Após filtro de status, resultados:", currentFiltered.length);
      }

      // 2. Aplicar filtro de pesquisa por texto
      if (searchTerm) {
        // console.log(`Aplicando filtro de pesquisa por texto: "${searchTerm}"`);
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        currentFiltered = currentFiltered.filter(meeting =>
          meeting.disciplina.toLowerCase().includes(lowerCaseSearchTerm) ||
          meeting.aluno_nome?.toLowerCase().includes(lowerCaseSearchTerm) ||
          meeting.observacoes?.toLowerCase().includes(lowerCaseSearchTerm)
        );
        // console.log("Após filtro de texto, resultados:", currentFiltered.length);
      }

      setFilteredMonitorMeetings(currentFiltered);
      // console.log("FilteredMonitorMeetings final:", currentFiltered.length, currentFiltered);
    } else {
      setFilteredMonitorMeetings([]);
      // console.log("monitorMeetings está vazio ou nulo.");
    }
    // console.log("------------------------------------------");
  }, [searchTerm, statusFilter, monitorMeetings]);
  // =========================================================================================================
  // FIM DOS ESTADOS E LÓGICA DO FILTRO DE AGENDAMENTOS
  // =========================================================================================================
  
  useEffect(() => {
    if (!typedUser || typedUser.role !== 'monitor') {
        setLoadingMonitorPerformance(false);
        if (typedUser && typedUser.role !== 'monitor') setErrorMonitorPerformance("Acesso restrito ao dashboard de monitor.");
        return;
    }
    
    async function fetchMonitorPerformanceData() {
      setLoadingMonitorPerformance(true);
      setErrorMonitorPerformance(null);
      try {
        const response = await fetch(`/api/dashboard/monitor-performance`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erro desconhecido ao buscar desempenho" }));
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const { userName: fetchedUserName, data: fetchedData } = await response.json();
        if (!Array.isArray(fetchedData)) {
          throw new Error("Formato de dados inesperado (desempenho).");
        }
        setMonitorPerformanceData(fetchedData as MonitorPerformanceItem[]);
        setMonitorUserName(fetchedUserName || typedUser?.nome || 'Monitor'); 
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorMonitorPerformance(`Falha ao carregar desempenho: ${message}`);
        console.error("Erro desempenho monitor:", err);
      } finally {
        setLoadingMonitorPerformance(false);
      }
    }
    fetchMonitorPerformanceData();
    return () => {
      if (monitorPerformanceChartInstanceRef.current) {
        monitorPerformanceChartInstanceRef.current.destroy();
      }
    };
  }, [typedUser]);

  useEffect(() => {
    if (monitorPerformanceChartRef.current && monitorPerformanceData.length > 0 && !loadingMonitorPerformance && !errorMonitorPerformance) {
      if (monitorPerformanceChartInstanceRef.current) monitorPerformanceChartInstanceRef.current.destroy();
      const ctx = monitorPerformanceChartRef.current.getContext("2d");
      if (ctx) {
        monitorPerformanceChartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: monitorPerformanceData.map(item => item.disciplina),
            datasets: [{
              label: "Minha Avaliação Média", 
              data: monitorPerformanceData.map(item => item.nota),
              backgroundColor: getChartColors(monitorPerformanceData.length),
              borderColor: getChartColors(monitorPerformanceData.length).map(c=>c.replace('0.7','1')),
              borderWidth: 1, borderRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, min: 0, max: 10, title: { display: true, text: "Nota Média", font: {size: 12} } }, 
                x: { title: { display: true, text: "Disciplinas Monitoradas", font: {size: 12} } } 
            },
            plugins: { legend: { display: false } }
          },
        });
      }
    } else if (monitorPerformanceChartInstanceRef.current && (monitorPerformanceData.length === 0 || errorMonitorPerformance)) {
      monitorPerformanceChartInstanceRef.current.destroy();
      monitorPerformanceChartInstanceRef.current = null;
    }
  }, [monitorPerformanceData, loadingMonitorPerformance, errorMonitorPerformance]);

  const fetchMonitorAgendamentos = useCallback(async () => {
    if (!typedUser || typedUser.role !== 'monitor') return;
    setLoadingMonitorMeetings(true);
    setErrorMonitorMeetings(null);
    try {
      const response = await fetch(`/api/agendamentos?resumo=true`); 
      if (!response.ok) { 
          const errorData = await response.json().catch(() => ({ error: "Erro ao buscar agendamentos do monitor" })); 
          throw new Error(errorData.error || `Erro HTTP Agendamentos: ${response.status}`); 
      }
      const dados = await response.json(); 
      console.log('Dados recebidos para agendamentos do monitor (Monitor/dashboard):', dados); 
      if (!Array.isArray(dados)) throw new Error("Formato inesperado (agendamentos do monitor)."); 
      
      const formatados: MonitorMeetingItem[] = (dados as AgendamentoMonitorAPIItem[]).map((item) => ({ 
        id: item.id_agendamento, 
        date: item.data_agendada, // Passa a string ISO diretamente
        disciplina: item.disciplina || "Não especificada", 
        aluno_nome: item.aluno || "Não informado", 
        status: item.status || "Não informado", 
        observacoes: item.observacoes,
        room_name: item.room_name,
      })).sort((a,b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setMonitorMeetings(formatados); 
    } catch (err: unknown) {  
        const message = err instanceof Error ? err.message : "Erro desconhecido"; 
        setErrorMonitorMeetings(`Falha ao carregar seus agendamentos: ${message}.`); 
        console.error("Erro agendamentos monitor:", err); 
    }  
    finally { setLoadingMonitorMeetings(false); }
  }, [typedUser]);

  useEffect(() => { if (typedUser && typedUser.role === 'monitor') fetchMonitorAgendamentos(); }, [fetchMonitorAgendamentos, typedUser]);

  const fetchMonitorStatusResumo = useCallback(async () => {
    if (!typedUser || typedUser.role !== 'monitor') return;
    setLoadingMonitorStatus(true);
    setErrorMonitorStatus(null);
    try {
      const response = await fetch(`/api/agendamentos?resumo=status`);
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({ error: "Erro ao buscar resumo de status" })); 
        throw new Error(errorData.error || `Erro HTTP Status: ${response.status}`); 
      }
      const data = await response.json();
      console.log('Dados recebidos para status dos agendamentos do monitor (Monitor/dashboard):', data); 
      if (!Array.isArray(data)) throw new Error("Formato inesperado (status).");
      setMonitorStatusResumo(data as StatusResumoMonitorItem[]);
    } catch (err: unknown) {  
        const message = err instanceof Error ? err.message : "Erro desconhecido"; 
        setErrorMonitorStatus(`Falha ao carregar resumo de status: ${message}.`); 
        console.error('Erro status monitor:', err);
    }  
    finally { setLoadingMonitorStatus(false); }
  }, [typedUser]);

  useEffect(() => { 
    if (typedUser && typedUser.role === 'monitor') fetchMonitorStatusResumo();
    return () => { if (monitorStatusChartInstanceRef.current) monitorStatusChartInstanceRef.current.destroy(); };
  }, [fetchMonitorStatusResumo, typedUser]);

  useEffect(() => {
    if (monitorStatusResumo.length > 0 && monitorStatusChartRef.current && !loadingMonitorStatus && !errorMonitorStatus) {
        if (monitorStatusChartInstanceRef.current) monitorStatusChartInstanceRef.current.destroy();
        const ctx = monitorStatusChartRef.current.getContext("2d");
        if (ctx) {
            monitorStatusChartInstanceRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: monitorStatusResumo.map((item) => item.status),
                datasets: [{
                label: "Total por Status",
                data: monitorStatusResumo.map((item) => item.quantidade), 
                backgroundColor: getChartColors(monitorStatusResumo.length),
                borderColor: '#ffffff', borderWidth: 2,
                }],
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'bottom', labels: { padding: 15, boxWidth: 12, font: {size: 12} } },
                } 
            },
            });
        }
    } else if (monitorStatusChartInstanceRef.current && (monitorStatusResumo.length === 0 || errorMonitorStatus)) {
        monitorStatusChartInstanceRef.current.destroy();
        monitorStatusChartInstanceRef.current = null;
    }
  }, [monitorStatusResumo, loadingMonitorStatus, errorMonitorStatus]);

  const totalMonitoriasMonitor = monitorStatusResumo.reduce((sum, item) => sum + item.quantidade, 0); 

  const renderLoading = (text: string = "Carregando...") => ( <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500 dark:text-gray-400"> <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500 dark:text-blue-400" /> <p>{text}</p> </div> );
  const renderError = (message: string | null) => ( <div className="flex flex-col items-center justify-center h-full py-10 text-red-600 dark:text-red-400"> <AlertTriangle className="w-8 h-8 mb-2" /> <p className="text-center px-4">{message || "Ocorreu um erro."}</p> </div> );
  const renderNoData = (message: string) => ( <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500 dark:text-gray-400"> <ListChecks className="w-8 h-8 mb-2" /> <p className="text-center px-4">{message}</p> </div> );

  if (authLoading) { return ( <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center"> <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" /> </div> ); }
  if (!typedUser) { return ( <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900"><Navbar /> <main className="flex-1 p-6 mt-16 flex flex-col items-center justify-center text-center"><AlertTriangle className="mx-auto h-16 w-16 text-orange-400" /><h1 className="mt-4 text-2xl font-bold">Acesso Negado</h1><p className="mt-2">Você precisa estar logado.</p><Link href="/login" className="mt-6 btn-primary">Ir para Login</Link></main></div> ); }
  if (typedUser.role !== 'monitor') { return ( <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900"><Navbar /> <main className="flex-1 p-6 mt-16 flex flex-col items-center justify-center text-center"><AlertTriangle className="mx-auto h-16 w-16 text-orange-400" /><h1 className="mt-4 text-2xl font-bold">Acesso Restrito</h1><p className="mt-2">Esta página é para monitores.</p><Link href="/" className="mt-6 btn-primary">Voltar para a página inicial</Link></main></div> ); }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar/>
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto mt-16">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Painel do Monitor
            {monitorUserName && ( <span className="text-blue-600 dark:text-blue-400">: {monitorUserName}</span> )}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1"> Acompanhe seu desempenho e suas monitorias. </p> 
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <section className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border">
              <div className="flex items-center mb-4"> <BarChart3 className="w-6 h-6 mr-3 text-blue-600" /> <h2 className="text-xl font-semibold">Meu Desempenho (Avaliações)</h2> </div> 
              <div className="h-72 sm:h-80 relative">
                {loadingMonitorPerformance && renderLoading("Carregando seu desempenho...")} 
                {errorMonitorPerformance && renderError(errorMonitorPerformance)}
                {!loadingMonitorPerformance && !errorMonitorPerformance && monitorPerformanceData.length === 0 && renderNoData("Nenhuma avaliação encontrada.")} 
                <canvas ref={monitorPerformanceChartRef} style={{ display: loadingMonitorPerformance || errorMonitorPerformance || monitorPerformanceData.length === 0 ? 'none' : 'block' }}></canvas>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border">
              <div className="flex items-center mb-4"> <PieChart className="w-6 h-6 mr-3 text-red-500" /> <h2 className="text-xl font-semibold"> Status das Minhas Monitorias ({totalMonitoriasMonitor}) </h2> </div>
              <div className="h-72 sm:h-80 relative">
                {loadingMonitorStatus && renderLoading("Carregando status...")} 
                {errorMonitorStatus && renderError(errorMonitorStatus)}
                {!loadingMonitorStatus && !errorMonitorStatus && monitorStatusResumo.length === 0 && renderNoData("Nenhum dado de status para exibir.")} 
                <canvas ref={monitorStatusChartRef} style={{ display: loadingMonitorStatus || errorMonitorStatus || monitorStatusResumo.length === 0 ? 'none' : 'block' }}></canvas>
              </div>
            </section>
          </div>

          {/* ASIDE COM OS AGENDAMENTOS E FILTRO (DUPLICADO) */}
          <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border">
            <div className="flex items-center mb-5">
              <CalendarDays className="w-6 h-6 mr-3 text-green-500" />
              <h2 className="text-xl font-semibold">Minhas Próximas Monitorias ({filteredMonitorMeetings.length})</h2> 
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Pesquisar agendamentos..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="confirmado">Confirmado</option>
                <option value="pendente">Pendente</option>
                <option value="realizada">Realizada</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="max-h-[calc(18rem+18rem+2rem+2rem)] sm:max-h-[calc(20rem+20rem+3rem+2rem)] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {loadingMonitorMeetings && renderLoading("Carregando agendamentos...")} 
              {errorMonitorMeetings && renderError(errorMonitorMeetings)}
              {!loadingMonitorMeetings && !errorMonitorMeetings && monitorMeetings.length === 0 && renderNoData("Nenhuma monitoria agendada.")} 
              
              {/* Mensagem se não houver resultados APÓS os filtros */}
              {!loadingMonitorMeetings && !errorMonitorMeetings && monitorMeetings.length > 0 && filteredMonitorMeetings.length === 0 && (searchTerm || statusFilter !== 'TODOS') && (
                  renderNoData("Nenhum agendamento encontrado com os filtros aplicados.")
              )}

              {filteredMonitorMeetings.length > 0 && (
                <ul className="divide-y dark:divide-gray-700">
                  {filteredMonitorMeetings.map((meeting) => (
                    <li key={meeting.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">{meeting.disciplina}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ 
                          meeting.status === 'confirmado' ? 'bg-green-100 text-green-800' : 
                          meeting.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                          meeting.status === 'realizada' ? 'bg-blue-100 text-blue-800' : 
                          meeting.status === 'cancelado' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800' 
                        }`}> {meeting.status} </span>
                      </div>
                      {/* Formata a data AQUI, já que 'date' é a string ISO */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"> {new Date(meeting.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} </p>
                      {meeting.aluno_nome && meeting.aluno_nome !== "Não informado" && ( <p className="text-xs text-gray-500 mt-0.5"> Aluno(a): {meeting.aluno_nome} </p> )} 
                      {meeting.observacoes && ( <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 italic"> Obs: {meeting.observacoes} </p> )}
                      {meeting.status === 'confirmado' && meeting.room_name && ( <Link href={`/monitor/monitoria?room=${meeting.room_name}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-blue-600 hover:underline"> Entrar na Sala </Link> )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!loadingMonitorMeetings && !errorMonitorMeetings && monitorMeetings.length > 5 && ( <div className="mt-6 text-center"> <Link href="/monitor/agenda" className="text-sm font-medium text-blue-600 hover:underline"> Ver todos os meus agendamentos </Link> </div> )}
            <div className="mt-8 text-center"> <Link href="/monitor/agenda" className="btn-primary w-full text-sm"> Gerenciar Agenda </Link> </div>
          </aside>
        </div>
      </main>
    </div>
  );
}