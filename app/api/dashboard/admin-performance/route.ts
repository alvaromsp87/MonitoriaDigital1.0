// app/api/dashboard/admin-performance/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db"; // Ajuste o caminho para sua conexão com o banco

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
      const [userRows]: any = await pool.query(
        `SELECT nome FROM usuarios WHERE id_usuario = ?`,
        [userId]
      );

      if (userRows.length > 0) {
        userName = userRows[0].nome;
      }
    } catch (userError) {
      console.error("Erro ao buscar nome do administrador:", userError);
    }

    // 3. Consultar o banco de dados para obter a média das notas de todas as disciplinas
    const [rows]: any = await pool.query(
      `
        SELECT d.nome AS disciplina, AVG(a.nota) AS media_nota
        FROM avaliacoes a
        JOIN disciplinas d ON a.id_disciplina = d.id_disciplina
        GROUP BY d.nome
        ORDER BY d.nome;
      `
    );

    // 4. Formatar os dados para o frontend
    const dadosDesempenhoMedio = rows.map((item: any) => ({
      disciplina: item.disciplina,
      media_nota: parseFloat(item.media_nota).toFixed(2), // Formata para 2 casas decimais
    }));

    // 5. Retornar os dados formatados como JSON, incluindo o nome do administrador
    return NextResponse.json({
      userName: userName,
      data: dadosDesempenhoMedio,
    });

  } catch (error: any) {
    console.error("Erro detalhado na API de desempenho do administrador:", error);
    console.error("Mensagem do erro:", error.message);
    if (error.stack) {
      console.error("Stack trace do erro:", error.stack);
    }
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
