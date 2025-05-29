// app/api/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db"; // Certifique-se de que o caminho para sua conexão com o banco está correto
import bcrypt from "bcryptjs"; // Para comparar senhas criptografadas

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    // 1. Buscar o usuário e seu tipo de acesso no banco de dados
    const [rows]: any = await pool.query(
      `
        SELECT u.id_usuario, u.nome, u.senha, a.tipo
        FROM usuarios u
        INNER JOIN acessos a ON u.id_usuario = a.id_usuario
        WHERE u.email = ?
      `,
      [email]
    );

    const usuarios = Array.isArray(rows) ? rows : [];

    // Se nenhum usuário for encontrado com o e-mail fornecido
    if (usuarios.length === 0) {
      // Por segurança, retorne uma mensagem genérica para não indicar se o e-mail existe ou não
      return new NextResponse("E-mail ou senha inválidos!", { status: 401 });
    }

    const usuario = usuarios[0] as any; // Pega o primeiro usuário encontrado

    // 2. Comparar a senha fornecida com a senha HASHED do banco de dados
    const senhaCorreta = await bcrypt.compare(password, usuario.senha);
    if (!senhaCorreta) {
      return new NextResponse("E-mail ou senha inválidos!", { status: 401 });
    }

    // 3. Se a senha estiver correta, criar a resposta e definir os cookies
    const responsePayload = {
      success: true,
      message: "Login bem-sucedido!",
      userId: usuario.id_usuario, // Pega o ID real do banco
      role: usuario.tipo,         // Pega a role real do banco
      userName: usuario.nome,     // Pega o nome real do banco
    };
    
    const response = NextResponse.json(responsePayload);

    // Definir cookies no servidor (httpOnly para segurança)
    const cookieOptions = {
      path: "/",
      httpOnly: true, // Torna o cookie inacessível via JavaScript no navegador (mais seguro)
      secure: process.env.NODE_ENV === "production", // Usar 'secure' em produção (HTTPS)
      sameSite: "lax" as const, // 'lax' ou 'strict' para proteção CSRF
      maxAge: 60 * 60 * 24 * 7, // Expira em 7 dias
    };

    response.cookies.set("userId", String(usuario.id_usuario), cookieOptions);
    response.cookies.set("userType", usuario.tipo, cookieOptions);
    response.cookies.set("userName", usuario.nome, cookieOptions);

    return response;

  } catch (error) {
    console.error("Erro ao processar login:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
