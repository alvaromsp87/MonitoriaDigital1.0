// app/api/dashboard/monitor-performance/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db"; // Ajuste o caminho se o seu db.ts estiver em @monitoriadigital/lib/db
import { RowDataPacket } from "mysql2/promise";

// Interface para o resultado da query de nome do usuário
interface UserNomeRow extends RowDataPacket {
  nome: string;
}

// Interface para o resultado da query de avaliações
interface AvaliacaoRow extends RowDataPacket {
  disciplina: string;
  nota: number;
}

export async function GET() {
  try {
    // 1. Recuperar o userId do monitor dos cookies
    const cookieStore = await cookies(); // Corrigido: Restaurado o await
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Monitor não autenticado." }, { status: 401 });
    }

    // 2. Buscar o nome do monitor
    let userName = "Monitor"; // Valor padrão

    try {
      const [userRows] = await pool.query<UserNomeRow[]>(
        `SELECT nome FROM usuarios WHERE id_usuario = ?`,
        [userId]
      );

      if (userRows.length > 0) {
        userName = userRows[0].nome;
      }
    } catch (userError: unknown) {
      console.error("Erro ao buscar nome do monitor:", userError instanceof Error ? userError.message : userError);
    }

    // 3. Consultar o banco de dados para obter as notas do PRÓPRIO MONITOR
    const [rows] = await pool.query<AvaliacaoRow[]>(
      `
        SELECT d.nome AS disciplina, a.nota
        FROM avaliacoes a
        JOIN disciplinas d ON a.id_disciplina = d.id_disciplina
        WHERE a.id_aluno = ? 
      `,
      [userId]
    );

    // 4. Formatar os dados para o frontend
    const dadosDesempenho = rows.map((avaliacao: AvaliacaoRow) => ({
      disciplina: avaliacao.disciplina,
      nota: avaliacao.nota,
    }));

    // 5. Retornar os dados formatados como JSON, incluindo o nome do monitor
    return NextResponse.json({
      userName: userName,
      data: dadosDesempenho,
    });

  } catch (error: unknown) {
    console.error("Erro detalhado na API de desempenho do monitor:", error);
    let errorMessage = "Erro interno do servidor.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.stack) {
        console.error("Stack trace do erro:", error.stack);
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}