// app/api/monitorias/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  const { mentorships } = await req.json(); // Espera um array de objetos de monitoria

  if (!mentorships || !Array.isArray(mentorships) || mentorships.length === 0) {
    return NextResponse.json({ error: "Dados de monitoria inválidos." }, { status: 400 });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const mentorship of mentorships) {
      const { id_disciplina, id_monitor, id_aluno, assunto, data_mentoria, status } = mentorship; 

      // --- Adicione este console.log para depuração ---
      console.log("Dados da monitoria recebidos na API:", {
        id_disciplina,
        id_monitor,
        id_aluno,
        assunto,
        data_mentoria,
        status
      });
      // --- Fim do console.log ---

      if (!id_disciplina || !id_monitor || !id_aluno || !assunto || !data_mentoria || !status) {
        // Loga qual campo está faltando antes de lançar o erro
        console.error("Campo(s) obrigatório(s) faltando na monitoria:", {
          id_disciplina: !id_disciplina ? 'Faltando' : 'OK',
          id_monitor: !id_monitor ? 'Faltando' : 'OK',
          id_aluno: !id_aluno ? 'Faltando' : 'OK',
          assunto: !assunto ? 'Faltando' : 'OK',
          data_mentoria: !data_mentoria ? 'Faltando' : 'OK',
          status: !status ? 'Faltando' : 'OK',
        });
        throw new Error("Um ou mais campos obrigatórios da monitoria estão faltando.");
      }

      await connection.query(
        `
          INSERT INTO mentorias (id_aluno, id_monitor, id_disciplina, conteúdo_programático, data_solicitacao, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [id_aluno, id_monitor, id_disciplina, assunto, data_mentoria, status] 
      );
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ message: "Monitoria(s) cadastrada(s) com sucesso!" }, { status: 201 });

  } catch (error: any) {
    console.error("Erro ao cadastrar monitoria:", error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    return NextResponse.json({ error: error.message || "Erro interno do servidor ao cadastrar monitoria." }, { status: 500 });
  }
}
