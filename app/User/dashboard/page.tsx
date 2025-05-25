"use client";

import Navbar from '../../components/Navbar';
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

export default function Dashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'student';
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartNotas, setChartNotas] = useState<number[]>([]);
  const [userName, setUserName] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard/conceitos");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }

        const { userName: fetchedUserName, data: fetchedData } = await response.json();

        console.log("Dados recebidos da API:", { fetchedUserName, fetchedData });

        if (!Array.isArray(fetchedData)) {
          throw new Error("Formato de dados inesperado da API: 'data' não é um array.");
        }

        const labels = fetchedData.map((item: any) => item.disciplina);
        const notas = fetchedData.map((item: any) => item.nota);

        setChartLabels(labels);
        setChartNotas(notas);
        setUserName(fetchedUserName);

      } catch (err: any) {
        console.error("Erro ao carregar dados do dashboard:", err.message);
        setError(err.message || "Erro desconhecido ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);


  useEffect(() => {
    if (chartRef.current && chartLabels.length > 0) {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");
        if (ctx) {
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

            const backgroundColors = chartNotas.map((_: any, index: number) => colors[index % colors.length]);
            const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));

            chartInstanceRef.current = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: chartLabels,
                    datasets: [
                        {
                            label: "Nota",
                            data: chartNotas,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
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
                            max: 10,
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
                            display: false,
                        },
                        // Adiciona o título principal do gráfico aqui
                        title: {
                            display: true,
                            text: 'Desempenho', // Título do gráfico
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
              <h5 className="text-lg font-semibold mb-4">Desempenho</h5>
              <div className="h-52">
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
