// app/api/mentorias/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type Mentoria = {
  id_mentoria: number;
  disciplina: string;
  id_disciplina: number;
};

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        m.id_mentoria, 
        d.nome AS disciplina,
        m.id_disciplina
      FROM mentorias m
      JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
    `);

    // rows já é RowDataPacket[], que tem as propriedades da query
    const mentorias: Mentoria[] = rows.map(row => ({
      id_mentoria: row.id_mentoria,
      disciplina: row.disciplina,
      id_disciplina: row.id_disciplina,
    }));

    return NextResponse.json(mentorias);
  } catch (error) {
    console.error('Erro ao buscar mentorias:', error);
    return NextResponse.json({ mensagem: 'Erro ao buscar mentorias.' }, { status: 500 });
  }
}
