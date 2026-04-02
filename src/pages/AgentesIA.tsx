import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { agents } from '@/data/mockData';
import { Target, DollarSign, Megaphone, Video, Truck, BarChart2, X, Send, RefreshCw } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = { Target, DollarSign, Megaphone, Video, Truck, BarChart2 };

type Message = { role: 'user' | 'assistant'; content: string };

export default function AgentesIA() {
  const { activeBrand } = useAppStore();
  const [chatAgent, setChatAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');

  const activeAgent = agents.find((a) => a.id === chatAgent);

  const sendMessage = () => {
    if (!input.trim() || !chatAgent) return;
    const newMsg: Message = { role: 'user', content: input };
    setMessages((prev) => ({
      ...prev,
      [chatAgent]: [...(prev[chatAgent] || []), newMsg, { role: 'assistant', content: 'Analizando datos del período actual para ' + (activeBrand === 'feel_ink' ? 'Feel Ink' : 'Skinglow') + '... Este es un placeholder — la integración con IA se conectará a Lovable Cloud.' }],
    }));
    setInput('');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-foreground">Agentes IA</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = iconMap[agent.icon] || Target;
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
              {agent.lastAnalysis && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{agent.lastAnalysis.slice(0, 100)}..."</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-[9px] text-muted-foreground">claude-sonnet-4-5</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChatAgent(agent.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg"
                  >
                    Chat →
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium border border-border text-foreground rounded-lg hover:bg-secondary">
                    <RefreshCw size={12} />
                  </button>
                </div>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(messages[chatAgent] || []).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {!(messages[chatAgent]?.length) && (
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
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={sendMessage} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
