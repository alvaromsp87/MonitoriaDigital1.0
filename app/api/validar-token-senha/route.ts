// app/api/validar-token-senha/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Certifique-se de que o caminho para sua conexão com o banco está correto

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 400 });
  }

  try {
    // 1. Buscar o token na tabela password_resets
    const [rows]: any = await pool.query(
      `SELECT user_id, expires_at FROM password_resets WHERE token = ?`,
      [token]
    );

    const tokens = Array.isArray(rows) ? rows : [];

    if (tokens.length === 0) {
      return NextResponse.json({ error: "Token inválido." }, { status: 404 });
    }

    const tokenData = tokens[0];
    const expiresAt = new Date(tokenData.expires_at);

    // 2. Verificar se o token expirou
    if (expiresAt < new Date()) {
      // Opcional: Remover o token expirado do DB para limpeza
      await pool.query(`DELETE FROM password_resets WHERE token = ?`, [token]);
      return NextResponse.json({ error: "Token expirado." }, { status: 400 });
    }

    // Token é válido
    return NextResponse.json({ message: "Token válido." }, { status: 200 });

  } catch (error) {
    console.error("Erro ao validar token de redefinição:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao validar token." }, { status: 500 });
  }
}
