// app/api/disciplines/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      `SELECT id_disciplina, nome FROM disciplinas ORDER BY nome`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar disciplinas:", error);
    return NextResponse.json({ error: "Erro ao buscar disciplinas." }, { status: 500 });
  }
}
