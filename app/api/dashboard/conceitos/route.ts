// app/api/dashboard/conceitos/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db"; // Ajuste o caminho se necessário para sua conexão com o banco

export async function GET() {
  try {
    // 1. Recuperar o userId dos cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      // Retorna um erro 401 se o userId não for encontrado nos cookies
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    // --- INÍCIO DA MUDANÇA: BUSCAR O NOME DO USUÁRIO ---
    let userName = "Usuário"; // Valor padrão caso o nome não seja encontrado

    try {
      const [userRows]: any = await pool.query(
        `SELECT nome FROM usuarios WHERE id_usuario = ?`,
        [userId]
      );

      if (userRows.length > 0) {
        userName = userRows[0].nome;
      }
    } catch (userError) {
      console.error("Erro ao buscar nome do usuário:", userError);
      // Continua mesmo se não conseguir buscar o nome do usuário, usando o padrão
    }
    // --- FIM DA MUDANÇA: BUSCAR O NOME DO USUÁRIO ---


    // 2. Consultar o banco de dados para obter as notas do aluno por disciplina
    const [rows]: any = await pool.query(
      `
        SELECT d.nome AS disciplina, a.nota
        FROM avaliacoes a
        JOIN disciplinas d ON a.id_disciplina = d.id_disciplina
        WHERE a.id_aluno = ?
      `,
      [userId]
    );

    // 3. Formatar os dados das notas para o frontend
    const dadosNotas = rows.map((avaliacao: any) => ({
      disciplina: avaliacao.disciplina,
      nota: avaliacao.nota,
    }));

    // 4. Retornar os dados formatados como JSON, incluindo o nome do usuário
    return NextResponse.json({
      userName: userName, // Inclui o nome do usuário na resposta
      data: dadosNotas    // Inclui os dados das notas
    });

  } catch (error: any) {
    // Captura e loga erros no servidor para depuração
    console.error("Erro detalhado na API de conceitos:", error);
    console.error("Mensagem do erro:", error.message);
    if (error.stack) {
      console.error("Stack trace do erro:", error.stack);
    }
    // Retorna um erro 500 para o frontend
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
