"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Mic, Sparkles, Loader2, Paperclip, Maximize2, Minimize2, Briefcase, GraduationCap, Users, ShieldAlert, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
}

export default function EduControlFloatingChat({ userRole = 'DOCENTE' }: { userName?: string, userRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingDB, setIsSearchingDB] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  // 1. SALUDO DINÁMICO BASADO EN LA HORA (A PRUEBA DE ERRORES)
  useEffect(() => {
    const hora = new Date().getHours();
    let saludoTemporal = "Buenas noches";
    
    if (hora >= 5 && hora < 12) {
      saludoTemporal = "Buenos días";
    } else if (hora >= 12 && hora < 19) {
      saludoTemporal = "Buenas tardes";
    }

    setMessages([
      { role: 'model', text: `¡${saludoTemporal}! Soy Jimmy ⚡. ¿En qué puedo ayudarte hoy en el sistema?` }
    ]);
  }, []);

  // 2. CONFIGURACIÓN VISUAL DEL ROL (Iconos y sugerencias)
  const roleFormat = userRole.toUpperCase();
  
  const getRoleConfig = () => {
    switch (roleFormat) {
      case 'DIRECTOR': return { icon: Briefcase, suggestions: ["Estadísticas globales", "Tickets pendientes"] };
      case 'DOCENTE': return { icon: GraduationCap, suggestions: ["Buscar expediente", "Generar rúbrica"] };
      case 'SECRETARIA': return { icon: Users, suggestions: ["Redactar circular", "Revisar asistencias"] };
      case 'ADMIN_SISTEMA': return { icon: ShieldAlert, suggestions: ["Tickets urgentes", "Estado BD"] };
      default: return { icon: Sparkles, suggestions: ["Buscar información general"] };
    }
  };

  const config = getRoleConfig();
  const RoleIcon = config.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExpanded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleSend = async (messageText: string = input) => {
    if ((!messageText.trim() && !attachedFile) || isLoading) return;

    let userText = messageText;
    if (attachedFile) {
      userText += `\n*[Archivo adjunto: ${attachedFile.name}]*`;
    }

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);
    setIsSearchingDB(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: messages.slice(1), userRole: roleFormat })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.reply || "Error en la respuesta." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Error de red. Revisa tu conexión." }]);
    } finally {
      setIsLoading(false);
      setIsSearchingDB(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end font-sans">
      
      <div className={`transition-all duration-500 ease-out transform origin-bottom-right 
        ${isOpen ? 'scale-100 opacity-100 mb-6' : 'scale-75 opacity-0 pointer-events-none absolute bottom-0'}
        ${isExpanded ? 'w-[800px] h-[85vh]' : 'w-[480px] h-[700px]'}
      `}>
        <div className="w-full h-full bg-white/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(37,99,235,0.15)] border border-white flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <div className="bg-white/40 backdrop-blur-md p-5 flex justify-between items-center border-b border-gray-100/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
                <RoleIcon size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg tracking-tight flex items-center gap-2">
                  Jimmy AI
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1"></span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">Asistente de EduControl</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setIsExpanded(!isExpanded)} className="hover:bg-gray-200/50 p-2.5 rounded-full transition-colors text-gray-500 hover:text-gray-800">
                {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-red-50 p-2.5 rounded-full transition-colors text-gray-500 hover:text-red-500">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Sugerencias Rápidas */}
          <div className="px-6 py-3 bg-gray-50/30 border-b border-gray-100/50 flex gap-2 overflow-x-auto custom-scrollbar">
            {config.suggestions.map((sugg, idx) => (
              <button key={idx} onClick={() => handleSend(sugg)} className="whitespace-nowrap px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
                {sugg}
              </button>
            ))}
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-gradient-to-b from-transparent to-blue-50/10">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                {msg.role !== 'user' && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                    <Bot size={20} className="text-white" />
                  </div>
                )}
                <div className={`prose prose-sm max-w-[85%] p-4.5 px-6 shadow-sm ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-[1.5rem] rounded-br-sm' : 'bg-white text-gray-800 rounded-[1.5rem] rounded-bl-sm border border-gray-100/80 shadow-md'}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-end gap-3 animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Bot size={20} className="text-white animate-pulse" />
                </div>
                <div className="px-5 py-3.5 bg-white rounded-[1.5rem] rounded-bl-sm border border-gray-100 shadow-md flex items-center gap-3">
                  <Loader2 className="animate-spin text-blue-600" size={18} />
                  <span className="text-sm font-medium text-gray-500">
                    {isSearchingDB ? "Consultando EduControl..." : "Generando respuesta..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 bg-white/60 border-t border-gray-100/50 backdrop-blur-md">
            {attachedFile && (
              <div className="mb-3 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm border border-blue-100 w-max animate-in fade-in">
                <FileText size={16} />
                <span className="font-medium truncate max-w-[200px]">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="ml-2 hover:text-red-500"><X size={16}/></button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-white rounded-[1.5rem] p-2 shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0">
                <Paperclip size={20} />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe tu consulta aquí..."
                className="flex-1 bg-transparent text-base px-2 py-3 focus:outline-none text-gray-700 placeholder-gray-400 font-medium resize-none max-h-32 custom-scrollbar"
                rows={1}
                disabled={isLoading}
              />

              <div className="flex items-center gap-1 shrink-0 pb-1 pr-1">
                <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <Mic size={20} />
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input.trim() && !attachedFile)}
                  className="bg-blue-600 text-white p-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className={`transition-all duration-500 transform ${isOpen ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100 hover:-translate-y-2'} bg-gray-900 text-white p-5 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-gray-700`}
      >
        <Sparkles size={26} className="text-blue-400" />
      </button>

    </div>
  );
}