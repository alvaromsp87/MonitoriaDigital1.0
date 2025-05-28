"use client";

import Navbar from '../../components/Navbar';
import React, { useEffect, useRef, useState, useCallback } from "react";
import Chart from "chart.js/auto";

// Interfaces para os dados
interface MonitorPerformanceItem {
  disciplina: string;
  nota: number; // API para monitor-performance retorna 'nota'
}

interface Meeting {
  id: number | string;
  date: string;
  disciplina: string;
  // Adicione outros campos que sua API /api/agendamentos?resumo=true possa retornar para a lista
}

interface AgendamentoAPIItem {
  id_agendamento: number | string;
  data_agendada: string;
  disciplina?: string;
  // Outros campos relevantes da sua API de agendamentos
}

interface StatusResumoItem {
  status: string;
  quantidade: number;
}

export default function MonitorDashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'monitor';

  // Estados e Refs para o Gráfico de Desempenho Pessoal do Monitor
  const monitorPerformanceChartRef = useRef<HTMLCanvasElement | null>(null);
  const monitorPerformanceChartInstanceRef = useRef<Chart | null>(null);
  const [monitorPerformanceLabels, setMonitorPerformanceLabels] = useState<string[]>([]);
  const [monitorPerformanceNotas, setMonitorPerformanceNotas] = useState<number[]>([]);
  const [monitorUserName, setMonitorUserName] = useState<string>('');
  const [loadingMonitorPerformance, setLoadingMonitorPerformance] = useState(true);
  const [errorMonitorPerformance, setErrorMonitorPerformance] = useState<string | null>(null);

  // Estados e Refs para o Gráfico de Status de Monitorias
  const statusChartRef = useRef<HTMLCanvasElement | null>(null);
  const statusChartInstanceRef = useRef<Chart | null>(null);
  const [statusResumo, setStatusResumo] = useState<StatusResumoItem[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Estados para a Lista de Agendamentos (Monitorias do Monitor)
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [errorMeetings, setErrorMeetings] = useState<string | null>(null);

  // Fetch para Desempenho Pessoal do Monitor
  useEffect(() => {
    async function fetchMonitorPerformanceData() {
      setLoadingMonitorPerformance(true);
      setErrorMonitorPerformance(null);
      try {
        const response = await fetch("/api/dashboard/monitor-performance"); // API existente
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        const { userName: fetchedUserName, data: fetchedData } = await response.json();
        if (!Array.isArray(fetchedData)) {
          throw new Error("Formato de dados inesperado da API de desempenho do monitor.");
        }
        const typedFetchedData = fetchedData as MonitorPerformanceItem[];
        setMonitorPerformanceLabels(typedFetchedData.map((item) => item.disciplina));
        setMonitorPerformanceNotas(typedFetchedData.map((item) => item.nota)); // 'nota' como number
        setMonitorUserName(fetchedUserName);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorMonitorPerformance(`Erro ao carregar seu desempenho: ${message}`);
        console.error("Erro ao carregar dados do dashboard do monitor:", err);
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
  }, []);

  // Renderiza Gráfico de Desempenho Pessoal do Monitor
  useEffect(() => {
    if (monitorPerformanceChartRef.current && monitorPerformanceLabels.length > 0 && !loadingMonitorPerformance && !errorMonitorPerformance) {
      if (monitorPerformanceChartInstanceRef.current) {
        monitorPerformanceChartInstanceRef.current.destroy();
      }
      const ctx = monitorPerformanceChartRef.current.getContext("2d");
      if (ctx) {
        const colors = ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', /* ... mais cores ... */];
        const backgroundColors = monitorPerformanceNotas.map((_, index: number) => colors[index % colors.length]);
        const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));
        monitorPerformanceChartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: monitorPerformanceLabels,
            datasets: [{
              label: "Minha Nota",
              data: monitorPerformanceNotas,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, min: 0, max: 10, title: { display: true, text: "Nota" } }, x: { title: { display: true, text: "Disciplinas" } } },
            plugins: { legend: { display: false }, title: { display: true, text: 'Meu Desempenho Acadêmico', font: { size: 16, weight: 'bold' } } }
          },
        });
      }
    } else if (monitorPerformanceLabels.length === 0 && !loadingMonitorPerformance && !errorMonitorPerformance) {
        if (monitorPerformanceChartInstanceRef.current) {
            monitorPerformanceChartInstanceRef.current.destroy();
            monitorPerformanceChartInstanceRef.current = null;
        }
    }
  }, [monitorPerformanceLabels, monitorPerformanceNotas, loadingMonitorPerformance, errorMonitorPerformance]);

  // Fetch para Lista de Agendamentos (Monitorias do Monitor)
  const fetchAgendamentos = useCallback(async () => {
    setLoadingMeetings(true);
    setErrorMeetings(null);
    try {
      // !! IMPORTANTE: Este endpoint precisa ser implementado ou adaptado no backend !!
      // Idealmente, seria algo como /api/agendamentos?monitorId={idDoMonitorLogado}&resumo=true
      const response = await fetch(`/api/agendamentos?resumo=true`); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro ao buscar seus agendamentos" }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      const dados = await response.json();
      if (!Array.isArray(dados)) {
        throw new Error("Formato de dados inesperado da API de agendamentos.");
      }
      const formatados: Meeting[] = (dados as AgendamentoAPIItem[]).map((item) => ({
        id: item.id_agendamento,
        date: new Date(item.data_agendada).toLocaleString(),
        disciplina: item.disciplina || "Disciplina não informada",
      }));
      setMeetings(formatados);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorMeetings(`Não foi possível carregar seus agendamentos: ${message}. Verifique a API.`);
      console.error("Erro ao buscar agendamentos (monitor):", err);
    } finally {
      setLoadingMeetings(false);
    }
  }, []); // Adicionar dependências se houver (ex: ID do monitor se passado como prop)

  useEffect(() => {
    fetchAgendamentos();
  }, [fetchAgendamentos]);


  // Fetch para Resumo de Status das Monitorias
  const fetchStatusResumo = useCallback(async () => {
    setLoadingStatus(true);
    setErrorStatus(null);
    try {
      // !! IMPORTANTE: Este endpoint precisa ser implementado ou adaptado no backend !!
      // Poderia ser /api/agendamentos?monitorId={idDoMonitorLogado}&resumo=status
      const response = await fetch('/api/agendamentos?resumo=status');
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
      setErrorStatus(`Não foi possível carregar o resumo de status: ${message}. Verifique a API.`);
      console.error('Erro ao buscar resumo por status (monitor):', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []); // Adicionar dependências se houver

  useEffect(() => {
    fetchStatusResumo();
    return () => {
      if (statusChartInstanceRef.current) {
        statusChartInstanceRef.current.destroy();
      }
    };
  }, [fetchStatusResumo]);

  // Renderiza Gráfico de Status (Doughnut)
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
              backgroundColor: ["#3b82f6", "#10b981", "#f87171", "#facc15", "#a78bfa"],
            }],
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { title: {display: true, text: "Status das Minhas Monitorias"}} },
        });
      }
    } else if (statusResumo.length === 0 && !loadingStatus && !errorStatus) {
        if (statusChartInstanceRef.current) {
            statusChartInstanceRef.current.destroy();
            statusChartInstanceRef.current = null;
        }
    }
  }, [statusResumo, loadingStatus, errorStatus]);

  const totalMonitoriasAgendadas = meetings.length; // Ou pode vir de um resumo específico da API
  const totalMonitoriasPorStatus = statusResumo.reduce((sum, item) => sum + item.quantidade, 0);


  return (
    <div className="flex">
      <Navbar userType={userType} />
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex-1 p-10">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-8 text-center">
            Dashboard do Monitor{monitorUserName ? `: ${monitorUserName}` : ''}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card do Desempenho Pessoal do Monitor */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Meu Desempenho Acadêmico</h5>
              <div className="h-64">
                {loadingMonitorPerformance && <p className="text-center text-gray-500 pt-10">Carregando seu desempenho...</p>}
                {errorMonitorPerformance && <p className="text-center text-red-500 pt-10">{errorMonitorPerformance}</p>}
                {!loadingMonitorPerformance && !errorMonitorPerformance && monitorPerformanceLabels.length === 0 && <p className="text-center text-gray-500 pt-10">Nenhuma nota encontrada.</p>}
                <canvas ref={monitorPerformanceChartRef}></canvas>
              </div>
            </div>

            {/* Card do Gráfico de Status das Monitorias */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">
                Status das Minhas Monitorias ({totalMonitoriasPorStatus} no total) 
              </h5>
              <div className="h-64">
                {loadingStatus && <p className="text-center text-gray-500 pt-10">Carregando status...</p>}
                {errorStatus && <p className="text-center text-red-500 pt-10">{errorStatus}</p>}
                {!loadingStatus && !errorStatus && statusResumo.length === 0 && <p className="text-center text-gray-500 pt-10">Nenhum dado de status encontrado. Verifique a API.</p>}
                <canvas ref={statusChartRef}></canvas>
              </div>
            </div>
            
            {/* Card da Lista de Minhas Monitorias Agendadas */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md md:col-span-2"> {/* Ocupa duas colunas em telas médias */}
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Minhas Monitorias Agendadas ({totalMonitoriasAgendadas})</h5>
              <div className="max-h-80 overflow-y-auto"> {/* Aumentei a altura e mantive o scroll */}
                {loadingMeetings && <p className="text-[var(--muted-foreground)] text-sm">Carregando seus agendamentos...</p>}
                {errorMeetings && <p className="text-red-500 text-sm">{errorMeetings}</p>}
                {!loadingMeetings && !errorMeetings && meetings.length === 0 && (
                  <p className="text-[var(--muted-foreground)] text-sm">Nenhuma monitoria agendada para você. Verifique a API.</p>
                )}
                {meetings.length > 0 && (
                  <ul className="space-y-3">
                    {meetings.map((meeting) => (
                      <li key={meeting.id} className="bg-gray-50 dark:bg-[var(--secondary)] p-3 rounded shadow-sm text-sm">
                        <p><strong>Data:</strong> {meeting.date}</p>
                        <p><strong>Disciplina:</strong> {meeting.disciplina}</p>
                        {/* Adicionar mais detalhes se a API retornar, ex: alunos, status específico */}
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