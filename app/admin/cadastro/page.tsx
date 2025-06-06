'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import Papa from 'papaparse';
import { 
  PlusCircleIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  MagnifyingGlassIcon // NOVO: Ícone para a barra de pesquisa
} from '@heroicons/react/24/outline';

type Usuario = {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: string;
  curso?: string;
  especialidade?: string;
  formacao_academica?: string;
  data_nascimento?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

const initialFormData = {
  nome: '',
  email: '',
  senha: '',
  tipo: '',
  curso: '',
  especialidade: '',
  formacao_academica: '',
  data_nascimento: '',
};

export default function CadastroPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
 

  // NOVO: Estados para os filtros e campo de pesquisa
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(''); // '' representa 'Todos os Tipos'

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await fetch('/api/usuarios', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${res.status}`);
      }
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setErro(error instanceof Error ? error.message : "Erro desconhecido ao carregar usuários.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      // Condição do campo de pesquisa (nome ou email)
      const correspondePesquisa = 
        usuario.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
        usuario.email.toLowerCase().includes(termoPesquisa.toLowerCase());
      
      // Condição do filtro de tipo de usuário
      const correspondeTipo = filtroTipo ? usuario.tipo === filtroTipo : true;

      return correspondePesquisa && correspondeTipo;
    });
  }, [usuarios, termoPesquisa, filtroTipo]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true); 
    try {
      const url = editandoId ? `/api/usuarios/${editandoId}` : '/api/usuarios';
      const method = editandoId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao processar requisição');
      }
      alert(editandoId ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
      setEditandoId(null);
      setFormData(initialFormData);
      await carregarUsuarios();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async (id_usuario: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      setCarregando(true); 
      const res = await fetch(`/api/usuarios/${id_usuario}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao deletar usuário');
      }
      alert('Usuário deletado com sucesso!');
      await carregarUsuarios();
    } catch (error) { 
      alert(getErrorMessage(error)); 
    } finally {
      setCarregando(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditandoId(usuario.id_usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '', 
      tipo: usuario.tipo,
      curso: usuario.curso || '',
      especialidade: usuario.especialidade || '',
      formacao_academica: usuario.formacao_academica || '',
      data_nascimento: usuario.data_nascimento 
        ? new Date(usuario.data_nascimento).toISOString().split('T')[0] 
        : '',
    });
    // Adiciona a rolagem para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

const handleCSVImport = async () => {
    if (!file) {
      alert("Por favor, selecione um arquivo CSV.");
      return;
    }
    setCarregando(true); 
    // let totalUsuariosProcessados = 0; // Removida esta linha
    let totalUsuariosCriadosComSucesso = 0;
    const errosPorLote: { lote: number, detalhes: string }[] = []; // Para armazenar erros com mais detalhes

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result: Papa.ParseResult<Record<string, string>>) => {
        const usuariosDoCsv = result.data;
        if (usuariosDoCsv.length === 0) {
          alert("CSV vazio ou sem dados válidos para importar.");
          setCarregando(false);
          setFile(null);
          return;
        }

        const batchSize = 50; 
        
        for (let i = 0; i < usuariosDoCsv.length; i += batchSize) {
          const batch = usuariosDoCsv.slice(i, i + batchSize);
          const loteNumero = Math.floor(i / batchSize) + 1;
          // totalUsuariosProcessados += batch.length; // Removida esta linha

          try {
            const res = await fetch('/api/usuarios/batch', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(batch), 
            });

            const responseData = await res.json();

            if (!res.ok) {
              const erroMsg = responseData.error || `Erro no lote ${loteNumero}: ${res.statusText}`;
              console.error(erroMsg, responseData.errors);
              errosPorLote.push({ lote: loteNumero, detalhes: erroMsg + (responseData.errors ? ` Detalhes: ${JSON.stringify(responseData.errors)}` : '') });
            }
            if (responseData.createdCount) {
                totalUsuariosCriadosComSucesso += responseData.createdCount;
            }

          } catch (batchError: unknown) {
            const erroMsg = `Erro crítico ao enviar lote ${loteNumero}: ${getErrorMessage(batchError)}`;
            console.error(erroMsg);
            errosPorLote.push({ lote: loteNumero, detalhes: erroMsg });
          }
        }

        setCarregando(false);
        setFile(null); 

        let alertMessage = `Processamento do CSV concluído.\nTotal de registros no CSV: ${usuariosDoCsv.length}.\n`;
        alertMessage += `Usuários criados com sucesso: ${totalUsuariosCriadosComSucesso}.\n`;
        
        if (errosPorLote.length > 0) {
          alertMessage += `Ocorreram erros em ${errosPorLote.length} lote(s) ou com usuários individuais.\nConsulte o console do navegador para mais detalhes sobre os erros.`;
        } else if (totalUsuariosCriadosComSucesso === usuariosDoCsv.length) {
            alertMessage = `Todos os ${totalUsuariosCriadosComSucesso} usuários do CSV foram importados com sucesso!`;
        } else if (totalUsuariosCriadosComSucesso > 0 && totalUsuariosCriadosComSucesso < usuariosDoCsv.length){
            alertMessage += `Alguns usuários podem não ter sido importados devido a erros. Verifique o console.`;
        } else if (totalUsuariosCriadosComSucesso === 0 && usuariosDoCsv.length > 0 && errosPorLote.length > 0) {
             alertMessage = "Nenhum usuário foi importado devido a erros. Verifique o formato do CSV e os logs do console/servidor.";
        } else if (totalUsuariosCriadosComSucesso === 0 && usuariosDoCsv.length > 0 && errosPorLote.length === 0) {
             alertMessage = "Nenhum usuário foi importado. O CSV pode não conter dados válidos ou houve um problema inesperado.";
        }


        alert(alertMessage);
        await carregarUsuarios(); 
      },
      error: (csvError: Error) => {
        alert(`Erro ao processar o arquivo CSV: ${csvError.message}`);
        setCarregando(false);
      },
    });
  };

  const handleCSVExport = () => {
    if (!Array.isArray(usuarios) || usuarios.length === 0) { 
      alert('Nenhum dado para exportar ou dados inválidos.');
      return;
    }
    try {
      const csv = Papa.unparse(usuarios);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usuarios_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Erro ao exportar: ${getErrorMessage(error)}`);
    }
  };

  if (carregando && usuarios.length === 0 && !erro) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar/>
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-300">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (erro && usuarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar/>
        <div className="max-w-6xl mx-auto p-4 pt-20">
          <div className="bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erro ao carregar dados:</strong> {erro}
            <button 
              onClick={carregarUsuarios}
              className="ml-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar/>
      <div className="max-w-7xl mx-auto p-6 pt-20 sm:pt-24"> 
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            {editandoId ? 'Editar Usuário' : 'Cadastro de Usuários'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            {/* Coluna 1 do Formulário */}
            <div className="space-y-6">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo*</label>
                <input id="nome" name="nome" placeholder="Nome completo do usuário" value={formData.nome} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email*</label>
                <input id="email" name="email" type="email" placeholder="exemplo@dominio.com" value={formData.email} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required />
              </div>
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{editandoId ? 'Nova Senha (opcional)' : 'Senha*'}</label>
                <input id="senha" type="password" name="senha" placeholder={editandoId ? 'Deixe em branco para manter atual' : 'Mínimo 6 caracteres'} value={formData.senha} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required={!editandoId} minLength={editandoId ? undefined : 6} />
              </div>
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Usuário*</label>
                <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required>
                  <option value="">Selecione o Tipo</option>
                  <option value="admin">Administrador</option>
                  <option value="monitor">Monitor</option>
                  <option value="aluno">Aluno</option>
                </select>
              </div>
            </div>
            {/* Coluna 2 do Formulário */}
            <div className="space-y-6">
              <div>
                <label htmlFor="curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Curso</label>
                <input id="curso" name="curso" placeholder="Curso (ex: Desenvolvimento de Sistemas)" value={formData.curso} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
              <div>
                <label htmlFor="especialidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidade (para Monitores)</label>
                <input id="especialidade" name="especialidade" placeholder="Área de especialização do monitor" value={formData.especialidade} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
              <div>
                <label htmlFor="formacao_academica" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formação Acadêmica</label>
                <input id="formacao_academica" name="formacao_academica" placeholder="Nível de formação (ex: Técnico, Graduação)" value={formData.formacao_academica} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
              <div>
                <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
                <input id="data_nascimento" type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-6">
              <button type="submit" disabled={carregando} className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70">
                {carregando && !editandoId ? ( <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processando...</>
                ) : editandoId ? <><PencilIcon className="h-5 w-5 mr-1" />Atualizar Usuário</> : <><PlusCircleIcon className="h-5 w-5 mr-1" />Cadastrar Usuário</>}
              </button>
              {editandoId && (
                <button type="button" onClick={() => { setEditandoId(null); setFormData(initialFormData);}} className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2">
                  <XCircleIcon className="h-5 w-5 mr-1" />Cancelar Edição
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Importar/Exportar Dados CSV</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecionar Arquivo CSV para Importar</label>
              <input id="csvFile" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 dark:file:border-gray-600 file:text-sm file:font-semibold file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-200 dark:hover:file:bg-gray-600 transition" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleCSVImport} disabled={!file || carregando} className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-70 flex items-center justify-center gap-2">
                  <ArrowUpTrayIcon className="h-5 w-5 mr-1" />Importar
                </button>
                <button onClick={handleCSVExport} disabled={usuarios.length === 0 || carregando} className="flex-1 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white dark:text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-70 flex items-center justify-center gap-2">
                  <ArrowDownTrayIcon className="h-5 w-5 mr-1" />Exportar
                </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white p-6 sm:p-8 pb-0">Usuários Cadastrados ({usuariosFiltrados.length})</h3>          
          {/* NOVO: Barra de Filtros e Pesquisa */}
<div className="p-6 sm:p-8 pt-6 flex flex-col sm:flex-row gap-4">
  <div className="relative flex-grow">
    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
    <input 
      type="text"
      placeholder="Pesquisar por nome ou email..."
      value={termoPesquisa}
      onChange={(e) => setTermoPesquisa(e.target.value)}
      className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    />
  </div>

  <div className="flex-shrink-0">
    <select 
      value={filtroTipo}
      onChange={(e) => setFiltroTipo(e.target.value)}
      className="w-full sm:w-auto border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    >
      <option value="">Todos os Tipos</option>
      <option value="admin">Administrador</option>
      <option value="monitor">Monitor</option>
      <option value="aluno">Aluno</option>
    </select>
  </div>
</div>
<div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Nome', 'Email', 'Tipo', 'Ações'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
  {/* MODIFICADO: Usa 'usuariosFiltrados' para renderizar e checar o estado vazio */}
  {carregando ? (
      <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">Carregando usuários...</td></tr>
  ) : usuariosFiltrados.length === 0 ? (
    <tr>
      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Nenhum usuário encontrado com os filtros aplicados.
      </td>
    </tr>
  ) : (
    usuariosFiltrados.map((usuario) => ( // ✅ CORRIGIDO AQUI
      <tr key={usuario.id_usuario} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{usuario.nome}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{usuario.email}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${usuario.tipo === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
             usuario.tipo === 'monitor' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
             'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}`}>
            {usuario.tipo}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <div className="flex items-center space-x-3">
    <button 
      onClick={() => handleEdit(usuario)} 
      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition flex items-center gap-1"
    >
      <PencilIcon className="h-4 w-4" />Editar
    </button>
    <button 
      onClick={() => handleDelete(usuario.id_usuario)} 
      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md shadow-sm transition flex items-center gap-1"
    >
      <TrashIcon className="h-4 w-4" />Excluir
    </button>
  </div>
</td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}