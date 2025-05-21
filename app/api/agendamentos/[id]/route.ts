// app/api/agendamentos/[id]/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const [result] = await pool.query('DELETE FROM agendamentos WHERE id_agendamento = ?', [id]);

    return NextResponse.json({ mensagem: "Agendamento excluído com sucesso!" });
  } catch (err) {
    console.error("Erro ao excluir agendamento:", err);
    return NextResponse.json({ mensagem: "Erro ao excluir agendamento" }, { status: 500 });
  }
}
