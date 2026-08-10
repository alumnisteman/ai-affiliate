import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { PenTool, Sparkles, Copy, Check, ChevronDown, Loader2, Clock, RefreshCw } from 'lucide-react';

interface Product { id: number; name: string; platform: string; category: string; }
interface AIContent {
  id: number; productId: number; contentType: string; platform: string;
  generatedText: string; createdAt: string;
  product: { name: string; platform: string; imageUrl: string };
}

const CONTENT_TYPES = [
  { value: 'caption', label: 'TikTok Caption', emoji: '📱' },
  { value: 'hook', label: 'Opening Hook', emoji: '🪝' },
  { value: 'script', label: 'Video Script', emoji: '🎬' },
  { value: 'reels', label: 'Reels/Short Script', emoji: '🎞️' },
  { value: 'whatsapp', label: 'WhatsApp Broadcast', emoji: '📲' },
];
const PLATFORMS = ['tiktok', 'instagram', 'shopee', 'tokopedia', 'lazada', 'whatsapp'];

function ContentCard({ content, onCopy, copied }: { content: AIContent; onCopy: (t: string, id: number) => void; copied: number | null }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.generatedText.slice(0, 200);
  const showMore = content.generatedText.length > 200;
  return (
    <div className="card p-4 hover:border-[#00AA5B]/30 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-green">{content.contentType}</span>
          <span className="badge-gray capitalize">{content.platform}</span>
        </div>
        <button onClick={() => onCopy(content.generatedText, content.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:border-[#00AA5B] hover:text-[#00AA5B] text-slate-500 transition flex-shrink-0">
          {copied === content.id ? <><Check size={12} className="text-[#00AA5B]" /><span className="text-[#00AA5B]">Disalin!</span></> : <><Copy size={12} />Salin</>}
        </button>
      </div>
      <p className="text-xs font-medium text-slate-500 mb-2">{content.product.name}</p>
      <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
        {expanded ? content.generatedText : preview}
        {showMore && !expanded && <span className="text-slate-400">...</span>}
      </div>
      {showMore && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#00AA5B] hover:underline mt-2 flex items-center gap-1">
          {expanded ? 'Sembunyikan' : 'Lihat selengkapnya'}
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
        <Clock size={10} />
        {new Date(content.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

export default function AIContentPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<AIContent[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [contentType, setContentType] = useState('caption');
  const [platform, setPlatform] = useState('tiktok');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [resultCopied, setResultCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios.get('/api/products').then(res => {
      const prods = res.data.products || [];
      setProducts(prods);
      const paramId = searchParams.get('productId');
      setSelectedProduct(paramId || (prods.length > 0 ? String(prods[0].id) : ''));
    });
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    axios.get('/api/ai-content?limit=15').then(res => setHistory(res.data.content || []));
  };

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setGenerating(true); setResult('');
    try {
      const res = await axios.post('/api/ai-content/generate', {
        productId: parseInt(selectedProduct), userId: 1,
        contentType, platform, customPrompt: customPrompt || undefined,
      });
      setResult(res.data.generatedText || '');
      fetchHistory();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      setResult('❌ Gagal: ' + (err?.response?.data?.error || err.message));
    } finally { setGenerating(false); }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setResultCopied(true);
    setTimeout(() => setResultCopied(false), 2000);
  };

  const selectedProd = products.find(p => String(p.id) === selectedProduct);

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <PenTool size={20} className="text-[#00AA5B]" />
          AI Content Generator
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Buat caption, hook, dan script viral menggunakan Gemini AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card p-5 space-y-5">
            <h3 className="section-title">
              <Sparkles size={16} className="text-[#00AA5B]" />
              Konfigurasi Generate
            </h3>

            {/* Product */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produk</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="select-field">
                <option value="">-- Pilih Produk --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {selectedProd && (
                <p className="text-xs text-slate-400 pl-1 capitalize">{selectedProd.platform} · {selectedProd.category}</p>
              )}
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe Konten</label>
              <div className="grid grid-cols-1 gap-1.5">
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.value} onClick={() => setContentType(ct.value)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                      contentType === ct.value
                        ? 'bg-[#E8F8EF] border-[#00AA5B] text-[#00AA5B]'
                        : 'border-slate-200 text-slate-600 hover:border-[#00AA5B]/50 hover:text-[#00AA5B]'
                    }`}>
                    <span className="text-base">{ct.emoji}</span>
                    <span>{ct.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Target</label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      platform === p ? 'bg-[#00AA5B] border-[#00AA5B] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#00AA5B]/50'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Custom Prompt <span className="text-slate-400 normal-case font-normal">(opsional)</span>
              </label>
              <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Instruksi tambahan, contoh: gunakan bahasa gaul, fokus ke manfaat ibu muda..."
                rows={3} className="input-field resize-none" />
            </div>

            {/* Generate Button */}
            <button onClick={handleGenerate} disabled={generating || !selectedProduct}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? <><Loader2 size={17} className="animate-spin" />Generating...</> : <><Sparkles size={17} />Generate dengan AI</>}
            </button>
          </div>
        </div>

        {/* Result + History */}
        <div className="lg:col-span-3 space-y-4">
          {/* Result */}
          {(result || generating) && (
            <div ref={resultRef} className="card p-5 border-[#00AA5B]/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="section-title">
                  <Sparkles size={16} className="text-[#00AA5B]" />
                  Hasil Generate
                </h3>
                {result && (
                  <button onClick={copyResult}
                    className="flex items-center gap-1.5 px-3 py-1.5 btn-secondary text-xs">
                    {resultCopied ? <><Check size={12} className="text-[#00AA5B]" /><span className="text-[#00AA5B]">Tersalin!</span></> : <><Copy size={12} />Salin Semua</>}
                  </button>
                )}
              </div>
              {generating ? (
                <div className="flex items-center gap-3 text-slate-500 py-6 justify-center">
                  <Loader2 size={20} className="animate-spin text-[#00AA5B]" />
                  <span className="text-sm">AI sedang menulis konten terbaik...</span>
                </div>
              ) : (
                <div>
                  <div className="bg-[#F0FBF5] rounded-xl p-4 border border-green-200">
                    <pre className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
                  </div>
                  <button onClick={handleGenerate} className="btn-ghost text-xs mt-2 gap-1.5">
                    <RefreshCw size={12} />Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                <Clock size={16} className="text-slate-400" />
                Riwayat Konten
              </h3>
              <button onClick={fetchHistory} className="btn-ghost text-xs gap-1.5">
                <RefreshCw size={12} />Refresh
              </button>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <PenTool size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm">Belum ada konten. Generate konten pertama Anda!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-0.5">
                {history.map(item => (
                  <ContentCard key={item.id} content={item} onCopy={copyToClipboard} copied={copied} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
