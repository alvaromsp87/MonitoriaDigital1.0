import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2';

// GET - Listar mentorias
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resumo = searchParams.get('resumo');

  try {
    if (resumo === 'disciplina') {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT d.nome AS disciplina, COUNT(*) AS quantidade
        FROM mentorias m
        JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
        GROUP BY d.nome
      `);

      return NextResponse.json(rows);
    }

    const [all] = await pool.query<RowDataPacket[]>(`
      SELECT 
        m.*, 
        mon.nome AS nome_monitor,
        alu.nome AS nome_aluno,
        d.nome AS nome_disciplina
      FROM mentorias m
      JOIN usuarios mon ON m.id_monitor = mon.id_usuario
      JOIN usuarios alu ON m.id_aluno = alu.id_usuario
      JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
      ORDER BY m.data_solicitacao DESC
    `);

    return NextResponse.json(all);
  } catch (error) {
    console.error('Erro ao buscar mentorias:', error);
    return NextResponse.json({ error: 'Erro ao buscar mentorias' }, { status: 500 });
  }
}

// POST - Cadastrar nova mentoria
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id_monitor,
      id_aluno,
      id_disciplina,
      conteudo_programatico,
      data_solicitacao,
    } = body;

    const [result] = await pool.query<OkPacket>(
      `INSERT INTO mentorias (
        id_monitor, id_aluno, id_disciplina, conteudo_programatico, data_solicitacao
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        id_monitor,
        id_aluno,
        id_disciplina,
        conteudo_programatico,
        data_solicitacao,
      ]
    );

    return NextResponse.json({
      message: 'Mentoria criada com sucesso',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Erro ao criar mentoria:', error);
    return NextResponse.json({ error: 'Erro ao criar mentoria' }, { status: 500 });
  }
}
