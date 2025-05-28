import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { OkPacket, RowDataPacket } from 'mysql2';
import crypto from 'crypto';

type Agendamento = {
  id_agendamento: number;
  id_mentoria: number;
  data_agendada: string;
  status: string;
  room_name?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resumo = searchParams.get('resumo');

  try {
    // Resumo por status
    if (resumo === 'status') {
      const [statusRows] = await pool.query<RowDataPacket[]>(`
        SELECT status, COUNT(*) AS quantidade
        FROM agendamentos
        GROUP BY status
      `);

      const statusResumo = statusRows.map(row => ({
        status: row.status,
        quantidade: row.quantidade,
      }));

      return NextResponse.json(statusResumo);
    }

    // Resumo para dashboard
    if (resumo === 'true') {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT a.id_agendamento, a.data_agendada, d.nome AS disciplina
        FROM agendamentos a
        JOIN mentorias m ON a.id_mentoria = m.id_mentoria
        JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
        ORDER BY a.data_agendada DESC
      `);

      const agendamentos = rows.map(row => ({
        id_agendamento: row.id_agendamento,
        data_agendada: row.data_agendada,
        disciplina: row.disciplina,
      }));

      return NextResponse.json(agendamentos);
    }

    // Retorno completo
    const [all] = await pool.query<RowDataPacket[]>(`SELECT * FROM agendamentos`);

    const agendamentos = all.map(row => ({
      id_agendamento: row.id_agendamento,
      id_mentoria: row.id_mentoria,
      data_agendada: row.data_agendada,
      status: row.status,
      room_name: row.room_name,
    }));

    return NextResponse.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const body: Omit<Agendamento, 'id_agendamento'> = await req.json();
    const {
      id_mentoria,
      data_agendada,
      status,
      room_name,
    } = body;

    // Gera room_name aleatório se não enviado
    const finalRoomName =
      room_name || `sala-${crypto.randomBytes(6).toString('hex')}`;

    const [result] = await pool.query<OkPacket>(
      `INSERT INTO agendamentos (
        id_mentoria, data_agendada, status, room_name
      ) VALUES (?, ?, ?, ?)`,
      [
        id_mentoria,
        data_agendada,
        status || 'pendente',
        finalRoomName,
      ]
    );

    return NextResponse.json({
      message: 'Agendamento criado com sucesso',
      id: result.insertId,
      roomName: finalRoomName,
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
  }
}
