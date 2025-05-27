// app/api/dashboard/monitor-performance/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db"; // Ajuste o caminho para sua conexão com o banco

export async function GET() {
  try {
    // 1. Recuperar o userId do monitor dos cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Monitor não autenticado." }, { status: 401 });
    }

    // 2. Buscar o nome do monitor
    let userName = "Monitor"; // Valor padrão

    try {
      const [userRows]: any = await pool.query(
        `SELECT nome FROM usuarios WHERE id_usuario = ?`,
        [userId]
      );

      if (userRows.length > 0) {
        userName = userRows[0].nome;
      }
    } catch (userError) {
      console.error("Erro ao buscar nome do monitor:", userError);
    }

    // 3. Consultar o banco de dados para obter as notas do PRÓPRIO MONITOR
    const [rows]: any = await pool.query(
      `
        SELECT d.nome AS disciplina, a.nota
        FROM avaliacoes a
        JOIN disciplinas d ON a.id_disciplina = d.id_disciplina
        WHERE a.id_aluno = ? -- Filtra pelas avaliações do monitor (que também é um aluno)
      `,
      [userId]
    );

    // 4. Formatar os dados para o frontend
    const dadosDesempenho = rows.map((avaliacao: any) => ({
      disciplina: avaliacao.disciplina,
      nota: avaliacao.nota,
    }));

    // 5. Retornar os dados formatados como JSON, incluindo o nome do monitor
    return NextResponse.json({
      userName: userName,
      data: dadosDesempenho,
    });

  } catch (error: any) {
    console.error("Erro detalhado na API de desempenho do monitor:", error);
    console.error("Mensagem do erro:", error.message);
    if (error.stack) {
      console.error("Stack trace do erro:", error.stack);
    }
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
