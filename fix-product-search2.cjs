const fs = require('fs');
let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

// replace the imports
content = content.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';"
);

// replace the state block
const oldState = `  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12');
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [seoResult, setSeoResult] = useState<any>(null);

  const handleOptimize = async () => {`;

const newState = `  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [optimized, setOptimized] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [seoResult, setSeoResult] = useState<any>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch products on mount and when typing
  useEffect(() => {
    const fetchProducts = async () => {
      setIsSearchingProducts(true);
      try {
        const response = await axios.get('/api/marketing/products', {
          params: { q: searchTerm }
        });
        setProducts(response.data);
      } catch (err) {
        console.error("Erro ao buscar produtos", err);
      } finally {
        setIsSearchingProducts(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 400); // Debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleOptimize = async () => {`;

content = content.replace(oldState, newState);

// replace handleOptimize call
const oldOptimizeCall = `const response = await axios.post('/api/marketing/optimize', { query: searchTerm });`;
const newOptimizeCall = `const response = await axios.post('/api/marketing/optimize', { 
        productId: selectedProductId,
        query: searchTerm 
      });`;
content = content.replace(oldOptimizeCall, newOptimizeCall);

// replace search bar block
const oldSearchBar = `<div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar ID ou Nome do produto na Nuvemshop..." 
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>`;

const newSearchBar = `<div className="relative flex-1 w-full" ref={dropdownRef}>
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Selecione ou busque um produto na Nuvemshop..." 
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white shadow-sm cursor-text"
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedProductId(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isSearchingProducts ? (
                  <div className="p-3 text-sm text-slate-500 text-center">Buscando produtos...</div>
                ) : products.length > 0 ? (
                  <ul className="py-1">
                    {products.map(p => (
                      <li 
                        key={p.id}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setSearchTerm(p.name);
                          setSelectedProductId(p.id);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="font-medium text-slate-800 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-slate-400">ID: {p.id}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-sm text-slate-500 text-center">Nenhum produto encontrado.</div>
                )}
              </div>
            )}
          </div>`;

content = content.replace(oldSearchBar, newSearchBar);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content);
