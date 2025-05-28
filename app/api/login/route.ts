// app/api/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // Importar para definir cookies no servidor

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // Simulação de usuários e IDs. Substitua pela lógica do seu banco de dados.
  const mockAdmin = { id: 1, nome: "Admin Principal", email: "admin@exemplo.com", tipo: "admin", senhaPlana: "123456" };
  const mockMonitor = { id: 2, nome: "Monitor Alfa", email: "monitor@exemplo.com", tipo: "monitor", senhaPlana: "123456" };
  const mockAluno = { id: 3, nome: "Aluno Beta", email: "user@exemplo.com", tipo: "aluno", senhaPlana: "123456" }; // user no email, mas tipo aluno

  let userToAuthenticate = null;

  if (email === mockAdmin.email && password === mockAdmin.senhaPlana) {
    userToAuthenticate = mockAdmin;
  } else if (email === mockMonitor.email && password === mockMonitor.senhaPlana) {
    userToAuthenticate = mockMonitor;
  } else if (email === mockAluno.email && password === mockAluno.senhaPlana) {
    userToAuthenticate = mockAluno;
  }

  if (userToAuthenticate) {
    const responsePayload = {
      success: true,
      message: "Login bem-sucedido!",
      userId: userToAuthenticate.id,
      role: userToAuthenticate.tipo, // O AuthContext espera 'role'
      userName: userToAuthenticate.nome,
    };
    
    const response = NextResponse.json(responsePayload);

    // Definir cookies no servidor
    // O AuthContext também define cookies no cliente com base na resposta JSON.
    // Os cookies httpOnly do servidor são para segurança e uso em API routes.
    const cookieOptions = {
      path: "/",
      httpOnly: true, // Mais seguro, não acessível via JavaScript do lado do cliente
      secure: process.env.NODE_ENV === "production", // Usar 'secure' em produção (HTTPS)
      sameSite: "lax" as const, // 'lax' ou 'strict'
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    };

    response.cookies.set("userId", String(userToAuthenticate.id), cookieOptions);
    response.cookies.set("userType", userToAuthenticate.tipo, cookieOptions);
    response.cookies.set("userName", userToAuthenticate.nome, cookieOptions); // Opcional, mas útil se o middleware/API precisar

    return response;
  }

  return NextResponse.json({ error: "Credenciais inválidas", success: false }, { status: 401 });
}
