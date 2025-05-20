'use client';

import React, { useState, useEffect } from 'react';
import Calendar, { Value } from 'react-calendar'; // ⬅️ Importa o tipo Value corretamente
import 'react-calendar/dist/Calendar.css';

export default function CalendarioAgendamento() {
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);

  useEffect(() => {
    const dataFormatada = dataSelecionada.toISOString().split('T')[0];

    fetch(`/api/agendamentos?data=${dataFormatada}`)
      .then(res => res.json())
      .then((data: string[]) => {
        const todosHorarios = ['09:00', '10:00', '11:00', '14:00', '15:00'];
        const disponiveis = todosHorarios.filter(h => !data.includes(h));
        setHorarios(disponiveis);
      });
  }, [dataSelecionada]);

  const handleDataChange = (value: Value, event?: React.MouseEvent<HTMLButtonElement>) => {
    console.log('handleDataChange chamado com:', value, event);
    if (!value) return;
    if (Array.isArray(value)) {
      setDataSelecionada(value[0]);
    } else {
      setDataSelecionada(value);
    }
  };

  const agendar = async () => {
    if (!horarioSelecionado) return alert('Escolha um horário!');

    const dataFormatada = dataSelecionada.toISOString().split('T')[0];
    const data_agendada = `${dataFormatada}T${horarioSelecionado}:00`;

    const res = await fetch('/api/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_mentoria: 1,
        data_agendada,
        status: 'PENDENTE'
      }),
    });

    const resultado = await res.json();
    alert(resultado.mensagem);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <Calendar onChange={handleDataChange} value={dataSelecionada} />
      <h3 className="mt-4">Horários disponíveis:</h3>
      <div className="flex gap-2 mt-2 flex-wrap">
        {horarios.map(h => (
          <button
            key={h}
            onClick={() => setHorarioSelecionado(h)}
            className={`px-3 py-1 rounded border ${horarioSelecionado === h ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            {h}
          </button>
        ))}
      </div>
      <button
        onClick={agendar}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Agendar
      </button>
    </div>
  );
}
