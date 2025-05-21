// app/api/agendamentos/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json();

  const { id_mentoria, data_agendada, status } = body;

  if (!id_mentoria || !data_agendada || !status) {
    return NextResponse.json({ mensagem: 'Dados incompletos.' }, { status: 400 });
  }

  try {
    const [result]: any = await pool.query(
      'INSERT INTO agendamentos (id_mentoria, data_agendada, status) VALUES (?, ?, ?)',
      [id_mentoria, data_agendada, status]
    );

    return NextResponse.json({ mensagem: 'Agendamento criado com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ mensagem: 'Erro ao criar agendamento.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");

  try {
    let query = 'SELECT * FROM agendamentos';
    const params: any[] = [];

    if (data) {
      query += ' WHERE DATE(data_agendada) = ?';
      params.push(data);
    }

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json({ mensagem: 'Erro ao buscar agendamentos.' }, { status: 500 });
  }
}
