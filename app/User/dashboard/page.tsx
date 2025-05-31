"use client"; // Indica que este é um componente cliente (React)
import Navbar from '../../components/Navbar'; // Caminho correto para Navbar
import { useEffect, useRef, useState } from "react"; // Importa hooks necessários do React
import Chart from "chart.js/auto"; // Importa o Chart.js para criação de gráficos
import { getCookie } from 'cookies-next'; // Importa a função para ler cookies
import axios from 'axios'; // Para fazer requisições HTTP

// Interfaces para os dados da API (resposta de SUCESSO)
interface Conceito {
  disciplina: string;
  nota: number;
}

interface DashboardApiResponse {
  userName: string;
  data: Conceito[];
}

// Interface para a resposta de ERRO da API
interface ErrorResponse {
  error?: string;
  message?: string;
}

// Interface para um item da lista de monitorias do aluno
interface StudentMeeting {
  id: number;
  date: string; // Data formatada
  disciplina: string;
  assunto: string;
  status: string;
}

export default function Dashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'student'; // Define corretamente o tipo de usuário
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const [userName, setUserName] = useState<string>('');
  const [chartLabels, setChartLabels] = useState<string[]>([]); // Para os labels do gráfico
  const [chartNotas, setChartNotas] = useState<number[]>([]); // Para os dados do gráfico

  const [meetings, setMeetings] = useState<StudentMeeting[]>([]); // Novo estado para a lista de monitorias
  const [loadingMeetings, setLoadingMeetings] = useState(true); // Estado de carregamento da lista
  const [errorMeetings, setErrorMeetings] = useState<string | null>(null); // Estado de erro da lista

  const [loading, setLoading] = useState(true); // Estado de carregamento geral do dashboard
  const [error, setError] = useState<string | null>(null); // Estado de erro geral do dashboard

  // useEffect principal para buscar TODOS os dados do dashboard
  useEffect(() => {
    async function fetchData() {
      setLoading(true); // Inicia carregamento geral
      setError(null);

      // --- Buscar dados de Desempenho (Gráfico) ---
      try {
        const storedUserName = getCookie('userName');
        if (storedUserName) {
          setUserName(String(storedUserName));
        }

        const response = await axios.get<DashboardApiResponse | ErrorResponse>('/api/dashboard/conceitos');
        
        if (response.status < 200 || response.status >= 300) {
            const errorData = response.data as ErrorResponse;
            throw new Error(errorData.error || errorData.message || `Erro HTTP: ${response.status}`);
        }

        const { userName: apiUserName, data: fetchedData } = response.data as DashboardApiResponse;

        if (apiUserName && apiUserName !== userName) {
            setUserName(apiUserName);
        }

        if (!Array.isArray(fetchedData)) {
            throw new Error("Formato de dados inesperado da API de desempenho: 'data' não é um array.");
        }

        setChartLabels(fetchedData.map(item => item.disciplina));
        setChartNotas(fetchedData.map(item => item.nota));

      } catch (err: any) {
        console.error("Erro ao carregar dados de desempenho do dashboard:", err);
        setError(err.response?.data?.error || err.response?.data?.message || err.message || "Erro desconhecido ao carregar desempenho.");
      } finally {
        // loading do desempenho pode ser separado ou combinado com o geral
      }

      // --- Buscar Lista de Próximas Monitorias ---
      setLoadingMeetings(true);
      setErrorMeetings(null);
      try {
        const meetingsResponse = await axios.get<StudentMeeting[] | ErrorResponse>('/api/agendamentos/student-meetings');
        
        if (meetingsResponse.status < 200 || meetingsResponse.status >= 300) {
            const errorData = meetingsResponse.data as ErrorResponse;
            throw new Error(errorData.error || errorData.message || `Erro HTTP: ${meetingsResponse.status}`);
        }

        if (!Array.isArray(meetingsResponse.data)) {
            throw new Error("Formato de dados inesperado da API de agendamentos: não é um array.");
        }
        setMeetings(meetingsResponse.data as StudentMeeting[]);

      } catch (err: any) {
        console.error("Erro ao carregar lista de monitorias:", err);
        setErrorMeetings(err.response?.data?.error || err.response?.data?.message || err.message || "Erro desconhecido ao carregar monitorias.");
      } finally {
        setLoadingMeetings(false); // Finaliza carregamento da lista
      }

      setLoading(false); // Finaliza carregamento geral do dashboard
    }
    
    fetchData();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // useEffect para criar/atualizar o gráfico de desempenho
  useEffect(() => {
    if (chartRef.current && chartLabels.length > 0 && !loading && !error) { // Verifica loading/error geral ou específico do gráfico
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        const colors = [
          'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(255, 0, 0, 0.6)',
          'rgba(0, 255, 0, 0.6)', 'rgba(0, 0, 255, 0.6)'
        ];
        const backgroundColors = chartNotas.map((_, index: number) => colors[index % colors.length]);
        const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));

        chartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: chartLabels,
            datasets: [{
              label: "Nota",
              data: chartNotas,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, min: 0, max: 10, title: { display: true, text: "Nota" } },
              x: { title: { display: true, text: "Disciplinas" } }
            },
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Meu Desempenho por Disciplina', font: { size: 16, weight: 'bold' } }
            }
          },
        });
      }
    } else if (chartLabels.length === 0 && !loading && !error) {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }
    }
  }, [chartLabels, chartNotas, loading, error]);


  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg">Carregando dados do dashboard...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600 text-lg">Erro: {error}</div>;
  }

  return (
    <div className="flex">
      <Navbar userType={userType} />
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex-1 p-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Bem-vindo{userName ? ` ${userName}` : ''} ao Dashboard!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card da Agenda de Monitorias (Agora, Lista de Próximas Monitorias) */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Minhas Monitorias</h5>
              <div className="max-h-64 overflow-y-auto"> {/* Adiciona scroll se a lista for longa */}
                {loadingMeetings && <p className="text-gray-500 text-sm">Carregando suas monitorias...</p>}
                {errorMeetings && <p className="text-red-500 text-sm">{errorMeetings}</p>}
                {!loadingMeetings && !errorMeetings && meetings.length === 0 && (
                  <p className="text-gray-500 text-sm">Nenhuma monitoria encontrada para você.</p>
                )}
                {meetings.length > 0 && (
                  <ul className="space-y-3">
                    {meetings.map((meeting) => (
                      <li key={meeting.id} className="bg-gray-50 p-3 rounded shadow-sm text-sm">
                        <p><strong>Data:</strong> {meeting.date}</p>
                        <p><strong>Disciplina:</strong> {meeting.disciplina}</p>
                        <p><strong>Assunto:</strong> {meeting.assunto}</p>
                        <p><strong>Status:</strong> {meeting.status}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Card do gráfico de desempenho */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Desempenho Acadêmico</h5>
              <div className="h-52">
                {chartLabels.length > 0 ? (
                  <canvas ref={chartRef}></canvas>
                ) : (
                  <p className="text-center text-gray-500 pt-10">Nenhuma nota encontrada para exibir.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
