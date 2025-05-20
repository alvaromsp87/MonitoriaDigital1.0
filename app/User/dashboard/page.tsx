"use client"; // Indica que este é um componente cliente (React)
import Navbar from '../../components/Navbar'; // Caminho correto para Navbar
import { useEffect, useRef } from "react"; // Importa hooks necessários do React
import Chart from "chart.js/auto"; // Importa o Chart.js para criação de gráficos

export default function Dashboard() {
  const userType: 'admin' | 'monitor' | 'student' = 'student'; // Defina corretamente o tipo de usuário
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
            labels: ["I", "R", "B", "MB"], // Rótulos no eixo X
            datasets: [
              {
                label: "Desempenho (%)", // Rótulo do conjunto de dados
                data: [80, 70, 85, 60, 90, 30], // Valores para o gráfico
                backgroundColor: ["#3b82f6", "#10b981", "#facc15", "#ef4444"], // Cores de fundo das barras
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
      <Navbar userType={userType} /> {/* Passando a prop userType corretamente */}
      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Conteúdo Principal */}
        <div className="flex-1 p-10">
          {/* Título da página */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Bem-vindo ao Dashboard</h2>

          {/* Layout em grid para exibir dois cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card da Agenda */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Agenda de Monitorias</h5>
              {/* Placeholder para o calendário de monitorias */}
              <div className="flex justify-center items-center bg-gray-100 border h-52 text-gray-500 text-lg">
                Calendário Placeholder
              </div>
            </div>

            {/* Card do gráfico de desempenho */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h5 className="text-lg font-semibold mb-4">Desempenho dos Alunos</h5>
              <div className="h-52">
                {/* Referência para o canvas onde o gráfico será desenhado */}
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
