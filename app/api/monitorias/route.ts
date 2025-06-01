import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { OkPacket, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { cookies } from 'next/headers';

// Interfaces que estavam faltando neste arquivo
interface AlunoParticipante {
  id_usuario: number;
  nome: string;
}

interface DisplayMentorshipGroup {
  representative_id_mentoria: number;
  original_mentoria_ids: number[];
  id_disciplina: number;
  nome_disciplina: string;
  id_monitor: number;
  nome_monitor: string;
  alunos: AlunoParticipante[];
  conteudo_programatico: string;
  data_agendamento: string;
  status: string;
}

interface CreateSessionPayload {
  id_disciplina: number;
  id_monitor: number;
  alunosIds: number[];
  assunto: string;
  data_agendamento: string;
  status?: string;
}

interface IndividualMentoriaDBRecord extends RowDataPacket {
  id_mentoria: number;
  id_disciplina: number;
  id_monitor: number;
  id_aluno: number;
  conteúdo_programático: string;
  data_solicitacao: string | null;
  status: string;
  nome_monitor: string;
  nome_aluno: string;
  nome_disciplina: string;
}

function groupMonitorias(individualMonitorias: IndividualMentoriaDBRecord[]): DisplayMentorshipGroup[] {
  if (!individualMonitorias || individualMonitorias.length === 0) {
    return [];
  }
  const groups = new Map<string, DisplayMentorshipGroup>();

  for (const record of individualMonitorias) {
    let sessionDateKeyPart: string;
    if (record.data_solicitacao === null || record.data_solicitacao === undefined) {
        sessionDateKeyPart = "NULL_DATE_KEY";
    } else {
        try {
            sessionDateKeyPart = new Date(record.data_solicitacao).toISOString().slice(0, 16);
        } catch (_error) { // CORRIGIDO: 'e' para '_error'
            console.warn(`Data inválida encontrada para record ID ${record.id_mentoria}: ${record.data_solicitacao}`, _error);
            sessionDateKeyPart = `INVALID_DATE_${record.data_solicitacao}`;
        }
    }
    
    const groupKey = `${record.id_monitor}-${record.id_disciplina}-${sessionDateKeyPart}-${record.conteúdo_programático}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        representative_id_mentoria: record.id_mentoria,
        original_mentoria_ids: [],
        id_disciplina: record.id_disciplina,
        nome_disciplina: record.nome_disciplina,
        id_monitor: record.id_monitor,
        nome_monitor: record.nome_monitor,
        alunos: [],
        conteudo_programatico: record.conteúdo_programático,
        data_agendamento: record.data_solicitacao || '',
        status: record.status,
      });
    }

    const group = groups.get(groupKey)!;
    group.alunos.push({ id_usuario: record.id_aluno, nome: record.nome_aluno });
    group.original_mentoria_ids.push(record.id_mentoria);
  }
  return Array.from(groups.values());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resumo = searchParams.get('resumo');
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    if (resumo === 'disciplina') {
      // CORRIGIDO: Query SQL restaurada
      const sqlQuery = `
        SELECT d.nome AS disciplina, COUNT(m.id_mentoria) AS quantidade
        FROM disciplinas d
        LEFT JOIN mentorias m ON m.id_disciplina = d.id_disciplina
        GROUP BY d.id_disciplina, d.nome
        ORDER BY d.nome;
      `;
      const [rows] = await connection.query<RowDataPacket[]>(sqlQuery);
      return NextResponse.json(rows);
    }

    const [allIndividualMonitoriasFromDB] = await connection.query<IndividualMentoriaDBRecord[]>(
    `
      SELECT
        m.id_mentoria, m.id_disciplina, m.id_monitor, m.id_aluno,
        m.\`conteúdo_programático\`, m.data_solicitacao, m.status,
        mon.nome AS nome_monitor,
        alu.nome AS nome_aluno,
        d.nome AS nome_disciplina
      FROM mentorias m
      JOIN usuarios mon ON m.id_monitor = mon.id_usuario
      JOIN usuarios alu ON m.id_aluno = alu.id_usuario
      JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
      ORDER BY m.data_solicitacao DESC, m.id_monitor, m.id_disciplina, m.id_mentoria ASC
    `);
    
    const groupedSessions = groupMonitorias(allIndividualMonitoriasFromDB);
    return NextResponse.json(groupedSessions);

  } catch (error: unknown) { // CORRIGIDO: 'error' para '_error' se apenas errorMessage for usado na resposta.
                             // Mas como é usado em console.error, está ok. Se o linter ainda reclamar, use _error.
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar sessões de monitoria:', error); // 'error' é usado aqui.
    return NextResponse.json({ error: 'Erro ao buscar sessões de monitoria', details: errorMessage }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(req: NextRequest) {
  let connection: PoolConnection | null = null; 
  try {
    const cookieStore = await cookies();
    const userTypeCookie = cookieStore.get('userType')?.value;
    if (userTypeCookie !== 'admin') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const body = await req.json() as CreateSessionPayload; // Agora CreateSessionPayload deve ser encontrado
    const { id_disciplina, id_monitor, alunosIds, assunto, data_agendamento } = body;
    const status = body.status || 'confirmada'; 

    if (!id_disciplina || !id_monitor || !alunosIds || alunosIds.length === 0 || !assunto || !data_agendamento) {
      return NextResponse.json({ error: "Campos obrigatórios faltando para criar a sessão." }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const createdMentoriaIds = [];

    for (const alunoId of alunosIds) {
      const [result] = await connection.query<OkPacket>(
        `INSERT INTO mentorias (id_disciplina, id_monitor, id_aluno, \`conteúdo_programático\`, data_solicitacao, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_disciplina, id_monitor, alunoId, assunto, data_agendamento, status]
      );
      createdMentoriaIds.push(result.insertId);
    }

    await connection.commit();
    return NextResponse.json({ message: `Sessão de monitoria cadastrada com sucesso para ${alunosIds.length} aluno(s).`, ids: createdMentoriaIds }, { status: 201 });

  } catch (error: unknown) { // Este 'error' é usado abaixo
    console.error("Erro ao cadastrar sessão de monitoria:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro interno do servidor ao cadastrar sessão.', details: errorMessage }, { status: 500 });
  } finally {
    if (connection) await connection.rollback();
    if (connection) connection.release(); // Adicionado para garantir release mesmo após rollback
  }
}