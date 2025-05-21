import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { OkPacket, RowDataPacket } from 'mysql2/promise';

// GET - Listar todos usuários
export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT u.*, a.tipo 
      FROM usuarios u
      JOIN acessos a ON u.id_usuario = a.id_usuario
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro no GET /api/usuarios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// POST - Criar novo usuário
export async function POST(request: Request) {
  let connection;
  try {
    connection = await pool.getConnection();
    const body = await request.json();
    
    // Validação dos campos obrigatórios
    if (!body.nome || !body.email || !body.senha || !body.tipo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    try {
      // 1. Cria o usuário
      const hashedPassword = await bcrypt.hash(body.senha, 10);
      const [userResult] = await pool.query<OkPacket>(
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

      // 2. Cria o acesso
      await pool.query(
        `INSERT INTO acessos (id_usuario, tipo) VALUES (?, ?)`,
        [userResult.insertId, body.tipo]
      );

      await connection.commit();

      return NextResponse.json(
        { success: true, id: userResult.insertId },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro no POST /api/usuarios:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}