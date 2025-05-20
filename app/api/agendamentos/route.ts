// app/api/agendamentos/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');

  if (!data) return NextResponse.json({ erro: 'Data não fornecida' }, { status: 400 });

  const dataInicio = `${data} 00:00:00`;
  const dataFim = `${data} 23:59:59`;

  const [rows] = await pool.query(
    'SELECT data_agendada FROM agendamentos WHERE data_agendada BETWEEN ? AND ? AND status != "CANCELADO"',
    [dataInicio, dataFim]
  );

  const horariosOcupados = (rows as any[]).map(row =>
    new Date(row.data_agendada).toISOString().split('T')[1].slice(0, 5)
  );

  return NextResponse.json(horariosOcupados);
}

export async function POST(request: Request) {
  try {
    const { id_mentoria, data_agendada, status } = await request.json();

    if (!id_mentoria || !data_agendada) {
      return NextResponse.json({ erro: 'id_mentoria e data_agendada são obrigatórios' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO agendamentos (id_mentoria, data_agendada, status) VALUES (?, ?, ?)',
      [id_mentoria, data_agendada, status || 'PENDENTE']
    );

    // Se quiser retornar o insertId (depende do driver MySQL)
    // @ts-ignore
    const insertId = result.insertId;

    return NextResponse.json({ mensagem: 'Agendamento criado com sucesso!', id: insertId });
  } catch (erro) {
    console.error('Erro ao criar agendamento:', erro);
    return NextResponse.json({ mensagem: 'Erro ao agendar' }, { status: 500 });
  }
}

