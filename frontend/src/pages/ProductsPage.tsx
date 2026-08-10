import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  PackageSearch, Star, TrendingUp, RefreshCw, X, Network,
  PenTool, ChevronRight, DollarSign, BarChart3, ShoppingBag,
  Award, Search, Filter, Loader2
} from 'lucide-react';

interface Product {
  id: number; name: string; platform: string; category: string;
  price: number; commissionRate: number; imageUrl: string;
  rating: number; reviews: number; opportunityScore: number;
  sales7d: number; salesGrowth: number; totalClicks: number; conversionRate: number;
}
interface Prediction { minimum: number; expected: number; optimistic: number; }

const PLATFORM_BADGE: Record<string, string> = {
  tiktok: 'bg-pink-50 text-pink-600 border-pink-200',
  shopee: 'bg-orange-50 text-orange-600 border-orange-200',
  tokopedia: 'bg-green-50 text-[#00AA5B] border-green-200',
  lazada: 'bg-blue-50 text-blue-600 border-blue-200',
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-[#00AA5B]' : score >= 70 ? 'bg-blue-500' : score >= 55 ? 'bg-amber-500' : 'bg-slate-300';
  const label = score >= 85 ? 'Sangat Tinggi' : score >= 70 ? 'Tinggi' : score >= 55 ? 'Sedang' : 'Rendah';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Opportunity Score</span>
        <span className="font-bold text-slate-800">{score} <span className="text-slate-400 font-normal">· {label}</span></span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function CommissionSimulator({ productId, commissionRate, price }: { productId: number; commissionRate: number; price: number }) {
  const [views, setViews] = useState(10000);
  const [ctr, setCtr] = useState(5);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      axios.get(`/api/products/${productId}/prediction?views=${views}`)
        .then(res => setPrediction(res.data))
        .catch(() => {
          const clicks = (views * ctr) / 100;
          const commission = clicks * 0.035 * price * commissionRate;
          setPrediction({ minimum: commission * 0.5, expected: commission, optimistic: commission * 1.8 });
        });
    }, 400);
  }, [views, ctr, productId, commissionRate, price]);

  const fmt = (v: number) => v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(1)}M` : `Rp ${(v / 1_000).toFixed(0)}K`;

  return (
    <div className="bg-[#F0FBF5] border border-green-200 rounded-2xl p-5 space-y-4">
      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
        <DollarSign size={16} className="text-[#00AA5B]" />
        Simulator Prediksi Komisi
      </h4>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Estimasi Tayangan</span>
            <span className="font-bold text-slate-800">{views.toLocaleString('id-ID')}</span>
          </div>
          <input type="range" min={1000} max={1000000} step={1000} value={views}
            onChange={e => setViews(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#00AA5B]" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>1K</span><span>1M</span></div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>CTR</span>
            <span className="font-bold text-slate-800">{ctr.toFixed(1)}%</span>
          </div>
          <input type="range" min={0.5} max={20} step={0.5} value={ctr}
            onChange={e => setCtr(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#00AA5B]" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>0.5%</span><span>20%</span></div>
        </div>
      </div>
      {prediction && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Minimum', value: prediction.minimum, color: 'text-slate-600' },
            { label: 'Ekspektasi', value: prediction.expected, color: 'text-[#00AA5B]' },
            { label: 'Optimis', value: prediction.optimistic, color: 'text-blue-600' },
          ].map(item => (
            <div key={item.label} className="text-center bg-white rounded-xl p-3 border border-green-100">
              <p className="text-[10px] text-slate-400 mb-1">{item.label}</p>
              <p className={`font-bold text-sm ${item.color}`}>{fmt(item.value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onGoToGraph, onGoToContent }: {
  product: Product; onClose: () => void; onGoToGraph: () => void; onGoToContent: () => void;
}) {
  const badgeClass = PLATFORM_BADGE[product.platform] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative p-6 border-b border-slate-100">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
              {product.imageUrl
                ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><PackageSearch size={28} className="text-slate-300" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${badgeClass}`}>{product.platform}</span>
                <span className="text-[10px] text-slate-400 capitalize">{product.category}</span>
              </div>
              <h3 className="font-bold text-slate-800 text-lg leading-snug">{product.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star size={13} fill="#FCA211" className="text-amber-400" />
                <span className="text-sm font-semibold text-slate-700">{product.rating}</span>
                <span className="text-xs text-slate-400">({product.reviews.toLocaleString('id-ID')} ulasan)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Harga', value: `Rp ${(product.price / 1000).toFixed(0)}K` },
              { label: 'Komisi', value: `${(product.commissionRate * 100).toFixed(0)}%` },
              { label: 'Sales/7d', value: product.sales7d.toLocaleString('id-ID') },
              { label: 'Konversi', value: `${product.conversionRate.toFixed(1)}%` },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-base font-black text-slate-800">{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Score */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <ScoreBar score={product.opportunityScore} />
          </div>

          {/* Growth */}
          {product.salesGrowth > 10 && (
            <div className="flex items-center gap-3 p-3 bg-[#F0FBF5] border border-green-200 rounded-xl">
              <TrendingUp size={18} className="text-[#00AA5B] flex-shrink-0" />
              <p className="text-sm text-[#00AA5B] font-medium">Sales tumbuh +{product.salesGrowth}% dalam 7 hari</p>
            </div>
          )}

          <CommissionSimulator productId={product.id} commissionRate={product.commissionRate} price={product.price} />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onGoToGraph} className="btn-secondary justify-center">
              <Network size={16} />Knowledge Graph
            </button>
            <button onClick={onGoToContent} className="btn-primary justify-center">
              <PenTool size={16} />Generate Konten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('opportunity');
  const navigate = useNavigate();

  const fetchProducts = () => {
    setLoading(true);
    axios.get(`/api/products?sort=${sort}`)
      .then(res => setProducts(res.data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [sort]);

  const handleRecalculate = () => {
    setRecalculating(true);
    axios.post('/api/products/recalculate-scores')
      .then(() => fetchProducts())
      .finally(() => setRecalculating(false));
  };

  const platforms = ['all', ...Array.from(new Set(products.map(p => p.platform)))];
  const filtered = products
    .filter(p => filter === 'all' || p.platform === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Produk Affiliate</h2>
          <p className="text-slate-500 text-sm mt-0.5">{products.length} produk aktif · Diurutkan berdasarkan Opportunity Score</p>
        </div>
        <button onClick={handleRecalculate} disabled={recalculating}
          className="btn-secondary text-sm disabled:opacity-50">
          <RefreshCw size={15} className={recalculating ? 'animate-spin' : ''} />
          {recalculating ? 'Menghitung...' : 'Recalculate Scores'}
        </button>
      </div>

      {/* Filter & Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk..." className="input-field pl-9" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {platforms.map(p => (
              <button key={p} onClick={() => setFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${filter === p ? 'bg-[#00AA5B] border-[#00AA5B] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#00AA5B] hover:text-[#00AA5B]'}`}>
                {p === 'all' ? 'Semua' : p}
              </button>
            ))}
            <select value={sort} onChange={e => setSort(e.target.value)} className="select-field text-xs w-auto">
              <option value="opportunity">Sort: Opportunity</option>
              <option value="">Sort: Default</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-64" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => {
            const badgeClass = PLATFORM_BADGE[product.platform] || 'bg-slate-100 text-slate-600 border-slate-200';
            const scoreColor = product.opportunityScore >= 85 ? 'text-[#00AA5B]' : product.opportunityScore >= 70 ? 'text-blue-600' : 'text-amber-500';
            return (
              <div key={product.id} onClick={() => setSelected(product)}
                className="card cursor-pointer group overflow-hidden hover:border-[#00AA5B]/40 transition-all">
                {/* Image */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center bg-slate-100"><PackageSearch size={32} className="text-slate-300" /></div>}
                  {/* Score badge */}
                  <div className="absolute top-2 left-2 bg-white rounded-xl px-2 py-1 shadow-sm border border-slate-100 flex items-center gap-1">
                    <Award size={12} className={scoreColor} />
                    <span className={`text-xs font-black ${scoreColor}`}>{product.opportunityScore}</span>
                  </div>
                  {product.salesGrowth > 30 && (
                    <div className="absolute top-2 right-2 badge-green shadow-sm">
                      <TrendingUp size={10} />+{product.salesGrowth}%
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}>{product.platform}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{product.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-[#00AA5B] transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-black text-slate-800">Rp {(product.price / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-[#00AA5B] font-semibold">Komisi {(product.commissionRate * 100).toFixed(0)}%</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} fill="#FCA211" className="text-amber-400" />
                      <span className="text-xs text-slate-600 font-medium">{product.rating}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>{product.sales7d.toLocaleString('id-ID')} sales/7d</span>
                    <ChevronRight size={14} className="group-hover:text-[#00AA5B] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full card p-12 text-center">
              <PackageSearch size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Tidak ada produk yang cocok dengan filter.</p>
            </div>
          )}
        </div>
      )}

      {selected && (
        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onGoToGraph={() => { navigate(`/knowledge/${selected.id}`); setSelected(null); }}
          onGoToContent={() => { navigate(`/content?productId=${selected.id}`); setSelected(null); }}
        />
      )}
    </div>
  );
}
