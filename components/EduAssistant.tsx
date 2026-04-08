'use client';

import { useUser } from '@/context/UserContext';
import { Bot, Send, X, Loader2, Trash2, User, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function EduAssistant() {
  const { user, role } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  if (role !== 'DOCENTE' && role !== 'DIRECTOR') return null;

  // Función para limpiar el chat
  const clearChat = () => {
    if (window.confirm('¿Deseas limpiar la conversación?')) {
      setMessages([]);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = chatInput.trim();
    if (!userMessage || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          userEmail: user?.email 
        }),
      });

      if (!response.ok) throw new Error('Error en el servidor');

      const assistantText = await response.text();
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
      
    } catch (err) {
      console.error("Error EduAI:", err);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Lo siento, hubo un error al procesar tu mensaje." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:scale-110 hover:bg-blue-700 transition-all z-50 group"
      >
        <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-2 -right-2 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-2 border-white"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-slate-100 z-50 animate-in slide-in-from-bottom-12 duration-500">
      
      {/* Header con Estilo Profesional */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Bot size={22} className="text-blue-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-base tracking-tight flex items-center gap-2">
              EduAI <Sparkles size={14} className="text-yellow-400" />
            </span>
            <span className="text-[10px] uppercase text-slate-400 tracking-[0.1em] font-semibold">Inteligencia Pedagógica</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            title="Limpiar chat"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Cuerpo del Chat */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc] custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center border border-slate-100">
                <Bot size={40} className="text-blue-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#f8fafc]"></div>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">¡Hola, {user?.nombre || 'Docente'}!</h3>
              <p className="text-slate-500 text-sm max-w-[220px] mx-auto mt-1">
                Soy tu asistente en <b>EduControl</b>. ¿En qué puedo apoyarte hoy con tus clases?
              </p>
            </div>
          </div>
        )}
        
        {messages.map((m, index) => (
          <div key={index} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex items-center gap-2 mb-1 px-1`}>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {m.role === 'user' ? 'Tú' : 'EduAI'}
               </span>
            </div>
            <div className={`relative p-4 rounded-2xl max-w-[90%] text-sm leading-relaxed shadow-sm transition-all ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-3 text-slate-400 text-sm shadow-sm">
              <Loader2 size={16} className="animate-spin text-blue-500" /> 
              <span>Procesando datos...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input de Mensajes */}
      <div className="p-5 bg-white border-t border-slate-100">
        <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Hazme una pregunta sobre tus cursos..."
            className="flex-1 px-4 py-3 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={isLoading || !chatInput.trim()}
            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 disabled:opacity-20 transition-all flex items-center justify-center active:scale-90"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-tight">
          Sincronizado con la base de datos de EduControl
        </p>
      </div>
    </div>
  );
}