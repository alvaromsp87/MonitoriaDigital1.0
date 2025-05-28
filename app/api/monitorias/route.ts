// app/api/monitorias/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2/promise';

// GET - Listar todas as mentorias com nomes
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

    // Query ajustada para usar os nomes corretos das colunas da tabela 'mentorias'
    const [allMonitorias] = await pool.query<RowDataPacket[]>(`
      SELECT 
        m.id_mentoria,
        m.\`conteúdo_programático\`, /* Corrigido: nome da coluna com acento e entre crases */
        m.data_solicitacao,        /* Corrigido: nome da coluna */
        m.status,
        mon.nome AS nome_monitor,
        alu.nome AS nome_aluno,
        d.nome AS nome_disciplina
      FROM mentorias m
      JOIN usuarios mon ON m.id_monitor = mon.id_usuario
      JOIN usuarios alu ON m.id_aluno = alu.id_usuario
      JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
      ORDER BY m.data_solicitacao DESC /* Ordenar pela coluna de data correta */
    `);

    return NextResponse.json(allMonitorias);
  } catch (error: unknown) {
    console.error('Erro ao buscar mentorias:', error);
    let errorMessage = 'Erro ao buscar mentorias';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST - Cadastrar nova(s) monitoria(s) (aceita array)
export async function POST(req: Request) {
  const { mentorships } = await req.json(); 

  if (!mentorships || !Array.isArray(mentorships) || mentorships.length === 0) {
    return NextResponse.json({ error: "Dados de monitoria inválidos." }, { status: 400 });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const createdIds = [];

    for (const mentorship of mentorships) {
      // Payload do frontend: id_disciplina, id_monitor, id_aluno, assunto, data_mentoria, status
      const { id_disciplina, id_monitor, id_aluno, assunto, data_mentoria, status } = mentorship; 

      if (!id_disciplina || !id_monitor || !id_aluno || !assunto || !data_mentoria || !status) {
        throw new Error("Um ou mais campos obrigatórios da monitoria estão faltando no payload.");
      }

      // Query INSERT ajustada para usar os nomes corretos das colunas da tabela 'mentorias'
      // 'assunto' do frontend vai para 'conteúdo_programático' no DB
      // 'data_mentoria' do frontend vai para 'data_solicitacao' no DB
      const [result] = await connection.query<OkPacket>(
        `
          INSERT INTO mentorias (id_disciplina, id_monitor, id_aluno, \`conteúdo_programático\`, data_solicitacao, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [id_disciplina, id_monitor, id_aluno, assunto, data_mentoria, status] 
      );
      createdIds.push(result.insertId);
    }

    await connection.commit();
    return NextResponse.json({ message: "Monitoria(s) cadastrada(s) com sucesso!", ids: createdIds }, { status: 201 });

  } catch (error: unknown) { 
    console.error("Erro ao cadastrar monitoria:", error);
    if (connection) {
      await connection.rollback(); 
    }
    
    let errorMessage = "Erro interno do servidor ao cadastrar monitoria.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}