import { NextApiRequest, NextApiResponse } from 'next';

let usuarios: any[] = [];
let idCounter = 1;

// Compartilhar os dados entre os arquivos (em dev apenas)
globalThis.usuarios = globalThis.usuarios || [];
globalThis.idCounter = globalThis.idCounter || 1;

usuarios = globalThis.usuarios;
idCounter = globalThis.idCounter;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = parseInt(req.query.id as string);

  if (req.method === 'PUT') {
    const index = usuarios.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado' });

    const { nome, email, senha, tipo } = req.body;
    if (!nome || !email || !tipo) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }

    usuarios[index] = {
      ...usuarios[index],
      nome,
      email,
      tipo,
      ...(senha && { senha }),
    };

    res.status(200).json(usuarios[index]);
  }

  else if (req.method === 'DELETE') {
    usuarios = usuarios.filter((u) => u.id !== id);
    globalThis.usuarios = usuarios;
    res.status(204).end();
  }

  else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
