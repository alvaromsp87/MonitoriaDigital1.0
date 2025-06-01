// 📁 app/api/mentorias/route.ts
import { NextResponse } from 'next/server'; // NextRequest pode não ser mais necessário se não usado
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { cookies } from 'next/headers';

// Helper para obter o ID e o papel do usuário autenticado
async function getAuthenticatedUser(): Promise<{ id: number; role: string } | null> {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');
  const userRoleCookie = cookieStore.get('userType');

  if (userIdCookie?.value && userRoleCookie?.value) {
    const id = parseInt(userIdCookie.value, 10);
    if (!isNaN(id)) {
      return { id, role: userRoleCookie.value };
    }
  }
  return null;
}

// Interface para o que a API retornará para cada mentoria no dropdown
interface MentoriaParaDropdown extends RowDataPacket {
  id_mentoria: number;
  disciplina_nome: string; 
  aluno_nome: string;      
  conteudo_programatico: string; 
  status_mentoria: string; 
}

// Interface para erros do MySQL, caso precise ser usada no catch block
interface MySQLError extends Error { sqlMessage?: string; }

// FIX: Removido o parâmetro '_request: NextRequest' pois não estava sendo utilizado.
// A tipagem NextRequest foi removida da importação também se não for usada em outros handlers (ex: POST).
// Se você tiver um POST handler neste arquivo que usa 'request: NextRequest', mantenha a importação.
export async function GET() { 
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  let sqlQuery = `
    SELECT 
      m.id_mentoria, 
      d.nome AS disciplina_nome,
      u_aluno.nome AS aluno_nome,
      m.conteúdo_programático AS conteudo_programatico,
      m.status AS status_mentoria 
    FROM mentorias m
    JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
    JOIN usuarios u_aluno ON m.id_aluno = u_aluno.id_usuario
  `;
  const queryParams: number[] = [];

  if (authenticatedUser.role === 'monitor') {
    sqlQuery += ` WHERE m.id_monitor = ? AND m.status IN ('pendente', 'confirmada')`;
    queryParams.push(authenticatedUser.id);
  } else if (authenticatedUser.role === 'admin') {
    // Para o dropdown, talvez o admin também queira ver todas as pendentes/confirmadas
    // Ou filtrar por um monitor específico (isso exigiria um query param ?monitorId=X)
    // Por enquanto, admin vê todas as acionáveis, similar ao que foi feito para monitor
    sqlQuery += ` WHERE m.status IN ('pendente', 'confirmada')`;
     // Se quiser que o admin possa filtrar por monitor no dropdown:
     // const monitorIdParam = new URL(request.url).searchParams.get('monitorId'); // precisaria do request
     // if (monitorIdParam) { 
     //   sqlQuery += ` AND m.id_monitor = ?`;
     //   queryParams.push(parseInt(monitorIdParam));
     // }
  } else {
    return NextResponse.json({ error: "Acesso não permitido para este perfil para listar mentorias de agendamento." }, { status: 403 });
  }

  sqlQuery += ` ORDER BY m.data_solicitacao DESC, d.nome ASC;`;

  try {
    console.log(`[API GET /mentorias - Dropdown] Role: ${authenticatedUser.role}, Query: ${sqlQuery.replace(/\s+/g, ' ')}, Params: ${JSON.stringify(queryParams)}`);
    const [rows] = await pool.query<MentoriaParaDropdown[]>(sqlQuery, queryParams);
    
    return NextResponse.json(rows);

  } catch (error: unknown) {
    console.error('Erro ao buscar mentorias para dropdown:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    if (error instanceof Error && 'sqlMessage' in error) {
        return NextResponse.json({ error: 'Erro de SQL ao buscar mentorias.', details: (error as MySQLError).sqlMessage }, { status: 500 });
    }
    return NextResponse.json({ error: 'Erro ao buscar mentorias.', details: errorMessage }, { status: 500 });
  }
}

// Se você tiver outros handlers (POST, PUT, DELETE) neste arquivo que usam 'NextRequest',
// mantenha a importação de 'NextRequest'. Caso contrário, ela pode ser removida.