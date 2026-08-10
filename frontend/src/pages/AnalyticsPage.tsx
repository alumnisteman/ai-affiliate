import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart3, TrendingUp, Eye, Heart, Share2, Zap, RefreshCw,
  MousePointerClick, DollarSign, Loader2, Target, Activity, Trophy, Hash
} from 'lucide-react';

interface PlatformClick { platform: string; clicks: number }
interface PlatformOrder { platform: string; orders: number; revenue: number; commission: number }
interface ContentSummary { avgCtr: number; avgConversion: number; totalViews: number; totalLikes: number; totalShares: number }
interface TopContent { id: number; hook: string; product: string; views: number; ctr: number }
interface RisingTrend { product: string; momentum: number; period: string }
interface Pattern { id: number; platform: string; hookTemplate: string; avgCtr: number; avgConversion: number; sampleSize: number; confidence: number }
interface AuditEvent { id: number; eventType: string; entityType: string; createdAt: string }

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500', shopee: 'bg-orange-500',
  tokopedia: 'bg-[#00AA5B]', lazada: 'bg-blue-500',
  direct: 'bg-purple-500', whatsapp: 'bg-emerald-500', unknown: 'bg-slate-400',
};
const EVENT_BADGE: Record<string, string> = {
  click: 'badge-blue', conversion: 'badge-green',
  content_generated: 'bg-purple-50 text-purple-600 text-[10px] font-semibold px-2 py-0.5 rounded-full',
  product_view: 'badge-gray', commission_earned: 'badge-orange',
  content_posted: 'bg-pink-50 text-pink-600 text-[10px] font-semibold px-2 py-0.5 rounded-full',
};

