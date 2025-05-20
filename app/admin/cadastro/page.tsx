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
      
      const res = await fetch('/api/usuarios');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Erro na requisição: ${res.status}`);
      }
      
      const data: Usuario[] = await res.json();
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setErro(error.message);
      setUsuarios([]);
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

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      alert(editandoId ? 'Usuário atualizado!' : 'Usuário cadastrado!');
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
      alert(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async (id_usuario: number) => {
    const confirm = window.confirm('Tem certeza que deseja excluir este usuário?');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/usuarios/${id_usuario}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao deletar usuário');
      }

      alert('Usuário deletado com sucesso!');
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro na exclusão:', error);
      alert(error.message);
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

          if (!res.ok) throw new Error(await res.text());
          
          alert('Importação concluída com sucesso!');
          carregarUsuarios();
        } catch (error) {
          alert(`Erro na importação: ${error.message}`);
        }
      },
    });
  };

  const handleCSVExport = () => {
    const csv = Papa.unparse(usuarios);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'usuarios.csv';
    link.click();
  };

  if (carregando) {
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

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar userType="admin" />
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong>Erro ao carregar dados:</strong> {erro}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar userType="admin" />

      <div className="max-w-6xl mx-auto p-4 mt-24 flex flex-col md:flex-row gap-8 justify-center items-center">
        {/* Coluna da esquerda: Cadastro */}
        <div className="w-full md:w-1/2 bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Cadastro de Usuários</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <input
              name="nome"
              placeholder="Nome"
              value={formData.nome}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
              required
            />
            <input
              type="password"
              name="senha"
              placeholder="Senha"
              value={formData.senha}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
              required={!editandoId}
            />
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
              required
            >
              <option value="">Selecione o Tipo</option>
              <option value="admin">Administrador</option>
              <option value="monitor">Monitor</option>
              <option value="usuario">Usuário</option>
            </select>
            <input
              name="curso"
              placeholder="Curso"
              value={formData.curso}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              name="especialidade"
              placeholder="Especialidade"
              value={formData.especialidade}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              name="formacao_academica"
              placeholder="Formação Acadêmica"
              value={formData.formacao_academica}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <input
              type="date"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              className="border px-3 py-2 rounded"
            />
            <button
              type="submit"
              disabled={carregando}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {carregando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-6 flex gap-4 items-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="border p-2 rounded"
            />
            <button
              onClick={handleCSVImport}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Importar CSV
            </button>
            <button
              onClick={handleCSVExport}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Coluna da direita: Lista de usuários */}
        <div className="w-full md:w-1/2 bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Usuários Cadastrados</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded shadow overflow-hidden">
              <thead className="bg-gray-200">
                <tr>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Curso</th>
                  <th className="text-left p-2">Especialidade</th>
                  <th className="text-left p-2">Formação</th>
                  <th className="text-left p-2">Nascimento</th>
                  <th className="text-left p-2">Ações</th>
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
  );
}