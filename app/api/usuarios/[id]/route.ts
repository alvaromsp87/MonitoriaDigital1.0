import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Ajuste o caminho se o seu db.ts estiver em @monitoriadigital/lib/db
import bcrypt from 'bcryptjs';
import type { OkPacket, RowDataPacket } from 'mysql2/promise';

type RouteContext = {
  params: {
    id: string;
  };
};

// GET - Buscar um usuário específico (se necessário nesta rota)
export async function GET(request: NextRequest, context: RouteContext) {
  let connection;
  try {
    const id = context.params.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 });
    }
    connection = await pool.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT u.id_usuario, u.nome, u.email, u.curso, u.especialidade, u.formacao_academica, u.data_nascimento, a.tipo 
       FROM usuarios u
       LEFT JOIN acessos a ON u.id_usuario = a.id_usuario
       WHERE u.id_usuario = ?`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar usuário:', errorMessage);
    return NextResponse.json({ success: false, message: 'Erro ao buscar usuário', error: errorMessage }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}


// PUT - Atualizar um usuário existente
export async function PUT(request: NextRequest, context: RouteContext) {
  let connection;
  try {
    const id = context.params.id;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, message: 'ID inválido para atualização' }, { status: 400 });
    }

    const body = await request.json();
    const { nome, email, senha, tipo, curso, especialidade, formacao_academica, data_nascimento } = body;

    if (!nome || !email || !tipo) {
      return NextResponse.json({ success: false, message: 'Nome, email e tipo são obrigatórios.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const updateFields = [];
      const queryParams = [];

      // Adiciona campos dinamicamente à query de atualização
      if (nome) { updateFields.push('nome = ?'); queryParams.push(nome); }
      if (email) { updateFields.push('email = ?'); queryParams.push(email); }
      if (curso !== undefined) { updateFields.push('curso = ?'); queryParams.push(curso || null); }
      if (especialidade !== undefined) { updateFields.push('especialidade = ?'); queryParams.push(especialidade || null); }
      if (formacao_academica !== undefined) { updateFields.push('formacao_academica = ?'); queryParams.push(formacao_academica || null); }
      if (data_nascimento !== undefined) { updateFields.push('data_nascimento = ?'); queryParams.push(data_nascimento || null); }
      
      // Atualiza a senha apenas se uma nova senha for fornecida e não for vazia
      if (senha && senha.trim() !== '') {
        const hashedPassword = await bcrypt.hash(senha, 10);
        updateFields.push('senha = ?');
        queryParams.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        // Se nenhum campo relevante para a tabela 'usuarios' foi alterado (além de 'tipo')
        // Isso pode acontecer se apenas 'tipo' mudou, ou se a senha era a única mudança e veio vazia.
        // Ainda precisamos processar a atualização de 'tipo' na tabela 'acessos'.
         if (!tipo) { // Se nem o tipo mudou, não há o que fazer.
            await connection.commit(); // Comita a transação vazia
            return NextResponse.json({ success: true, message: 'Nenhum dado para atualizar na tabela de usuários, tipo de acesso verificado.' });
        }
      } else {
        queryParams.push(id); // Adiciona o id_usuario ao final para a cláusula WHERE
        const userUpdateQuery = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id_usuario = ?`;
        await connection.query<OkPacket>(userUpdateQuery, queryParams);
      }


      // Atualiza o tipo na tabela 'acessos'
      if (tipo) {
        const [accessRows] = await connection.query<RowDataPacket[]>('SELECT id_acesso FROM acessos WHERE id_usuario = ?', [id]);
        if (accessRows.length > 0) {
          await connection.query<OkPacket>('UPDATE acessos SET tipo = ? WHERE id_usuario = ?', [tipo, id]);
        } else {
          // Caso raro onde o usuário não tem um registro em 'acessos', cria um.
          await connection.query<OkPacket>('INSERT INTO acessos (id_usuario, tipo) VALUES (?, ?)', [id, tipo]);
          console.warn(`Registro de acesso não encontrado para usuário ${id} durante PUT. Um novo foi criado.`);
        }
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso!' });

    } catch (innerError: unknown) {
      await connection.rollback();
      const errorMessage = innerError instanceof Error ? innerError.message : 'Erro interno ao atualizar usuário.';
      console.error('Erro na transação de atualização do usuário:', errorMessage);
      // Lançar o erro para ser pego pelo catch externo pode ser uma opção,
      // mas aqui estamos retornando uma resposta JSON específica.
      return NextResponse.json({ success: false, message: 'Falha na atualização do usuário.', error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro geral ao atualizar usuário:', errorMessage);
    return NextResponse.json({ success: false, message: 'Erro ao atualizar usuário', error: errorMessage }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// DELETE - Deletar uma mentoria (função DELETE que já existia)
// ... (mantenha sua função DELETE aqui, ajustada com o context: RouteContext se necessário) ...
export async function DELETE(request: NextRequest, context: RouteContext ) {
  let connection;
  try {
    const id = context.params.id;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { success: false, message: 'ID inválido' },
        { status: 400 }
      );
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await connection.query<OkPacket>(
        'DELETE FROM acessos WHERE id_usuario = ?',
        [id]
      );
      const [usuarioResult] = await connection.query<OkPacket>(
        'DELETE FROM usuarios WHERE id_usuario = ?',
        [id]
      );
      await connection.commit();
      return NextResponse.json(
        {
          success: true,
          message: 'Usuário deletado com sucesso',
          affectedRows: usuarioResult.affectedRows,
        },
        { status: 200 }
      );
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao deletar usuário:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao deletar usuário',
        error: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}