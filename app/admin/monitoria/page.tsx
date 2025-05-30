"use client";
import Navbar from '../../components/Navbar';
import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import Image from 'next/image';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// --- Interfaces ---
interface Disciplina { id_disciplina: string; nome: string; }
interface Usuario { id_usuario: string; nome: string; }

interface AlunoParticipante {
  id_usuario: string;
  nome: string;
}

// FormData para o formulário
interface FormData {
  disciplinaId: string;
  monitorId: string;
  alunosIds: string[]; 
  assunto: string;
  data_agendamento: string;
}

// Para exibir a lista de sessões de monitoria (agrupadas)
interface DisplayMentorshipGroup {
  representative_id_mentoria: number; 
  original_mentoria_ids: number[];    
  id_disciplina: number;
  nome_disciplina: string;
  id_monitor: number;
  nome_monitor: string;
  alunos: AlunoParticipante[];
  conteudo_programatico: string;
  data_agendamento: string;
  status: string;
}

// Para carregar dados de uma sessão para edição
interface MentoriaGroupParaEdicaoAPI {
  representative_id_mentoria: number;
  original_mentoria_ids: number[];
  id_disciplina: number;
  id_monitor: number;
  alunos: Array<{ id_usuario: string; nome?: string }>; 
  assunto: string; 
  data_agendamento: string;
  status: string;
}

