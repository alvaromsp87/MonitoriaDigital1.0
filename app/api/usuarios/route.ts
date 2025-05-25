import { pool } from '@monitoriadigital/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { OkPacket, RowDataPacket } from 'mysql2/promise';

// GET - Listar todos os usuários
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
    console.error('Erro no GET /api/usuarios:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST - Criar novo usuário
export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json();

    if (!body.nome || !body.email || !body.senha || !body.tipo) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const hashedPassword = await bcrypt.hash(body.senha, 10);
      const [userResult] = await connection.query<OkPacket>(
        `INSERT INTO usuarios 
        (nome, email, senha, curso, especialidade, formacao_academica, data_nascimento) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          body.nome,
          body.email,
          hashedPassword,
          body.curso || null,
          body.especialidade || null,
          body.formacao_academica || null,
          body.data_nascimento || null,
        ]
      );

      await connection.query(
        `INSERT INTO acessos (id_usuario, tipo) VALUES (?, ?)`,
        [userResult.insertId, body.tipo]
      );

      await connection.commit();

      return NextResponse.json({ success: true, id: userResult.insertId }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro no POST /api/usuarios:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

