// 📁 app/api/login/route.ts
import { NextResponse, NextRequest } from "next/server";
import { pool } from '@/lib/db'; // Seu pool de conexões
import bcrypt from 'bcrypt';   // Importe o bcrypt
import { RowDataPacket } from "mysql2";

// Interface para o usuário como vem do banco de dados (agora com JOIN)
interface UserFromDB extends RowDataPacket {
  id_usuario: number;
  nome: string;
  email: string;
  senha: string; // Senha hasheada do banco
  tipo: "admin" | "monitor" | "aluno"; // Tipo vindo da tabela 'acessos'
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios", success: false }, { status: 400 });
    }

    // 1. Buscar o usuário e seu tipo de acesso usando JOIN
    // Usamos INNER JOIN para garantir que o usuário só seja retornado se tiver um tipo de acesso definido.
    // Se um usuário puder existir sem um tipo em 'acessos', use LEFT JOIN e trate o 'tipo' nulo.
    const sqlGetUserAndAccess = `
      SELECT 
        u.id_usuario, 
        u.nome, 
        u.email, 
        u.senha, 
        a.tipo 
      FROM usuarios u
      INNER JOIN acessos a ON u.id_usuario = a.id_usuario
      WHERE u.email = ?
    `;
    const [users] = await pool.execute<UserFromDB[]>(sqlGetUserAndAccess, [email]);

    if (users.length === 0) {
      // Usuário não encontrado ou não possui um tipo de acesso válido em 'acessos'
      return NextResponse.json({ error: "Credenciais inválidas ou usuário sem tipo de acesso definido", success: false }, { status: 401 });
    }

    const userFromDb = users[0];

    // Se a.tipo puder ser NULL (ex: com LEFT JOIN e usuário sem entrada em acessos)
    // você precisaria tratar isso aqui:
    if (!userFromDb.tipo) {
        return NextResponse.json({ error: "Tipo de acesso do usuário não definido.", success: false }, { status: 403 }); // Forbidden
    }

    // 2. Comparar a senha fornecida com a senha hasheada do banco
    const passwordMatch = await bcrypt.compare(password, userFromDb.senha);

    if (!passwordMatch) {
      // Senha não confere
      return NextResponse.json({ error: "Credenciais inválidas", success: false }, { status: 401 });
    }

    // 3. Usuário autenticado com sucesso
    const responsePayload = {
      success: true,
      message: "Login bem-sucedido!",
      userId: userFromDb.id_usuario, // ID real do banco (number)
      role: userFromDb.tipo,         // Role vindo da tabela 'acessos'
      userName: userFromDb.nome,       // Nome real do banco
      email: userFromDb.email,         // Email real do banco
    };
    
    const response = NextResponse.json(responsePayload);

    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    };

    response.cookies.set("userId", String(userFromDb.id_usuario), cookieOptions);
    response.cookies.set("userType", userFromDb.tipo, cookieOptions); // userFromDb.tipo já é string e do tipo correto
    response.cookies.set("userName", userFromDb.nome, cookieOptions);

    return response;

  } catch (error) {
    console.error("Erro no servidor durante o login:", error);
    return NextResponse.json({ error: "Erro interno do servidor", success: false }, { status: 500 });
  }
}