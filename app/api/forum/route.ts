// 📁 app/api/forum/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { pool } from '@/lib/db'; 
import { OkPacket, RowDataPacket } from 'mysql2/promise';
import { cookies } from 'next/headers'; // Importação correta

// Interface para dados de um novo post vindo do cliente
interface NewPostPayload {
  titulo: string;
  conteudo: string;
}

// Interface para um post como ele é no banco (incluindo dados do autor)
interface PostFromDB extends RowDataPacket {
  id_post: number;
  id_usuario_autor: number;
  nome_autor: string; 
  titulo: string;
  conteudo: string;
  data_criacao: string;
  data_ultima_modificacao: string;
  status_post: string;
  visualizacoes: number;
  total_comentarios: number; 
}

// GET para listar todos os posts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) { // Adicionado comentário para ESLint
  try {
    const sql = `
      SELECT 
        p.id_post, 
        p.id_usuario_autor, 
        u.nome AS nome_autor, 
        p.titulo, 
        p.conteudo, 
        DATE_FORMAT(p.data_criacao, '%Y-%m-%dT%TZ') as data_criacao, 
        DATE_FORMAT(p.data_ultima_modificacao, '%Y-%m-%dT%TZ') as data_ultima_modificacao,
        p.status_post,
        p.visualizacoes,
        (SELECT COUNT(*) FROM monitoria_digital_forum_comentarios fc WHERE fc.id_post = p.id_post) AS total_comentarios
      FROM monitoria_digital_forum_posts p
      JOIN usuarios u ON p.id_usuario_autor = u.id_usuario
      ORDER BY p.data_criacao DESC;
    `;
    const [posts] = await pool.execute<PostFromDB[]>(sql);
    return NextResponse.json(posts);
  } catch (e) {
    console.error("Erro ao buscar posts:", e);
    const error = e as Error;
    return NextResponse.json({ error: "Erro ao buscar posts.", details: error.message }, { status: 500 });
  }
}

// POST para criar um novo post
export async function POST(request: NextRequest) {
  try {
    // CORREÇÃO: Tentar usar await com cookies() conforme sugestão do TypeScript
    const cookieStore = await cookies(); 
    const userIdCookie = cookieStore.get('userId');

    if (!userIdCookie || !userIdCookie.value) {
      return NextResponse.json({ error: "Usuário não autenticado. Cookie de userId não encontrado." }, { status: 401 });
    }

    const id_usuario_autor = parseInt(userIdCookie.value, 10);
    
    if (isNaN(id_usuario_autor)) {
        return NextResponse.json({ error: "ID de usuário inválido no cookie." }, { status: 401 });
    }

    const body = await request.json() as NewPostPayload;
    const { titulo, conteudo } = body;

    if (!titulo || !conteudo) {
      return NextResponse.json({ error: "Título e conteúdo são obrigatórios." }, { status: 400 });
    }

    const sqlInsertPost = `
      INSERT INTO monitoria_digital_forum_posts (id_usuario_autor, titulo, conteudo)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute<OkPacket>(sqlInsertPost, [id_usuario_autor, titulo, conteudo]);

    if (result.insertId) {
      const sqlGetNewPost = `
        SELECT 
          p.id_post, 
          p.id_usuario_autor, 
          u.nome AS nome_autor, 
          p.titulo, 
          p.conteudo, 
          DATE_FORMAT(p.data_criacao, '%Y-%m-%dT%TZ') as data_criacao, 
          DATE_FORMAT(p.data_ultima_modificacao, '%Y-%m-%dT%TZ') as data_ultima_modificacao,
          p.status_post,
          p.visualizacoes,
          0 AS total_comentarios
        FROM monitoria_digital_forum_posts p
        JOIN usuarios u ON p.id_usuario_autor = u.id_usuario
        WHERE p.id_post = ?
      `;
      const [newPosts] = await pool.execute<PostFromDB[]>(sqlGetNewPost, [result.insertId]);
      if (newPosts.length > 0) {
        return NextResponse.json(newPosts[0], { status: 201 });
      }
    }
    return NextResponse.json({ error: "Falha ao criar postagem após inserção." }, { status: 500 });
  } catch (e) {
    console.error("Erro ao criar post:", e);
    const error = e as Error;
    if (e instanceof SyntaxError && (e as SyntaxError).message.includes('JSON')) {
        return NextResponse.json({ error: 'Corpo da requisição inválido (JSON malformado)' }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor ao criar post.", details: error.message }, { status: 500 });
  }
}