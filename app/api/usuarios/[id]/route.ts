// app/api/usuarios/[id]/route.ts

import { pool } from '@monitoriadigital/lib/db';
import { NextResponse } from 'next/server';
import type { OkPacket, RowDataPacket } from 'mysql2/promise';
import type { NextRequest } from 'next/server';

// Rota GET para buscar todos os usuários (pode ser usado em /api/usuarios, não nesta rota dinâmica)
export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query<RowDataPacket[]>(`
      SELECT u.*, a.tipo 
      FROM usuarios u
      JOIN acessos a ON u.id_usuario = a.id_usuario
    `);

    return NextResponse.json(rows);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar usuários:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao carregar usuários',
        error: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// Tipagem correta do contexto esperado pelo Next.js
type RouteContext = {
  params: {
    id: string;
  };
};

// Rota DELETE para deletar usuário por ID
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  let connection;
  try {
    const id = context.params.id;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [acessoResult] = await connection.query<OkPacket>(
        'DELETE FROM acessos WHERE id_usuario = ?',
        [id]
      );

      const [usuarioResult] = await connection.query<OkPacket>(
        'DELETE FROM usuarios WHERE id_usuario = ?',
        [id]
      );

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          message: 'Usuário deletado com sucesso',
          affectedRows: usuarioResult.affectedRows,
        },
        { status: 200 }
      );
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao deletar usuário:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao deletar usuário',
        error: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
