import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, Network, AlertTriangle, Link as LinkIcon, PenTool, BarChart3, Menu, X, Sparkles } from 'lucide-react';
import KnowledgeGraph from './pages/KnowledgeGraph';
import ViralDashboard from './pages/ViralDashboard';
import LinksPage from './pages/LinksPage';

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { to: "/products", icon: <PackageSearch size={20} />, label: "Produk" },
    { to: "/knowledge/1", icon: <Network size={20} />, label: "Knowledge Graph" },
    { to: "/viral", icon: <AlertTriangle size={20} />, label: "Viral Warning" },
    { to: "/links", icon: <LinkIcon size={20} />, label: "Link Affiliate" },
    { to: "/content", icon: <PenTool size={20} />, label: "AI Content" },
    { to: "/analytics", icon: <BarChart3 size={20} />, label: "Analitik" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 z-50
        bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300
        border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-6 h-20 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-500 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <Sparkles size={24} />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AI Affiliate OS
            </h1>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100vh-5rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                  : 'hover:bg-slate-800/50 hover:text-slate-100 hover:translate-x-1'
                }
              `}
            >
              <div className={`transition-colors ${
                // Use a different color logic for active icon if needed, here we rely on text color cascade
                'group-hover:text-white'
              }`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-[#0B1120]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-slate-100 capitalize">
              {location.pathname === '/' ? 'Overview' : location.pathname.split('/')[1].replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
              <span className="text-sm font-medium text-slate-300">System Online</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px] shadow-lg">
              <div className="w-full h-full rounded-full bg-slate-900 border-2 border-transparent flex items-center justify-center text-sm font-bold text-white">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-400">Selamat datang kembali di pusat komando AI Affiliate OS.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Klik", value: "24,592", trend: "+12.5%", color: "blue" },
          { label: "Konversi (Sales)", value: "1,204", trend: "+8.2%", color: "emerald" },
          { label: "Estimasi Komisi", value: "Rp 14.5M", trend: "+24.1%", color: "purple" },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/60 shadow-xl group hover:border-slate-700 transition-colors">
            <div className={`absolute top-0 right-0 p-32 bg-${stat.color}-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-${stat.color}-500/20 transition-colors`}></div>
            <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
            <span className={`text-sm font-medium text-${stat.color}-400 bg-${stat.color}-500/10 px-2 py-1 rounded-md`}>
              {stat.trend} bulan ini
            </span>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-800/60 shadow-xl mt-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Sparkles size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Assistant Siap</h3>
            <p className="text-slate-400 mt-1">11 Intelligence Engines sedang menganalisis pasar untuk Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout><Overview /></DashboardLayout>} />
        <Route path="/knowledge/:productId" element={<DashboardLayout><KnowledgeGraph /></DashboardLayout>} />
        <Route path="/viral" element={<DashboardLayout><ViralDashboard /></DashboardLayout>} />
        <Route path="/links" element={<DashboardLayout><LinksPage /></DashboardLayout>} />
        {/* Fallbacks for other routes to prevent blank pages before implementation */}
        <Route path="/products" element={<DashboardLayout><div className="text-white p-8 bg-slate-900/50 rounded-2xl border border-slate-800">Halaman Produk sedang dibangun.</div></DashboardLayout>} />
        <Route path="/content" element={<DashboardLayout><div className="text-white p-8 bg-slate-900/50 rounded-2xl border border-slate-800">Halaman AI Content sedang dibangun.</div></DashboardLayout>} />
        <Route path="/analytics" element={<DashboardLayout><div className="text-white p-8 bg-slate-900/50 rounded-2xl border border-slate-800">Halaman Analitik sedang dibangun.</div></DashboardLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
