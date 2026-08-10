import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, PackageSearch, Network, AlertTriangle,
  Link as LinkIcon, PenTool, BarChart3, Menu, X, Sparkles,
  TrendingUp, DollarSign, MousePointerClick, Target, Bell,
  ChevronRight, ShoppingBag
} from 'lucide-react';
import KnowledgeGraph from './pages/KnowledgeGraph';
import ViralDashboard from './pages/ViralDashboard';
import LinksPage from './pages/LinksPage';
import ProductsPage from './pages/ProductsPage';
import AIContentPage from './pages/AIContentPage';
import AnalyticsPage from './pages/AnalyticsPage';

/* ─── Sidebar ─── */
function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', exact: true },
    { to: '/products', icon: <PackageSearch size={18} />, label: 'Produk' },
    { to: '/viral', icon: <AlertTriangle size={18} />, label: 'Viral Warning' },
    { to: '/knowledge/1', icon: <Network size={18} />, label: 'Knowledge Graph' },
    { to: '/links', icon: <LinkIcon size={18} />, label: 'Link Affiliate' },
    { to: '/content', icon: <PenTool size={18} />, label: 'AI Content' },
    { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analitik' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-60 z-50
        bg-white border-r border-slate-200 shadow-sm flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#00AA5B] rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm leading-none tracking-tight">AI Affiliate OS</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Intelligence Platform</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 mt-1">Menu Utama</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item'
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00AA5B] to-[#42C97A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">Demo User</p>
              <p className="text-[11px] text-slate-400 truncate">Growth Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Header ─── */
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/products': 'Produk & Opportunity',
    '/viral': 'Viral Early Warning',
    '/links': 'Link Affiliate',
    '/content': 'AI Content Generator',
    '/analytics': 'Analitik & Content DNA',
  };
  const title = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/knowledge') ? 'Knowledge Graph' : 'Dashboard');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-5 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-bold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#E8F8EF] rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00AA5B] animate-pulse" />
          <span className="text-xs font-semibold text-[#00AA5B]">11 Engines Aktif</span>
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

/* ─── Dashboard Overview (with real data) ─── */
function Overview() {
  const navigate = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/dashboard')
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n >= 1_000_000
    ? `Rp ${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `Rp ${(n / 1_000).toFixed(0)}K` : `Rp ${n}`;

  const stats = data ? [
    { label: 'Total Klik', value: data.summary.totalClicks.toLocaleString('id-ID'), icon: <MousePointerClick size={20} />, color: 'border-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', trend: null },
    { label: 'Total Pesanan', value: data.summary.totalOrders.toLocaleString('id-ID'), icon: <ShoppingBag size={20} />, color: 'border-[#00AA5B]', iconBg: 'bg-[#E8F8EF]', iconColor: 'text-[#00AA5B]', trend: null },
    { label: 'Total Komisi', value: fmt(data.summary.totalCommission), icon: <DollarSign size={20} />, color: 'border-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', trend: null },
    { label: 'Conversion Rate', value: `${data.summary.conversionRate.toFixed(1)}%`, icon: <Target size={20} />, color: 'border-purple-500', iconBg: 'bg-purple-50', iconColor: 'text-purple-500', trend: null },
  ] : [
    { label: 'Total Klik', value: '—', icon: <MousePointerClick size={20} />, color: 'border-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', trend: null },
    { label: 'Total Pesanan', value: '—', icon: <ShoppingBag size={20} />, color: 'border-[#00AA5B]', iconBg: 'bg-[#E8F8EF]', iconColor: 'text-[#00AA5B]', trend: null },
    { label: 'Total Komisi', value: '—', icon: <DollarSign size={20} />, color: 'border-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', trend: null },
    { label: 'Conversion Rate', value: '—', icon: <Target size={20} />, color: 'border-purple-500', iconBg: 'bg-purple-50', iconColor: 'text-purple-500', trend: null },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#00AA5B] to-[#00924E] rounded-2xl p-6 text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-48 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="150" cy="50" r="80" fill="white" />
            <circle cx="50" cy="150" r="60" fill="white" />
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-green-100 text-sm font-medium mb-1">Selamat datang kembali 👋</p>
          <h2 className="text-2xl font-black text-white">AI Affiliate OS</h2>
          <p className="text-green-100 text-sm mt-1">
            {data ? `${data.summary.productsCount} produk aktif · ${data.summary.activeLinks} link affiliate` : 'Intelligence Platform untuk Afiliator Indonesia'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            {loading ? (
              <div className="skeleton h-16 rounded-xl" />
            ) : (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
                </div>
                <p className="text-2xl font-black text-slate-800">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Opportunities */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              <Target size={18} className="text-[#00AA5B]" />
              Top Opportunities
            </h3>
            <a href="/products" className="text-[#00AA5B] text-xs font-semibold hover:underline flex items-center gap-1">
              Lihat semua <ChevronRight size={14} />
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
          ) : data?.topOpportunities?.length > 0 ? (
            <div className="space-y-2">
              {data.topOpportunities.map((o: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F8EF] flex items-center justify-center text-[#00AA5B] font-black text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{o.productName}</p>
                    <p className="text-xs text-slate-400 capitalize">{o.platform} · {o.category}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="badge-green">{o.score}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">Belum ada data oportunitas</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              <ShoppingBag size={18} className="text-amber-500" />
              Pesanan Terbaru
            </h3>
            <span className="text-xs text-slate-400">7 hari terakhir</span>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
          ) : data?.recentOrders?.length > 0 ? (
            <div className="space-y-2">
              {data.recentOrders.slice(0, 5).map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={16} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{o.product}</p>
                    <p className="text-xs text-slate-400">{new Date(o.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-800">Rp {(o.amount / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-[#00AA5B] font-medium">+Rp {(o.commission / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">Belum ada pesanan terbaru</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="section-title mb-4">
          <Sparkles size={18} className="text-[#00AA5B]" />
          Aksi Cepat
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/products', icon: <PackageSearch size={22} />, label: 'Cari Produk', color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100' },
            { href: '/viral', icon: <AlertTriangle size={22} />, label: 'Viral Alert', color: 'text-red-500', bg: 'bg-red-50 hover:bg-red-100' },
            { href: '/content', icon: <PenTool size={22} />, label: 'Buat Konten', color: 'text-[#00AA5B]', bg: 'bg-[#E8F8EF] hover:bg-[#d4f2e5]' },
            { href: '/analytics', icon: <BarChart3 size={22} />, label: 'Lihat Analitik', color: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100' },
          ].map(a => (
            <a key={a.href} href={a.href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${a.bg} group`}>
              <div className={a.color}>{a.icon}</div>
              <span className="text-xs font-semibold text-slate-700 text-center">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Layout ─── */
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── App Router ─── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout><Overview /></DashboardLayout>} />
        <Route path="/products" element={<DashboardLayout><ProductsPage /></DashboardLayout>} />
        <Route path="/viral" element={<DashboardLayout><ViralDashboard /></DashboardLayout>} />
        <Route path="/links" element={<DashboardLayout><LinksPage /></DashboardLayout>} />
        <Route path="/content" element={<DashboardLayout><AIContentPage /></DashboardLayout>} />
        <Route path="/analytics" element={<DashboardLayout><AnalyticsPage /></DashboardLayout>} />
        <Route path="/knowledge/:productId" element={<DashboardLayout><KnowledgeGraph /></DashboardLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
