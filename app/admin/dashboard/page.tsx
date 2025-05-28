"use client";

import Navbar from '../../components/Navbar';
import React, { useEffect, useRef, useState, useCallback } from "react"; // Adicionado useCallback
import Chart from "chart.js/auto";
// import CalendarioAgendamento from '@/app/components/calendarioAgendamento'; // Removida a importação

// Interfaces
interface Meeting {
  id: number; 
  date: string;
  disciplina: string;
}

interface AgendamentoAPIItem {
  id_agendamento: number; 
  data_agendada: string;
  disciplina?: string; 
}

interface StatusResumoItem {
  status: string;
  quantidade: number;
}

interface AdminPerformanceItem {
  disciplina: string;
  media_nota: string; 
}

export default function AdminDashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'admin';

  const performanceChartRef = useRef<HTMLCanvasElement | null>(null);
  const performanceChartInstanceRef = useRef<Chart | null>(null);
  const [performanceLabels, setPerformanceLabels] = useState<string[]>([]);
  const [performanceMedias, setPerformanceMedias] = useState<number[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const [errorPerformance, setErrorPerformance] = useState<string | null>(null);

  const statusChartRef = useRef<HTMLCanvasElement | null>(null);
  const statusChartInstanceRef = useRef<Chart | null>(null);
  const [statusResumo, setStatusResumo] = useState<StatusResumoItem[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [errorMeetings, setErrorMeetings] = useState<string | null>(null);

  // useEffect para buscar dados de desempenho do administrador
  useEffect(() => {
    async function fetchAdminPerformanceData() {
      setLoadingPerformance(true);
      setErrorPerformance(null);
      try {
        const response = await fetch("/api/dashboard/admin-performance");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const { userName: fetchedUserName, data: fetchedData } = await response.json();
        if (!Array.isArray(fetchedData)) {
          throw new Error("Formato de dados inesperado da API de desempenho.");
        }
        const typedFetchedData = fetchedData as AdminPerformanceItem[];
        setPerformanceLabels(typedFetchedData.map((item) => item.disciplina));
        setPerformanceMedias(typedFetchedData.map((item) => parseFloat(item.media_nota)));
        setUserName(fetchedUserName);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorPerformance(`Erro ao carregar dados de desempenho: ${message}`);
        console.error("Erro ao carregar dados do dashboard do administrador:", err);
      } finally {
        setLoadingPerformance(false);
      }
    }
    fetchAdminPerformanceData();
     return () => {
      if (performanceChartInstanceRef.current) {
        performanceChartInstanceRef.current.destroy();
      }
    };
  }, []);

  // useEffect para renderizar o gráfico de desempenho
  useEffect(() => {
    if (performanceChartRef.current && performanceLabels.length > 0 && !loadingPerformance && !errorPerformance) {
      if (performanceChartInstanceRef.current) {
        performanceChartInstanceRef.current.destroy();
      }
      const ctx = performanceChartRef.current.getContext("2d");
      if (ctx) {
        const colors = ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'];
        const backgroundColors = performanceMedias.map((_, index: number) => colors[index % colors.length]);
        const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));
        performanceChartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: performanceLabels,
            datasets: [{
              label: "Média da Nota",
              data: performanceMedias,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, min: 0, max: 10, title: { display: true, text: "Média da Nota" } }, x: { title: { display: true, text: "Disciplinas" } } },
            plugins: { legend: { display: false }, title: { display: true, text: 'Média de Desempenho por Disciplina (Geral)', font: { size: 16, weight: 'bold'}}}
          },
        });
      }
    } else if (performanceLabels.length === 0 && !loadingPerformance && !errorPerformance) {
        if (performanceChartInstanceRef.current) {
            performanceChartInstanceRef.current.destroy();
            performanceChartInstanceRef.current = null;
        }
    }
  }, [performanceLabels, performanceMedias, loadingPerformance, errorPerformance]);

  // useEffect para buscar lista de agendamentos
  useEffect(() => {
    const fetchAgendamentos = async () => {
      setLoadingMeetings(true);
      setErrorMeetings(null);
      try {
        const response = await fetch(`/api/agendamentos?resumo=true`); // Endpoint precisa ser implementado
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Erro ao buscar agendamentos" }));
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const dados = await response.json();
        if (!Array.isArray(dados)) {
          throw new Error("Formato de dados inesperado da API de agendamentos (lista).");
        }
        const formatados: Meeting[] = (dados as AgendamentoAPIItem[]).map((item) => ({
          id: item.id_agendamento,
          date: new Date(item.data_agendada).toLocaleString(),
          disciplina: item.disciplina || "Desconhecida",
        }));
        setMeetings(formatados);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorMeetings(`Não foi possível carregar a lista de agendamentos: ${message}. Verifique se a API está implementada.`);
        console.error("Erro ao buscar agendamentos (lista):", err);
      } finally {
        setLoadingMeetings(false);
      }
    };
    fetchAgendamentos();
  }, []);

  // useEffect para buscar resumo de status
  const fetchStatusResumo = useCallback(async () => { // Envolvido em useCallback
    setLoadingStatus(true);
    setErrorStatus(null);
    try {
      const response = await fetch('/api/agendamentos?resumo=status'); // Endpoint precisa ser implementado
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro ao buscar resumo de status" }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de dados inesperado da API de resumo de status.");
      }
      setStatusResumo(data as StatusResumoItem[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorStatus(`Não foi possível carregar o resumo de status: ${message}. Verifique se a API está implementada.`);
      console.error('Erro ao buscar resumo por status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []); // useCallback com array de dependências vazio

  useEffect(() => {
    fetchStatusResumo();
     return () => {
      if (statusChartInstanceRef.current) {
        statusChartInstanceRef.current.destroy();
      }
    };
  }, [fetchStatusResumo]); // Adicionado fetchStatusResumo às dependências

  // useEffect para renderizar o gráfico de status (doughnut)
  useEffect(() => {
    if (statusResumo.length > 0 && statusChartRef.current && !loadingStatus && !errorStatus) {
      if (statusChartInstanceRef.current) {
        statusChartInstanceRef.current.destroy();
      }
      const ctx = statusChartRef.current.getContext("2d");
      if (ctx) {
        statusChartInstanceRef.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: statusResumo.map((item) => item.status),
            datasets: [{
              label: "Total por Status",
              data: statusResumo.map((item) => item.quantidade),
              backgroundColor: ["#3b82f6", "#f87171", "#10b981", "#facc15", "#a78bfa"], 
            }],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { title: {display: true, text: "Distribuição de Status"}} },
        });
      }
    } else if (statusResumo.length === 0 && !loadingStatus && !errorStatus) {
        if (statusChartInstanceRef.current) {
            statusChartInstanceRef.current.destroy();
            statusChartInstanceRef.current = null;
        }
    }
  }, [statusResumo, loadingStatus, errorStatus]);

  const totalMonitorias = statusResumo.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <div className="flex">
      <Navbar userType={userType} />
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex-1 p-10">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-8 text-center">
            Bem-vindo{userName ? ` ${userName}` : ''} ao Dashboard do Administrador!
          </h2>

          {/* A grade agora terá 3 itens, então eles podem se rearranjar. 
              Ou você pode querer md:grid-cols-3 se tiver mais um card ou ajustar o layout.
              Por enquanto, deixarei md:grid-cols-2 e o último card ocupará uma nova linha ou expandirá.
           */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card do Gráfico de Desempenho Geral */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Desempenho Geral dos Alunos</h5>
              <div className="h-64">
                {loadingPerformance && <p className="text-center text-gray-500 pt-10">Carregando desempenho...</p>}
                {errorPerformance && <p className="text-center text-red-500 pt-10">{errorPerformance}</p>}
                {!loadingPerformance && !errorPerformance && performanceLabels.length === 0 && <p className="text-center text-gray-500 pt-10">Nenhum dado de desempenho encontrado.</p>}
                <canvas ref={performanceChartRef}></canvas>
              </div>
            </div>

            {/* Card do Gráfico de Status das Monitorias */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">
                Status das Monitorias ({totalMonitorias} no total)
              </h5>
              <div className="h-64">
                {loadingStatus && <p className="text-center text-gray-500 pt-10">Carregando status...</p>}
                {errorStatus && <p className="text-center text-red-500 pt-10">{errorStatus}</p>}
                {!loadingStatus && !errorStatus && statusResumo.length === 0 && <p className="text-center text-gray-500 pt-10">Nenhum dado de status encontrado. Verifique a API.</p>}
                <canvas ref={statusChartRef}></canvas>
              </div>
            </div>
            
            {/* Card da Lista de Próximas Monitorias */}
            {/* Este card pode ocupar a largura total na próxima linha se for o terceiro em um grid de 2 colunas,
                ou você pode ajustar para md:col-span-2 se quiser que ele seja mais largo.
                Ou, se adicionar outro card, pode voltar a um layout 2x2.
             */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md md:col-span-2"> {/* Exemplo: fazendo ocupar 2 colunas */}
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Próximas Monitorias (Lista)</h5>
              <div className="max-h-64 overflow-y-auto">
                {loadingMeetings && <p className="text-[var(--muted-foreground)] text-sm">Carregando agendamentos...</p>}
                {errorMeetings && <p className="text-red-500 text-sm">{errorMeetings}</p>}
                {!loadingMeetings && !errorMeetings && meetings.length === 0 && (
                  <p className="text-[var(--muted-foreground)] text-sm">Nenhuma reunião agendada. Verifique a API.</p>
                )}
                {meetings.length > 0 && (
                  <ul className="space-y-3">
                    {meetings.map((meeting) => (
                      <li key={meeting.id} className="bg-gray-50 dark:bg-[var(--secondary)] p-3 rounded shadow-sm text-sm">
                        <p><strong>Data:</strong> {meeting.date}</p>
                        <p><strong>Disciplina:</strong> {meeting.disciplina}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}