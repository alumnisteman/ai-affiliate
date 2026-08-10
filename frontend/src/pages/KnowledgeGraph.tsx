import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, RefreshCw, Loader2, Lightbulb, PenTool } from 'lucide-react';

interface Node { id: string; label: string; type: string; val?: number }
interface Edge { source: string; target: string; label?: string; weight?: number }
interface GraphData { nodes: Node[]; links: Edge[]; insights: any[] }

const NODE_COLORS: Record<string, string> = {
  product: '#00AA5B', category: '#3b82f6', content: '#f59e0b',
  creator: '#8b5cf6', audience: '#ec4899', conversion: '#06b6d4',
};
const NODE_LEGEND = [
  { type: 'product', label: 'Produk' }, { type: 'category', label: 'Kategori' },
  { type: 'content', label: 'Konten' }, { type: 'creator', label: 'Creator' },
  { type: 'audience', label: 'Audience' }, { type: 'conversion', label: 'Konversi' },
];

export default function KnowledgeGraph() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);

  const fetchGraph = () => {
    if (!productId) return;
    setLoading(true);
    axios.get(`/api/knowledge/graph/${productId}`)
      .then(res => {
        const payload = res.data.data;
        if (payload) {
          const links = payload.edges.map((e: any) => ({ source: e.from, target: e.to, label: e.label, weight: e.weight }));
          setData({ nodes: payload.nodes, links, insights: payload.insights });
        } else { setData(null); }
      })
      .catch(err => console.error('Graph error:', err))
      .finally(() => setLoading(false));
  };

  const handleBuild = () => {
    setBuilding(true);
    axios.post(`/api/knowledge/build/${productId}`)
      .then(() => setTimeout(() => fetchGraph(), 2000))
      .finally(() => setBuilding(false));
  };

  useEffect(() => { fetchGraph(); }, [productId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={32} className="animate-spin text-[#00AA5B]" />
        <p className="text-slate-400 text-sm">Memuat knowledge graph...</p>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="space-y-5 animate-in">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Network size={20} className="text-[#00AA5B]" />Affiliate Knowledge Graph
        </h2>
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-[#E8F8EF] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Network size={32} className="text-[#00AA5B]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Graph Belum Dibuat</h3>
          <p className="text-slate-500 text-sm mb-6">Belum ada data relasi untuk produk #{productId}.</p>
          <button onClick={handleBuild} disabled={building}
            className="btn-primary disabled:opacity-50">
            {building ? <><Loader2 size={16} className="animate-spin" />Membangun...</> : <><Network size={16} />Build Graph</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Network size={20} className="text-[#00AA5B]" />Affiliate Knowledge Graph
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{data.nodes.length} node · {data.links.length} relasi · Produk #{productId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/content?productId=${productId}`)} className="btn-secondary text-sm">
            <PenTool size={15} />Generate Konten
          </button>
          <button onClick={handleBuild} disabled={building} className="btn-secondary text-sm disabled:opacity-50">
            <RefreshCw size={15} className={building ? 'animate-spin' : ''} />
            {building ? 'Rebuilding...' : 'Rebuild'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-4">
        {NODE_LEGEND.map(n => (
          <div key={n.type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[n.type] }} />
            <span className="text-xs text-slate-500">{n.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Graph */}
        <div className="lg:col-span-3 card overflow-hidden h-[520px]">
          <ForceGraph2D
            graphData={data}
            backgroundColor="#ffffff"
            nodeLabel="label"
            linkColor={() => '#e2e8f0'}
            linkWidth={1.5}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const nodeColor = NODE_COLORS[node.type] || '#94a3b8';
              const fontSize = Math.max(9, 11 / globalScale);

              // Draw outer glow
              ctx.beginPath();
              ctx.arc(node.x, node.y, 9, 0, 2 * Math.PI);
              ctx.fillStyle = nodeColor + '25';
              ctx.fill();

              // Draw circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
              ctx.fillStyle = nodeColor;
              ctx.fill();

              // White border
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Label
              ctx.font = `500 ${fontSize}px Inter, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = '#475569';
              ctx.fillText(node.label, node.x, node.y + 9);

              node.__bckgDimensions = [ctx.measureText(node.label).width, fontSize];
            }}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
              ctx.fill();
            }}
          />
        </div>

        {/* Insights */}
        <div className="space-y-3">
          <h3 className="section-title">
            <Lightbulb size={16} className="text-amber-500" />AI Insights
          </h3>
          {data.insights.length > 0 ? (
            <div className="space-y-3 max-h-[470px] overflow-y-auto pr-0.5">
              {data.insights.map((insight, idx) => (
                <div key={idx} className="card border-l-4 border-l-[#00AA5B] p-4">
                  <span className="text-[10px] font-bold text-[#00AA5B] uppercase tracking-wider block mb-1">
                    {insight.insightType}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{insight.value}</p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                    <span>Confidence: <span className="text-[#00AA5B] font-bold">{(insight.confidence * 100).toFixed(0)}%</span></span>
                    <span>n={insight.sampleSize}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#00AA5B] rounded-full" style={{ width: `${insight.confidence * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-5 text-center">
              <Lightbulb size={24} className="mx-auto mb-2 text-slate-200" />
              <p className="text-sm text-slate-400">Belum ada insight.</p>
              <p className="text-xs text-slate-300 mt-1">Insight muncul setelah data performa konten cukup.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
