import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAgentConversations, useAgentDailyRuns } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { Target, DollarSign, Megaphone, Video, Truck, BarChart2, Palette, X, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const iconMap: Record<string, React.ElementType> = { Target, DollarSign, Megaphone, Video, Truck, BarChart2, Palette };

const agents = [
  { id: 'director', name: 'Director / CEO', icon: 'Target', description: 'Visión estratégica total de ambas marcas' },
  { id: 'financiero', name: 'Analista Financiero', icon: 'DollarSign', description: 'P&L, márgenes, cashflow y KPIs' },
  { id: 'publicidad', name: 'Analista de Publicidad', icon: 'Megaphone', description: 'ROAS, creativos y presupuesto' },
  { id: 'lives', name: 'Analista de Lives', icon: 'Video', description: 'Rentabilidad por sesión y host' },
  { id: 'logistica', name: 'Analista de Logística', icon: 'Truck', description: 'Envíos, inventario, contracargos' },
  { id: 'datos', name: 'Analista de Datos', icon: 'BarChart2', description: 'Síntesis diaria y anomalías' },
  { id: 'creativo', name: 'Analista Creativo', icon: 'Palette', description: 'Ángulos ganadores, fatigue, sugerencias' },
];

type Message = { role: 'user' | 'assistant'; content: string };

export default function AgentesIA() {
  const { activeBrand } = useAppStore();
  const { data: conversations } = useAgentConversations();
  const { data: dailyRuns } = useAgentDailyRuns();
  const [chatAgent, setChatAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeAgent = agents.find((a) => a.id === chatAgent);
  const lastRun = dailyRuns?.[0];
  const lastRunAge = lastRun?.ran_at ? (Date.now() - new Date(lastRun.ran_at).getTime()) / 3600000 : null;
  const statusColor = lastRunAge === null ? 'bg-muted' : lastRunAge < 2 ? 'bg-status-good' : lastRunAge < 6 ? 'bg-status-warning' : 'bg-status-critical';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatAgent]);

  const sendMessage = async () => {
    if (!input.trim() || !chatAgent) return;
    const userMsg: Message = { role: 'user', content: input };
    const currentMessages = [...(messages[chatAgent] || []), userMsg];
    setMessages(prev => ({ ...prev, [chatAgent]: currentMessages }));
    setInput('');
    setLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-agent`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          agentId: chatAgent,
          brand: activeBrand,
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (resp.status === 429) { toast.error('Rate limit — espera unos segundos'); setLoading(false); return; }
      if (resp.status === 402) { toast.error('Créditos agotados — agrega fondos en Settings'); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error('Error de IA'); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const agentMsgs = prev[chatAgent] || [];
                const last = agentMsgs[agentMsgs.length - 1];
                if (last?.role === 'assistant') {
                  return { ...prev, [chatAgent]: agentMsgs.map((m, i) => i === agentMsgs.length - 1 ? { ...m, content: assistantContent } : m) };
                }
                return { ...prev, [chatAgent]: [...agentMsgs, { role: 'assistant', content: assistantContent }] };
              });
            }
          } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
          <h1 className="text-2xl font-medium text-foreground">Agentes IA</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          {lastRun ? `Última ejecución: ${new Date(lastRun.ran_at || '').toLocaleString('es-MX')}` : 'Sin ejecuciones'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = iconMap[agent.icon] || Target;
          const conv = conversations?.find(c => c.agent_id === agent.id);
          return (
            <div key={agent.id} className="bg-card rounded-lg border border-border p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">{agent.name}</h3>
                  <span className="text-[9px] uppercase tracking-wider text-primary font-medium">{activeBrand === 'feel_ink' ? 'Feel Ink' : 'Skinglow'}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex-1">{agent.description}</p>
              {conv?.last_analysis && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{conv.last_analysis.slice(0, 100)}..."</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-[9px] text-muted-foreground">Lovable AI</span>
                <button onClick={() => setChatAgent(agent.id)} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg">
                  Chat →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Panel */}
      {chatAgent && activeAgent && (
        <div className="fixed inset-y-0 right-0 w-full max-w-[540px] bg-card border-l border-border z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">🤖 {activeAgent.name}</span>
              <span className="text-[9px] uppercase tracking-wider text-primary">— {activeBrand === 'feel_ink' ? 'Feel Ink' : 'Skinglow'}</span>
            </div>
            <button onClick={() => setChatAgent(null)} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {(messages[chatAgent] || []).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg px-4 py-2.5 text-sm text-muted-foreground animate-pulse">Analizando...</div>
              </div>
            )}
            {!(messages[chatAgent]?.length) && !loading && (
              <div className="text-center text-sm text-muted-foreground mt-10">
                Envía un mensaje para iniciar el análisis con {activeAgent.name}.
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="Escribe tu pregunta..."
                disabled={loading}
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button onClick={sendMessage} disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
