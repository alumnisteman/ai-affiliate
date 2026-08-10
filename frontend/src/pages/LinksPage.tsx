import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link as LinkIcon, Plus, Copy, ExternalLink, TrendingUp, Check, Loader2, Search } from 'lucide-react';

interface AffiliateLink {
  id: number; productId: number; productName: string; platform: string;
  imageUrl: string; price: number; url: string; shortUrl: string;
  linkPlatform: string; clicks: number; conversions: number; conversionRate: number; createdAt: string;
}

const PLATFORM_BADGE: Record<string, string> = {
  tiktok: 'bg-pink-50 text-pink-600 border-pink-200',
  shopee: 'bg-orange-50 text-orange-600 border-orange-200',
  tokopedia: 'bg-green-50 text-[#00AA5B] border-green-200',
  lazada: 'bg-blue-50 text-blue-600 border-blue-200',
};

export default function LinksPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    axios.get('/api/affiliate-links')
      .then(res => setLinks(res.data.links || []))
      .catch(err => console.error('Links error:', err))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTrack = async (id: number) => {
    await axios.put(`/api/affiliate-links/${id}/track`);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, clicks: l.clicks + 1 } : l));
  };

  const filtered = links.filter(l =>
    !search || l.productName.toLowerCase().includes(search.toLowerCase()) ||
    l.platform.toLowerCase().includes(search.toLowerCase())
  );

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
  const avgCvr = links.length > 0 ? links.reduce((s, l) => s + l.conversionRate, 0) / links.length : 0;

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LinkIcon size={20} className="text-[#00AA5B]" />
            Manajemen Link Affiliate
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Kelola dan lacak performa semua link afiliasi Anda</p>
        </div>
        <button className="btn-primary text-sm">
          <Plus size={16} />Buat Link Baru
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Link', value: links.length.toString(), color: 'border-[#00AA5B]' },
          { label: 'Total Klik', value: totalClicks.toLocaleString('id-ID'), color: 'border-blue-500' },
          { label: 'Total Konversi', value: totalConversions.toLocaleString('id-ID'), color: 'border-amber-500' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <p className="text-2xl font-black text-slate-800">{s.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari link atau produk..." className="input-field pl-9 text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#00AA5B]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Produk', 'Short URL', 'Platform', 'Klik', 'Konversi', 'Conv. Rate', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(link => {
                  const badgeClass = PLATFORM_BADGE[link.platform] || 'bg-slate-100 text-slate-600 border-slate-200';
                  const isGoodCvr = link.conversionRate >= 3;
                  return (
                    <tr key={link.id} className="hover:bg-[#F0FBF5] transition-colors group">
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                            {link.imageUrl
                              ? <img src={link.imageUrl} alt={link.productName} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">{link.productName[0]}</div>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{link.productName}</p>
                            <p className="text-xs text-slate-400">Rp {(link.price / 1000).toFixed(0)}K</p>
                          </div>
                        </div>
                      </td>

                      {/* Short URL */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-[#00AA5B] hover:underline flex items-center gap-1 max-w-[160px] truncate">
                            {link.shortUrl}
                            <ExternalLink size={12} className="flex-shrink-0" />
                          </a>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${badgeClass}`}>
                          {link.platform}
                        </span>
                      </td>

                      {/* Clicks */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-700">{link.clicks.toLocaleString('id-ID')}</span>
                      </td>

                      {/* Conversions */}
                      <td className="px-5 py-4">
                        <span className={`text-sm font-semibold ${isGoodCvr ? 'text-[#00AA5B]' : 'text-slate-600'}`}>
                          {link.conversions.toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* CVR */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {isGoodCvr && <TrendingUp size={13} className="text-[#00AA5B]" />}
                          <span className={`text-sm font-bold ${isGoodCvr ? 'text-[#00AA5B]' : 'text-slate-500'}`}>
                            {link.conversionRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyLink(link.url, link.id)}
                            title="Salin link"
                            className="p-2 rounded-lg hover:bg-[#E8F8EF] text-slate-400 hover:text-[#00AA5B] transition-colors"
                          >
                            {copiedId === link.id ? <Check size={15} className="text-[#00AA5B]" /> : <Copy size={15} />}
                          </button>
                          <button
                            onClick={() => handleTrack(link.id)}
                            title="Catat klik"
                            className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <LinkIcon size={32} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm">{search ? 'Tidak ada link yang sesuai pencarian.' : 'Belum ada link affiliate.'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
            <span>Menampilkan {filtered.length} dari {links.length} link</span>
            <span>Avg. CVR: {avgCvr.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
