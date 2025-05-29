"use client"; // Indica que este é um componente cliente (React)
import Navbar from '../../components/Navbar'; // Caminho correto para Navbar
import { useEffect, useRef, useState } from "react"; // Importa hooks necessários do React
import Chart from "chart.js/auto"; // Importa o Chart.js para criação de gráficos
import { getCookie } from 'cookies-next'; // Importa a função para ler cookies (instale se não tiver: npm install cookies-next)
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


export default function Dashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'student'; // Defina corretamente o tipo de usuário
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const [userName, setUserName] = useState<string>(''); // Estado para armazenar o nome do usuário
  const [chartLabels, setChartLabels] = useState<string[]>([]); // Para os labels do gráfico
  const [chartNotas, setChartNotas] = useState<number[]>([]); // Para os dados do gráfico

  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [error, setError] = useState<string | null>(null); // Estado de erro

  // useEffect para buscar dados da API e ler o cookie
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Lendo o cookie 'userName' para exibir no título
        const storedUserName = getCookie('userName');
        if (storedUserName) {
          setUserName(String(storedUserName));
        }

        // Fazendo a requisição para a API de conceitos do aluno
        const response = await axios.get<DashboardApiResponse | ErrorResponse>('/api/dashboard/conceitos');
        
        // Verifica se a resposta HTTP não foi bem-sucedida (status fora do range 2xx)
        if (response.status < 200 || response.status >= 300) {
            const errorData = response.data as ErrorResponse; // Força o tipo para a interface de erro
            throw new Error(errorData.error || errorData.message || `Erro HTTP: ${response.status}`);
        }

        // Se a resposta for bem-sucedida, assume que é DashboardApiResponse
        const { userName: apiUserName, data: fetchedData } = response.data as DashboardApiResponse;

        // Se o nome vier da API e for mais recente, pode usar (opcional)
        if (apiUserName && apiUserName !== userName) {
            setUserName(apiUserName);
        }

        if (!Array.isArray(fetchedData)) {
            throw new Error("Formato de dados inesperado da API: 'data' não é um array.");
        }

        const labels = fetchedData.map(item => item.disciplina);
        const notas = fetchedData.map(item => item.nota);

        setChartLabels(labels);
        setChartNotas(notas);

      } catch (err: any) { // Mantém err: any para capturar erros de rede ou outros
        console.error("Erro ao carregar dados do dashboard:", err);
        // Tenta extrair a mensagem de erro de axios.response.data, ou do próprio erro
        setError(err.response?.data?.error || err.response?.data?.message || err.message || "Erro desconhecido ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Cleanup: destrói a instância do gráfico ao desmontar o componente
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []); // Executa apenas uma vez no carregamento

  // useEffect para criar/atualizar o gráfico quando os dados (labels, notas) mudam
  useEffect(() => {
    if (chartRef.current && chartLabels.length > 0) {
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
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Agenda de Monitorias</h5>
              <div className="flex justify-center items-center bg-gray-100 border h-52 text-gray-500 text-lg">
                Calendário Placeholder
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Desempenho dos Alunos</h5>
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
