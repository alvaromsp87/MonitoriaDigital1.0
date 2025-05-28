// app/api/dashboard/admin-performance/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db"; // Ajuste o caminho para sua conexão com o banco
import { RowDataPacket } from "mysql2/promise"; // Importar para tipagem

// Interface para o resultado da query de nome do usuário
interface UserNomeRow extends RowDataPacket {
  nome: string;
}

// Interface para o resultado da query de desempenho (média de notas)
interface AdminPerformanceDbRow extends RowDataPacket {
  disciplina: string;
  media_nota: number | string; // AVG() pode retornar string ou number dependendo do driver/DB
}

export async function GET() {
  try {
    // 1. Recuperar o userId do administrador dos cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Administrador não autenticado." }, { status: 401 });
    }

    // 2. Buscar o nome do administrador
    let userName = "Administrador"; // Valor padrão

    try {
      const [userRows] = await pool.query<UserNomeRow[]>( // Tipagem aqui
        `SELECT nome FROM usuarios WHERE id_usuario = ?`,
        [userId]
      );

      if (userRows.length > 0 && userRows[0]) {
        userName = userRows[0].nome;
      }
    } catch (userError: unknown) { // Tipagem do erro
      console.error("Erro ao buscar nome do administrador:", userError instanceof Error ? userError.message : userError);
      // Continuar com o nome padrão "Administrador"
    }

    // 3. Consultar o banco de dados para obter a média das notas de todas as disciplinas
    const [rows] = await pool.query<AdminPerformanceDbRow[]>( // Tipagem aqui
      `
        SELECT d.nome AS disciplina, AVG(a.nota) AS media_nota
        FROM avaliacoes a
        JOIN disciplinas d ON a.id_disciplina = d.id_disciplina
        GROUP BY d.nome
        ORDER BY d.nome;
      `
    );

    // 4. Formatar os dados para o frontend
    const dadosDesempenhoMedio = rows.map((item: AdminPerformanceDbRow) => ({ // Tipagem aqui
      disciplina: item.disciplina,
      // A API do AdminDashboard no frontend espera uma string, então parseFloat + toFixed é ok.
      // Se a API devesse retornar número, seria apenas: parseFloat(String(item.media_nota))
      media_nota: parseFloat(String(item.media_nota)).toFixed(2), 
    }));

    // 5. Retornar os dados formatados como JSON, incluindo o nome do administrador
    return NextResponse.json({
      userName: userName,
      data: dadosDesempenhoMedio,
    });

  } catch (error: unknown) { // Tipagem do erro principal
    console.error("Erro detalhado na API de desempenho do administrador:", error);
    let errorMessage = "Erro interno do servidor.";
    let errorStack = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack; // Captura o stack se for uma instância de Error
    }
    
    if (errorStack) { // Log do stack se disponível
        console.error("Stack trace do erro:", errorStack);
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
