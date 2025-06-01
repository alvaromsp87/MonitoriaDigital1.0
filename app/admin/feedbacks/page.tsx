"use client"; // Declaração para o uso do Next.js com React (funcionalidade de "client-side")
import Navbar from '../../components/Navbar'; // Caminho correto para Navbar
import { useState } from "react"; // Importação do hook useState do React para gerenciar o estado

export default function Feedbacks() {

  // Estado para armazenar os feedbacks recebidos, agora com campo monitoria
  const [feedbacks, setFeedbacks] = useState([
    { id: "1", nome: "Aluno 1", monitoria: "PW 2", comentario: "Gostei muito da monitoria, ajudou bastante!", data: "2025-03-06", resposta: "" },
    { id: "2", nome: "Aluno 2", monitoria: "BD 2", comentario: "A monitoria poderia ter mais exemplos práticos.", data: "2025-03-05", resposta: "" },
  ]);

  // Estado para armazenar as respostas do administrador, associando o id do feedback com a resposta
  const [respostas, setRespostas] = useState<{ [key: string]: string }>({});
  const [isResponding, setIsResponding] = useState<{ [key: string]: boolean }>({}); // Estado para controle do processo de resposta

  // Função para manipular a mudança na resposta do administrador
  const handleRespostaChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setRespostas({ ...respostas, [id]: e.target.value }); // Atualiza a resposta associada ao feedback
  };

  // Função para enviar a resposta para um feedback
  const handleResponder = (id: string) => {
    if (!respostas[id]) return; // Impede envio se não houver resposta

    // Atualiza o feedback com a resposta fornecida pelo administrador
    setFeedbacks(feedbacks.map(feedback => 
      feedback.id === id ? { ...feedback, resposta: respostas[id] } : feedback
    ));
    setRespostas({ ...respostas, [id]: "" }); // Limpa o campo de resposta após o envio
    setIsResponding({ ...isResponding, [id]: false }); // Marca como não respondendo
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Navbar/>
      <div className="container mx-auto px-2 py-4 flex-1">
        <main className="flex-1 p-2 md:p-4">
          <h2 className="text-center text-2xl font-bold text-[var(--foreground)] mb-3">Feedbacks</h2>

          {/* Lista de Feedbacks Recebidos */}
          <div className="mt-2">
            <h3 className="text-lg md:text-xl font-semibold text-[var(--foreground)] mb-2">Feedbacks Recebidos</h3>
            <div className="space-y-2 md:space-y-3">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="bg-[var(--card)] p-3 rounded-lg shadow-soft border border-[var(--border)]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1 gap-1">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{feedback.nome}</p>
                      <span className="inline-block text-xs font-semibold bg-[var(--destaque)] bg-opacity-10 text-[var(--destaque)] rounded px-2 py-0.5 mt-1 mb-1">
                        Monitoria: {feedback.monitoria}
                      </span>
                    </div>
                    <p className="text-[var(--paragrafo)] text-xs md:text-sm mt-1 md:mt-0">{feedback.data}</p>
                  </div>
                  <p className="text-[var(--paragrafo)] mb-2 text-sm md:text-base">{feedback.comentario}</p>

                  {/* Exibe a resposta do administrador ou formulário para resposta */}
                  <div>
                    {feedback.resposta ? (
                      <div className="bg-[var(--accent)] bg-opacity-5 p-2 rounded text-sm text-[var(--foreground)]">
                        <strong>Resposta:</strong> {feedback.resposta}
                      </div>
                    ) : (
                      <form
                        className="flex flex-col gap-2 mt-1"
                        onSubmit={e => { e.preventDefault(); handleResponder(feedback.id); }}
                      >
                        <label className="block text-[var(--foreground)] font-medium text-sm">Responder</label>
                        <input
                          type="text"
                          value={respostas[feedback.id] || ""}
                          onChange={(e) => handleRespostaChange(feedback.id, e)}
                          className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--destaque)] focus:outline-none text-sm text-[var(--foreground)]"
                          placeholder="Digite sua resposta..."
                        />
                        <button
                          type="submit"
                          disabled={isResponding[feedback.id]}
                          className={`w-max self-end px-4 py-1.5 rounded transition text-sm font-semibold ${
                            isResponding[feedback.id] 
                              ? 'bg-[var(--secundario)]' 
                              : 'bg-[var(--botao)] hover:bg-[var(--botao-hover)] text-[var(--textoBotao)]'
                          }`}
                        >
                          {isResponding[feedback.id] ? 'Respondendo...' : 'Responder'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
