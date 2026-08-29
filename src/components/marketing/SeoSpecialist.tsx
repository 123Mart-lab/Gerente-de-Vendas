import React, { useState } from 'react';
import ProductOptimizer from './ProductOptimizer';
import CategorySEO from './CategorySEO';
import { Sparkles, Tags } from 'lucide-react';

export default function SeoSpecialist() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  return (
    <div className="space-y-6">
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
