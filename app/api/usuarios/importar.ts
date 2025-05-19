import { NextApiRequest, NextApiResponse } from 'next';

let usuarios: any[] = [];
let idCounter = 1;

globalThis.usuarios = globalThis.usuarios || [];
globalThis.idCounter = globalThis.idCounter || 1;

usuarios = globalThis.usuarios;
idCounter = globalThis.idCounter;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const novosUsuarios = req.body;

    if (!Array.isArray(novosUsuarios)) {
      return res.status(400).json({ message: 'Formato inválido.' });
    }

    for (const usuario of novosUsuarios) {
      if (!usuario.nome || !usuario.email || !usuario.tipo) continue;
      usuarios.push({ id: idCounter++, ...usuario });
    }

    globalThis.usuarios = usuarios;
    globalThis.idCounter = idCounter;

    res.status(200).json({ message: 'Importação concluída.' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
