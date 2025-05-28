// app/api/recuperar-senha/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Certifique-se de que o caminho para sua conexão com o banco está correto
import crypto from 'crypto'; // Para gerar tokens seguros
import nodemailer from 'nodemailer'; // Para enviar e-mails

export async function POST(req: Request) {
  const { email } = await req.json();

  try {
    // 1. Verificar se o e-mail existe na tabela de usuários
    const [rows]: any = await pool.query(
      `SELECT id_usuario, nome FROM usuarios WHERE email = ?`,
      [email]
    );

    const usuarios = Array.isArray(rows) ? rows : [];

    // Importante: Por segurança, sempre retorne uma mensagem de sucesso genérica,
    // mesmo que o e-mail não seja encontrado, para evitar enumeração de usuários.
    if (usuarios.length === 0) {
      console.warn(`Tentativa de recuperação de senha para e-mail não encontrado: ${email}`);
      return NextResponse.json({ message: "Se o e-mail estiver cadastrado, as instruções de recuperação de senha foram enviadas." }, { status: 200 });
    }

    const usuario = usuarios[0];
    const userId = usuario.id_usuario;
    const userName = usuario.nome;

    // 2. Gerar um token único para recuperação de senha
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // Token válido por 1 hora (3600000 ms)

    // 3. Remover tokens antigos para este usuário (se houver) e inserir o novo na tabela password_resets
    await pool.query(
        `DELETE FROM password_resets WHERE user_id = ?`,
        [userId]
    );
    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [userId, resetToken, resetTokenExpires]
    );

    // 4. Construir o link de redefinição de senha
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/redefinir-senha?token=${resetToken}`;

    // 5. Configurar e enviar o e-mail real com Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para outras portas
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Redefinição de Senha para Monitoria Digital',
      html: `
        Olá ${userName},
        <p>Você solicitou uma redefinição de senha para sua conta na Monitoria Digital.</p>
        <p>Por favor, clique no link a seguir para redefinir sua senha:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
        <p>Atenciosamente,<br/>Equipe Monitoria Digital</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`E-mail de recuperação enviado com sucesso para: ${email}`);

    return NextResponse.json({ message: "Se o e-mail estiver cadastrado, as instruções de recuperação de senha foram enviadas." }, { status: 200 });

  } catch (error: any) {
    console.error("Erro no processo de recuperação de senha:", error);
    // Log detalhado do erro do Nodemailer, se houver
    if (error.response) {
      console.error("Erro de resposta do Nodemailer:", error.response);
    }
    return NextResponse.json({ error: "Erro interno do servidor ao tentar recuperar a senha." }, { status: 500 });
  }
}
