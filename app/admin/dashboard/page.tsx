"use client";
import Navbar from '../../components/Navbar';
import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

interface Meeting {
  id: number;
  date: string;
  disciplina: string;
}

interface AgendamentoAPI {
  id_agendamento: number;
  data_agendada: string;
  disciplina?: string;
}

interface StatusResumo {
  status: string;
  quantidade: number;
}

export default function Dashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'admin';
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const statusChartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const statusChartInstanceRef = useRef<Chart | null>(null);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [statusResumo, setStatusResumo] = useState<StatusResumo[]>([]);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const response = await fetch(`/api/agendamentos?resumo=true`);
        const dados = await response.json();

        const formatados: Meeting[] = dados.map((item: AgendamentoAPI) => ({
  id: item.id_agendamento,
  date: new Date(item.data_agendada).toLocaleString(),
  disciplina: item.disciplina || "Desconhecida",
}));


        setMeetings(formatados);
      } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
      }
    };

    fetchAgendamentos();
  }, []);

  useEffect(() => {
    const fetchStatusResumo = async () => {
      try {
        const response = await fetch('/api/agendamentos?resumo=status');
        const data = await response.json();
        setStatusResumo(data);
      } catch (error) {
        console.error('Erro ao buscar resumo por status:', error);
      }
    };

    fetchStatusResumo();
  }, []);

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["PW 2", "BD 2", "PAM", "APS", "DS 1", "SE"],
            datasets: [
              {
                label: "Desempenho (%)",
                data: [80, 70, 85, 60, 90, 30],
                backgroundColor: ["#3b82f6", "#10b981", "#facc15", "#ef4444", "#8b5cf6", "#6b7280"],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!statusResumo.length || !statusChartRef.current) return;

    const ctx = statusChartRef.current.getContext("2d");
    if (!ctx) return;

    if (statusChartInstanceRef.current) {
      statusChartInstanceRef.current.destroy();
    }

    statusChartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: statusResumo.map((item) => item.status),
        datasets: [
          {
            label: "Total por Status",
            data: statusResumo.map((item) => item.quantidade),
            backgroundColor: ["#3b82f6", "#f87171", "#10b981"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    return () => {
      if (statusChartInstanceRef.current) {
        statusChartInstanceRef.current.destroy();
      }
    };
  }, [statusResumo]);

  const totalMonitorias = statusResumo.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <div className="flex">
      <Navbar userType={userType} />
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex-1 p-10 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6 text-center mt-4 md:mt-8">
            Bem-vindo ao Dashboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
<<<<<<< Updated upstream
            {/* Card da Agenda */}

            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md flex flex-col items-center">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Agenda de Monitorias</h5>
              <div className="flex justify-center items-center bg-[var(--accent)] border border-[var(--border)] h-52 text-[var(--muted-foreground)] text-lg w-full rounded-md">
                Calendário Placeholder


=======
            {/* Agenda */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md flex flex-col items-center w-full">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Agenda de Monitorias</h5>
              <div className="flex flex-col gap-4 bg-[var(--accent)] border border-[var(--border)] p-4 w-full rounded-md max-h-52 overflow-auto">
                {meetings.length === 0 ? (
                  <p className="text-[var(--muted-foreground)] text-sm">Nenhuma reunião agendada.</p>
                ) : (
                  <ul className="space-y-2 w-full">
                    {meetings.map((meeting) => (
                      <li key={meeting.id} className="bg-white p-3 rounded shadow-sm text-sm">
                        <p><strong>📆 Data:</strong> {meeting.date}</p>
                        <p><strong>📚 Disciplina:</strong> {meeting.disciplina}</p>
                      </li>
                    ))}
                  </ul>
                )}
>>>>>>> Stashed changes
              </div>
            </div>

            {/* Gráfico Desempenho */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md flex flex-col items-center w-full">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Desempenho dos Alunos</h5>
              <div className="h-52 w-full flex justify-center items-center">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* Gráfico de Status */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md flex flex-col items-center w-full">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">
                Status das Monitorias ({totalMonitorias} total)
              </h5>
              <div className="h-52 w-full flex justify-center items-center">
                <canvas ref={statusChartRef}></canvas>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