function StatCard({ label, value, icon, border }: { label: string; value: string; icon: React.ReactNode; border: string }) {
  return (
    <div className={`stat-card ${border}`}>
      <div className="flex items-start justify-between mb-3">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [discoveringPatterns, setDiscoveringPatterns] = useState(false);
  const [clicksByPlatform, setClicksByPlatform] = useState<PlatformClick[]>([]);
  const [ordersByPlatform, setOrdersByPlatform] = useState<PlatformOrder[]>([]);
  const [contentSummary, setContentSummary] = useState<ContentSummary | null>(null);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [risingTrends, setRisingTrends] = useState<RisingTrend[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [overview, patternsRes, eventsRes] = await Promise.all([
        axios.get('/api/analytics/overview'),
        axios.get('/api/analytics/content-patterns'),
        axios.get('/api/analytics/events?limit=20'),
      ]);
      setClicksByPlatform(overview.data.clicksByPlatform || []);
      setOrdersByPlatform(overview.data.ordersByPlatform || []);
      setContentSummary(overview.data.contentSummary || null);
      setTopContent(overview.data.topContent || []);
      setRisingTrends(overview.data.risingTrends || []);
      setPatterns(patternsRes.data.patterns || []);
      setEvents(eventsRes.data.events || []);
    } catch (err) { console.error('Analytics error:', err); }
    finally { setLoading(false); }
  };

  const handleDiscoverPatterns = async () => {
    setDiscoveringPatterns(true);
    try { await axios.post('/api/analytics/discover-patterns'); await fetchAll(); }
    catch (err) { console.error(err); }
    finally { setDiscoveringPatterns(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalClicks = clicksByPlatform.reduce((s, c) => s + c.clicks, 0);
  const totalRevenue = ordersByPlatform.reduce((s, o) => s + o.revenue, 0);
  const totalCommission = ordersByPlatform.reduce((s, o) => s + o.commission, 0);
  const totalOrders = ordersByPlatform.reduce((s, o) => s + o.orders, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={32} className="animate-spin text-[#00AA5B]" />
        <p className="text-slate-400 text-sm">Memuat data analitik...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-[#00AA5B]" />
            Analitik & Content Intelligence
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Data performa affiliate & pola konten pemenang</p>
        </div>
        <button onClick={handleDiscoverPatterns} disabled={discoveringPatterns}
          className="btn-secondary text-sm disabled:opacity-50">
          {discoveringPatterns ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
          {discoveringPatterns ? 'Discovering...' : 'Discover Patterns'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Klik" value={totalClicks.toLocaleString('id-ID')}
          icon={<MousePointerClick size={18} className="text-blue-500" />} border="border-l-blue-500" />
        <StatCard label="Total Pesanan" value={totalOrders.toLocaleString('id-ID')}
          icon={<Target size={18} className="text-[#00AA5B]" />} border="border-l-[#00AA5B]" />
        <StatCard label="Total Omset" value={`Rp ${(totalRevenue / 1_000_000).toFixed(1)}M`}
          icon={<DollarSign size={18} className="text-amber-500" />} border="border-l-amber-500" />
        <StatCard label="Est. Komisi" value={`Rp ${(totalCommission / 1_000_000).toFixed(1)}M`}
          icon={<Trophy size={18} className="text-purple-500" />} border="border-l-purple-500" />
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Clicks by Platform */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title">
            <MousePointerClick size={16} className="text-blue-500" />
            Klik per Platform
          </h3>
          <div className="space-y-3">
            {clicksByPlatform.sort((a, b) => b.clicks - a.clicks).map(c => (
              <div key={c.platform} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 capitalize">{c.platform}</span>
                  <span className="text-slate-400">{c.clicks.toLocaleString('id-ID')} klik</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${PLATFORM_COLORS[c.platform] || 'bg-slate-400'}`}
                    style={{ width: `${Math.min(100, (c.clicks / Math.max(totalClicks, 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
            {clicksByPlatform.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Belum ada data klik</p>}
          </div>
        </div>

        {/* Commission by Platform */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title">
            <DollarSign size={16} className="text-[#00AA5B]" />
            Komisi per Platform
          </h3>
          <div className="space-y-2">
            {ordersByPlatform.sort((a, b) => b.commission - a.commission).map(o => (
              <div key={o.platform} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#00AA5B]/30 transition">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${PLATFORM_COLORS[o.platform] || 'bg-slate-400'}`} />
                  <span className="text-sm font-medium text-slate-700 capitalize">{o.platform}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">Rp {(o.commission / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] text-slate-400">{o.orders} orders</p>
                </div>
              </div>
            ))}
            {ordersByPlatform.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Belum ada data penjualan</p>}
          </div>
        </div>
      </div>

      {/* Content Metrics */}
      {contentSummary && (
        <div className="card p-5">
          <h3 className="section-title mb-4">
            <Eye size={16} className="text-purple-500" />
            Performa Konten
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Avg CTR', value: `${(contentSummary.avgCtr || 0).toFixed(1)}%`, icon: <Target size={15} className="text-blue-500" /> },
              { label: 'Avg Konversi', value: `${(contentSummary.avgConversion || 0).toFixed(1)}%`, icon: <TrendingUp size={15} className="text-[#00AA5B]" /> },
              { label: 'Total Views', value: (contentSummary.totalViews || 0).toLocaleString('id-ID'), icon: <Eye size={15} className="text-purple-500" /> },
              { label: 'Total Likes', value: (contentSummary.totalLikes || 0).toLocaleString('id-ID'), icon: <Heart size={15} className="text-pink-500" /> },
              { label: 'Total Shares', value: (contentSummary.totalShares || 0).toLocaleString('id-ID'), icon: <Share2 size={15} className="text-amber-500" /> },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <div className="flex justify-center mb-2">{s.icon}</div>
                <p className="text-lg font-black text-slate-800">{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Winning Patterns */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-title">
              <Hash size={16} className="text-[#00AA5B]" />
              Winning Content Patterns
            </h3>
            <span className="text-xs text-slate-400">{patterns.length} pola</span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {patterns.map(p => (
              <div key={p.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-[#00AA5B]/30 transition space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 leading-snug">"{p.hookTemplate}"</p>
                  <span className="badge-green flex-shrink-0">CTR {p.avgCtr.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="badge-gray capitalize">{p.platform}</span>
                  <span>Conv: {p.avgConversion.toFixed(1)}%</span>
                  <span>{p.sampleSize} samples</span>
                  <span className="text-[#00AA5B]">conf: {(p.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {patterns.length === 0 && (
              <div className="text-center py-8">
                <Zap size={24} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">Klik "Discover Patterns" untuk menganalisis pola</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Content + Rising Trends */}
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <h3 className="section-title">
              <Trophy size={16} className="text-amber-500" />
              Top Performing Content
            </h3>
            {topContent.slice(0, 5).map((c, idx) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                <span className="text-base font-black text-slate-200 w-6 text-center">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">"{c.hook}"</p>
                  <p className="text-[10px] text-slate-400 truncate">{c.product}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-[#00AA5B]">{c.ctr.toFixed(1)}% CTR</p>
                  <p className="text-[10px] text-slate-400">{c.views.toLocaleString('id-ID')} views</p>
                </div>
              </div>
            ))}
            {topContent.length === 0 && <p className="text-slate-400 text-xs py-2 text-center">Belum ada data konten</p>}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="section-title">
              <TrendingUp size={16} className="text-[#00AA5B]" />
              Rising Product Trends
            </h3>
            {risingTrends.slice(0, 5).map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <p className="text-xs text-slate-700 flex-1 truncate">{t.product}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-[#00AA5B] rounded-full" style={{ width: `${Math.min(100, t.momentum)}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-[#00AA5B] w-6">{t.momentum}</span>
                </div>
              </div>
            ))}
            {risingTrends.length === 0 && <p className="text-slate-400 text-xs py-2 text-center">Belum ada data tren</p>}
          </div>
        </div>
      </div>

      {/* Feedback Loop Events */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">
            <Activity size={16} className="text-slate-500" />
            System Feedback Loop Events
          </h3>
          <span className="text-xs text-slate-400">{events.length} event terbaru</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
          {events.map(evt => (
            <div key={evt.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${EVENT_BADGE[evt.eventType] || 'badge-gray'}`}>
                {evt.eventType}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">{evt.entityType}</span>
              <span className="ml-auto text-[10px] text-slate-300">
                {new Date(evt.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {events.length === 0 && <p className="text-slate-400 text-xs py-4 col-span-full text-center">Belum ada event</p>}
        </div>
      </div>
    </div>
  );
}
