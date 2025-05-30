// app/api/agendamentos/student-meetings/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";
import { RowDataPacket, FieldPacket } from "mysql2/promise";

// Interface para o item de agendamento retornado pela API
interface StudentMeetingDbItem extends RowDataPacket {
  id_agendamento: number;
  data_agendada: Date; // Usaremos Date para facilitar a manipulação
  disciplina_nome: string; // Nome da disciplina
  conteudo_programatico: string; // Corrigido: nome da coluna no DB é 'conteúdo_programático'
  status: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value; // Pega o ID do aluno logado

    if (!userId) {
      return NextResponse.json({ error: "Aluno não autenticado." }, { status: 401 });
    }

    // Consulta para buscar as monitorias em que o aluno está inscrito
    const [rows, fields] = await pool.query<StudentMeetingDbItem[]>(
      `
        SELECT
            a.id_agendamento,
            a.data_agendada,
            d.nome AS disciplina_nome,
            m.conteúdo_programático AS conteudo_programatico, -- CORRIGIDO AQUI: m.assunto para m.conteúdo_programático
            a.status
        FROM agendamentos a
        JOIN mentorias m ON a.id_mentoria = m.id_mentoria
        JOIN disciplinas d ON m.id_disciplina = d.id_disciplina
        WHERE m.id_aluno = ?
        -- Se quiser filtrar apenas por status 'confirmado', adicione:
        -- AND a.status = 'confirmado'
        ORDER BY a.data_agendada DESC;
      `,
      [userId]
    );

    const formattedMeetings = rows.map((item: StudentMeetingDbItem) => ({
      id: item.id_agendamento,
      date: new Date(item.data_agendada).toLocaleString('pt-BR'),
      disciplina: item.disciplina_nome,
      assunto: item.conteudo_programatico, // Mapeia para 'assunto' no frontend
      status: item.status,
    }));

    return NextResponse.json(formattedMeetings);

  } catch (error) {
    console.error("Erro ao buscar agendamentos do aluno:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao buscar agendamentos." }, { status: 500 });
  }
}
