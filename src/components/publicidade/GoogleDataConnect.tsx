import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { AlertCircle, CheckCircle2, TrendingUp, Search, ShoppingBag } from 'lucide-react';

export default function GoogleDataConnect() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchConsoleData, setSearchConsoleData] = useState<any>(null);
  
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setToken(tokenResponse.access_token);
      fetchConnectedData(tokenResponse.access_token);
    },
    onError: (errorResponse) => {
      setError('Erro ao autenticar com o Google.');
      console.error(errorResponse);
    },
    scope: 'https://www.googleapis.com/auth/content https://www.googleapis.com/auth/webmasters.readonly',
    flow: 'implicit'
  });

  const fetchConnectedData = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Search Console sites
      const sitesRes = await axios.get('https://searchconsole.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const sites = sitesRes.data.siteEntry || [];
      
      if (sites.length > 0) {
        // Fetch some basic metrics for the first site
        const siteUrl = sites[0].siteUrl;
        
        // 30 days ago
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Yesterday
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        try {
          const metricsRes = await axios.post(
            `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
            {
              startDate: startDateStr,
              endDate: endDateStr,
              dimensions: ['query']
            },
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          setSearchConsoleData({
            siteUrl,
            rows: metricsRes.data.rows || []
          });
        } catch (metricsErr: any) {
          console.error("Erro ao buscar métricas", metricsErr);
          // If the user doesn't have permissions or site is not verified, just list the sites
          setSearchConsoleData({
            siteUrl,
            rows: [],
            warning: "Sem permissão para buscar métricas ou site não verificado."
          });
        }
      } else {
        setSearchConsoleData({ warning: "Nenhuma propriedade encontrada no Search Console." });
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Erro desconhecido';
      setError(`Erro ao buscar dados do Google: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Integração Google (Search Console & Merchant Center)
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Conecte suas contas para que o Especialista SEO analise termos de busca reais e dados de produtos.
          </p>
        </div>
        {!token ? (
          <button
            onClick={() => login()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Conectar Google
          </button>
        ) : (
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium flex items-center gap-2 border border-green-200">
            <CheckCircle2 className="w-4 h-4" />
            Conectado
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p>Buscando dados das suas contas Google...</p>
        </div>
      )}

      {token && searchConsoleData && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-5">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-slate-500" />
              Search Console: {searchConsoleData.siteUrl || "Dados"}
            </h4>
            
            {searchConsoleData.warning ? (
              <p className="text-sm text-amber-600">{searchConsoleData.warning}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase">Top Consultas (Últimos 30 dias)</p>
                {searchConsoleData.rows?.slice(0, 5).map((row: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                    <span className="text-sm text-slate-700">{row.keys[0]}</span>
                    <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {row.clicks} cliques
                    </span>
                  </div>
                ))}
                {(!searchConsoleData.rows || searchConsoleData.rows.length === 0) && (
                  <p className="text-sm text-slate-500 italic">Nenhum dado de clique recente encontrado.</p>
                )}
              </div>
            )}
          </div>
          
          <div className="border border-slate-200 rounded-lg p-5">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              Merchant Center
            </h4>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-600 mb-2">
                Acesso aos produtos habilitado. O Especialista SEO utilizará esses dados cruzados com a Nuvemshop para melhorar o diagnóstico de desempenho dos seus anúncios no Google Shopping.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 mt-4">
                <CheckCircle2 className="w-4 h-4" />
                Permissão Concedida
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
