import { pool } from '@monitoriadigital/lib/db';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { OkPacket, RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    const id = params.id;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT u.*, a.tipo 
       FROM usuarios u
       JOIN acessos a ON u.id_usuario = a.id_usuario
       WHERE u.id_usuario = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar usuário:', message);
    return NextResponse.json({ success: false, message: 'Erro ao buscar usuário', error: message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    const id = params.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { nome, email, senha, tipo, curso, especialidade, formacao_academica, data_nascimento } = body;

    connection = await pool.getConnection();
    const [result] = await connection.query<OkPacket>(
      `UPDATE usuarios SET nome = ?, email = ?, senha = ?, tipo = ?, curso = ?, especialidade = ?, formacao_academica = ?, data_nascimento = ? WHERE id_usuario = ?`,
      [nome, email, senha, tipo, curso, especialidade, formacao_academica, data_nascimento, id]
    );

    return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao atualizar usuário:', message);
    return NextResponse.json({ success: false, message: 'Erro ao atualizar usuário', error: message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    const id = params.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query<OkPacket>('DELETE FROM acessos WHERE id_usuario = ?', [id]);
      const [usuarioResult] = await connection.query<OkPacket>('DELETE FROM usuarios WHERE id_usuario = ?', [id]);

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Usuário deletado com sucesso',
        affectedRows: usuarioResult.affectedRows,
      });
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao deletar usuário:', message);
    return NextResponse.json({ success: false, message: 'Erro ao deletar usuário', error: message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
