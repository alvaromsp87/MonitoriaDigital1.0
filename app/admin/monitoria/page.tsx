// app/admin/cadastro-monitoria/page.tsx (Assumindo que este é o caminho do arquivo)
"use client";
import Navbar from '../../components/Navbar';
import React, { useState, useEffect } from "react"; // Importa useEffect
import axios from 'axios'; // Para fazer requisições HTTP

// Definindo as interfaces para os tipos de dados que vêm do banco
interface Disciplina {
  id_disciplina: string;
  nome: string;
}

interface Usuario {
  id_usuario: string;
  nome: string;
}

// Definindo o tipo para os dados do formulário
interface FormData {
  disciplinaId: string; // Agora armazena o ID da disciplina
  monitorId: string;
  alunosIds: string[];
  assunto: string;      // Novo campo
  data_agendamento: string; // Novo campo para data e hora (string para input datetime-local)
  status: 'pendente' | 'realizada' | 'cancelada'; // Novo campo com ENUM
}

export default function CadastroMonitoria() {
  const userType: 'admin' | 'monitor' | 'student' = 'admin';
  
  const [formData, setFormData] = useState<FormData>({
    disciplinaId: "",
    monitorId: "",
    alunosIds: [],
    assunto: "",
    data_agendamento: "",
    status: "pendente", // Valor padrão
  });

  // Estados para armazenar os dados reais do banco de dados
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [monitores, setMonitores] = useState<Usuario[]>([]);
  const [alunos, setAlunos] = useState<Usuario[]>([]);

  // Estados para feedback do usuário
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // useEffect para buscar disciplinas, monitores e alunos ao carregar o componente
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      setError(null);
      try {
        // Requisições paralelas para buscar todos os dados
        const [disciplinasRes, monitoresRes, alunosRes] = await Promise.all([
          axios.get<Disciplina[]>('/api/disciplines'),
          axios.get<Usuario[]>('/api/monitors'),
          axios.get<Usuario[]>('/api/students'),
        ]);

        setDisciplinas(disciplinasRes.data);
        setMonitores(monitoresRes.data);
        setAlunos(alunosRes.data);

      } catch (err: any) {
        console.error("Erro ao carregar dados iniciais:", err);
        setError("Erro ao carregar disciplinas, monitores ou alunos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []); // Executa apenas uma vez no carregamento do componente

  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Função para lidar com a mudança nas seleções múltiplas de alunos
  const handleAlunosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, alunosIds: selectedOptions });
  };

  // Função para enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validação básica
    if (!formData.disciplinaId || !formData.monitorId || formData.alunosIds.length === 0 || !formData.assunto || !formData.data_agendamento || !formData.status) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      // Para cada aluno selecionado, criamos uma entrada de mentoria (se a mentoria for 1:1)
      // Se a mentoria for em grupo (1 monitor para N alunos na MESMA mentoria),
      // a estrutura do banco de dados (tabela mentorias) e a lógica da API precisariam ser diferentes
      // A sua tabela 'mentorias' tem 'id_aluno' singular, então vamos criar uma mentoria para cada aluno selecionado
      
      const mentorshipsToCreate = formData.alunosIds.map(alunoId => ({
        id_disciplina: parseInt(formData.disciplinaId),
        id_monitor: parseInt(formData.monitorId),
        id_aluno: parseInt(alunoId), // Um aluno por mentoria
        assunto: formData.assunto,
        data_mentoria: formData.data_agendamento, // Já no formato ISO para DATETIME
        status: formData.status,
      }));

      await axios.post('/api/monitorias', { mentorships: mentorshipsToCreate });

      setSuccessMessage("Monitoria(s) cadastrada(s) com sucesso!");
      setFormData({ // Limpa o formulário após o sucesso
        disciplinaId: "",
        monitorId: "",
        alunosIds: [],
        assunto: "",
        data_agendamento: "",
        status: "pendente",
      });
    } catch (err: any) {
      console.error("Erro ao cadastrar monitoria:", err);
      setError(err.response?.data?.error || "Erro ao cadastrar monitoria. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && disciplinas.length === 0 && monitores.length === 0 && alunos.length === 0) {
    return <div className="flex justify-center items-center min-h-screen text-lg">Carregando dados...</div>;
  }

  return (
    <div className="flex">
      <Navbar userType={userType} />
      <div className="container mx-auto px-4 py-6 flex-1">
        <main className="p-10">
          <h2 className="text-center text-2xl font-semibold text-gray-800">Cadastrar Monitoria</h2>
          
          <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded-lg shadow-md w-full max-w-lg mx-auto">
            {/* Feedback de sucesso ou erro */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Erro!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Sucesso!</strong>
                <span className="block sm:inline"> {successMessage}</span>
              </div>
            )}

            {/* Disciplina */}
            <div className="mb-4">
              <label htmlFor="disciplinaId" className="block text-gray-700 font-medium mb-1">Disciplina</label>
              <select
                id="disciplinaId"
                name="disciplinaId"
                value={formData.disciplinaId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loading}
              >
                <option value="">Selecione uma disciplina</option>
                {disciplinas.map((disciplina) => (
                  <option key={disciplina.id_disciplina} value={disciplina.id_disciplina}>
                    {disciplina.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Monitor */}
            <div className="mb-4">
              <label htmlFor="monitorId" className="block text-gray-700 font-medium mb-1">Monitor</label>
              <select
                id="monitorId"
                name="monitorId"
                value={formData.monitorId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loading}
              >
                <option value="">Selecione um monitor</option>
                {monitores.map((monitor) => (
                  <option key={monitor.id_usuario} value={monitor.id_usuario}>
                    {monitor.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Assunto */}
            <div className="mb-4">
              <label htmlFor="assunto" className="block text-gray-700 font-medium mb-1">Assunto da Monitoria</label>
              <input
                type="text"
                id="assunto"
                name="assunto"
                value={formData.assunto}
                onChange={handleChange}
                placeholder="Ex: Revisão de Álgebra Linear"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            {/* Data e Hora */}
            <div className="mb-4">
              <label htmlFor="data_agendamento" className="block text-gray-700 font-medium mb-1">Data e Hora</label>
              <input
                type="datetime-local"
                id="data_agendamento"
                name="data_agendamento"
                value={formData.data_agendamento}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loading}
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <label htmlFor="status" className="block text-gray-700 font-medium mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loading}
              >
                <option value="pendente">Pendente</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* Alunos (seleção múltipla) */}
            <div className="mb-4">
              <label htmlFor="alunosIds" className="block text-gray-700 font-medium mb-1">Alunos</label>
              <select
                id="alunosIds"
                name="alunosIds"
                multiple
                value={formData.alunosIds}
                onChange={handleAlunosChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none h-32" // Aumenta a altura para seleção múltipla
                required
                disabled={loading}
              >
                {alunos.map((aluno) => (
                  <option key={aluno.id_usuario} value={aluno.id_usuario}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
              <small className="text-gray-500">Segure CTRL (Windows) ou Command (Mac) para selecionar múltiplos alunos.</small>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
              <button
                type="reset"
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition disabled:opacity-50"
                onClick={() => setFormData({ disciplinaId: "", monitorId: "", alunosIds: [], assunto: "", data_agendamento: "", status: "pendente" })}
                disabled={loading}
              >
                Limpar
              </button>
            </div>
          </form>

          {/* Seção de visualização de turmas cadastradas (será preenchida por outra API ou estado) */}
          {/* Por enquanto, removemos o hardcoded 'turmas' */}
          <div className="mt-10">
            <h3 className="text-center text-xl font-semibold text-gray-800">Monitorias Cadastradas</h3>
            <div className="mt-6 space-y-4">
              <p className="text-center text-gray-500">
                Os dados das monitorias cadastradas serão exibidos aqui (precisará de uma API para listar).
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
