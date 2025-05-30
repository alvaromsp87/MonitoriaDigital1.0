// 📁 app/api/forum/posts/[id_post]/comments/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { pool } from '@/lib/db'; 
// Se RowDataPacket for realmente usado (ex: CommentFromDB extends RowDataPacket), mantenha.
// Caso contrário, se CommentFromDB não estender, você pode remover RowDataPacket daqui.
import { OkPacket, RowDataPacket } from 'mysql2/promise'; 
import { cookies } from 'next/headers';

// Interface para dados de um novo comentário vindo do cliente
interface NewCommentPayload { // Esta interface será usada agora
  conteudo_comentario: string;
}

// Interface para um comentário como ele é no banco (incluindo dados do autor)
export interface CommentFromDB extends RowDataPacket { // Assumindo que estende RowDataPacket
  id_comentario: number;
  id_post: number;
  id_usuario_autor: number;
  nome_autor: string; 
  conteudo_comentario: string;
  data_criacao_comentario: string;
}

// GET para buscar comentários de um post específico
export async function GET(
  _request: NextRequest, // Adicionado _ se request não for usado
  { params }: { params: { id_post: string } }
) {
  // Mantive o console.log original que usa params diretamente
  console.log(`API HIT: GET /api/forum/posts/${params.id_post}/comments`); 
  try {
    const id_post_str = params.id_post; // Usando params diretamente
    const id_post = parseInt(id_post_str, 10);

    if (isNaN(id_post)) {
      console.log("ID do post inválido no GET:", id_post_str);
      return NextResponse.json({ error: "ID do post inválido." }, { status: 400 });
    }

    console.log("Buscando comentários para o post ID:", id_post);
    const sql = `
      SELECT 
        c.id_comentario, 
        c.id_post, 
        c.id_usuario_autor, 
        u.nome AS nome_autor, 
        c.conteudo_comentario, 
        DATE_FORMAT(c.data_criacao_comentario, '%Y-%m-%dT%TZ') as data_criacao_comentario
      FROM monitoria_digital_forum_comentarios c
      JOIN usuarios u ON c.id_usuario_autor = u.id_usuario
      WHERE c.id_post = ?
      ORDER BY c.data_criacao_comentario ASC;
    `;
    const [comments] = await pool.execute<CommentFromDB[]>(sql, [id_post]);
    console.log("Comentários encontrados:", comments.length);
    return NextResponse.json(comments);
  } catch (e: unknown) {
    console.error(`Erro ao buscar comentários para o post ${params.id_post}:`, e);
    const error = e as Error;
    return NextResponse.json({ error: "Erro ao buscar comentários.", details: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest, // request é usado aqui para request.json()
  context: { params: { id_post: string } } // Usando 'context' para params
) {
  // Removida a variável id_post_param_value desnecessária. Usando context.params.id_post diretamente.
  console.log(`API HIT: POST /api/forum/posts/${context.params.id_post}/comments`); 

  try {
    const id_post_str = context.params.id_post; // Usando context.params diretamente
    const id_post = parseInt(id_post_str, 10);

    if (isNaN(id_post)) {
      console.log("ID do post inválido no POST:", id_post_str);
      return NextResponse.json({ error: "ID do post inválido." }, { status: 400 });
    }

    const cookieStore = await cookies(); 
    const userIdCookie = cookieStore.get('userId');

    if (!userIdCookie || !userIdCookie.value) {
      console.log("Usuário não autenticado para postar comentário.");
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }
    const id_usuario_autor = parseInt(userIdCookie.value, 10);
    if (isNaN(id_usuario_autor)) {
        console.log("ID de usuário inválido no cookie para postar comentário.");
        return NextResponse.json({ error: "ID de usuário inválido no cookie." }, { status: 401 });
    }

    // CORREÇÃO: Usar a interface NewCommentPayload
    const body = await request.json() as NewCommentPayload; 
    const { conteudo_comentario } = body;

    if (!conteudo_comentario || !conteudo_comentario.trim()) {
      return NextResponse.json({ error: "Conteúdo do comentário é obrigatório." }, { status: 400 });
    }

    console.log(`Inserindo comentário para post ${id_post} por usuário ${id_usuario_autor}`);
    const sqlInsertComment = `
      INSERT INTO monitoria_digital_forum_comentarios (id_post, id_usuario_autor, conteudo_comentario)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute<OkPacket>(sqlInsertComment, [id_post, id_usuario_autor, conteudo_comentario.trim()]);

    if (result.insertId) {
      console.log("Comentário inserido com ID:", result.insertId);
      const sqlGetNewComment = `
        SELECT 
          c.id_comentario, 
          c.id_post, 
          c.id_usuario_autor, 
          u.nome AS nome_autor, 
          c.conteudo_comentario, 
          DATE_FORMAT(c.data_criacao_comentario, '%Y-%m-%dT%TZ') as data_criacao_comentario
        FROM monitoria_digital_forum_comentarios c
        JOIN usuarios u ON c.id_usuario_autor = u.id_usuario
        WHERE c.id_comentario = ?
      `;
      const [newComments] = await pool.execute<CommentFromDB[]>(sqlGetNewComment, [result.insertId]);
      if (newComments.length > 0) {
        return NextResponse.json(newComments[0], { status: 201 });
      }
      console.warn("Comentário inserido, mas não encontrado ao buscar:", result.insertId);
    }
    return NextResponse.json({ error: "Falha ao adicionar comentário após inserção." }, { status: 500 });
  } catch (e: unknown) {
    console.error(`Erro crítico ao adicionar comentário ao post ${context?.params?.id_post || 'desconhecido'}:`, e);
    const error = e as Error;
    if (e instanceof SyntaxError && (e as SyntaxError).message.includes('JSON')) {
        return NextResponse.json({ error: 'Corpo da requisição inválido (JSON malformado)' }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno ao adicionar comentário.", details: error.message }, { status: 500 });
  }
}