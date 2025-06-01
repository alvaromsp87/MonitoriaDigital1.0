// 📁 app/api/agendamentos/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2/promise';
import { cookies } from 'next/headers'; 
import crypto from 'crypto';

interface MySQLError extends Error {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  sqlState?: string;
  sql?: string;
}

interface AgendamentoFromDB extends RowDataPacket {
  id_agendamento: number;
  data_agendada: string;
  disciplina_nome?: string; 
  aluno_nome?: string;      
  monitor_nome?: string;    
  status: string;
  room_name?: string;
  observacoes?: string; // Virá de m.conteúdo_programático
}

interface AgendamentoPayload {
  id_mentoria: number;
  data_agendada: string; 
  status?: string;
  room_name?: string;
}

interface StatusResumoFromDB extends RowDataPacket {
  status: string;
  quantidade: number;
}

async function getAuthenticatedUser(): Promise<{ id: number; role: string } | null> {
  const cookieStore = await cookies(); 
  const userIdCookie = cookieStore.get('userId');
  const userRoleCookie = cookieStore.get('userType'); 

  if (userIdCookie?.value && userRoleCookie?.value) {
    const id = parseInt(userIdCookie.value, 10);
    if (!isNaN(id)) {
      return { id, role: userRoleCookie.value };
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const resumo = searchParams.get('resumo');
  const specificMonitorIdParam = searchParams.get('monitorId');
  const specificAlunoIdParam = searchParams.get('alunoId'); 

  let userIdForFilter = authenticatedUser.id; 
  const userRoleForLogic = authenticatedUser.role; // Use const
  
  type FilterTypeValue = 'aluno' | 'monitor' | 'all' | 'specific_monitor' | 'specific_aluno';
  let filterType: FilterTypeValue;

  if (userRoleForLogic === 'admin') {
    if (specificMonitorIdParam) {
      const parsedId = parseInt(specificMonitorIdParam, 10);
      if(!isNaN(parsedId)) userIdForFilter = parsedId;
      filterType = 'specific_monitor';
    } else if (specificAlunoIdParam) {
      const parsedId = parseInt(specificAlunoIdParam, 10);
      if(!isNaN(parsedId)) userIdForFilter = parsedId;
      filterType = 'specific_aluno';
    } else {
      filterType = 'all'; 
    }
  } else if (userRoleForLogic === 'monitor') {
    filterType = 'monitor';
  } else if (userRoleForLogic === 'aluno') {
    filterType = 'aluno';
  } else {
     return NextResponse.json({ error: "Perfil de usuário desconhecido para esta operação." }, { status: 403 });
  }
  
  console.log(`[API GET /agendamentos] FilterType: ${filterType}, UserIDForFilter: ${userIdForFilter}, LoggedInRole: ${authenticatedUser.role}, Resumo: ${resumo}`);

  try {
    if (resumo === 'status') {
      let sqlStatusQuery = '';
      let queryParams: number[] = [];

      switch (filterType) {
        case 'monitor':
        case 'specific_monitor':
          sqlStatusQuery = `
            SELECT ag.status, COUNT(*) AS quantidade
            FROM agendamentos ag
            JOIN mentorias m ON ag.id_mentoria = m.id_mentoria
            WHERE m.id_monitor = ?
            GROUP BY ag.status;
          `;
          queryParams = [userIdForFilter];
          break;
        case 'aluno':
        case 'specific_aluno':
          sqlStatusQuery = `
            SELECT ag.status, COUNT(*) AS quantidade
            FROM agendamentos ag
            JOIN mentorias m ON ag.id_mentoria = m.id_mentoria
            WHERE m.id_aluno = ?
            GROUP BY ag.status;
          `;
          queryParams = [userIdForFilter];
          break;
        case 'all': 
          sqlStatusQuery = `
            SELECT ag.status, COUNT(*) AS quantidade
            FROM agendamentos ag
            GROUP BY ag.status;
          `;
          break;
        // No default, as filterType is validated
      }
      console.log(`[API GET /agendamentos] SQL Status Query: ${sqlStatusQuery.trim().replace(/\s+/g, ' ')} with params: ${JSON.stringify(queryParams)}`);
      const [statusRows] = await pool.execute<StatusResumoFromDB[]>(sqlStatusQuery, queryParams);
      console.log(`[API GET /agendamentos] Status Rows Found: ${statusRows.length}, Data: ${JSON.stringify(statusRows)}`);
      return NextResponse.json(statusRows);
    }

    if (resumo === 'true') {
      let sqlAgendamentosQuery = '';
      let queryParams: number[] = [];
      
      const baseSelect = `
        SELECT 
          ag.id_agendamento, 
          DATE_FORMAT(ag.data_agendada, '%Y-%m-%dT%TZ') as data_agendada, 
          d.nome AS disciplina_nome,
          ua.nome as aluno_nome, 
          um.nome as monitor_nome, 
          m.conteúdo_programático as observacoes, -- NOME DA COLUNA CORRIGIDO
          ag.status,
          ag.room_name
        FROM agendamentos ag
        JOIN mentorias m ON ag.id_mentoria = m.id_mentoria
        JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
        JOIN usuarios ua ON m.id_aluno = ua.id_usuario 
        JOIN usuarios um ON m.id_monitor = um.id_usuario 
      `;

      switch (filterType) {
        case 'monitor':
        case 'specific_monitor':
          sqlAgendamentosQuery = `${baseSelect} WHERE m.id_monitor = ? ORDER BY ag.data_agendada DESC;`;
          queryParams = [userIdForFilter];
          break;
        case 'aluno':
        case 'specific_aluno':
          sqlAgendamentosQuery = `${baseSelect} WHERE m.id_aluno = ? ORDER BY ag.data_agendada DESC;`;
          queryParams = [userIdForFilter];
          break;
        case 'all': 
          sqlAgendamentosQuery = `${baseSelect} ORDER BY ag.data_agendada DESC;`;
          break;
        // No default, as filterType is validated
      }
      
      console.log(`[API GET /agendamentos] SQL Agendamentos Query: ${sqlAgendamentosQuery.trim().replace(/\s+/g, ' ')} with params: ${JSON.stringify(queryParams)}`);
      const [agendamentoRows] = await pool.execute<AgendamentoFromDB[]>(sqlAgendamentosQuery, queryParams);
      console.log(`[API GET /agendamentos] Agendamento Rows Found: ${agendamentoRows.length}, Data: ${JSON.stringify(agendamentoRows)}`);
      
      const formattedAgendamentos = agendamentoRows.map(row => ({
        id_agendamento: row.id_agendamento,
        data_agendada: row.data_agendada,
        disciplina: row.disciplina_nome, 
        aluno: row.aluno_nome,          
        monitor_nome: row.monitor_nome,   
        status: row.status,
        room_name: row.room_name,
        observacoes: row.observacoes,
      }));
      return NextResponse.json(formattedAgendamentos);
    }

    return NextResponse.json({ error: "Parâmetro 'resumo' (true ou status) é obrigatório." }, { status: 400 });

  } catch (error: unknown) { 
    console.error('[API GET /agendamentos] Erro ao buscar agendamentos:', error);
    if (error instanceof Error && 'sqlMessage' in error && typeof (error as MySQLError).sqlMessage === 'string') {
        return NextResponse.json({ 
            error: 'Erro de SQL ao processar sua solicitação.', 
            details: (error as MySQLError).sqlMessage 
        }, { status: 500 });
    }
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Erro interno do servidor ao processar sua solicitação.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor ao processar sua solicitação.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }
  
  if (authenticatedUser.role !== 'monitor' && authenticatedUser.role !== 'admin') {
     return NextResponse.json({ error: "Apenas monitores ou administradores podem criar agendamentos." }, { status: 403 });
  }

  try {
    const body = await req.json() as AgendamentoPayload; 
    
    if (!body.id_mentoria || !body.data_agendada) {
        return NextResponse.json({ error: "id_mentoria e data_agendada são obrigatórios." }, { status: 400 });
    }

    if (authenticatedUser.role === 'monitor') {
        const [mentoriaCheck] = await pool.execute<RowDataPacket[]>(
            "SELECT id_monitor FROM mentorias WHERE id_mentoria = ?",
            [body.id_mentoria]
        );
        if (mentoriaCheck.length === 0 || mentoriaCheck[0].id_monitor !== authenticatedUser.id) {
           return NextResponse.json({ error: "Mentoria inválida ou não pertence a este monitor." }, { status: 403 });
        }
    }
    
    const finalRoomName = body.room_name || `sala-${crypto.randomBytes(6).toString('hex')}`;
    const statusFinal = body.status || 'PENDENTE';

    if (isNaN(new Date(body.data_agendada).getTime())) {
        return NextResponse.json({ error: "Formato de data_agendada inválido." }, { status: 400 });
    }

    const [result] = await pool.execute<OkPacket>(
      `INSERT INTO agendamentos (id_mentoria, data_agendada, status, room_name) 
       VALUES (?, ?, ?, ?)`,
      [body.id_mentoria, body.data_agendada, statusFinal, finalRoomName]
    );

    if (result.insertId) {
      const [newAgendamentoRows] = await pool.execute<AgendamentoFromDB[] & RowDataPacket[]>(
        `SELECT 
            ag.id_agendamento, ag.id_mentoria, 
            DATE_FORMAT(ag.data_agendada, '%Y-%m-%dT%TZ') as data_agendada, 
            ag.status, ag.room_name,
            d.nome as disciplina_nome, um.nome as monitor_nome, ua.nome as aluno_nome,
            m.conteúdo_programático as observacoes -- NOME DA COLUNA CORRIGIDO
         FROM agendamentos ag
         JOIN mentorias m ON ag.id_mentoria = m.id_mentoria
         JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
         JOIN usuarios um ON m.id_monitor = um.id_usuario
         JOIN usuarios ua ON m.id_aluno = ua.id_usuario
         WHERE ag.id_agendamento = ?`,
        [result.insertId]
      );
      
      const newAgendamento = newAgendamentoRows[0];
      return NextResponse.json({
        message: 'Agendamento criado com sucesso!',
        agendamento: { 
            id_agendamento: newAgendamento.id_agendamento,
            id_mentoria: newAgendamento.id_mentoria,
            data_agendada: newAgendamento.data_agendada,
            status: newAgendamento.status,
            room_name: newAgendamento.room_name,
            disciplina: newAgendamento.disciplina_nome,
            monitor_nome: newAgendamento.monitor_nome,
            aluno_nome: newAgendamento.aluno_nome,
            observacoes: newAgendamento.observacoes,
        }
      }, { status: 201 });
    } else {
      throw new Error("Falha ao obter ID do agendamento inserido.");
    }

  } catch (error: unknown) { 
    console.error('[API POST /agendamentos] Erro ao criar agendamento:', error);
    if (error instanceof SyntaxError) { 
        return NextResponse.json({ error: 'Corpo da requisição inválido (JSON malformado).' }, { status: 400 });
    }
    
    const errorMessageDefault = 'Erro interno do servidor ao criar agendamento.';
    
    if (error instanceof Error && 'sqlMessage' in error && typeof (error as MySQLError).sqlMessage === 'string') {
        return NextResponse.json({ 
            error: 'Erro de SQL ao criar agendamento.', 
            details: (error as MySQLError).sqlMessage 
        }, { status: 500 });
    }
    if (error instanceof Error) {
        return NextResponse.json({ error: errorMessageDefault, details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: errorMessageDefault }, { status: 500 });
  }
}