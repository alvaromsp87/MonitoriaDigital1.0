// app/api/usuarios/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Ajuste o caminho se o seu db.ts estiver em @monitoriadigital/lib/db
import bcrypt from 'bcryptjs';
import { OkPacket } from 'mysql2/promise';

interface BatchUsuario {
  nome: string;
  email: string;
  senha?: string; // Senha é obrigatória para novos usuários
  tipo: string;
  curso?: string;
  especialidade?: string;
  formacao_academica?: string;
  data_nascimento?: string;
  // Adicione outros campos que seu CSV pode conter e que você quer importar
}

export async function POST(request: NextRequest) {
  let connection;
  let createdCount = 0;
  const individualErrors: { email?: string, nome?: string, error: string }[] = [];

  try {
    const batchUsers = (await request.json()) as BatchUsuario[];

    if (!Array.isArray(batchUsers) || batchUsers.length === 0) {
      return NextResponse.json({ error: 'Nenhum usuário fornecido no lote.', createdCount: 0, errors: [] }, { status: 400 });
    }

    connection = await pool.getConnection();
    
    for (const userData of batchUsers) {
      // Validação básica para cada usuário no lote
      if (!userData.nome || !userData.email || !userData.senha || !userData.tipo) {
        individualErrors.push({ 
          email: userData.email, 
          nome: userData.nome, 
          error: 'Campos obrigatórios (nome, email, senha, tipo) faltando.' 
        });
        continue; // Pula este usuário e continua com o próximo no lote
      }

      try {
        await connection.beginTransaction();

        const hashedPassword = await bcrypt.hash(userData.senha, 10);
        const [userResult] = await connection.query<OkPacket>(
          `INSERT INTO usuarios 
          (nome, email, senha, curso, especialidade, formacao_academica, data_nascimento) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userData.nome,
            userData.email,
            hashedPassword,
            userData.curso || null,
            userData.especialidade || null,
            userData.formacao_academica || null,
            userData.data_nascimento || null,
          ]
        );

        await connection.query<OkPacket>(
          `INSERT INTO acessos (id_usuario, tipo) VALUES (?, ?)`,
          [userResult.insertId, userData.tipo]
        );

        await connection.commit();
        createdCount++;
      } catch (userCreationError: unknown) {
        await connection.rollback(); // Rollback para este usuário específico
        const errorMsg = userCreationError instanceof Error ? userCreationError.message : 'Erro desconhecido ao criar usuário.';
        individualErrors.push({ email: userData.email, nome: userData.nome, error: errorMsg });
        console.error(`Falha ao criar usuário ${userData.email || userData.nome} no lote:`, userCreationError);
      }
    }

    // Resposta final após processar todos os usuários no lote
    if (individualErrors.length > 0) {
      return NextResponse.json(
        { 
          message: `Lote processado. ${createdCount} usuários criados com sucesso. ${individualErrors.length} usuários falharam.`,
          createdCount,
          errors: individualErrors 
        },
        // HTTP 207 Multi-Status se alguns tiveram sucesso e outros falharam
        // HTTP 400 Bad Request se todos falharam
        { status: createdCount > 0 && individualErrors.length > 0 ? 207 : (createdCount === 0 && individualErrors.length > 0 ? 400 : 201) } 
      );
    }

    return NextResponse.json(
      { message: 'Lote de usuários cadastrado com sucesso!', createdCount },
      { status: 201 }
    );

  } catch (error: unknown) { // Erro geral (ex: falha ao parsear JSON do request)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no processamento do lote.';
    console.error('Erro crítico no endpoint /api/usuarios/batch:', error);
    // Se a conexão foi estabelecida antes do erro geral, liberar.
    // (Não há transação geral para o lote inteiro aqui, apenas por usuário)
    return NextResponse.json({ error: errorMessage, createdCount, errors: individualErrors }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}