// app/api/students/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `
        SELECT u.id_usuario, u.nome
        FROM usuarios u
        JOIN acessos a ON u.id_usuario = a.id_usuario
        WHERE a.tipo = 'aluno'
        ORDER BY u.nome
      `
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    return NextResponse.json({ error: "Erro ao buscar alunos." }, { status: 500 });
  }
}
