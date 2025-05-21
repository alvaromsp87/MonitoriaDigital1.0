'use client';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Papa from 'papaparse';

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

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: '',
    curso: '',
    especialidade: '',
    formacao_academica: '',
    data_nascimento: '',
  });

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

const carregarUsuarios = async () => {
  try {
    setCarregando(true);
    setErro(null);
    
    const res = await fetch('/api/usuarios', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${res.status}`);
    }

    const data = await res.json();
    setUsuarios(data);
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    setErro(error instanceof Error ? error.message : "Erro desconhecido");
  } finally {
    setCarregando(false);
  }
};

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const url = editandoId 
        ? `/api/usuarios/${editandoId}`
        : '/api/usuarios';

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
      setFormData({
        nome: '',
        email: '',
        senha: '',
        tipo: '',
        curso: '',
        especialidade: '',
        formacao_academica: '',
        data_nascimento: '',
      });
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
      const res = await fetch(`/api/usuarios/${id_usuario}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao deletar usuário');
      }

      alert('Usuário deletado com sucesso!');
      await carregarUsuarios();
    } catch (error) {
      alert(getErrorMessage(error));
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
  };

  const handleCSVImport = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result: Papa.ParseResult<Record<string, string>>) => {
        try {
          const res = await fetch('/api/usuarios/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.data),
          });

          if (!res.ok) {
            throw new Error(await res.text());
          }
          
          alert('Importação concluída com sucesso!');
          await carregarUsuarios();
        } catch (error) {
          alert(`Erro na importação: ${getErrorMessage(error)}`);
        }
      },
      error: (error: Error) => {
        alert(`Erro ao processar CSV: ${error.message}`);
      },
    });
  };

  const handleCSVExport = () => {
    if (!Array.isArray(usuarios)) {
      alert('Dados inválidos para exportação');
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

  if (carregando && usuarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar userType="admin" />
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
  <div className="min-h-screen bg-gray-50">
    <Navbar userType="admin" />

    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastro de Usuários</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input
                name="nome"
                placeholder="Nome completo"
                value={formData.nome}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
              <input
                name="email"
                type="email"
                placeholder="Email válido"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editandoId ? 'Nova Senha' : 'Senha*'}
              </label>
              <input
                type="password"
                name="senha"
                placeholder={editandoId ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                value={formData.senha}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required={!editandoId}
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo*</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">Selecione o Tipo</option>
                <option value="admin">Administrador</option>
                <option value="monitor">Monitor</option>
                <option value="usuario">Usuário</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
              <input
                name="curso"
                placeholder="Curso do usuário"
                value={formData.curso}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
              <input
                name="especialidade"
                placeholder="Área de especialização"
                value={formData.especialidade}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formação Acadêmica</label>
              <input
                name="formacao_academica"
                placeholder="Nível de formação"
                value={formData.formacao_academica}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="col-span-full flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={carregando}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-sm transition flex items-center justify-center gap-2 flex-1"
            >
              {carregando ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : editandoId ? (
                'Atualizar Usuário'
              ) : (
                'Cadastrar Usuário'
              )}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={() => {
                  setEditandoId(null);
                  setFormData({
                    nome: '',
                    email: '',
                    senha: '',
                    tipo: '',
                    curso: '',
                    especialidade: '',
                    formacao_academica: '',
                    data_nascimento: '',
                  });
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg shadow-sm transition flex-1"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CSV Import/Export Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Importar/Exportar Dados</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Arquivo CSV</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
              />
              <button
                onClick={handleCSVImport}
                disabled={!file}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Importar CSV
              </button>
            </div>
          </div>
          <button
            onClick={handleCSVExport}
            disabled={usuarios.length === 0}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap w-full md:w-auto"
          >
            Exportar CSV
          </button>
        </div>
      </div>


      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.length > 0 ? (
                usuarios.map((usuario) => (
                  <tr key={usuario.id_usuario} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {usuario.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.tipo === 'admin' ? 'bg-blue-100 text-blue-800' :
                        usuario.tipo === 'monitor' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {usuario.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition flex items-center gap-1"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id_usuario)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition flex items-center gap-1"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum usuário cadastrado
                  </td>

                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map((usuario) => (
                    <tr key={usuario.id_usuario} className="border-t hover:bg-gray-50">
                      <td className="p-2">{usuario.nome}</td>
                      <td className="p-2">{usuario.email}</td>
                      <td className="p-2 capitalize">{usuario.tipo}</td>
                      <td className="p-2">{usuario.curso || '-'}</td>
                      <td className="p-2">{usuario.especialidade || '-'}</td>
                      <td className="p-2">{usuario.formacao_academica || '-'}</td>
                      <td className="p-2">{usuario.data_nascimento?.split('T')[0] || '-'}</td>
                      <td className="p-2 space-x-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id_usuario)}
                          className="text-red-600 hover:underline"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      Nenhum usuário cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
);}
