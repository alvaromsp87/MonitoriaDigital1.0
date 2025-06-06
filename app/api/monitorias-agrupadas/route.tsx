// Caminho do arquivo: app/api/monitorias-agrupadas/route.tsx

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

export interface SessaoMonitoriaAgrupada {
  id_representativo: number;
  nome_disciplina: string;
  conteudo_programatico: string;
  status: string;
  data_agendamento: string;
  nomes_alunos: string;
  nome_monitor: string;
}

export async function GET() {
  let connection;
  try {
    const cookieStore = await cookies(); 
    const userId = cookieStore.get('userId')?.value;
    const userRole = cookieStore.get('userType')?.value;

    if (!userId || (userRole !== 'admin' && userRole !== 'monitor')) {
        return NextResponse.json(
            { error: 'Acesso não autorizado.' },
            { status: 403 }
        );
    }
    
    connection = await pool.getConnection();

    // ✅ MUDANÇA: Construindo a query a partir de um array para garantir que não haja espaços/caracteres indesejados.
    const queryParts = [
      'SELECT',
      'MIN(m.id_mentoria) AS id_representativo,',
      'd.nome AS nome_disciplina,',
      'm.`conteúdo_programático` AS conteudo_programatico,',
      'm.status,',
      'm.data_solicitacao AS data_agendamento,',
      'mon.nome AS nome_monitor,',
      "GROUP_CONCAT(u.nome ORDER BY u.nome SEPARATOR ', ') AS nomes_alunos",
      'FROM mentorias m',
      'JOIN disciplinas d ON m.id_disciplina = d.id_disciplina',
      'JOIN usuarios u ON m.id_aluno = u.id_usuario',
      'JOIN usuarios mon ON m.id_monitor = mon.id_usuario'
    ];
    
    const queryParams = [];

    if (userRole === 'monitor') {
        queryParts.push('WHERE m.id_monitor = ?');
        queryParams.push(userId);
    }

    queryParts.push(
      'GROUP BY m.id_monitor, m.id_disciplina, m.`conteúdo_programático`, m.data_solicitacao, m.status, d.nome, mon.nome',
      'ORDER BY m.data_solicitacao DESC'
    );

    const query = queryParts.join(' '); // Junta todas as partes com um espaço entre elas.

    const [rows] = await connection.query(query, queryParams);
    connection.release();

    return NextResponse.json(rows);

  } catch (error) {
    if (connection) connection.release();
    console.error('Erro ao buscar monitorias agrupadas:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar monitorias agrupadas.' },
      { status: 500 }
    );
  }
}