export default function CadastroMonitoriaPage() {

  const initialFormData: FormData = {
    disciplinaId: "",
    monitorId: "",
    alunosIds: [],
    assunto: "",
    data_agendamento: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null); 
  const [currentOriginalMentoriaIds, setCurrentOriginalMentoriaIds] = useState<number[]>([]);


  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [monitores, setMonitores] = useState<Usuario[]>([]);
  const [alunos, setAlunos] = useState<Usuario[]>([]);

  const [monitoriasAgrupadas, setMonitoriasAgrupadas] = useState<DisplayMentorshipGroup[]>([]);
  const [loadingMonitorias, setLoadingMonitorias] = useState(true);
  const [errorMonitorias, setErrorMonitorias] = useState<string | null>(null);

  const [loadingFormSelects, setLoadingFormSelects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchMonitoriasAgrupadas = useCallback(async () => {
    setLoadingMonitorias(true);
    setErrorMonitorias(null);
    try {
      const response = await axios.get<DisplayMentorshipGroup[]>('/api/monitorias');
      setMonitoriasAgrupadas(response.data);
    } catch (err: unknown) {
      console.error("Erro ao buscar monitorias agrupadas:", err);
      const message = axios.isAxiosError(err) && err.response?.data?.error ? err.response.data.error : (err instanceof Error ? err.message : "Erro desconhecido");
      setErrorMonitorias(`Não foi possível carregar monitorias: ${message}`);
    } finally {
      setLoadingMonitorias(false);
    }
  }, []);

  useEffect(() => {
    async function fetchInitialPageData() {
      setLoadingFormSelects(true);
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
        await fetchMonitoriasAgrupadas();
      } catch (err: unknown) {
        console.error("Erro ao carregar dados iniciais:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        setErrorForm(`Erro ao carregar dados para o formulário: ${errorMessage}.`);
      } finally {
        setLoadingFormSelects(false);
      }
    }
    fetchInitialPageData();
  }, [fetchMonitoriasAgrupadas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAlunosChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({ ...formData, alunosIds: selectedOptions });
  };

  const handleEditClick = async (representativeMentoriaId: number) => {
    setIsSubmitting(true);
    setErrorForm(null);
    setSuccessMessage(null);
    try {
      const response = await axios.get<MentoriaGroupParaEdicaoAPI>(`/api/monitorias/${representativeMentoriaId}`);
      const mentoriaGroupParaEditar = response.data;

      if (!mentoriaGroupParaEditar || typeof mentoriaGroupParaEditar.id_disciplina === 'undefined') {
        throw new Error("Dados da sessão de monitoria para edição estão incompletos.");
      }
      
      let formattedDataAgendamento = mentoriaGroupParaEditar.data_agendamento;
      try {
        const date = new Date(mentoriaGroupParaEditar.data_agendamento);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        formattedDataAgendamento = `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch(e){
        console.warn("Could not re-format date from API for datetime-local input", e);
      }

      setFormData({
        disciplinaId: String(mentoriaGroupParaEditar.id_disciplina),
        monitorId: String(mentoriaGroupParaEditar.id_monitor),
        alunosIds: mentoriaGroupParaEditar.alunos.map(aluno => String(aluno.id_usuario)),
        assunto: mentoriaGroupParaEditar.assunto,
        data_agendamento: formattedDataAgendamento,
      });
      setEditingGroupId(representativeMentoriaId);
      setCurrentOriginalMentoriaIds(mentoriaGroupParaEditar.original_mentoria_ids || []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(`Erro ao carregar dados da sessão ${representativeMentoriaId} para edição:`, err);
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : (err instanceof Error ? err.message : "Erro desconhecido");
      setErrorForm(`Falha ao carregar dados para edição: ${message}`);
      setEditingGroupId(null);
      setCurrentOriginalMentoriaIds([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (representativeMentoriaId: number) => {
    if (!window.confirm(`Tem certeza que deseja excluir esta sessão de monitoria (ID representativo ${representativeMentoriaId}) e todas as suas participações? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/monitorias/${representativeMentoriaId}`);
      setSuccessMessage('Sessão de monitoria excluída com sucesso!');
      setErrorForm(null);
      await fetchMonitoriasAgrupadas();
    } catch (err: unknown) {
      console.error(`Erro ao excluir sessão ${representativeMentoriaId}:`, err);
      const message = axios.isAxiosError(err) && err.response?.data?.error ? err.response.data.error : (err instanceof Error ? err.message : "Erro desconhecido");
      setErrorForm(`Falha ao excluir sessão de monitoria: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorForm(null);
    setSuccessMessage(null);

    const { disciplinaId, monitorId, alunosIds, assunto, data_agendamento } = formData;

    if (!disciplinaId || !monitorId || alunosIds.length === 0 || !assunto.trim() || !data_agendamento.trim()) {
      setErrorForm("Todos os campos marcados com * são obrigatórios e ao menos um aluno deve ser selecionado.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      id_disciplina: parseInt(disciplinaId),
      id_monitor: parseInt(monitorId),
      alunosIds: alunosIds.map(id => parseInt(id)), 
      assunto: assunto,
      data_agendamento: data_agendamento, 
      status: 'confirmada', 
      ...(editingGroupId && { original_mentoria_ids: currentOriginalMentoriaIds })
    };

    try {
      if (editingGroupId) {
        await axios.put(`/api/monitorias/${editingGroupId}`, payload);
        setSuccessMessage("Sessão de monitoria atualizada com sucesso!");
      } else {
        await axios.post('/api/monitorias', payload);
        setSuccessMessage("Sessão de monitoria cadastrada com sucesso!");
      }

      setFormData(initialFormData);
      setEditingGroupId(null);
      setCurrentOriginalMentoriaIds([]);
      await fetchMonitoriasAgrupadas();
    } catch (err: unknown) {
      console.error("Erro ao processar sessão de monitoria:", err);
      if (axios.isAxiosError(err) && err.response) {
        const backendError = err.response.data?.error || err.response.data?.message || `Erro ${err.response.status} ao processar.`;
        setErrorForm(backendError);
      } else if (err instanceof Error) {
        setErrorForm(`Erro: ${err.message}.`);
      } else {
        setErrorForm("Erro desconhecido ao processar sessão de monitoria.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const cancelEdit = () => {
    setEditingGroupId(null);
    setFormData(initialFormData);
    setCurrentOriginalMentoriaIds([]);
    setErrorForm(null);
    setSuccessMessage(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-screen-xl mx-auto p-4 md:p-6 mt-16 md:mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 md:p-8">
            <div className="flex items-center justify-center mb-2">
              <Image
                src="/for_cadastastrar_monitor.svg" 
                alt="Ilustração de cadastro de monitoria"
                width={120}
                height={120}
                className="rounded-xl"
                priority
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              {editingGroupId ? 'Editar Sessão de Monitoria' : 'Cadastrar Nova Sessão de Monitoria'}
            </h2>

            {errorForm && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:text-red-200 dark:bg-red-900_replace p-4 mb-6 rounded-md shadow-md" role="alert">
                <p className="font-bold">Erro!</p>
                <p>{errorForm}</p>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 dark:text-green-200 dark:bg-green-900_replace p-4 mb-6 rounded-md shadow-md" role="alert">
                <p className="font-bold">Sucesso!</p>
                <p>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="disciplinaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disciplina*</label>
                <select id="disciplinaId" name="disciplinaId" value={formData.disciplinaId} onChange={handleChange} className="w-full p-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required disabled={loadingFormSelects || isSubmitting || !!editingGroupId}>
                  <option value="">{loadingFormSelects && disciplinas.length === 0 ? 'Carregando...' : 'Selecione Disciplina'}</option>
                  {disciplinas.map((d) => (<option key={d.id_disciplina} value={d.id_disciplina}>{d.nome}</option>))}
                </select>
                {!!editingGroupId && <small className="text-xs text-gray-500 dark:text-gray-400 mt-1">Disciplina não pode ser alterada na edição de grupo.</small>}
              </div>

              <div>
                <label htmlFor="monitorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monitor*</label>
                <select id="monitorId" name="monitorId" value={formData.monitorId} onChange={handleChange} className="w-full p-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required disabled={loadingFormSelects || isSubmitting || !!editingGroupId}>
                  <option value="">{loadingFormSelects && monitores.length === 0 ? 'Carregando...' : 'Selecione Monitor'}</option>
                  {monitores.map((m) => (<option key={m.id_usuario} value={m.id_usuario}>{m.nome}</option>))}
                </select>
                 {!!editingGroupId && <small className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monitor não pode ser alterado na edição de grupo.</small>}
              </div>

              {/* CAMPO ASSUNTO CORRIGIDO */}
              <div className="sm:col-span-2">
                <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assunto da Monitoria*</label>
                <input
                  type="text"
                  id="assunto"
                  name="assunto"
                  value={formData.assunto}
                  onChange={handleChange}
                  placeholder="Ex: Revisão Cap. 1-3"
                  className="w-full p-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                  disabled={isSubmitting} 
                />
                {/* Exemplo de lógica para desabilitar/mostrar mensagem, ajuste conforme necessário */}
                {!!editingGroupId && 
                  false && /* Coloque sua condição real aqui, ex: formData.assunto === "AlgumValorFixo" */
                  <small className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Assunto não pode ser alterado sob certas condições na edição.
                  </small>
                }
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="data_agendamento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data e Hora*</label>
                <input type="datetime-local" id="data_agendamento" name="data_agendamento" value={formData.data_agendamento} onChange={handleChange} className="w-full p-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required disabled={isSubmitting} />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="alunosIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alunos Envolvidos*</label>
                <select
                  id="alunosIds"
                  name="alunosIds"
                  multiple={true} 
                  value={formData.alunosIds}
                  onChange={handleAlunosChange}
                  className="w-full p-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition h-40"
                  required
                  disabled={loadingFormSelects || alunos.length === 0 || isSubmitting}
                >
                  {alunos.map((aluno) => (
                    <option key={aluno.id_usuario} value={aluno.id_usuario}>
                      {aluno.nome}
                    </option>
                  ))}
                </select>
                <small className="text-xs text-gray-500 dark:text-gray-400 mt-1">Segure CTRL (ou Command no Mac) para selecionar múltiplos alunos.</small>
              </div>

              <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-3 mt-4">
                {editingGroupId && (
                  <button type="button" onClick={cancelEdit} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-2.5 px-6 rounded-lg shadow-sm transition order-last sm:order-none">
                    Cancelar Edição
                  </button>
                )}
                <button type="button" className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-2.5 px-6 rounded-lg shadow-sm transition order-last sm:order-none" onClick={() => {if(!editingGroupId) setFormData(initialFormData);}} disabled={isSubmitting || !!editingGroupId}>
                  <ArrowPathIcon className="h-5 w-5 inline mr-2" /> Limpar Campos
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition disabled:opacity-70 flex items-center justify-center" disabled={loadingFormSelects || isSubmitting}>
                  {isSubmitting ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : editingGroupId ? <PencilSquareIcon className="h-5 w-5 mr-2" /> : <PlusCircleIcon className="h-5 w-5 mr-2" />}
                  {isSubmitting ? (editingGroupId ? 'Atualizando...' : 'Cadastrando...') : (editingGroupId ? 'Atualizar Sessão' : 'Cadastrar Sessão')}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Sessões de Monitoria Agendadas</h3>
            <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {loadingMonitorias ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Carregando sessões...</p>
              ) : errorMonitorias ? (
                <div className="bg-red-50 dark:bg-opacity-10 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-md" role="alert">
                  <p className="font-medium">Erro ao carregar sessões:</p>
                  <p className="text-sm">{errorMonitorias}</p>
                  <button onClick={fetchMonitoriasAgrupadas} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">Tentar novamente</button>
                </div>
              ) : monitoriasAgrupadas.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhuma sessão de monitoria cadastrada.</p>
              ) : (
                monitoriasAgrupadas.map((sessao) => (
                  <div key={sessao.representative_id_mentoria} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-md font-semibold text-blue-600 dark:text-blue-400">{sessao.nome_disciplina}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID Grupo Rep.: {sessao.representative_id_mentoria}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1"><strong>Assunto:</strong> {sessao.conteudo_programatico}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Monitor:</strong> {sessao.nome_monitor}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Alunos:</strong> {sessao.alunos.map(a => a.nome).join(', ') || 'Nenhum aluno'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Data:</strong> {new Date(sessao.data_agendamento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                     <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Status:</strong> {sessao.status}</p>
                    <div className="mt-3 flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditClick(sessao.representative_id_mentoria)}
                        className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition flex items-center gap-1 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        <PencilSquareIcon className="h-4 w-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(sessao.representative_id_mentoria)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition flex items-center gap-1 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        <TrashIcon className="h-4 w-4" /> Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}