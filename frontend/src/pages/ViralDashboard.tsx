import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ViralPrediction {
  id: number;
  viralScore: number;
  confidence: number;
  salesTrend: number;
  reviewTrend: number;
  predictedFor: string;
  product: {
    name: string;
    imageUrl: string;
    price: string;
    commissionRate: number;
    platform: string;
    category?: { name: string };
  };
}

export default function ViralDashboard() {
  const [predictions, setPredictions] = useState<ViralPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/viral/predictions')
      .then(res => {
        setPredictions(res.data.data || []);
      })
      .catch(err => console.error("Error fetching viral predictions:", err))
      .finally(() => setLoading(false));
  }, []);

  const triggerEngine = () => {
    axios.post('/api/viral/run')
      .then(() => alert('Viral engine sedang berjalan di background!'))
      .catch(err => alert('Gagal menjalankan engine: ' + err.message));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🔥 Viral Early Warning System
          </h2>
          <p className="text-slate-500 mt-1">Prediksi produk yang akan viral dalam 72 jam ke depan.</p>
        </div>
        <button 
          onClick={triggerEngine}
          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition font-medium border border-red-100"
        >
          ⚡ Force Run Engine
        </button>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500 mb-2">Belum ada produk yang menunjukkan sinyal viral kuat hari ini.</p>
          <p className="text-sm text-slate-400">Sistem terus memantau pergerakan data 24/7.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden relative">
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Score: {p.viralScore.toFixed(0)}
              </div>
              <div className="h-48 bg-slate-100">
                {p.product.imageUrl ? (
                  <img src={p.product.imageUrl} alt={p.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                    {p.product.platform}
                  </span>
                  {p.product.category && (
                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                      {p.product.category.name}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 truncate" title={p.product.name}>
                  {p.product.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Sales Trend</p>
                    <p className="font-bold text-emerald-500">+{p.salesTrend.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="font-bold text-slate-700">{(p.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500">Komisi</p>
                    <p className="font-bold text-indigo-600">{(p.product.commissionRate * 100).toFixed(0)}%</p>
                  </div>
                  <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition">
                    Promosikan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
