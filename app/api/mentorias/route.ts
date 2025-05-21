// app/api/mentorias/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        m.id_mentoria, 
        d.nome AS disciplina,
        m.id_disciplina
      FROM mentorias m
      JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao buscar mentorias:', error);
    return NextResponse.json({ mensagem: 'Erro ao buscar mentorias.' }, { status: 500 });
  }
}
