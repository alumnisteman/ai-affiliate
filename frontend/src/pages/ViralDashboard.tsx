import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap, TrendingUp, Star, DollarSign, Loader2, PenTool, ShieldCheck } from 'lucide-react';

interface ViralPrediction {
  id: number; viralScore: number; confidence: number; salesTrend: number;
  reviewTrend: number; commissionScore: number; predictedFor: string;
  product: { id: number; name: string; imageUrl: string; price: string; commissionRate: number; platform: string; category?: { name: string } };
}

const PLATFORM_BADGE: Record<string, string> = {
  tiktok: 'bg-pink-50 text-pink-600 border-pink-200',
  shopee: 'bg-orange-50 text-orange-600 border-orange-200',
  tokopedia: 'bg-green-50 text-[#00AA5B] border-green-200',
  lazada: 'bg-blue-50 text-blue-600 border-blue-200',
};

function ScoreGauge({ score }: { score: number }) {
  const isHot = score >= 80;
  const isWarm = score >= 60;
  const color = isHot ? '#ef4444' : isWarm ? '#f59e0b' : '#94a3b8';
  const bgColor = isHot ? 'bg-red-50 border-red-200' : isWarm ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200';
  const size = 52;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className={`relative w-14 h-14 rounded-full border flex items-center justify-center ${bgColor}`}>
      <svg width={size} height={size} className="absolute -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span className="font-black text-xs z-10" style={{ color }}>{score.toFixed(0)}</span>
    </div>
  );
}

export default function ViralDashboard() {
  const [predictions, setPredictions] = useState<ViralPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const navigate = useNavigate();

  const fetchPredictions = () => {
    setLoading(true);
    axios.get('/api/viral/predictions')
      .then(res => setPredictions(res.data.data || []))
      .finally(() => setLoading(false));
  };

  const triggerEngine = () => {
    setTriggering(true);
    axios.post('/api/viral/run')
      .then(() => setTimeout(() => { fetchPredictions(); setTriggering(false); }, 3000))
      .catch(() => setTriggering(false));
  };

  useEffect(() => { fetchPredictions(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={32} className="animate-spin text-red-500" />
        <p className="text-slate-400 text-sm">Memuat data sinyal viral...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Viral Early Warning System
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Prediksi produk berpotensi viral dalam <span className="text-amber-600 font-semibold">72 jam ke depan</span>
          </p>
        </div>
        <button onClick={triggerEngine} disabled={triggering}
          className="btn-secondary text-sm disabled:opacity-50 border-red-200 hover:border-red-400 hover:text-red-600">
          {triggering ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
          {triggering ? 'Engine berjalan...' : 'Force Run Engine'}
        </button>
      </div>

      {/* Status Bar */}
      <div className={`card px-4 py-3 flex items-center gap-3 ${predictions.length > 0 ? 'border-l-4 border-l-red-500 bg-red-50/50' : 'border-l-4 border-l-[#00AA5B] bg-[#F0FBF5]'}`}>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${predictions.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-[#00AA5B]'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">
            {predictions.length > 0
              ? `${predictions.length} produk terdeteksi memiliki sinyal viral kuat`
              : 'Pasar stabil – Tidak ada sinyal viral terdeteksi'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Sistem memantau 24/7 · Diperbarui setiap 24 jam</p>
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0">
          {predictions.length > 0 ? '⚠️ Alert Aktif' : '✅ Aman'}
        </span>
      </div>

      {predictions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-[#E8F8EF] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-[#00AA5B]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Pasar Stabil</h3>
          <p className="text-slate-500 text-sm mb-1">Belum ada produk dengan sinyal viral di atas threshold hari ini.</p>
          <p className="text-xs text-slate-400">Klik "Force Run Engine" untuk memicu analisis manual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map(p => {
            const isHot = p.viralScore >= 80;
            const badgeClass = PLATFORM_BADGE[p.product.platform] || 'bg-slate-100 text-slate-600 border-slate-200';
            return (
              <div key={p.id}
                className={`card overflow-hidden hover:shadow-md transition-all group ${isHot ? 'border-red-200 ring-1 ring-red-200' : ''}`}>
                {/* Hot bar */}
                {isHot && <div className="h-1 bg-gradient-to-r from-red-500 to-orange-400" />}

                {/* Product Image */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  {p.product.imageUrl
                    ? <img src={p.product.imageUrl} alt={p.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><TrendingUp size={36} className="text-slate-300" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  {isHot && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow">
                      🔥 VIRAL ALERT
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}>{p.product.platform}</span>
                        {p.product.category && <span className="text-[10px] text-slate-400">{p.product.category.name}</span>}
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{p.product.name}</h3>
                    </div>
                    <ScoreGauge score={p.viralScore} />
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Sales Trend', value: `+${(p.salesTrend * 100).toFixed(0)}%`, color: 'text-[#00AA5B]' },
                      { label: 'Confidence', value: `${(p.confidence * 100).toFixed(0)}%`, color: 'text-amber-600' },
                      { label: 'Komisi', value: `${(p.product.commissionRate * 100).toFixed(0)}%`, color: 'text-blue-600' },
                    ].map(m => (
                      <div key={m.label} className="text-center bg-slate-50 rounded-xl p-2 border border-slate-100">
                        <p className={`text-xs font-black ${m.color}`}>{m.value}</p>
                        <p className="text-[9px] text-slate-400">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigate(`/content?productId=${p.product.id}`)}
                    className={`w-full btn-${isHot ? 'primary' : 'secondary'} text-sm justify-center`}
                    style={isHot ? { background: 'linear-gradient(135deg, #ef4444, #f97316)', border: 'none', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' } : {}}>
                    <PenTool size={15} />
                    Buat Konten Sekarang
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
