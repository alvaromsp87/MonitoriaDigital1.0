// app/api/aluno/agendamentos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface AlunoAgendamentoDbRow extends RowDataPacket {
    id_agendamento: number;
    data_agendada: string;
    status: string;
    // A coluna 'turma' foi removida desta interface
    room_name: string | null;
    disciplina_nome: string;
    monitor_nome: string;
    observacoes: string | null;
    id_monitor_responsavel: number;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const statusFiltro = searchParams.get('status');
    let connection;

    try {
        const cookieStore = await cookies();
        const alunoId = cookieStore.get('userId')?.value;

        if (!alunoId) {
            return NextResponse.json({ error: 'Aluno não autenticado.' }, { status: 401 });
        }

        connection = await pool.getConnection();
        
        // A coluna 'ag.turma' foi removida da query SQL
        let query = `
            SELECT
                ag.id_agendamento,
                ag.data_agendada,
                ag.status,
                ag.room_name,
                d.nome AS disciplina_nome,
                u_monitor.nome AS monitor_nome,
                m.conteúdo_programático AS observacoes, 
                m.id_monitor AS id_monitor_responsavel 
            FROM agendamentos ag
            JOIN mentorias m ON ag.id_mentoria = m.id_mentoria
            JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
            JOIN usuarios u_monitor ON m.id_monitor = u_monitor.id_usuario
            WHERE m.id_aluno = ? 
        `;
        const queryParams: (string | number)[] = [alunoId];

        if (statusFiltro) {
            query += ` AND ag.status = ?`;
            queryParams.push(statusFiltro.toLowerCase()); 
        }
        query += ` ORDER BY ag.data_agendada ASC`;

        const [rows] = await connection.query<AlunoAgendamentoDbRow[]>(query, queryParams);
        
        const typedRows = rows.map(row => ({
            ...row,
            status: row.status.toLowerCase(),
        }));
        return NextResponse.json(typedRows);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('Erro ao buscar agendamentos do aluno:', error);
        return NextResponse.json({ error: 'Erro ao buscar agendamentos.', details: errorMessage }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}