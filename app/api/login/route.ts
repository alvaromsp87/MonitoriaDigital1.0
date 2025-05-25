import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    const [rows] = await pool.query(
      `
      SELECT u.id_usuario, u.senha, a.tipo
      FROM usuarios u
      INNER JOIN acessos a ON u.id_usuario = a.id_usuario
      WHERE u.email = ?
    `,
      [email]
    );

    const usuarios = Array.isArray(rows) ? rows : [];

    if (usuarios.length === 0) {
      return new NextResponse("Credenciais inválidas", { status: 401 });
    }

    const usuario = usuarios[0] as any;

    const senhaCorreta = await bcrypt.compare(password, usuario.senha);
    if (!senhaCorreta) {
      return new NextResponse("Credenciais inválidas", { status: 401 });
    }

    const response = NextResponse.json({ role: usuario.tipo });

    response.cookies.set("userType", usuario.tipo, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Erro ao processar login:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
