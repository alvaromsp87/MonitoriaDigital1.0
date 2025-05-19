import { NextResponse } from 'next/server';

let usuarios: any[] = [];
let idCounter = 1;

export async function GET() {
  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { nome, email, senha, tipo } = body;

  if (!nome || !email || !senha || !tipo) {
    return NextResponse.json({ message: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }

  const novoUsuario = { id: idCounter++, nome, email, senha, tipo };
  usuarios.push(novoUsuario);

  return NextResponse.json(novoUsuario, { status: 201 });
}
