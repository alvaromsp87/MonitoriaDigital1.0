"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@monitoriadigital/app/context/AuthContext";
import { MessageCircle } from "lucide-react";


export default function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    };
  
    
  
    return () => {
      
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      setMessage("");
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 bg-white shadow-lg rounded-xl overflow-hidden border border-gray-300">
          <div className="bg-blue-500 text-white px-4 py-2 flex justify-between items-center">
            <span className="font-semibold">Chat</span>
            <button onClick={() => setIsOpen(false)}>✖️</button>
          </div>
          <div className="p-3 h-64 overflow-y-auto bg-gray-100">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm mb-1">{msg}</div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex p-2 gap-2 border-t">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
              placeholder="Mensagem..."
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
