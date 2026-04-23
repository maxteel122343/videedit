/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Trash2, 
  Mic, 
  Settings, 
  Video,
  Monitor,
  Smartphone,
  ChevronRight,
  Send,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { EditorProfile, Word, VideoProject, ChatMessage, ExportFormat, ExportQuality } from './types';
import { processCommand, analyzeTranscript } from './services/geminiService';

const MOCK_TRANSCRIPT: Word[] = [
  { id: '1', text: "Today", start: 0, end: 0.5, isRemoved: false },
  { id: '2', text: "I'm", start: 0.5, end: 0.8, isRemoved: false },
  { id: '3', text: "going", start: 0.8, end: 1.2, isRemoved: false },
  { id: '4', text: "to", start: 1.2, end: 1.4, isRemoved: false },
  { id: '5', text: "show", start: 1.4, end: 1.8, isRemoved: false },
  { id: '6', text: "you", start: 1.8, end: 2.1, isRemoved: false },
  { id: '7', text: "[Silence]", start: 2.1, end: 3.5, isRemoved: false, type: 'silence' },
  { id: '8', text: "how", start: 3.5, end: 3.8, isRemoved: false },
  { id: '9', text: "to", start: 3.8, end: 4.0, isRemoved: false },
  { id: '10', text: "build", start: 4.0, end: 4.3, isRemoved: false },
  { id: '11', text: "a", start: 4.3, end: 4.5, isRemoved: false },
  { id: '12', text: "product", start: 4.5, end: 5.0, isRemoved: false },
  { id: '13', text: "[Speech Error]", start: 5.0, end: 6.2, isRemoved: false, type: 'error' },
  { id: '14', text: "a", start: 6.2, end: 6.4, isRemoved: false },
  { id: '15', text: "reallly", start: 6.4, end: 6.8, isRemoved: false },
  { id: '16', text: "cool", start: 6.8, end: 7.2, isRemoved: false },
  { id: '17', text: "app.", start: 7.2, end: 7.8, isRemoved: false },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: "Olá! Eu sou a Lumina AI. O que vamos editar hoje? Você pode me enviar um vídeo ou digitar comandos como 'Corta os silêncios'.", timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>({
    id: 'demo-1',
    name: 'Sample Project',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    transcript: MOCK_TRANSCRIPT,
    profile: EditorProfile.YOUTUBER,
    createdAt: Date.now(),
    originalSize: 1024 * 1024 * 1024 // 1GB demo
  });
  const [profile, setProfile] = useState<EditorProfile>(EditorProfile.YOUTUBER);

  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem('GEMINI_API_KEY');
    // Using simple check for placeholder
    if (saved && saved !== 'MY_GEMINI_API_KEY') return saved;
    return process.env.GEMINI_API_KEY || '';
  });

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
    }
  }, [apiKey]);

  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.MP4);
  const [exportQuality, setExportQuality] = useState<ExportQuality>(ExportQuality.PADRAO);
  const [autoSave, setAutoSave] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [protectedPhrases, setProtectedPhrases] = useState<string[]>(['Importante', 'Lumina']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCurrentProject({
      id: Date.now().toString(),
      name: file.name,
      videoUrl: url,
      transcript: await analyzeTranscript("Processando transcrição do seu vídeo..."),
      profile: EditorProfile.YOUTUBER,
      createdAt: Date.now(),
      originalSize: file.size
    });
  };
  const [detectedPII, setDetectedPII] = useState<{ type: string; value: string; index: number }[]>([]);

  // Detect PII in transcript
  useEffect(() => {
    if (!currentProject) return;
    const pii: typeof detectedPII = [];
    currentProject.transcript.forEach((word, index) => {
      // Very simple mock detection for demo
      if (word.text.includes('@')) pii.push({ type: 'Email', value: word.text, index });
      if (/\d{3}\.\d{3}\.\d{3}/.test(word.text)) pii.push({ type: 'CPF', value: word.text, index });
    });
    setDetectedPII(pii);
  }, [currentProject?.transcript]);

  // Playback control
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'k':
          setIsPlaying(prev => !prev);
          break;
        case 'j':
          if (videoRef.current) videoRef.current.currentTime -= 5;
          break;
        case 'l':
          if (videoRef.current) videoRef.current.currentTime += 5;
          break;
        case 'i':
          // Start mark (concept)
          break;
        case 'o':
          // End mark (concept)
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getEstimatedSize = () => {
    if (!currentProject) return 0;
    let factor = 1;
    if (exportFormat === ExportFormat.MP4) factor *= 0.8;
    if (exportQuality === ExportQuality.ECONOMICO) factor *= 0.25;
    else if (exportQuality === ExportQuality.PADRAO) factor *= 0.5;
    else factor *= 0.9;
    
    // AI compression factor for redundancy
    factor *= 0.85; 
    
    return currentProject.originalSize * factor;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulate AI processing
    const aiResponse = await processCommand(inputText, messages.map(m => ({ role: m.role, content: m.content })), apiKey);
    
    setMessages(prev => [...prev.slice(-20), {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse || "Entendido. Processando sua solicitação...",
      timestamp: Date.now()
    }]);

    // Handle special commands
    if (inputText.toLowerCase().includes('silêncio') || inputText.toLowerCase().includes('corta')) {
      handleCutSilences();
      if (autoSave) {
        setTimeout(handleSave, 1000);
      }
    }
  };

  const handleCutSilences = () => {
    if (!currentProject) return;
    const newTranscript = currentProject.transcript.map(word => 
      word.type === 'silence' ? { ...word, isRemoved: true } : word
    );
    setCurrentProject({ ...currentProject, transcript: newTranscript });
  };

  const handleToggleWord = (wordId: string) => {
    if (!currentProject) return;
    const newTranscript = currentProject.transcript.map(word => 
      word.id === wordId ? { ...word, isRemoved: !word.isRemoved } : word
    );
    setCurrentProject({ ...currentProject, transcript: newTranscript });
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Projeto salvo com sucesso!");
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full bg-brand-bg font-sans selection:bg-brand-text selection:text-brand-bg overflow-hidden text-brand-text">
      {/* Left Sidebar: AI Chat */}
      <aside className="w-[320px] border-r border-brand-border flex flex-col bg-white">
        <div className="p-6 border-b border-brand-border">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center text-white font-bold">E</div>
            <h1 className="text-xs font-bold uppercase tracking-widest">Lumina Editor AI</h1>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
            <div className="text-[11px] uppercase tracking-tighter text-gray-400 font-bold mb-2">Sessão Ativa</div>
            <AnimatePresence>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-lg text-sm leading-relaxed mb-4",
                    m.role === 'assistant' 
                      ? "bg-brand-bg italic text-gray-700 border border-brand-border" 
                      : "bg-brand-text text-brand-bg ml-4"
                  )}
                >
                  {m.content}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-auto p-6 bg-brand-bg border-t border-brand-border">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Comande a IA (ex: 'corta silêncios')"
              className="w-full bg-white border border-brand-border p-4 text-xs focus:outline-none focus:border-black resize-none rounded-sm min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="absolute right-3 bottom-3 opacity-30 italic text-[10px] pointer-events-none">⌘ENTER</div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-400 font-mono uppercase font-bold">
            <Mic size={12} /> Segure Espaço para falar
          </div>
        </div>
        
        <div className="p-6 bg-white border-t border-brand-border space-y-6">
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex justify-between items-center">
              Chave API Gemini
              <Settings size={12} className="opacity-40" />
            </p>
            <input 
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Inserir chave API..."
              className="w-full bg-brand-bg border border-brand-border p-2 text-[10px] font-mono focus:outline-none focus:border-black rounded-sm"
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Configurações de Exportação</p>
            
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Formato</span>
                <div className="flex gap-2">
                  {Object.values(ExportFormat).map(f => (
                    <button 
                      key={f}
                      onClick={() => setExportFormat(f)}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold border transition-all",
                        exportFormat === f ? "bg-brand-text text-brand-bg border-brand-text" : "bg-white border-brand-border text-gray-400"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Qualidade</span>
                <div className="grid grid-cols-3 gap-1">
                  {Object.values(ExportQuality).map(q => (
                    <button 
                      key={q}
                      onClick={() => setExportQuality(q)}
                      className={cn(
                        "py-1.5 text-[9px] font-bold border transition-all",
                        exportQuality === q ? "bg-brand-text text-brand-bg border-brand-text" : "bg-white border-brand-border text-gray-400"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Salvamento Auto</span>
                <button 
                  onClick={() => setAutoSave(!autoSave)}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    autoSave ? "bg-brand-text" : "bg-gray-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                    autoSave ? "right-0.5" : "left-0.5"
                  )} />
                </button>
              </div>

              <div className="p-3 bg-brand-bg border border-brand-border rounded-sm space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="opacity-50">Original:</span>
                  <span>{formatFileSize(currentProject?.originalSize || 0)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-green-600">Comprimido:</span>
                  <span className="text-green-600">{formatFileSize(getEstimatedSize())}</span>
                </div>
                <p className="text-[8px] text-gray-400 italic leading-tight pt-1">
                  IA analisando texturas e redundâncias para compressão inteligente visivelmente sem perdas.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-brand-border">
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Perfis de Edição</p>
            <div className="grid grid-cols-3 gap-2">
            <ProfileButton 
              active={profile === EditorProfile.YOUTUBER} 
              icon={<Monitor size={14} />} 
              label="YT" 
              onClick={() => setProfile(EditorProfile.YOUTUBER)} 
            />
            <ProfileButton 
              active={profile === EditorProfile.REELS} 
              icon={<Smartphone size={14} />} 
              label="Reels" 
              onClick={() => setProfile(EditorProfile.REELS)} 
            />
            <ProfileButton 
              active={profile === EditorProfile.CLASSROOM} 
              icon={<Plus size={14} />} 
              label="Aula" 
              onClick={() => setProfile(EditorProfile.CLASSROOM)} 
            />
          </div>
        </div>
      </div>
    </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Header / Nav */}
        <header className="h-16 border-b border-brand-border bg-white flex items-center justify-between px-8">
          <div className="flex gap-6">
            <span className="text-[10px] uppercase font-bold border-b-2 border-brand-text pb-1 tracking-widest">{currentProject?.name}</span>
            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest cursor-pointer hover:text-brand-text transition-colors">Histórico</span>
            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest cursor-pointer hover:text-brand-text transition-colors">Ativos</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              <span className="text-[10px] font-mono font-bold tracking-tighter">
                {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
              </span>
            </div>
            <div className="h-4 w-px bg-brand-border" />
            <div className="flex items-center gap-4">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="text-[10px] uppercase tracking-widest font-bold hover:underline disabled:opacity-30"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button className="bg-brand-text text-brand-bg px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:opacity-90 transition-opacity">
                Exportar
              </button>
            </div>
          </div>
        </header>

        {/* Video Preview Section */}
        <section className="flex-1 p-8 flex flex-col min-h-0">
          <div className="flex-1 bg-[#141414] rounded-sm relative flex items-center justify-center overflow-hidden group shadow-2xl">
            <video
              ref={videoRef}
              src={currentProject?.videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
            
            {/* AI Intention Overlay */}
            <AnimatePresence>
              {profile === EditorProfile.REELS && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute bottom-10 left-10 bg-white/95 backdrop-blur p-6 border border-brand-text/10 shadow-2xl max-w-[280px]"
                >
                  <div className="text-[9px] uppercase font-bold mb-2 tracking-widest opacity-40">Sugestão Modo Diretor</div>
                  <p className="text-sm font-serif leading-tight italic">
                    "Este segmento parece um <b>Viral Clip</b>. Sugerindo corte 9:16 para TikTok?"
                  </p>
                  <div className="text-[10px] font-mono mt-2 text-gray-500">
                    Est. {formatFileSize(getEstimatedSize())} ({exportFormat})
                  </div>
                  <div className="mt-4 flex gap-4">
                    <button className="text-[10px] font-bold uppercase border-b border-brand-text mb-1">Aplicar Corte</button>
                    <button className="text-[10px] font-bold uppercase opacity-30">Ignorar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simple Floating Controls */}
            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
               <div className="flex items-center gap-8 text-white">
                  <button onClick={() => {}} className="opacity-40 hover:opacity-100"><SkipBack size={24} /></button>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="hover:scale-110 transition-transform">
                    {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" />}
                  </button>
                  <button onClick={() => {}} className="opacity-40 hover:opacity-100"><SkipForward size={24} /></button>
               </div>
            </div>
          </div>
        </section>

        {/* Text Timeline Section */}
        <section className="h-[340px] border-t border-brand-border bg-white flex flex-col">
          <div className="px-8 py-4 border-b border-brand-border flex justify-between items-center bg-brand-bg/30">
            <div className="flex gap-3">
              <span className="px-2 py-1 bg-[#E8F5E9] text-[#2E7D32] text-[9px] font-bold uppercase rounded-sm border border-[#2E7D32]/10 tracking-widest">
                [Intro]
              </span>
              <span className="px-2 py-1 bg-[#FFEBEE] text-[#C62828] text-[9px] font-bold uppercase rounded-sm border border-[#C62828]/10 tracking-widest">
                [Silêncio]
              </span>
              <span className="px-2 py-1 bg-[#FFF3E0] text-[#EF6C00] text-[9px] font-bold uppercase rounded-sm border border-[#EF6C00]/10 tracking-widest">
                [Erro]
              </span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className={cn("w-2 h-2 rounded-full", batchMode ? "bg-green-500" : "bg-gray-300")} />
                 <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">Lote: {batchMode ? 'Ativo' : 'Inativo'}</span>
               </div>
               <button 
                 onClick={handleCutSilences}
                 className="text-[10px] font-bold uppercase bg-brand-text text-brand-bg px-4 py-1.5 hover:opacity-90 tracking-widest"
               >
                 Auto-Cut
               </button>
            </div>
          </div>

          <div 
            ref={transcriptRef}
            className="flex-1 overflow-y-auto p-10 flex flex-wrap gap-x-2 gap-y-3 align-baseline content-start font-serif"
          >
            {currentProject?.transcript.map((word) => (
              <React.Fragment key={word.id}>
                {word.start % 15 < 0.5 && word.start > 0 && (
                  <span className="w-full h-4 flex items-center gap-2 my-2">
                    <span className="h-[1px] flex-1 bg-brand-border opacity-50" />
                    <span className="text-[10px] font-mono text-gray-300">{formatTime(word.start)}</span>
                    <span className="h-[1px] flex-1 bg-brand-border opacity-50" />
                  </span>
                )}
                <span
                  onClick={() => handleToggleWord(word.id)}
                  onMouseEnter={() => !word.isRemoved && handleSeek(word.start)}
                  className={cn(
                    "transcript-word text-2xl tracking-tight leading-relaxed select-none",
                    word.isRemoved && "removed",
                    currentTime >= word.start && currentTime <= word.end && !word.isRemoved && "active",
                    word.type === 'silence' && "silence underline decoration-dotted",
                    word.type === 'error' && "error underline decoration-wavy",
                    !word.isRemoved && !word.type && "hover:decoration-brand-text/30"
                  )}
                >
                  {word.text}
                </span>
              </React.Fragment>
            ))}
            <span className="text-gray-300 font-serif italic text-2xl tracking-tight opacity-40 ml-2">
              [Fim da Transcrição]
            </span>
          </div>

          <div className="px-8 py-4 border-t border-[#F0F0EE] flex items-center justify-between">
            <div className="flex gap-10">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Playback</span>
                <span className="text-xs font-mono font-bold">J K L Controles</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Voz</span>
                <span className="text-xs font-mono font-bold">Espaço p/ Comando</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Modo</span>
                <span className="text-xs font-mono font-bold uppercase">{profile}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end pr-6 border-r border-brand-border">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Proteção</span>
                  <span className="text-xs font-mono font-bold">{protectedPhrases.length} Regras</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Sensível</span>
                  <span className="text-xs font-mono font-bold text-orange-600">{detectedPII.length} Alertas</span>
                </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Explorer Tooltip (Inspired by Footer) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept="video/*"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 bg-brand-text text-brand-bg rounded-sm shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}

function ProfileButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3 border transition-all gap-1 rounded-sm",
        active 
          ? "bg-brand-text text-brand-bg border-brand-text" 
          : "bg-white border-brand-border text-gray-400 hover:border-brand-text hover:text-brand-text"
      )}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
