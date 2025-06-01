// 📁 app/api/users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { pool } from '@/lib/db'; // Seu pool de conexões do banco de dados
import { RowDataPacket } from 'mysql2/promise';

// Interface para o item da lista de usuários que a API retornará
// Mantemos 'id' e 'nome' para consistência com o AuthContext e ChatPage.tsx
export interface UserListItemAPI {
  id: string; // Será o id_usuario convertido para string
  nome: string;
}

// Tipo para as linhas que vêm diretamente do banco de dados
interface UserFromDb extends RowDataPacket {
  id_usuario: number | string; // Pode ser number ou string dependendo do schema
  nome: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const loggedInUserId = searchParams.get('currentUserId');

  if (!loggedInUserId) {
    return NextResponse.json(
      { error: 'ID do usuário logado (currentUserId) é obrigatório como parâmetro de busca' },
      { status: 400 }
    );
  }

  try {
    // Seleciona as colunas corretas: id_usuario e nome
    const sql = `
      SELECT id_usuario, nome 
      FROM usuarios 
      WHERE id_usuario != ?  
      ORDER BY nome ASC
    `;
    
    // Executa a query. O resultado (usersFromDb) terá id_usuario e nome.
    const [usersFromDb] = await pool.execute<UserFromDb[]>(sql, [loggedInUserId]);

    // Mapeia o resultado para o formato UserListItemAPI (id: string, nome: string)
    const usersForApi: UserListItemAPI[] = usersFromDb.map(user => ({
      id: String(user.id_usuario), // Garante que o ID seja uma string
      nome: user.nome,
    }));

    return NextResponse.json(usersForApi);
  } catch (e: unknown) {
    let errorMessage = 'Erro interno do servidor ao buscar usuários';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error('Erro ao buscar usuários do banco:', e);
    return NextResponse.json({ error: 'Erro ao buscar usuários', details: errorMessage }, { status: 500 });
  }
}