"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Papa from 'papaparse';
import { Download, Upload, Trash2, Edit } from 'lucide-react';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
  tipo: 'admin' | 'monitor';
}

const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formData, setFormData] = useState<Usuario>({ id: 0, nome: '', email: '', senha: '', tipo: 'admin' });
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
  try {
    const response = await fetch('/api/usuarios');
    if (!response.ok) {
      throw new Error('Erro ao buscar usuários');
    }
    const data = await response.json();
    setUsuarios(data);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  }
};


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.email || (!editandoId && !formData.senha) || !formData.tipo) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const payload = { ...formData };
    if (editandoId && !payload.senha) {
      delete payload.senha;
    }

    const method = editandoId ? 'PUT' : 'POST';
    const url = editandoId ? `/api/usuarios/${editandoId}` : '/api/usuarios';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setFormData({ id: 0, nome: '', email: '', senha: '', tipo: 'admin' });
    setEditandoId(null);
    fetchUsuarios();
  };

  const handleEdit = (usuario: Usuario) => {
    setFormData({ ...usuario, senha: '' });
    setEditandoId(usuario.id);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    fetchUsuarios();
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      usuarios.map(({ senha, ...usuario }) => usuario)
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'usuarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (result) => {
        const isValid = result.data.every((item: any) => item.nome && item.email && item.tipo);
        if (!isValid) {
          alert('CSV inválido. Verifique se os campos obrigatórios estão preenchidos.');
          return;
        }

        await fetch('/api/usuarios/importar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data),
        });
        fetchUsuarios();
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Cadastro de Usuários</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Nome"
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleInputChange}
            placeholder="Senha"
            className="border p-2 rounded"
            required={!editandoId}
          />
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            className="border p-2 rounded"
            required
          >
            <option value="admin">Administrador</option>
            <option value="monitor">Monitor</option>
          </select>
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {editandoId ? 'Atualizar' : 'Cadastrar'}
        </button>
      </form>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lista de Usuários</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            <Download size={16} /> Exportar CSV
          </button>
          <label className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 cursor-pointer">
            <Upload size={16} /> Importar CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
        </div>
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Nome</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Tipo</th>
            <th className="py-2 px-4 border-b">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td className="py-2 px-4 border-b">{usuario.nome}</td>
              <td className="py-2 px-4 border-b">{usuario.email}</td>
              <td className="py-2 px-4 border-b">
                {usuario.tipo.charAt(0).toUpperCase() + usuario.tipo.slice(1)}
              </td>
              <td className="py-2 px-4 border-b flex gap-2">
                <button
                  onClick={() => handleEdit(usuario)}
                  className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition flex items-center gap-1"
                >
                  <Edit size={16} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(usuario.id)}
                  className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition flex items-center gap-1"
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosPage;
