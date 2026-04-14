import { useOrganicoPosts } from '@/hooks/useSupabaseData';
import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';
import { Eye, Heart, MessageCircle, Share2, Bookmark, Video, TrendingUp, FileText, ExternalLink } from 'lucide-react';
import { formatMXN } from '@/lib/formatters';

export default function OrganicoSocial() {
  const { activeBrand } = useAppStore();
  const { data: posts, isLoading } = useOrganicoPosts();

  const allPosts = posts || [];

  // KPIs
  const totalVideos = allPosts.length;
  const totalViews = allPosts.reduce((s, p) => s + (p.views || 0), 0);
  const tiktokPosts = allPosts.filter(p => p.plataforma === 'tiktok');
  const igPosts = allPosts.filter(p => p.plataforma === 'instagram');
  const viewsTikTok = tiktokPosts.reduce((s, p) => s + (p.views || 0), 0);
  const viewsIG = igPosts.reduce((s, p) => s + (p.views || 0), 0);
  const avgViews = totalVideos > 0 ? totalViews / totalVideos : 0;

  // Weekly breakdown
  const weeklyData = useMemo(() => {
    if (!allPosts.length) return [];
    const weeks: Record<string, typeof allPosts> = {};
    allPosts.forEach(p => {
      const d = new Date(p.fecha_publicacion || p.created_at || '');
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(p);
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekOf, posts]) => {
        const tiktoks = posts.filter(p => p.plataforma === 'tiktok');
        const reels = posts.filter(p => p.plataforma === 'instagram');
        const views = posts.reduce((s, p) => s + (p.views || 0), 0);
        const topPost = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
        return {
          weekOf,
          total: posts.length,
          tiktoks: tiktoks.length,
          reels: reels.length,
          views,
          avgViews: posts.length > 0 ? Math.round(views / posts.length) : 0,
          topCaption: topPost?.caption?.slice(0, 40) || '—',
          topViews: topPost?.views || 0,
        };
      });
  }, [allPosts]);

  // Top 5 by platform
  const top5TikTok = useMemo(() =>
    [...tiktokPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    [tiktokPosts]);

  const top5IG = useMemo(() =>
    [...igPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    [igPosts]);

  // Hook analysis
  const hookAnalysis = useMemo(() => {
    if (!allPosts.length) return [];
    const byAngulo: Record<string, { count: number; views: number }> = {};
    allPosts.forEach(p => {
      const key = p.angulo || 'sin_angulo';
      if (!byAngulo[key]) byAngulo[key] = { count: 0, views: 0 };
      byAngulo[key].count++;
      byAngulo[key].views += p.views || 0;
    });
    return Object.entries(byAngulo)
      .map(([name, d]) => ({ name, count: d.count, avgViews: Math.round(d.views / d.count) }))
      .sort((a, b) => b.avgViews - a.avgViews)
      .slice(0, 5);
  }, [allPosts]);

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-800 rounded w-48" />
      <div className="h-64 bg-gray-800 rounded" />
    </div>
  );

  if (!allPosts.length) return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-white">Orgánico Social</h1>
      </div>
      <div className="bg-[#111111] border border-gray-800/60 rounded-xl p-12 text-center">
        <Video size={40} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-sm">No hay datos de orgánico aún.</p>
        <p className="text-gray-600 text-xs mt-1">Los datos se sincronizarán automáticamente.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Intelligence Suite</p>
        <h1 className="text-2xl font-medium text-white">Orgánico Social</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Videos" value={String(totalVideos)} icon={<Video size={14} />} />
        <KpiCard label="Total Views" value={totalViews.toLocaleString()} icon={<Eye size={14} />} />
        <KpiCard label="Views TikTok" value={viewsTikTok.toLocaleString()} color="text-pink-400" />
        <KpiCard label="Views Instagram" value={viewsIG.toLocaleString()} color="text-purple-400" />
        <KpiCard label="Prom. Views/Video" value={Math.round(avgViews).toLocaleString()} icon={<TrendingUp size={14} />} />
        <KpiCard label="Seguidores Nuevos" value="—" icon={<Heart size={14} />} />
      </div>

      {/* Resumen Ejecutivo */}
      <div className="bg-[#111111] border border-gray-800/60 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-2">Resumen Ejecutivo</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Se publicaron <span className="text-white font-medium">{totalVideos} videos</span> con un total de{' '}
          <span className="text-white font-medium">{totalViews.toLocaleString()} views</span>.
          TikTok generó <span className="text-pink-400">{viewsTikTok.toLocaleString()} views</span> ({tiktokPosts.length} videos) e
          Instagram <span className="text-purple-400">{viewsIG.toLocaleString()} views</span> ({igPosts.length} reels).
          El promedio por video es <span className="text-white font-medium">{Math.round(avgViews).toLocaleString()} views</span>.
          {top5TikTok[0] && ` El video más viral alcanzó ${(top5TikTok[0].views || 0).toLocaleString()} views.`}
        </p>
      </div>

      {/* Desglose Semanal */}
      <div className="bg-[#111111] border border-gray-800/60 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800/60">
          <h3 className="text-sm font-medium text-white">Desglose Semanal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800/60">
                {['Semana', 'Videos', 'TikToks', 'Reels IG', 'Views', 'Prom. Views', 'Video Más Viral'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[9px] uppercase tracking-wider text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeklyData.map(w => (
                <tr key={w.weekOf} className="border-b border-gray-800/30 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-gray-300 font-mono">{w.weekOf}</td>
                  <td className="px-4 py-2.5 text-white font-medium">{w.total}</td>
                  <td className="px-4 py-2.5 text-pink-400">{w.tiktoks}</td>
                  <td className="px-4 py-2.5 text-purple-400">{w.reels}</td>
                  <td className="px-4 py-2.5 text-white">{w.views.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-300">{w.avgViews.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-400 max-w-[200px] truncate">
                    {w.topCaption} <span className="text-orange-400">({w.topViews.toLocaleString()})</span>
                  </td>
                </tr>
              ))}
              {!weeklyData.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 5 por plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 TikToks */}
        <div className="bg-[#111111] border border-gray-800/60 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-3">🎵 Top 5 TikToks</h3>
          {top5TikTok.length > 0 ? (
            <div className="space-y-3">
              {top5TikTok.map((p, i) => (
                <PostCard key={p.id} post={p} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">Sin TikToks</p>
          )}
        </div>

        {/* Top 5 Reels */}
        <div className="bg-[#111111] border border-gray-800/60 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-3">📸 Top 5 Reels IG</h3>
          {top5IG.length > 0 ? (
            <div className="space-y-3">
              {top5IG.map((p, i) => (
                <PostCard key={p.id} post={p} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-4">Sin Reels</p>
          )}
        </div>
      </div>

      {/* Hook Analysis */}
      <div className="bg-[#111111] border border-gray-800/60 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-3">Análisis de Hooks</h3>
        {hookAnalysis.length > 0 ? (
          <div className="space-y-2">
            {hookAnalysis.map(h => {
              const maxViews = hookAnalysis[0]?.avgViews || 1;
              const pct = (h.avgViews / maxViews) * 100;
              return (
                <div key={h.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-300 w-28 truncate capitalize">{h.name.replace('_', ' ')}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 w-12 text-right">{h.count} vids</span>
                  <span className="text-[10px] text-white w-16 text-right">{h.avgViews.toLocaleString()} avg</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500">Sin datos de ángulos/hooks</p>
        )}
      </div>

      {/* Crear en Notion */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
          <ExternalLink size={14} />
          Crear en Notion
        </button>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon?: React.ReactNode; color?: string }) {
  return (
    <div className="bg-[#111111] border border-gray-800/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      <div className={`text-lg font-medium ${color || 'text-white'}`}>{value}</div>
    </div>
  );
}

function PostCard({ post, rank }: { post: any; rank: number }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-lg">
      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold flex-shrink-0">
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white line-clamp-2 mb-1.5">{post.caption || 'Sin caption'}</p>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5"><Eye size={10} /> {(post.views || 0).toLocaleString()}</span>
          <span className="flex items-center gap-0.5"><Heart size={10} /> {post.likes || 0}</span>
          <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {post.comentarios || 0}</span>
          <span className="flex items-center gap-0.5"><Share2 size={10} /> {post.shares || 0}</span>
          {post.saves > 0 && <span className="flex items-center gap-0.5"><Bookmark size={10} /> {post.saves}</span>}
        </div>
      </div>
    </div>
  );
}
