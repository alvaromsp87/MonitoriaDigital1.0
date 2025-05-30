// 📁 app/api/messages/route.ts
import { NextResponse, NextRequest } from 'next/server';
// Importa o 'pool' nomeado do seu lib/db.ts
import { pool } from '@/lib/db'; 
// Tipos do mysql2 para os resultados das queries
import { OkPacket, RowDataPacket } from 'mysql2/promise'; 

// Interface para as mensagens
export interface MensagemChatAPI {
  id_mensagem: number;
  id_remetente: string;
  id_destinatario: string;
  conteudo: string;
  data_envio: string; 
}

// Handler para GET (buscar mensagens entre dois usuários)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idUsuarioLogado = searchParams.get('idUsuarioLogado');
  const idOutroUsuario = searchParams.get('idOutroUsuario');

  if (!idUsuarioLogado || !idOutroUsuario) {
    return NextResponse.json(
      { error: 'Parâmetros idUsuarioLogado e idOutroUsuario são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const sql = `
      SELECT id_mensagem, id_remetente, id_destinatario, conteudo, DATE_FORMAT(data_envio, '%Y-%m-%dT%TZ') as data_envio
      FROM mensagens
      WHERE (id_remetente = ? AND id_destinatario = ?) OR (id_remetente = ? AND id_destinatario = ?)
      ORDER BY data_envio ASC
    `;
    // Usa pool.execute() para a query
    // O resultado de execute é uma tupla: [rows, fields]
    // Tipamos 'rows' como MensagemChatAPI[]
    const [rows] = await pool.execute<MensagemChatAPI[] & RowDataPacket[]>(sql, [
      idUsuarioLogado, 
      idOutroUsuario, 
      idOutroUsuario, 
      idUsuarioLogado
    ]);
    
    return NextResponse.json(rows);
  } catch (e: unknown) {
    let errorMessage = 'Erro interno do servidor ao buscar mensagens';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error('Erro ao buscar mensagens do banco:', e);
    return NextResponse.json({ error: 'Erro ao buscar mensagens', details: errorMessage }, { status: 500 });
  }
}

// Interface para o corpo da requisição POST
interface PostRequestBody {
  id_remetente: string;
  id_destinatario: string;
  conteudo: string;
}

// Handler para POST (enviar nova mensagem)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PostRequestBody;
    const { id_remetente, id_destinatario, conteudo } = body;

    if (!id_remetente || !id_destinatario || !conteudo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando: id_remetente, id_destinatario, conteudo' },
        { status: 400 }
      );
    }

    const sqlInsert = `
      INSERT INTO mensagens (id_remetente, id_destinatario, conteudo, data_envio)
      VALUES (?, ?, ?, NOW()) 
    `;
    // Usa pool.execute() para o INSERT e espera um OkPacket
    const [result] = await pool.execute<OkPacket>(sqlInsert, [id_remetente, id_destinatario, conteudo]);

    if (result.insertId) {
      const selectNewMessageSql = "SELECT id_mensagem, id_remetente, id_destinatario, conteudo, DATE_FORMAT(data_envio, '%Y-%m-%dT%TZ') as data_envio FROM mensagens WHERE id_mensagem = ?";
      // Usa pool.execute() para buscar a nova mensagem
      const [newMessages] = await pool.execute<MensagemChatAPI[] & RowDataPacket[]>(selectNewMessageSql, [result.insertId]);

      if (newMessages && newMessages.length > 0) {
        return NextResponse.json(newMessages[0], { status: 201 });
      } else {
        // Fallback se não conseguir buscar a mensagem (raro)
        const fallbackNovaMensagem: MensagemChatAPI = {
            id_mensagem: result.insertId,
            id_remetente,
            id_destinatario,
            conteudo,
            data_envio: new Date().toISOString(), 
          };
        console.warn("Mensagem inserida, mas não foi possível recuperá-la imediatamente. Retornando dados aproximados.");
        return NextResponse.json(fallbackNovaMensagem, { status: 201 });
      }
    } else {
      console.warn('Falha ao inserir mensagem, resultado do banco:', result);
      throw new Error('Falha ao inserir mensagem, nenhum ID de inserção retornado.');
    }

  } catch (e: unknown) { 
    let errorMessage = 'Erro interno do servidor ao enviar mensagem';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    
    console.error('Erro ao enviar mensagem para o banco:', e);

    if (e instanceof SyntaxError && (e as SyntaxError).message.includes('JSON')) {
        return NextResponse.json({ error: 'Corpo da requisição inválido (JSON malformado)' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Erro ao enviar mensagem', details: errorMessage }, { status: 500 });
  }
}