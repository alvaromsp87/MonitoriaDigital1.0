"use client"; // Indica que este é um componente cliente (React)

import Navbar from '../../components/Navbar'; // Caminho correto para Navbar
import React, { useEffect, useRef, useState } from "react"; // Importa hooks necessários do React
import Chart from "chart.js/auto"; // Importa o Chart.js para criação de gráficos

export default function MonitorDashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'monitor'; // Defina corretamente o tipo de usuário como 'monitor'
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Estados para armazenar os dados do gráfico e o nome do usuário
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartNotas, setChartNotas] = useState<number[]>([]); // Renomeado para 'chartNotas'
  const [userName, setUserName] = useState<string>('');

  // Estados para controle de carregamento e erros
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect para buscar os dados da API quando o componente for montado
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Faz a requisição para a API do monitor
        const response = await fetch("/api/dashboard/monitor-performance");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        // Desestrutura a resposta para obter userName e o array de dados
        const { userName: fetchedUserName, data: fetchedData } = await response.json();

        console.log("Dados recebidos da API do Monitor:", { fetchedUserName, fetchedData });

        if (!Array.isArray(fetchedData)) {
          throw new Error("Formato de dados inesperado da API: 'data' não é um array.");
        }

        const labels = fetchedData.map((item: any) => item.disciplina);
        const notas = fetchedData.map((item: any) => parseFloat(item.nota)); // Pega a nota individual e converte para número

        setChartLabels(labels);
        setChartNotas(notas); // Atualiza o estado das notas
        setUserName(fetchedUserName); // Define o nome do monitor

      } catch (err: any) {
        console.error("Erro ao carregar dados do dashboard do monitor:", err.message);
        setError(err.message || "Erro desconhecido ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Cleanup: destrói a instância do gráfico quando o componente é desmontado
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []); // Array vazio: executa apenas na montagem do componente

  // useEffect para criar/atualizar o gráfico quando os dados mudam
  useEffect(() => {
    if (chartRef.current && chartLabels.length > 0) {
      // Destrói a instância anterior do gráfico, se existir
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        // Array de cores para as barras do gráfico
        const colors = [
          'rgba(255, 99, 132, 0.6)', // Vermelho
          'rgba(54, 162, 235, 0.6)', // Azul
          'rgba(255, 206, 86, 0.6)', // Amarelo
          'rgba(75, 192, 192, 0.6)', // Verde Água
          'rgba(153, 102, 255, 0.6)', // Roxo
          'rgba(255, 159, 64, 0.6)', // Laranja
          'rgba(199, 199, 199, 0.6)', // Cinza
          'rgba(83, 102, 255, 0.6)', // Azul Claro
          'rgba(255, 0, 0, 0.6)',    // Vermelho puro
          'rgba(0, 255, 0, 0.6)',    // Verde puro
          'rgba(0, 0, 255, 0.6)'     // Azul escuro
        ];

        // Mapeia as notas para as cores, ciclando pelas cores disponíveis
        const backgroundColors = chartNotas.map((_: any, index: number) => colors[index % colors.length]);
        const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));

        chartInstanceRef.current = new Chart(ctx, {
          type: "bar", // Tipo de gráfico (barras)
          data: {
            labels: chartLabels, // Rótulos do estado
            datasets: [
              {
                label: "Nota", // Rótulo do conjunto de dados
                data: chartNotas, // Valores do estado
                backgroundColor: backgroundColors, // Cores de fundo dinâmicas
                borderColor: borderColors,       // Bordas dinâmicas
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                min: 0,
                max: 10, // Escala de notas de 0 a 10
                ticks: {
                  stepSize: 1,
                },
                title: {
                  display: true,
                  text: "Nota",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Disciplinas",
                },
              },
            },
            plugins: {
              legend: {
                display: false, // Oculta a legenda padrão do dataset
              },
              title: { // Título principal do gráfico
                display: true,
                text: 'Meu Desempenho', // Título para o desempenho do próprio monitor
                color: '#333',
                font: {
                  size: 16,
                  weight: 'bold'
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += context.parsed.y;
                    }
                    return label;
                  }
                }
              }
            }
          },
        });
      }
    } else if (chartLabels.length === 0 && !loading && !error) {
        // Se não há dados, mas o carregamento terminou e não houve erro,
        // destruir o gráfico se ele existir para não mostrar um gráfico vazio
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null; // Limpa a referência
        }
    }
  }, [chartLabels, chartNotas, loading, error]); // Dependências do useEffect

  // Renderização condicional baseada no estado de carregamento e erro
  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg">Carregando dashboard do monitor...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600 text-lg">Erro: {error}</div>;
  }

  return (
    <div className="flex">
      <Navbar userType={userType} /> {/* Passando a prop userType */}
      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Conteúdo Principal */}
        <div className="flex-1 p-10">
          {/* Título da página com nome do monitor */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Bem-vindo{userName ? ` ${userName}` : ''} ao Dashboard do Monitor!
          </h2>

          {/* Layout em grid para exibir dois cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card da Agenda */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Agenda de Monitorias</h5>
              <div className="flex justify-center items-center bg-gray-100 border h-52 text-gray-500 text-lg">
                Calendário Placeholder
              </div>
            </div>

            {/* Card do gráfico de desempenho */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Desempenho</h5> {/* Título do card */}
              <div className="h-52">
                {/* Renderiza o gráfico se houver dados, senão mostra uma mensagem */}
                {chartLabels.length > 0 ? (
                  <canvas ref={chartRef}></canvas>
                ) : (
                  <p className="text-center text-gray-500 pt-10">Nenhuma nota encontrada para exibir no gráfico.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
