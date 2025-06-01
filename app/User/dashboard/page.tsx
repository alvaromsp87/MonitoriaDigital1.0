// 📁 app/User/dashboard/page.tsx
"use client";

import Navbar from '../../components/Navbar'; 
import React, { useEffect, useRef, useState, useCallback } from "react";
import Chart from "chart.js/auto";
import { BarChart3, PieChart, ListChecks, AlertTriangle, CalendarDays, Loader2 } from "lucide-react";
import { useAuth, User as TipoUserDoAuthContext } from "../../context/AuthContext"; 
import Link from "next/link";

// Interfaces para os dados do Aluno
interface AlunoPerformanceItem {
  disciplina: string;
  nota: number; 
}

interface AlunoMeetingItem { 
  id: number | string; 
  date: string;        
  disciplina: string;
  monitor_nome?: string; 
  status?: string;       
  observacoes?: string; // Adicionado para exibir observações
  room_name?: string;   // Adicionado para link da sala
}

interface AgendamentoAlunoAPIItem { 
  id_agendamento: number | string;
  data_agendada: string;
  disciplina?: string;
  monitor_nome?: string; 
  status?: string;
  observacoes?: string;
  room_name?: string;
}

interface StatusResumoAlunoItem { 
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

export default function AlunoDashboard() {
  const { user, loading: authLoading } = useAuth(); 
  const typedUser = user as TipoUserDoAuthContext | null;

  const alunoPerformanceChartRef = useRef<HTMLCanvasElement | null>(null);
  const alunoPerformanceChartInstanceRef = useRef<Chart<'bar'> | null>(null);
  const [alunoPerformanceData, setAlunoPerformanceData] = useState<AlunoPerformanceItem[]>([]);
  const [alunoUserName, setAlunoUserName] = useState<string>('');
  const [loadingAlunoPerformance, setLoadingAlunoPerformance] = useState(true);
  const [errorAlunoPerformance, setErrorAlunoPerformance] = useState<string | null>(null);

  const alunoStatusChartRef = useRef<HTMLCanvasElement | null>(null);
  const alunoStatusChartInstanceRef = useRef<Chart<'doughnut'> | null>(null);
  const [alunoStatusResumo, setAlunoStatusResumo] = useState<StatusResumoAlunoItem[]>([]);
  const [loadingAlunoStatus, setLoadingAlunoStatus] = useState(true);
  const [errorAlunoStatus, setErrorAlunoStatus] = useState<string | null>(null);

  const [alunoMeetings, setAlunoMeetings] = useState<AlunoMeetingItem[]>([]);
  const [loadingAlunoMeetings, setLoadingAlunoMeetings] = useState(true);
  const [errorAlunoMeetings, setErrorAlunoMeetings] = useState<string | null>(null);

  useEffect(() => {
    if (!typedUser || typedUser.role !== 'aluno') {
        setLoadingAlunoPerformance(false);
        if (typedUser && typedUser.role !== 'aluno') {
            setErrorAlunoPerformance("Acesso restrito ao dashboard de aluno.");
        }
        return;
    }

    async function fetchAlunoPerformanceData() {
      setLoadingAlunoPerformance(true);
      setErrorAlunoPerformance(null);
      try {
        const response = await fetch(`/api/dashboard/conceitos`); 
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erro desconhecido ao buscar desempenho do aluno" }));
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const { userName: fetchedUserName, data: fetchedData } = await response.json();
        if (!Array.isArray(fetchedData)) {
          throw new Error("Formato de dados inesperado (desempenho do aluno).");
        }
        setAlunoPerformanceData(fetchedData as AlunoPerformanceItem[]);
        setAlunoUserName(fetchedUserName || typedUser?.nome || 'Aluno'); 
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorAlunoPerformance(`Falha ao carregar seu desempenho: ${message}`);
        console.error("Erro desempenho aluno:", err);
      } finally {
        setLoadingAlunoPerformance(false);
      }
    }
    fetchAlunoPerformanceData();
    return () => {
      if (alunoPerformanceChartInstanceRef.current) {
        alunoPerformanceChartInstanceRef.current.destroy();
      }
    };
  }, [typedUser]);

  useEffect(() => {
    if (alunoPerformanceChartRef.current && alunoPerformanceData.length > 0 && !loadingAlunoPerformance && !errorAlunoPerformance) {
      if (alunoPerformanceChartInstanceRef.current) {
        alunoPerformanceChartInstanceRef.current.destroy();
      }
      const ctx = alunoPerformanceChartRef.current.getContext("2d");
      if (ctx) {
        const labels = alunoPerformanceData.map(item => item.disciplina);
        const notas = alunoPerformanceData.map(item => item.nota);
        const backgroundColors = getChartColors(labels.length);
        const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

        alunoPerformanceChartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [{
              label: "Minhas Notas/Conceitos",
              data: notas,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, min: 0, max: 10, title: { display: true, text: "Nota/Conceito", font: {size: 12} } }, 
                x: { title: { display: true, text: "Disciplinas", font: {size: 12} } } 
            },
            plugins: { legend: { display: false }, tooltip: { 
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        if (context.parsed.y !== null) { label += context.parsed.y.toFixed(1); }
                        return label;
                    }
                }
             } }
          },
        });
      }
    } else if (alunoPerformanceChartInstanceRef.current && (alunoPerformanceData.length === 0 || errorAlunoPerformance)) {
      alunoPerformanceChartInstanceRef.current.destroy();
      alunoPerformanceChartInstanceRef.current = null;
    }
  }, [alunoPerformanceData, loadingAlunoPerformance, errorAlunoPerformance]);

  const fetchAlunoAgendamentos = useCallback(async () => {
    if (!typedUser || typedUser.role !== 'aluno') return;

    setLoadingAlunoMeetings(true);
    setErrorAlunoMeetings(null);
    try {
      const response = await fetch(`/api/agendamentos?resumo=true`); 
      if (!response.ok) { 
          const errorData = await response.json().catch(() => ({ error: "Erro ao buscar seus agendamentos" }));
          throw new Error(errorData.error || `Erro HTTP Agendamentos: ${response.status}`); 
      }
      const dados = await response.json();
      console.log('Dados recebidos para agendamentos do aluno (User/dashboard):', dados); // Log para depuração
      if (!Array.isArray(dados)) throw new Error("Formato inesperado (seus agendamentos).");
      
      const formatados: AlunoMeetingItem[] = (dados as AgendamentoAlunoAPIItem[]).map((item) => ({
        id: item.id_agendamento,
        date: new Date(item.data_agendada).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        disciplina: item.disciplina || "Não especificada",
        monitor_nome: item.monitor_nome || "Não informado",
        status: item.status || "Não informado",
        observacoes: item.observacoes, // Mapeando observacoes
        room_name: item.room_name,     // Mapeando room_name
      })).sort((a,b) => {
          // Correção na ordenação de data, assumindo formato DD/MM/YYYY, HH:MM
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split(', ');
            const dateParts = parts[0].split('/');
            // Note: JavaScript Date months are 0-indexed (0 for January)
            return new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), 
                            parseInt(parts[1].split(':')[0]), parseInt(parts[1].split(':')[1])).getTime();
          };
          return parseDate(b.date) - parseDate(a.date);
      });
      setAlunoMeetings(formatados);
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorAlunoMeetings(`Falha ao carregar seus agendamentos: ${message}.`);
        console.error("Erro agendamentos aluno:", err);
    } 
    finally { setLoadingAlunoMeetings(false); }
  }, [typedUser]);

  useEffect(() => { if (typedUser && typedUser.role === 'aluno') fetchAlunoAgendamentos(); }, [fetchAlunoAgendamentos, typedUser]);

  const fetchAlunoStatusResumo = useCallback(async () => {
    if (!typedUser || typedUser.role !== 'aluno') return;
    
    setLoadingAlunoStatus(true);
    setErrorAlunoStatus(null);
    try {
      const response = await fetch(`/api/agendamentos?resumo=status`);
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({ error: "Erro ao buscar resumo de status dos seus agendamentos" }));
        throw new Error(errorData.error || `Erro HTTP Status: ${response.status}`); 
      }
      const data = await response.json();
      console.log('Dados recebidos para status dos agendamentos do aluno (User/dashboard):', data); // Log para depuração
      if (!Array.isArray(data)) throw new Error("Formato inesperado (status dos seus agendamentos).");
      setAlunoStatusResumo(data as StatusResumoAlunoItem[]);
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorAlunoStatus(`Falha ao carregar resumo de status: ${message}.`);
        console.error('Erro status aluno:', err);
    } 
    finally { setLoadingAlunoStatus(false); }
  }, [typedUser]);

  useEffect(() => { 
    if (typedUser && typedUser.role === 'aluno') fetchAlunoStatusResumo();
    return () => { if (alunoStatusChartInstanceRef.current) alunoStatusChartInstanceRef.current.destroy(); };
  }, [fetchAlunoStatusResumo, typedUser]);

  useEffect(() => {
    if (alunoStatusResumo.length > 0 && alunoStatusChartRef.current && !loadingAlunoStatus && !errorAlunoStatus) {
        if (alunoStatusChartInstanceRef.current) alunoStatusChartInstanceRef.current.destroy();
        const ctx = alunoStatusChartRef.current.getContext("2d");
        if (ctx) {
            alunoStatusChartInstanceRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: alunoStatusResumo.map((item) => item.status),
                datasets: [{
                label: "Total por Status",
                data: alunoStatusResumo.map((item) => item.quantidade),
                backgroundColor: getChartColors(alunoStatusResumo.length),
                borderColor: '#ffffff', 
                borderWidth: 2,
                }],
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'bottom', labels: { padding: 15, boxWidth: 12, font: {size: 12} } },
                    title: { display: false } 
                } 
            },
            });
        }
    } else if (alunoStatusChartInstanceRef.current && (alunoStatusResumo.length === 0 || errorAlunoStatus)) {
        alunoStatusChartInstanceRef.current.destroy();
        alunoStatusChartInstanceRef.current = null;
    }
  }, [alunoStatusResumo, loadingAlunoStatus, errorAlunoStatus]);

  const totalMonitoriasAluno = alunoStatusResumo.reduce((sum, item) => sum + item.quantidade, 0);
  
  const renderLoading = (text: string = "Carregando...") => (
    <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500 dark:text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500 dark:text-blue-400" />
      <p>{text}</p>
    </div>
  );

  const renderError = (message: string | null) => (
    <div className="flex flex-col items-center justify-center h-full py-10 text-red-600 dark:text-red-400">
      <AlertTriangle className="w-8 h-8 mb-2" />
      <p className="text-center px-4">{message || "Ocorreu um erro ao carregar os dados."}</p>
    </div>
  );

  const renderNoData = (message: string) => (
     <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500 dark:text-gray-400">
        <ListChecks className="w-8 h-8 mb-2" />
        <p className="text-center px-4">{message}</p>
    </div>
  );

  if (authLoading) { 
     return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
     );
  }
  
  if (!typedUser) { 
    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar /> 
            <main className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center text-center mt-16">
                 <AlertTriangle className="mx-auto h-16 w-16 text-orange-400" />
                <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Acesso Negado</h1>
                <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                    Você precisa estar logado para acessar esta página.
                </p>
                <Link href="/login" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors">
                    Ir para Login
                </Link>
            </main>
        </div>
    );
  }

  if (typedUser.role !== 'aluno') { 
    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar /> 
            <main className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center text-center mt-16">
                 <AlertTriangle className="mx-auto h-16 w-16 text-orange-400" />
                <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Acesso Restrito</h1>
                <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                    Esta página é destinada apenas para alunos. Seu perfil atual é: {typedUser.role}.
                </p>
                <Link href="/" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors">
                    Voltar para Home
                </Link>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar/>
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto mt-16">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
            Meu Dashboard
            {alunoUserName && (
              <span className="text-blue-600 dark:text-blue-400">: {alunoUserName}</span>
            )}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe seu desempenho e suas monitorias agendadas.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <section className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-6 h-6 mr-3 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Meu Desempenho Acadêmico</h2>
              </div>
              <div className="h-72 sm:h-80 relative">
                {loadingAlunoPerformance && renderLoading("Carregando seu desempenho...")}
                {errorAlunoPerformance && renderError(errorAlunoPerformance)}
                {!loadingAlunoPerformance && !errorAlunoPerformance && alunoPerformanceData.length === 0 && renderNoData("Nenhuma nota ou conceito encontrado.")}
                <canvas ref={alunoPerformanceChartRef} style={{ display: loadingAlunoPerformance || errorAlunoPerformance || alunoPerformanceData.length === 0 ? 'none' : 'block' }}></canvas>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <PieChart className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Status das Minhas Monitorias ({totalMonitoriasAluno})
                </h2>
              </div>
              <div className="h-72 sm:h-80 relative">
                {loadingAlunoStatus && renderLoading("Carregando status...")}
                {errorAlunoStatus && renderError(errorAlunoStatus)}
                {!loadingAlunoStatus && !errorAlunoStatus && alunoStatusResumo.length === 0 && renderNoData("Nenhum dado de status para exibir.")}
                <canvas ref={alunoStatusChartRef} style={{ display: loadingAlunoStatus || errorAlunoStatus || alunoStatusResumo.length === 0 ? 'none' : 'block' }}></canvas>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-5">
                <CalendarDays className="w-6 h-6 mr-3 text-yellow-500 dark:text-yellow-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Minhas Próximas Monitorias ({alunoMeetings.length})</h2>
            </div>
            <div className="max-h-[calc(18rem+18rem+2rem+2rem)] sm:max-h-[calc(20rem+20rem+3rem+2rem)] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {loadingAlunoMeetings && renderLoading("Carregando agendamentos...")}
              {errorAlunoMeetings && renderError(errorAlunoMeetings)}
              {!loadingAlunoMeetings && !errorAlunoMeetings && alunoMeetings.length === 0 && renderNoData("Nenhuma monitoria agendada para você.")}
              
              {alunoMeetings.length > 0 && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {alunoMeetings.map((meeting) => (
                    <li key={meeting.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm text-gray-700 dark:text-gray-200">{meeting.disciplina}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full
                          ${meeting.status === 'CONFIRMADO' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 
                            meeting.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' : 
                            meeting.status === 'REALIZADA' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100': 
                            meeting.status === 'CANCELADO' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                          {meeting.status}
                        </span>
                      </div>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {meeting.date}
                      </p>
                      {meeting.monitor_nome && meeting.monitor_nome !== "Não informado" && (
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Monitor(a): {meeting.monitor_nome}
                        </p>
                      )}
                      {meeting.observacoes && (
                         <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 italic">
                            Obs: {meeting.observacoes}
                        </p>
                      )}
                       {meeting.status === 'CONFIRMADO' && meeting.room_name && (
                        <Link href={`/User/monitoria?room=${meeting.room_name}`} 
                            className="mt-2 inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            target="_blank" rel="noopener noreferrer"
                        >
                            Entrar na Sala
                        </Link>
                       )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
             {!loadingAlunoMeetings && !errorAlunoMeetings && alunoMeetings.length > 5 && ( 
                <div className="mt-6 text-center">
                    <Link 
                        href="/User/agenda" 
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Ver todos os meus agendamentos
                    </Link>
                </div>
            )}
             <div className="mt-8 text-center">
                <Link 
                    href="/User/monitoria" 
                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 text-sm"
                >
                    Buscar Novas Monitorias
                </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}