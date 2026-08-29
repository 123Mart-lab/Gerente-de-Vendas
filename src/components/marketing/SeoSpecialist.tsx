import React, { useState, useEffect } from 'react';
import axios from 'axios';
//, { useState } from 'react';
import { Sparkles, Tags } from 'lucide-react';
import ProductOptimizer from './ProductOptimizer';
import CategorySEO from './CategorySEO';
import TaskAuditPanel, { AuditTask } from '../publicidade/TaskAuditPanel';

export default function SeoSpecialist() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  const [mockHistory, setMockHistory] = useState<AuditTask[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/marketing/audit-logs');
        if (res.data && Array.isArray(res.data)) {
          setMockHistory(res.data.filter((task: any) => task.role === 'seo'));
        }
      } catch (err) {
        console.error('Erro ao buscar logs', err);
      }
    };
    fetchLogs();
    
    // Auto refresh
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-sky-600" />
          Especialista SEO
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Mídia, SEO e Performance</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Otimiza títulos, descrições, metadados e a estrutura das páginas e anúncios.</li>
            <li>Garante o ranqueamento orgânico máximo nos mecanismos de busca.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Cria o SEO completo do anúncio e preenche todos os campos na Nuvemshop, salvando tudo.</li>
            <li><strong>Relatórios Entregues:</strong> Envia para o Gerente de Projetos o relatório com o resultado final, a melhoria de SEO promovida, o que modificou no anúncio e por que modificou.</li>
          </ul>

          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'products'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            SEO de Produtos
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Tags className="w-4 h-4" />
            SEO de Categorias
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'products' ? <ProductOptimizer /> : <CategorySEO />}
      </div>
    </div>
  );
}
