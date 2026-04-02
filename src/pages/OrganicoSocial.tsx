import { useOrganicoPosts } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, Heart, MessageCircle, Share2, Flame } from 'lucide-react';

export default function OrganicoSocial() {
  const { activeBrand } = useAppStore();
  const { data: posts, isLoading } = useOrganicoPosts();

  const totalViews = (posts || []).reduce((s, p) => s + (p.views || 0), 0);
  const totalLikes = (posts || []).reduce((s, p) => s + (p.likes || 0), 0);
  const avgViews = posts?.length ? totalViews / posts.length : 0;
  const engagement = totalViews ? ((totalLikes + (posts || []).reduce((s, p) => s + (p.comentarios || 0), 0)) / totalViews) * 100 : 0;

  const convertToPaid = async (postId: string) => {
    const post = posts?.find(p => p.id === postId);
    if (!post) return;
    const { error } = await supabase.from('creativos').insert({
      brand: activeBrand,
      nombre: `Org→Paid: ${(post.caption || '').slice(0, 30)}`,
      tipo: post.tipo === 'video' ? 'video' : 'imagen',
      plataforma: post.plataforma === 'tiktok' ? 'tiktok_ads' : 'meta',
      hook_text: post.caption?.slice(0, 100),
      angulo: post.angulo,
    });
    if (error) toast.error(error.message); else toast.success('Creativo creado desde post orgánico');
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-secondary rounded" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-foreground">Orgánico Social</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Views</span>
          <div className="text-2xl font-medium text-foreground">{totalViews.toLocaleString()}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Likes</span>
          <div className="text-2xl font-medium text-foreground">{totalLikes.toLocaleString()}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Engagement</span>
          <div className="text-2xl font-medium text-foreground">{engagement.toFixed(1)}%</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Posts</span>
          <div className="text-2xl font-medium text-foreground">{posts?.length || 0}</div>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(posts || []).map(p => {
          const isViral = (p.views || 0) > avgViews * 10;
          return (
            <div key={p.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase tracking-wider bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{p.plataforma}</span>
                {isViral && <span className="flex items-center gap-1 text-[9px] text-primary font-medium"><Flame size={12} /> VIRAL</span>}
              </div>
              <p className="text-sm text-foreground line-clamp-3">{p.caption || 'Sin caption'}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye size={12} /> {(p.views || 0).toLocaleString()}</span>
                <span className="flex items-center gap-1"><Heart size={12} /> {p.likes || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {p.comentarios || 0}</span>
                <span className="flex items-center gap-1"><Share2 size={12} /> {p.shares || 0}</span>
              </div>
              <button onClick={() => convertToPaid(p.id)} className="mt-3 w-full px-3 py-1.5 text-xs border border-border rounded-lg text-foreground hover:bg-secondary">
                Convertir a Paid →
              </button>
            </div>
          );
        })}
        {!posts?.length && <div className="col-span-3 text-center py-8 text-muted-foreground">Sin posts orgánicos</div>}
      </div>
    </div>
  );
}
