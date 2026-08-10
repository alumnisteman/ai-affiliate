import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';

interface Node {
  id: string;
  label: string;
  type: string;
  val?: number;
}

interface Edge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

interface GraphData {
  nodes: Node[];
  links: Edge[];
  insights: any[];
}

export default function KnowledgeGraph() {
  const { productId } = useParams<{ productId: string }>();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    axios.get(`/api/knowledge/graph/${productId}`)
      .then(res => {
        const payload = res.data.data;
        if (payload) {
          // react-force-graph uses 'source' and 'target' instead of 'from' and 'to'
          const links = payload.edges.map((e: any) => ({
            source: e.from,
            target: e.to,
            label: e.label,
            weight: e.weight
          }));
          setData({ nodes: payload.nodes, links, insights: payload.insights });
        }
      })
      .catch(err => console.error("Error fetching graph:", err))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Knowledge Graph Kosong</h3>
        <p className="text-slate-500 mb-6">Belum ada data relasi untuk produk ini.</p>
        <button 
          onClick={() => axios.post(`/api/knowledge/build/${productId}`)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Build Graph Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Affiliate Knowledge Graph</h2>
        <button 
          onClick={() => axios.post(`/api/knowledge/build/${productId}`).then(() => window.location.reload())}
          className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition font-medium"
        >
          ⟳ Rebuild Graph
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-[600px] overflow-hidden">
          <ForceGraph2D
            graphData={data}
            nodeLabel="label"
            nodeAutoColorBy="type"
            linkColor={() => '#cbd5e1'}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.label;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); 
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
              
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = node.color || '#4f46e5';
              ctx.fillText(label, node.x, node.y);

              node.__bckgDimensions = bckgDimensions;
            }}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              ctx.fillStyle = color;
              const bckgDimensions = node.__bckgDimensions;
              bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
            }}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Insights</h3>
          {data.insights.length > 0 ? (
            data.insights.map((insight, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
                <span className="text-xs font-bold text-indigo-500 uppercase">{insight.insightType}</span>
                <p className="font-semibold text-slate-800 mt-1">{insight.value}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
                  <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                  <span>Sample: {insight.sampleSize}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">Belum ada insight yang cukup untuk produk ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
