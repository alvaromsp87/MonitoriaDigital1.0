// app/api/agendamentos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// PATCH: Atualizar status de agendamento
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { status } = await req.json();

  if (!['REALIZADA','PENDENTE', 'CONFIRMADO', 'CANCELADO'].includes(status)) {
    return NextResponse.json({ mensagem: 'Status inválido' }, { status: 400 });
  }

  try {
    await pool.query('UPDATE agendamentos SET status = ? WHERE id_agendamento = ?', [status, id]);
    return NextResponse.json({ mensagem: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json({ mensagem: 'Erro ao atualizar status' }, { status: 500 });
  }
}
