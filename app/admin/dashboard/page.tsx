"use client"; // Indica que este é um componente cliente (React)
import Navbar from '../../components/Navbar'; // Caminho correto para Navbar
import { useEffect, useRef } from "react"; // Importa hooks necessários do React
import Chart from "chart.js/auto"; // Importa o Chart.js para criação de gráficos
import CalendarioAgendamento from '@/app/components/calendarioAgendamento';

export default function Dashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'admin'; // Defina corretamente o tipo de usuário
  // Ref para o elemento canvas onde o gráfico será desenhado
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  
  // Ref para armazenar a instância do gráfico, para poder manipulá-lo depois (como destruir ou atualizar)
  const chartInstanceRef = useRef<Chart | null>(null); 

  // useEffect é usado para criar o gráfico quando o componente for montado
  useEffect(() => {
    // Verifica se já existe uma instância do gráfico e a destrói antes de criar uma nova
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Verifica se o canvas foi referenciado corretamente
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d"); // Obtém o contexto 2D para desenhar no canvas

      // Se o contexto for válido, cria a nova instância do gráfico
      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: "bar", // Tipo de gráfico (barras)
          data: {
            // Dados para o gráfico (rótulos e valores)
            labels: ["PW 2", "BD 2", "PAM", "APS", "DS 1", "SE"], // Rótulos no eixo X
            datasets: [
              {
                label: "Desempenho (%)", // Rótulo do conjunto de dados
                data: [80, 70, 85, 60, 90, 30], // Valores para o gráfico
                backgroundColor: ["#3b82f6", "#10b981", "#facc15", "#ef4444", "#8b5cf6", "#6b7280"], // Cores de fundo das barras
              },
            ],
          },
          options: {
            responsive: true, // O gráfico será responsivo (ajustará seu tamanho conforme a tela)
            maintainAspectRatio: false, // Desativa a manutenção da proporção ao redimensionar
            scales: {
              y: { beginAtZero: true }, // A escala do eixo Y começa do zero
            },
          },
        });
      }
    }

    // Cleanup (limpeza): ao desmontar o componente, destrói a instância do gráfico para evitar vazamentos de memória
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []); // O array vazio garante que o gráfico seja criado apenas uma vez, quando o componente for montado

  return (
    <div className="flex">
      <Navbar userType={userType} />
      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Conteúdo Principal */}
        <div className="flex-1 p-10 flex flex-col items-center justify-center">
          {/* Título da página */}
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6 text-center mt-4 md:mt-8">
            Bem-vindo ao Dashboard
          </h2>

          {/* Layout em grid para exibir dois cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Card da Agenda */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md flex flex-col items-center">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Agenda de Monitorias</h5>
              <div className="flex justify-center items-center bg-[var(--accent)] border border-[var(--border)] h-52 text-[var(--muted-foreground)] text-lg w-full rounded-md">
                Calendário Placeholder
              </div>
            </div>

            {/* Card do gráfico de desempenho */}
            <div className="bg-[var(--card)] p-6 rounded-lg shadow-md flex flex-col items-center">
              <h5 className="text-lg font-semibold mb-4 text-[var(--card-foreground)]">Desempenho dos Alunos</h5>
              <div className="h-52 w-full flex justify-center items-center">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
