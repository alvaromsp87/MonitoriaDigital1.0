"use client";
import Navbar from '../../components/Navbar';
import { useState } from "react";

type Turma = {
  id: string;
  disciplina: string;
  monitor: string;
  alunos: string[];
};

export default function CadastroMonitoria() {
  const userType: 'admin' | 'monitor' | 'student' = 'admin';
  const [formData, setFormData] = useState<{
    disciplina: string;
    monitorId: string;
    alunosIds: string[];
  }>({
    disciplina: "",
    monitorId: "",
    alunosIds: [],
  });

  // Dados simulados para monitores e alunos
  const monitores = [
    { id: "1", nome: "Monitor 1" },
    { id: "2", nome: "Monitor 2" },
  ];

  const alunos = [
    { id: "1", nome: "Aluno 1" },
    { id: "2", nome: "Aluno 2" },
    { id: "3", nome: "Aluno 3" },
  ];

  // Estado para armazenar turmas cadastradas dinamicamente
  const [turmas, setTurmas] = useState<Turma[]>([
    {
      id: "1",
      disciplina: "Matemática",
      monitor: "Monitor 1",
      alunos: ["Aluno 1", "Aluno 2"],
    },
    {
      id: "2",
      disciplina: "Física",
      monitor: "Monitor 2",
      alunos: ["Aluno 3"],
    },
  ]);

  // Função para lidar com mudanças nos campos de texto e select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Função para lidar com a seleção múltipla de alunos
  const handleAlunosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, alunosIds: selectedOptions });
  };

  // Função para enviar o formulário e adicionar turma na lista
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se monitor e disciplina foram selecionados
    if (!formData.disciplina || !formData.monitorId || formData.alunosIds.length === 0) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    // Obter nomes do monitor e dos alunos selecionados
    const nomeMonitor = monitores.find(m => m.id === formData.monitorId)?.nome || "Sem Monitor";
    const nomesAlunos = alunos
      .filter(a => formData.alunosIds.includes(a.id))
      .map(a => a.nome);

    // Criar um ID simples para a nova turma (pode usar UUID ou outro método)
    const novoId = (turmas.length + 1).toString();

    const novaTurma: Turma = {
      id: novoId,
      disciplina: formData.disciplina,
      monitor: nomeMonitor,
      alunos: nomesAlunos,
    };

    // Adicionar a nova turma ao estado
    setTurmas([...turmas, novaTurma]);

    // Resetar formulário
    setFormData({ disciplina: "", monitorId: "", alunosIds: [] });

    alert("Monitoria cadastrada com sucesso!");
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-[var(--background)]">
      <Navbar userType={userType} />
      <div className="max-w-6xl mx-auto p-4 mt-24 flex flex-col md:flex-row gap-8 justify-center items-start">

        {/* Seção da imagem */}
        <div className="hidden md:block md:w-3/3 rounded-xl dark:bg-[#25262b]">
          <img
            src="/for_cadastastrar_monitor.svg"
            alt="Ilustração de cadastro de monitoria"
            className="rounded-xl shadow-md object-cover w-full h-full"
          />
        </div>

        {/* Coluna do formulário */}
        <div className="w-full md:w-3/3 bg-white dark:bg-[var(--card)] border border-black/10 dark:border-[var(--border)] rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-[var(--card-foreground)] mb-4 text-center">Cadastrar Monitoria</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Disciplina</label>
              <input
                type="text"
                name="disciplina"
                value={formData.disciplina}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Monitor</label>
              <select
                name="monitorId"
                value={formData.monitorId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              >
                <option value="">Selecione um monitor</option>
                {monitores.map((monitor) => (
                  <option key={monitor.id} value={monitor.id}>
                    {monitor.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Alunos</label>
              <select
                name="alunosIds"
                multiple
                value={formData.alunosIds}
                onChange={handleAlunosChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
              >
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
              <small className="text-gray-500 dark:text-[var(--muted-foreground)]">Segure CTRL (Windows) ou Command (Mac) para selecionar múltiplos alunos.</small>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition dark:bg-[var(--primary)] dark:hover:bg-[var(--primary-foreground)]"
              >
                Cadastrar
              </button>
              <button
                type="reset"
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition dark:bg-[var(--secondary)] dark:text-[var(--secondary-foreground)] dark:hover:bg-[var(--accent)]"
                onClick={() => setFormData({ disciplina: "", monitorId: "", alunosIds: [] })}
              >
                Limpar
              </button>
            </div>
          </form>
        </div>

        {/* Coluna das turmas cadastradas */}
        <div className="w-full md:w-3/3 bg-white dark:bg-[var(--card)] border border-black/10 dark:border-[var(--border)] rounded-xl shadow-md p-8">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-[var(--card-foreground)] mb-4 text-center">Turmas Cadastradas</h3>
          <div className="space-y-4">
            {turmas.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-[var(--muted-foreground)]">Nenhuma turma cadastrada.</p>
            ) : (
              turmas.map((turma) => (
                <div key={turma.id} className="bg-gray-50 dark:bg-[var(--secondary)] border border-black/10 dark:border-[var(--border)] rounded-lg p-4 shadow">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-[var(--card-foreground)]">{turma.disciplina}</h4>
                  <p className="text-gray-600 dark:text-[var(--muted-foreground)]">Monitor: {turma.monitor}</p>
                  <p className="text-gray-600 dark:text-[var(--muted-foreground)]">Alunos: {turma.alunos.join(", ")}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
