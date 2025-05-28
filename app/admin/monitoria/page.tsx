"use client";
import Navbar from '../../components/Navbar';
import React, { useState, useEffect } from "react";
import axios from 'axios';
import Image from 'next/image';
// Interfaces para dados dos dropdowns
interface Disciplina {
  id_disciplina: string;
  nome: string;
}

interface Usuario {
  id_usuario: string;
  nome: string;
}

// Interface para o formulário
interface FormData {
  disciplinaId: string;
  monitorId: string;
  alunosIds: string[];
  assunto: string;
  data_agendamento: string;
  status: 'pendente' | 'realizada' | 'cancelada';
}

// Interface para a monitoria como retornada pelo novo GET /api/monitorias
interface DisplayMentorship {
  id_mentoria: string | number;
  nome_disciplina: string;
  nome_monitor: string;
  nome_aluno: string;
  conteúdo_programático: string; // <- Corresponde ao que a API GET agora retorna
  data_solicitacao: string;    // <- Corresponde ao que a API GET agora retorna
  status: 'pendente' | 'realizada' | 'cancelada';

  // Adicione quaisquer outros campos de 'm.*' que você queira usar
}

export default function CadastroMonitoria() {
  const userType: 'admin' | 'monitor' | 'student' = 'admin';
  
  const [formData, setFormData] = useState<FormData>({
    disciplinaId: "",
    monitorId: "",
    alunosIds: [],
    assunto: "",
    data_agendamento: "",
    status: "pendente",
  });

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [monitores, setMonitores] = useState<Usuario[]>([]);
  const [alunos, setAlunos] = useState<Usuario[]>([]);
  
  const [monitoriasCadastradas, setMonitoriasCadastradas] = useState<DisplayMentorship[]>([]);
  const [loadingMonitorias, setLoadingMonitorias] = useState(false);
  const [errorMonitorias, setErrorMonitorias] = useState<string | null>(null);

  const [loadingForm, setLoadingForm] = useState(false); // Renomeado para clareza
  const [errorForm, setErrorForm] = useState<string | null>(null); // Renomeado
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Função para buscar monitorias cadastradas
  const fetchMonitorias = async () => {
    setLoadingMonitorias(true);
    setErrorMonitorias(null);
    try {
      // A API GET agora retorna os nomes, então DisplayMentorship pode ser usado diretamente
      const response = await axios.get<DisplayMentorship[]>('/api/monitorias');
      setMonitoriasCadastradas(response.data);
    } catch (err: unknown) {
      console.error("Erro ao buscar monitorias cadastradas:", err);
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setErrorMonitorias(`Não foi possível carregar as monitorias: ${message}`);
    } finally {
      setLoadingMonitorias(false);
    }
  };
  
  // useEffect para buscar dados iniciais (disciplinas, monitores, alunos) e as monitorias
  useEffect(() => {
    async function fetchInitialPageData() {
      setLoadingForm(true); // Loading para os selects do formulário
      setErrorForm(null);
      try {
        const [disciplinasRes, monitoresRes, alunosRes] = await Promise.all([
          axios.get<Disciplina[]>('/api/disciplines'),
          axios.get<Usuario[]>('/api/monitors'),
          axios.get<Usuario[]>('/api/students'),
        ]);
        setDisciplinas(disciplinasRes.data);
        setMonitores(monitoresRes.data);
        setAlunos(alunosRes.data);
        
        // Após carregar os dados dos selects, busca as monitorias
        await fetchMonitorias();

      } catch (err: unknown) {
        console.error("Erro ao carregar dados iniciais da página:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorForm(`Erro ao carregar dados para o formulário: ${errorMessage}.`);
      } finally {
        setLoadingForm(false);
      }
    }
    fetchInitialPageData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAlunosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, alunosIds: selectedOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    setErrorForm(null);
    setSuccessMessage(null);

    if (!formData.disciplinaId || !formData.monitorId || formData.alunosIds.length === 0 || !formData.assunto || !formData.data_agendamento || !formData.status) {
      setErrorForm("Por favor, preencha todos os campos obrigatórios.");
      setLoadingForm(false);
      return;
    }

    try {
      // O novo backend POST espera um objeto por vez.
      // Então, faremos uma chamada POST para cada aluno selecionado.
      const creationPromises = formData.alunosIds.map(alunoId => {
        const payload = {
          id_disciplina: parseInt(formData.disciplinaId),
          id_monitor: parseInt(formData.monitorId),
          id_aluno: parseInt(alunoId),
          conteudo_programatico: formData.assunto,       // Nome do campo ajustado
          data_solicitacao: formData.data_agendamento, // Nome do campo ajustado
          status: formData.status, // Enviando status. **Verifique se seu backend POST o processa!**
        };
        return axios.post('/api/monitorias', payload);
      });

      await Promise.all(creationPromises);

      setSuccessMessage("Monitoria(s) cadastrada(s) com sucesso!");
      setFormData({
        disciplinaId: "",
        monitorId: "",
        alunosIds: [],
        assunto: "",
        data_agendamento: "",
        status: "pendente",
      });
      await fetchMonitorias(); // Atualiza a lista após o cadastro
    } catch (err: unknown) {
      console.error("Erro ao cadastrar monitoria:", err);
      if (axios.isAxiosError(err) && err.response) {
        setErrorForm(err.response.data?.error || "Erro ao cadastrar monitoria.");
      } else if (err instanceof Error) {
        setErrorForm(`Erro ao cadastrar monitoria: ${err.message}.`);
      } else {
        setErrorForm("Erro desconhecido ao cadastrar monitoria.");
      }
    } finally {
      setLoadingForm(false);
    }
  };
  
  if (loadingForm && disciplinas.length === 0 && monitores.length === 0 && alunos.length === 0) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-[var(--background)] flex flex-col">
        <Navbar userType={userType} />
        <div className="flex-grow flex justify-center items-center text-lg">Carregando dados do formulário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-[var(--background)]">
      <Navbar userType={userType} />
      <div className="max-w-6xl mx-auto p-4 mt-24 flex flex-col md:flex-row gap-8 justify-center items-start">

        <div className="hidden md:block md:w-1/3 h-auto rounded-xl dark:bg-[#25262b] relative" style={{ minHeight: '300px' }}> {/* Adicionado position: relative e uma altura mínima para o contêiner */}
          <Image
            src="/for_cadastastrar_monitor.svg" // Certifique-se que esta imagem está na pasta /public
            alt="Ilustração de cadastro de monitoria"
            fill // Faz a imagem preencher o contêiner pai
            className="rounded-xl shadow-md object-cover" // object-cover garante que a imagem cubra a área sem distorcer
            sizes="(max-width: 768px) 100vw, 33vw" // Ajuda o Next.js a otimizar a imagem para diferentes tamanhos de tela
                                                    // Ajuste '33vw' se a largura em telas maiores for diferente
          />
        </div>

        <div className="w-full md:w-1/3 bg-white dark:bg-[var(--card)] border border-black/10 dark:border-[var(--border)] rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-[var(--card-foreground)] mb-6 text-center">Cadastrar Monitoria</h2>
          
          {errorForm && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Erro!</strong>
              <span className="block sm:inline"> {errorForm}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Sucesso!</strong>
              <span className="block sm:inline"> {successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="disciplinaId" className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Disciplina</label>
              <select
                id="disciplinaId"
                name="disciplinaId"
                value={formData.disciplinaId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loadingForm || disciplinas.length === 0}
              >
                <option value="">{loadingForm && disciplinas.length === 0 ? 'Carregando...' : 'Selecione uma disciplina'}</option>
                {disciplinas.map((disciplina) => (
                  <option key={disciplina.id_disciplina} value={disciplina.id_disciplina}>
                    {disciplina.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="monitorId" className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Monitor</label>
              <select
                id="monitorId"
                name="monitorId"
                value={formData.monitorId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loadingForm || monitores.length === 0}
              >
                <option value="">{loadingForm && monitores.length === 0 ? 'Carregando...' : 'Selecione um monitor'}</option>
                {monitores.map((monitor) => (
                  <option key={monitor.id_usuario} value={monitor.id_usuario}>
                    {monitor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assunto" className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Assunto da Monitoria</label>
              <input
                type="text"
                id="assunto"
                name="assunto"
                value={formData.assunto}
                onChange={handleChange}
                placeholder="Ex: Revisão de Álgebra Linear"
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loadingForm}
              />
            </div>

            <div>
              <label htmlFor="data_agendamento" className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Data e Hora</label>
              <input
                type="datetime-local"
                id="data_agendamento"
                name="data_agendamento"
                value={formData.data_agendamento}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loadingForm}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                required
                disabled={loadingForm}
              >
                <option value="pendente">Pendente</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="alunosIds" className="block text-gray-700 dark:text-[var(--card-foreground)] font-medium">Alunos</label>
              <select
                id="alunosIds"
                name="alunosIds"
                multiple
                value={formData.alunosIds}
                onChange={handleAlunosChange}
                className="w-full p-2 border border-gray-300 dark:border-[var(--border)] dark:bg-[var(--input)] dark:text-[var(--foreground)] rounded mt-1 focus:ring-2 focus:ring-blue-400 focus:outline-none h-32"
                required
                disabled={loadingForm || alunos.length === 0}
              >
                {loadingForm && alunos.length === 0 && <option disabled>Carregando...</option>}
                {alunos.map((aluno) => (
                  <option key={aluno.id_usuario} value={aluno.id_usuario}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
              <small className="text-gray-500 dark:text-[var(--muted-foreground)]">Segure CTRL (Windows) ou Command (Mac) para selecionar múltiplos alunos.</small>
            </div>

            <div className="flex justify-center gap-4 mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition dark:bg-[var(--primary)] dark:hover:bg-[var(--primary-foreground)] disabled:opacity-50"
                disabled={loadingForm}
              >
                {loadingForm ? 'Cadastrando...' : 'Cadastrar'}
              </button>
              <button
                type="reset"
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition dark:bg-[var(--secondary)] dark:text-[var(--secondary-foreground)] dark:hover:bg-[var(--accent)] disabled:opacity-50"
                onClick={() => setFormData({ disciplinaId: "", monitorId: "", alunosIds: [], assunto: "", data_agendamento: "", status: "pendente" })}
                disabled={loadingForm}
              >
                Limpar
              </button>
            </div>
          </form>
        </div>

        <div className="w-full md:w-1/3 bg-white dark:bg-[var(--card)] border border-black/10 dark:border-[var(--border)] rounded-xl shadow-md p-8">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-[var(--card-foreground)] mb-4 text-center">Monitorias Cadastradas</h3>
          <div className="mt-6 space-y-4 max-h-96 overflow-y-auto"> {/* Adicionado scroll */}
            {loadingMonitorias ? (
              <p className="text-center text-gray-500 dark:text-[var(--muted-foreground)]">Carregando monitorias...</p>
            ) : errorMonitorias ? (
              <p className="text-center text-red-500 dark:text-red-400">{errorMonitorias}</p>
            ) : monitoriasCadastradas.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-[var(--muted-foreground)]">Nenhuma monitoria cadastrada.</p>
            ) : (
              monitoriasCadastradas.map((mentoria) => (
                <div key={mentoria.id_mentoria} className="bg-gray-50 dark:bg-[var(--secondary)] border border-gray-200 dark:border-[var(--border)] rounded-lg p-4 shadow">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-[var(--card-foreground)]">{mentoria.nome_disciplina}</h4>
                  <p className="text-sm text-gray-600 dark:text-[var(--muted-foreground)]"><strong>Assunto:</strong> {mentoria.conteúdo_programático}</p>
                  <p className="text-sm text-gray-600 dark:text-[var(--muted-foreground)]"><strong>Monitor:</strong> {mentoria.nome_monitor}</p>
                  <p className="text-sm text-gray-600 dark:text-[var(--muted-foreground)]"><strong>Aluno:</strong> {mentoria.nome_aluno}</p>
                  <p className="text-sm text-gray-600 dark:text-[var(--muted-foreground)]"><strong>Data:</strong> {new Date(mentoria.data_solicitacao).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-[var(--muted-foreground)]"><strong>Status:</strong> {mentoria.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}