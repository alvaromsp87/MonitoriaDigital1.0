// 📁 app/admin/dashboard/page.tsx
"use client";

import Navbar from '../../components/Navbar';
import React, { useEffect, useRef, useState, useCallback } from "react"; // Removido 'JSX' daqui
import Chart from "chart.js/auto";
import { BarChart3, PieChart, ListChecks, AlertTriangle, CalendarDays, Loader2, Users, BookOpen } from "lucide-react";
import { useAuth, User as TipoUserDoAuthContext } from "../../context/AuthContext";
import Link from "next/link";

interface AdminPerformanceItem { // Desempenho médio geral por disciplina
  disciplina: string;
  media_nota: string; // API retorna como string
}
interface AdminMeetingItem { // Todos os agendamentos no sistema
  id: number | string;
  date: string;
  disciplina: string;
  aluno_nome?: string;
  monitor_nome?: string;
  status?: string;
  observacoes?: string;
  room_name?: string;
}
interface AgendamentoAdminAPIItem { // Como os dados vêm da API de agendamentos para admin
  id_agendamento: number | string;
  data_agendada: string;
  disciplina?: string; 
  aluno?: string; 
  monitor_nome?: string; 
  status?: string;
  observacoes?: string; 
  room_name?: string;
}
interface StatusResumoAdminItem { // Status de todos os agendamentos
  status: string;
  quantidade: number;
}

