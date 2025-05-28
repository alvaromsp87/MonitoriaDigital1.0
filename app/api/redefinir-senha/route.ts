// app/api/redefinir-senha/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Certifique-se de que o caminho para sua conexão com o banco está correto
import bcrypt from "bcryptjs"; // Para criptografar a nova senha

export async function POST(req: Request) {
  const { token, newPassword } = await req.json();

  if (!token || !newPassword) {
    return NextResponse.json({ error: "Token e nova senha são obrigatórios." }, { status: 400 });
  }

  try {
    // 1. Buscar o token na tabela password_resets e verificar validade
    const [rows]: any = await pool.query(
      `SELECT user_id, expires_at FROM password_resets WHERE token = ?`,
      [token]
    );

    const tokens = Array.isArray(rows) ? rows : [];

    if (tokens.length === 0) {
      return NextResponse.json({ error: "Token inválido ou já utilizado." }, { status: 404 });
    }

    const tokenData = tokens[0];
    const expiresAt = new Date(tokenData.expires_at);
    const userId = tokenData.user_id;

    if (expiresAt < new Date()) {
      // Remover o token expirado do DB para limpeza
      await pool.query(`DELETE FROM password_resets WHERE token = ?`, [token]);
      return NextResponse.json({ error: "Token expirado. Por favor, solicite um novo." }, { status: 400 });
    }

    // 2. Criptografar a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Criptografia da senha

    // 3. Atualizar a senha do usuário na tabela 'usuarios'
    await pool.query(
      `UPDATE usuarios SET senha = ? WHERE id_usuario = ?`,
      [hashedPassword, userId]
    );

    // 4. Remover o token de recuperação (usado) do banco de dados para evitar reutilização
    await pool.query(`DELETE FROM password_resets WHERE token = ?`, [token]);

    return NextResponse.json({ message: "Senha redefinida com sucesso!" }, { status: 200 });

  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao redefinir senha." }, { status: 500 });
  }
}
