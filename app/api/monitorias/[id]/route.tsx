import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { OkPacket, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { cookies } from 'next/headers';

interface UpdateSessionPayload {
  alunosIds: number[];
  assunto: string;
  data_agendamento: string;
  status: string;
  original_mentoria_ids?: number[];
}

interface MentoriaIndividualComNomes extends RowDataPacket {
    id_mentoria: number;
    id_disciplina: number;
    nome_disciplina: string;
    id_monitor: number;
    nome_monitor: string;
    id_aluno: number;
    nome_aluno: string;
    conteúdo_programático: string;
    data_solicitacao: string | null;
    status: string;
}

async function getGroupMembers(connection: PoolConnection, representativeMentoriaId: number | string): Promise<MentoriaIndividualComNomes[]> {
    const [representativeRecordRows] = await connection.query<MentoriaIndividualComNomes[]>(
        `SELECT id_monitor, id_disciplina, data_solicitacao, \`conteúdo_programático\`
         FROM mentorias 
         WHERE id_mentoria = ?`,
        [representativeMentoriaId]
    );

    if (representativeRecordRows.length === 0) {
        console.warn(`[getGroupMembers] Registro representativo ID ${representativeMentoriaId} não encontrado.`);
        return [];
    }
    const repRecord = representativeRecordRows[0];

    let representativeDateKeyPart: string;
    if (repRecord.data_solicitacao === null || repRecord.data_solicitacao === undefined) {
        representativeDateKeyPart = "NULL_DATE_KEY";
    } else {
        try {
            representativeDateKeyPart = new Date(repRecord.data_solicitacao).toISOString().slice(0, 16);
        } catch (_errorCaught) { 
            console.error(`[getGroupMembers] Data inválida no registro representativo ${representativeMentoriaId}: ${repRecord.data_solicitacao}`, _errorCaught);
            return []; 
        }
    }

    const [potentialGroupMembers] = await connection.query<MentoriaIndividualComNomes[]>(
        `SELECT m.id_mentoria, m.id_disciplina, d.nome AS nome_disciplina,
                m.id_monitor, mon_user.nome AS nome_monitor,
                m.id_aluno, u.nome AS nome_aluno,
                m.\`conteúdo_programático\`, m.data_solicitacao, m.status
         FROM mentorias m
         JOIN usuarios u ON m.id_aluno = u.id_usuario
         JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
         JOIN usuarios mon_user ON m.id_monitor = mon_user.id_usuario
         WHERE m.id_monitor = ? AND m.id_disciplina = ? AND m.\`conteúdo_programático\` = ?
         ORDER BY m.id_aluno`,
        [repRecord.id_monitor, repRecord.id_disciplina, repRecord.conteúdo_programático]
    );

    const actualGroupMembers = potentialGroupMembers.filter(member => {
        let memberDateKeyPart: string;
        if (member.data_solicitacao === null || member.data_solicitacao === undefined) {
            memberDateKeyPart = "NULL_DATE_KEY";
        } else {
            try {
                memberDateKeyPart = new Date(member.data_solicitacao).toISOString().slice(0, 16);
            } catch (_errorCaught) { // CORRIGIDO: Usar a variável de erro _errorCaught
                console.error(`[getGroupMembers] Data inválida para membro ${member.id_mentoria} (ID Mentoria) durante filtro: ${member.data_solicitacao}`, _errorCaught); 
                return false; 
            }
        }
        return memberDateKeyPart === representativeDateKeyPart;
    });
    
    if (actualGroupMembers.length === 0) {
        // Este log é útil para saber por que um grupo não foi formado como esperado
        console.warn(`[getGroupMembers] Nenhum membro encontrado para o grupo do ID representativo ${representativeMentoriaId} após filtro de data. Critérios usados para busca inicial: Monitor=${repRecord.id_monitor}, Disciplina=${repRecord.id_disciplina}, Assunto='${repRecord.conteúdo_programático}'. Chave de data representativa: '${representativeDateKeyPart}'. Número de membros potenciais antes do filtro de data: ${potentialGroupMembers.length}`);
    }
    return actualGroupMembers;
}

// ... (O restante do arquivo GET, PUT, DELETE handlers permanecem os mesmos) ...
// GET Handler
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const representativeMentoriaId = params.id;
  let connection: PoolConnection | null = null; 
  try {
    connection = await pool.getConnection();
    const groupMembers = await getGroupMembers(connection, representativeMentoriaId);

    if (groupMembers.length === 0) {
      return NextResponse.json({ error: 'Sessão de monitoria não encontrada' }, { status: 404 });
    }

    const firstMember = groupMembers[0];
    const responseGroup = {
      representative_id_mentoria: parseInt(representativeMentoriaId), 
      original_mentoria_ids: groupMembers.map(m => m.id_mentoria),
      id_disciplina: firstMember.id_disciplina,
      nome_disciplina: firstMember.nome_disciplina, 
      id_monitor: firstMember.id_monitor,
      nome_monitor: firstMember.nome_monitor, 
      alunos: groupMembers.map(m => ({ id_usuario: String(m.id_aluno), nome: m.nome_aluno })),
      assunto: firstMember.conteúdo_programático,
      data_agendamento: firstMember.data_solicitacao || '', 
      status: firstMember.status,
    };

    return NextResponse.json(responseGroup);
  } catch (error: unknown) {
    console.error(`[API GET /api/monitorias/${representativeMentoriaId}] Erro ao buscar sessão:`, error);
    const message = error instanceof Error ? error.message : "Erro desconhecido ao buscar sessão."
    return NextResponse.json({ error: 'Erro ao buscar sessão de monitoria', details: message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PUT Handler
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const representativeMentoriaId = params.id;
  let connection: PoolConnection | null = null; 

  try {
    const cookieStore = await cookies();
    const userTypeCookie = cookieStore.get('userType')?.value;
    if (userTypeCookie !== 'admin') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const body = await req.json() as UpdateSessionPayload;
    const { alunosIds, assunto, data_agendamento, status } = body;

    if (!alunosIds || alunosIds.length === 0 || !assunto || !data_agendamento || !status) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando para atualizar a sessão.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const originalGroupMembers = await getGroupMembers(connection, representativeMentoriaId);
    if (originalGroupMembers.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Sessão de monitoria original não encontrada para atualização.' }, { status: 404 });
    }

    const firstOriginalMember = originalGroupMembers[0];
    const id_disciplina = firstOriginalMember.id_disciplina; 
    const id_monitor = firstOriginalMember.id_monitor;

    const newAlunosIdsSet = new Set(alunosIds.map(id => Number(id))); 

    for (const member of originalGroupMembers) {
      if (!newAlunosIdsSet.has(member.id_aluno)) {
        await connection.query<OkPacket>('DELETE FROM mentorias WHERE id_mentoria = ?', [member.id_mentoria]);
      }
    }

    for (const alunoId of alunosIds.map(id => Number(id))) { 
      const existingMemberRecord = originalGroupMembers.find(m => m.id_aluno === alunoId);
      if (existingMemberRecord) {
        await connection.query<OkPacket>(
          `UPDATE mentorias SET \`conteúdo_programático\` = ?, data_solicitacao = ?, status = ? 
           WHERE id_mentoria = ?`,
          [assunto, data_agendamento, status, existingMemberRecord.id_mentoria]
        );
      } else {
        await connection.query<OkPacket>(
          `INSERT INTO mentorias (id_disciplina, id_monitor, id_aluno, \`conteúdo_programático\`, data_solicitacao, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id_disciplina, id_monitor, alunoId, assunto, data_agendamento, status]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ message: 'Sessão de monitoria atualizada com sucesso' });

  } catch (error: unknown) {
    console.error(`[API PUT /api/monitorias/${representativeMentoriaId}] Erro ao atualizar sessão:`, error);
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : "Erro desconhecido ao atualizar sessão."
    return NextResponse.json({ error: 'Erro interno ao atualizar sessão.', details: message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// DELETE Handler
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const representativeMentoriaId = params.id;
  let connection: PoolConnection | null = null; 
  try {
    const cookieStore = await cookies();
    const userTypeCookie = cookieStore.get('userType')?.value;
    if (userTypeCookie !== 'admin') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const groupMembersToDelete = await getGroupMembers(connection, representativeMentoriaId);
    if (groupMembersToDelete.length === 0) {
      await connection.rollback(); 
      return NextResponse.json({ error: 'Sessão de monitoria não encontrada para exclusão.' }, { status: 404 });
    }

    for (const member of groupMembersToDelete) {
      await connection.query<OkPacket>('DELETE FROM mentorias WHERE id_mentoria = ?', [member.id_mentoria]);
    }

    await connection.commit();
    return NextResponse.json({ message: 'Sessão de monitoria e todas as participações associadas foram excluídas com sucesso' });
  } catch (error: unknown) {
    console.error(`[API DELETE /api/monitorias/${representativeMentoriaId}] Erro ao excluir sessão:`, error);
    const message = error instanceof Error ? error.message : "Erro desconhecido ao excluir sessão."
    return NextResponse.json({ error: 'Erro ao excluir sessão de monitoria', details: message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}