const getChartColors = (numColors: number): string[] => {
  const baseColors = [
    'rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(255, 206, 86, 0.7)', 
    'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
    'rgba(201, 203, 207, 0.7)' 
  ];
  const colors: string[] = [];
  for (let i = 0; i < numColors; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

// =====================================================================================================================
// COMPONENTE: AdminMeetingsAside
// =====================================================================================================================
interface AdminMeetingsAsideProps {
  adminMeetings: AdminMeetingItem[];
  loadingAdminMeetings: boolean;
  errorAdminMeetings: string | null;
  // ALTERAÇÃO AQUI: De JSX.Element para React.ReactElement
  renderLoading: (text?: string) => React.ReactElement; 
  renderError: (message: string | null) => React.ReactElement;
  renderNoData: (message: string) => React.ReactElement;
}

function AdminMeetingsAside({ adminMeetings: initialAdminMeetings, loadingAdminMeetings, errorAdminMeetings, renderLoading, renderError, renderNoData }: AdminMeetingsAsideProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [filteredMeetings, setFilteredMeetings] = useState<AdminMeetingItem[]>([]);

  useEffect(() => {
    console.log("------------------------------------------");
    console.log("useEffect do AdminMeetingsAside ativado!");
    console.log("initialAdminMeetings recebido:", initialAdminMeetings);
    console.log("searchTerm atual:", searchTerm);
    console.log("statusFilter atual:", statusFilter);

    if (initialAdminMeetings && initialAdminMeetings.length > 0) {
      let currentFiltered = initialAdminMeetings;

      if (statusFilter !== 'TODOS') {
        console.log(`Aplicando filtro de status: ${statusFilter}`);
        currentFiltered = currentFiltered.filter(meeting => {
          const match = meeting.status === statusFilter;
          return match;
        });
        console.log("Após filtro de status, resultados:", currentFiltered.length);
      }

      if (searchTerm) {
        console.log(`Aplicando filtro de pesquisa por texto: "${searchTerm}"`);
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        currentFiltered = currentFiltered.filter(meeting => {
          const match = 
            meeting.disciplina.toLowerCase().includes(lowerCaseSearchTerm) ||
            meeting.monitor_nome?.toLowerCase().includes(lowerCaseSearchTerm) ||
            meeting.aluno_nome?.toLowerCase().includes(lowerCaseSearchTerm) ||
            meeting.observacoes?.toLowerCase().includes(lowerCaseSearchTerm);
          return match;
        });
        console.log("Após filtro de texto, resultados:", currentFiltered.length);
      }

      setFilteredMeetings(currentFiltered);
      console.log("FilteredMeetings final:", currentFiltered.length, currentFiltered);
    } else {
      setFilteredMeetings([]);
      console.log("initialAdminMeetings está vazio ou nulo. Nenhum agendamento para filtrar.");
    }
    console.log("------------------------------------------");
  }, [searchTerm, statusFilter, initialAdminMeetings]);

  return (
    <aside className="lg:col-span-1 bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border">
      <div className="flex items-center mb-5">
        <CalendarDays className="w-6 h-6 mr-3 text-teal-500" />
        <h2 className="text-xl font-semibold">Todos Agendamentos ({filteredMeetings.length})</h2> 
      </div>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Pesquisar agendamentos..."
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
        {loadingAdminMeetings && renderLoading("Carregando todos agendamentos...")}
        {errorAdminMeetings && renderError(errorAdminMeetings)}
        
        {!loadingAdminMeetings && !errorAdminMeetings && initialAdminMeetings.length === 0 && renderNoData("Nenhum agendamento no sistema.")}

        {!loadingAdminMeetings && !errorAdminMeetings && initialAdminMeetings.length > 0 && filteredMeetings.length === 0 && (searchTerm || statusFilter !== 'TODOS') && (
            renderNoData("Nenhum agendamento encontrado com os filtros aplicados.")
        )}

        {filteredMeetings.length > 0 && (
          <ul className="divide-y dark:divide-gray-700">
            {filteredMeetings.map((meeting) => (
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"> {meeting.date} </p>
                {meeting.monitor_nome && ( <p className="text-xs text-gray-500 mt-0.5"> Monitor(a): {meeting.monitor_nome} </p> )}
                {meeting.aluno_nome && ( <p className="text-xs text-gray-500 mt-0.5"> Aluno(a): {meeting.aluno_nome} </p> )}
                {meeting.observacoes && ( <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 italic"> Obs: {meeting.observacoes} </p> )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-8 text-center">
        <Link href="/admin/monitoria" className="btn-primary w-full text-sm"> Gerenciar Monitorias (Admin) </Link>
      </div>
    </aside>
  );
}
// =====================================================================================================================
// FIM DO COMPONENTE AdminMeetingsAside
// =====================================================================================================================


export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const typedUser = user as TipoUserDoAuthContext | null;

  const adminPerformanceChartRef = useRef<HTMLCanvasElement | null>(null);
  const adminPerformanceChartInstanceRef = useRef<Chart<'bar'> | null>(null);
  const [adminPerformanceData, setAdminPerformanceData] = useState<AdminPerformanceItem[]>([]);
  const [adminUserName, setAdminUserName] = useState<string>('');
  const [loadingAdminPerformance, setLoadingAdminPerformance] = useState(true);
  const [errorAdminPerformance, setErrorAdminPerformance] = useState<string | null>(null);

  const adminStatusChartRef = useRef<HTMLCanvasElement | null>(null);
  const adminStatusChartInstanceRef = useRef<Chart<'doughnut'> | null>(null);
  const [adminStatusResumo, setAdminStatusResumo] = useState<StatusResumoAdminItem[]>([]);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [errorAdminStatus, setErrorAdminStatus] = useState<string | null>(null);

  const [adminMeetings, setAdminMeetings] = useState<AdminMeetingItem[]>([]);
  const [loadingAdminMeetings, setLoadingAdminMeetings] = useState(true);
  const [errorAdminMeetings, setErrorAdminMeetings] = useState<string | null>(null);

  useEffect(() => {
    if (!typedUser || typedUser.role !== 'admin') {
        setLoadingAdminPerformance(false);
        if(typedUser && typedUser.role !== 'admin') setErrorAdminPerformance("Acesso restrito ao dashboard de administrador.");
        return;
    }
    async function fetchAdminPerformanceData() {
      setLoadingAdminPerformance(true);
      setErrorAdminPerformance(null);
      try {
        const response = await fetch("/api/dashboard/admin-performance");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({error: "Erro desconhecido"}));
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const { userName: fetchedUserName, data: fetchedData } = await response.json();
        if (!Array.isArray(fetchedData)) {
          throw new Error("Formato de dados inesperado da API de desempenho (admin).");
        }
        setAdminPerformanceData(fetchedData as AdminPerformanceItem[]);
        setAdminUserName(fetchedUserName || typedUser?.nome || 'Admin');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorAdminPerformance(`Erro ao carregar desempenho geral: ${message}`);
      } finally {
        setLoadingAdminPerformance(false);
      }
    }
    fetchAdminPerformanceData();
    return () => { if (adminPerformanceChartInstanceRef.current) adminPerformanceChartInstanceRef.current.destroy(); };
  }, [typedUser]);

  useEffect(() => {
    if (adminPerformanceChartRef.current && adminPerformanceData.length > 0 && !loadingAdminPerformance && !errorAdminPerformance) {
      if (adminPerformanceChartInstanceRef.current) adminPerformanceChartInstanceRef.current.destroy();
      const ctx = adminPerformanceChartRef.current.getContext("2d");
      if (ctx) {
        adminPerformanceChartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: adminPerformanceData.map((item) => item.disciplina),
            datasets: [{
              label: "Média Geral de Notas",
              data: adminPerformanceData.map((item) => parseFloat(item.media_nota)),
              backgroundColor: getChartColors(adminPerformanceData.length),
              borderColor: getChartColors(adminPerformanceData.length).map(c=>c.replace('0.7','1')),
              borderWidth: 1, borderRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, min:0, max: 10, title: { display: true, text: "Nota Média" } }, x: { title: { display: true, text: "Disciplinas" } } },
            plugins: { legend: { display: false }, title: { display: true, text: 'Desempenho Médio Geral por Disciplina', font: { size: 14 }}}
          },
        });
      }
    } else if (adminPerformanceChartInstanceRef.current && (adminPerformanceData.length === 0 || errorAdminPerformance)) {
      adminPerformanceChartInstanceRef.current.destroy();
      adminPerformanceChartInstanceRef.current = null;
    }
  }, [adminPerformanceData, loadingAdminPerformance, errorAdminPerformance]);

  const fetchAdminAgendamentos = useCallback(async () => {
    if (!typedUser || typedUser.role !== 'admin') return;
    setLoadingAdminMeetings(true);
    setErrorAdminMeetings(null);
    try {
      const response = await fetch(`/api/agendamentos?resumo=true`); 
      if (!response.ok) { 
          const errorData = await response.json().catch(() => ({ error: "Erro ao buscar todos os agendamentos" }));
          throw new Error(errorData.error || `Erro HTTP Agendamentos: ${response.status}`); 
      }
      const dados = await response.json();
      console.log('Dados recebidos para todos agendamentos (Admin/dashboard) da API:', dados);
      if (!Array.isArray(dados)) throw new Error("Formato inesperado (todos agendamentos).");
      
      const formatados: AdminMeetingItem[] = (dados as AgendamentoAdminAPIItem[]).map((item) => ({
        id: item.id_agendamento,
        date: new Date(item.data_agendada).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        disciplina: item.disciplina || "Não especificada",
        aluno_nome: item.aluno || "Não informado",
        monitor_nome: item.monitor_nome || "Não informado",
        status: item.status || "Não informado", 
        observacoes: item.observacoes,
        room_name: item.room_name
      })).sort((a,b) => {
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split(', ');
            const dateParts = parts[0].split('/');
            let year = parseInt(dateParts[2]);
            if (year < 100) year += 2000; 
            
            return new Date(year, parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), 
                            parseInt(parts[1].split(':')[0]), parseInt(parts[1].split(':')[1])).getTime();
          };
          return parseDate(b.date) - parseDate(a.date);
      });
      setAdminMeetings(formatados);
      console.log('Dados formatados e setados em adminMeetings (Admin/dashboard):', formatados);
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorAdminMeetings(`Falha ao carregar todos agendamentos: ${message}.`);
    } 
    finally { setLoadingAdminMeetings(false); }
  }, [typedUser]);

  useEffect(() => { if (typedUser && typedUser.role === 'admin') fetchAdminAgendamentos(); }, [fetchAdminAgendamentos, typedUser]);

  const fetchAdminStatusResumo = useCallback(async () => {
    if (!typedUser || typedUser.role !== 'admin') return;
    setLoadingAdminStatus(true);
    setErrorAdminStatus(null);
    try {
      const response = await fetch(`/api/agendamentos?resumo=status`);
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({ error: "Erro ao buscar resumo de status geral" }));
        throw new Error(errorData.error || `Erro HTTP Status: ${response.status}`); 
      }
      const data = await response.json();
      console.log('Dados recebidos para status geral (Admin/dashboard):', data);
      if (!Array.isArray(data)) throw new Error("Formato inesperado (status geral).");
      setAdminStatusResumo(data as StatusResumoAdminItem[]);
    } catch (err: unknown) { 
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorAdminStatus(`Falha ao carregar resumo de status geral: ${message}.`);
    } 
    finally { setLoadingAdminStatus(false); }
  }, [typedUser]);

  useEffect(() => { 
    if (typedUser && typedUser.role === 'admin') fetchAdminStatusResumo();
    return () => { if (adminStatusChartInstanceRef.current) adminStatusChartInstanceRef.current.destroy(); };
  }, [fetchAdminStatusResumo, typedUser]);

    useEffect(() => {
    if (adminStatusResumo.length > 0 && adminStatusChartRef.current && !loadingAdminStatus && !errorAdminStatus) {
        if (adminStatusChartInstanceRef.current) adminStatusChartInstanceRef.current.destroy();
        const ctx = adminStatusChartRef.current.getContext("2d");
        if (ctx) {
            adminStatusChartInstanceRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: adminStatusResumo.map((item) => item.status),
                datasets: [{
                label: "Total por Status",
                data: adminStatusResumo.map((item) => item.quantidade),
                backgroundColor: getChartColors(adminStatusResumo.length),
                borderColor: '#ffffff', borderWidth: 2,
                }],
            },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'bottom', labels: { padding: 15, boxWidth: 12, font: {size: 12} } },
                    title: { display: true, text: "Distribuição Geral de Status das Monitorias", font:{size:14} }
                } 
            },
            });
        }
    } else if (adminStatusChartInstanceRef.current && (adminStatusResumo.length === 0 || errorAdminStatus)) {
        adminStatusChartInstanceRef.current.destroy();
        adminStatusChartInstanceRef.current = null;
    }
  }, [adminStatusResumo, loadingAdminStatus, errorAdminStatus]);

  const totalMonitoriasAdmin = adminStatusResumo.reduce((sum, item) => sum + item.quantidade, 0);

  const renderLoading = (text: string = "Carregando...") => ( <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500 dark:text-gray-400"> <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500 dark:text-blue-400" /> <p>{text}</p> </div> );
  const renderError = (message: string | null) => ( <div className="flex flex-col items-center justify-center h-full py-10 text-red-600 dark:text-red-400"> <AlertTriangle className="w-8 h-8 mb-2" /> <p className="text-center px-4">{message || "Ocorreu um erro."}</p> </div> );
  const renderNoData = (message: string) => ( <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500 dark:text-gray-400"> <ListChecks className="w-8 h-8 mb-2" /> <p className="text-center px-4">{message}</p> </div> );

  if (authLoading) { return ( <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 items-center justify-center"> <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" /> </div> ); }
  if (!typedUser) { return ( <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900"><Navbar /> <main className="flex-1 p-6 mt-16 flex flex-col items-center justify-center text-center"><AlertTriangle className="mx-auto h-16 w-16 text-orange-400" /><h1 className="mt-4 text-2xl font-bold">Acesso Negado</h1><p className="mt-2">Você precisa estar logado.</p><Link href="/login" className="mt-6 btn-primary">Ir para Login</Link></main></div> ); }
  if (typedUser.role !== 'admin') { return ( <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900"><Navbar /> <main className="flex-1 p-6 mt-16 flex flex-col items-center justify-center text-center"><AlertTriangle className="mx-auto h-16 w-16 text-orange-400" /><h1 className="mt-4 text-2xl font-bold">Acesso Restrito</h1><p className="mt-2">Esta página é para administradores.</p><Link href="/" className="mt-6 btn-primary">Voltar para Home</Link></main></div> ); }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar/>
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto mt-16">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Dashboard do Administrador
            {adminUserName && ( <span className="text-blue-600 dark:text-blue-400">: {adminUserName}</span> )}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1"> Visão geral do sistema de monitorias. </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <section className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border">
              <div className="flex items-center mb-4"> <BarChart3 className="w-6 h-6 mr-3 text-indigo-600" /> <h2 className="text-xl font-semibold">Desempenho Geral por Disciplina</h2> </div>
              <div className="h-72 sm:h-80 relative">
                {loadingAdminPerformance && renderLoading("Carregando desempenho geral...")}
                {errorAdminPerformance && renderError(errorAdminPerformance)}
                {!loadingAdminPerformance && !errorAdminPerformance && adminPerformanceData.length === 0 && renderNoData("Nenhum dado de desempenho geral encontrado.")}
                <canvas ref={adminPerformanceChartRef} style={{ display: loadingAdminPerformance || errorAdminPerformance || adminPerformanceData.length === 0 ? 'none' : 'block' }}></canvas>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border">
              <div className="flex items-center mb-4"> <PieChart className="w-6 h-6 mr-3 text-pink-500" /> <h2 className="text-xl font-semibold"> Status Geral das Monitorias ({totalMonitoriasAdmin}) </h2> </div>
              <div className="h-72 sm:h-80 relative">
                {loadingAdminStatus && renderLoading("Carregando status geral...")}
                {errorAdminStatus && renderError(errorAdminStatus)}
                {!loadingAdminStatus && !errorAdminStatus && adminStatusResumo.length === 0 && renderNoData("Nenhum dado de status geral para exibir.")}
                <canvas ref={adminStatusChartRef} style={{ display: loadingAdminStatus || errorAdminStatus || adminStatusResumo.length === 0 ? 'none' : 'block' }}></canvas>
              </div>
            </section>
          </div>

          <AdminMeetingsAside 
            adminMeetings={adminMeetings}
            loadingAdminMeetings={loadingAdminMeetings}
            errorAdminMeetings={errorAdminMeetings}
            renderLoading={renderLoading}
            renderError={renderError}
            renderNoData={renderNoData}
          />

        </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/cadastro" className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Users className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-semibold">Gerenciar Usuários</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Cadastrar, editar e remover usuários (alunos, monitores, administradores).</p>
            </Link>
            <Link href="/admin/feedbacks" className="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-shadow border">
                   <div className="flex items-center text-green-600 dark:text-green-400">
                    <BookOpen className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-semibold">Visualizar Feedbacks</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Acompanhar e responder aos feedbacks dos alunos sobre as monitorias.</p>
            </Link>
        </div>
      </main>
    </div>
  );
}