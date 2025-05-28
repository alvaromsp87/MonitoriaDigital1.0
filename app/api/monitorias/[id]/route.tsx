import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// DELETE - Deletar uma mentoria
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    await pool.query(`DELETE FROM mentorias WHERE id_mentoria = ?`, [id]);
    return NextResponse.json({ message: 'Mentoria excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mentoria:', error);
    return NextResponse.json({ error: 'Erro ao excluir mentoria' }, { status: 500 });
  }
}

// GET - Buscar uma mentoria específica
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // Tipagem explícita para evitar erro TS
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM mentorias WHERE id_mentoria = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Mentoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar mentoria:', error);
    return NextResponse.json({ error: 'Erro ao buscar mentoria' }, { status: 500 });
  }
}
