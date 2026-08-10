import React from 'react';
import { Plus, Copy, Edit2, ExternalLink } from 'lucide-react';

export default function LinksPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Manajemen Link Affiliate</h2>
          <p className="text-slate-400 mt-1">Kelola dan lacak performa semua link afiliasi Anda.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95">
          <Plus size={18} />
          Buat Link Baru
        </button>
      </div>
      
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/40 border-b border-slate-700/50">
                <th className="p-5 text-sm font-semibold text-slate-300">Nama Produk</th>
                <th className="p-5 text-sm font-semibold text-slate-300">Link URL</th>
                <th className="p-5 text-sm font-semibold text-slate-300">Platform</th>
                <th className="p-5 text-sm font-semibold text-slate-300">Klik</th>
                <th className="p-5 text-sm font-semibold text-slate-300">Konversi</th>
                <th className="p-5 text-sm font-semibold text-slate-300 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <tr className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-5 text-slate-200 font-medium flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                    S
                  </div>
                  Contoh Produk Viral 1
                </td>
                <td className="p-5">
                  <a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors w-max">
                    shope.ee/xyz123
                    <ExternalLink size={14} />
                  </a>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-medium border border-orange-500/20">Shopee</span>
                </td>
                <td className="p-5 text-slate-300">1,245</td>
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className="text-emerald-400 font-medium">89</span>
                    <span className="text-xs text-slate-500">7.1% rate</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Salin Link">
                      <Copy size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-5 text-slate-200 font-medium flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                    T
                  </div>
                  Contoh Produk Viral 2
                </td>
                <td className="p-5">
                  <a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors w-max">
                    tokopedia.link/abc987
                    <ExternalLink size={14} />
                  </a>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium border border-green-500/20">Tokopedia</span>
                </td>
                <td className="p-5 text-slate-300">512</td>
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className="text-emerald-400 font-medium">21</span>
                    <span className="text-xs text-slate-500">4.1% rate</span>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Salin Link">
                      <Copy size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Edit">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
