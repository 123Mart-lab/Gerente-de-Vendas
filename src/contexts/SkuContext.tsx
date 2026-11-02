import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SkuValidationResult {
  isValid: boolean;
  message: string;
  formattedSku: string;
}

export interface SkuContextType {
  activeSku: string | null;
  activeProductName: string | null;
  activeProduct: any | null;
  setActiveSku: (sku: string | null, productName?: string | null, product?: any | null) => void;
  clearActiveSku: () => void;
  validateSku: (sku: string | null | undefined) => SkuValidationResult;
  injectSkuPrompt: (basePrompt: string, customSku?: string, customName?: string) => string;
}

const SkuContext = createContext<SkuContextType | undefined>(undefined);

export function validateSkuFormat(sku: string | null | undefined): SkuValidationResult {
  if (!sku || typeof sku !== 'string') {
    return {
      isValid: false,
      message: 'O SKU é obrigatório e não pode estar vazio.',
      formattedSku: ''
    };
  }

  const trimmed = sku.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      message: 'O SKU não pode conter apenas espaços.',
      formattedSku: ''
    };
  }

  if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'n/a') {
    return {
      isValid: false,
      message: 'SKU inválido detectado ("undefined" ou "null"). Selecione um produto real.',
      formattedSku: ''
    };
  }

  // Verifica se inicia com 123Mart (padrão corporativo da 123Mart)
  if (!trimmed.toLowerCase().startsWith('123mart')) {
    return {
      isValid: false,
      message: `O SKU "${trimmed}" é inválido. A regra corporativa exige que todo SKU inicie com "123Mart" (exemplo: 123Mart09015).`,
      formattedSku: trimmed
    };
  }

  if (trimmed.length < 8) {
    return {
      isValid: false,
      message: `O SKU "${trimmed}" é muito curto. Um SKU válido da 123Mart possui o prefixo e código numérico/alfanumérico (ex: 123Mart09015).`,
      formattedSku: trimmed
    };
  }

  return {
    isValid: true,
    message: 'SKU válido e em conformidade corporativa.',
    formattedSku: trimmed
  };
}

export function extractSkuFromText(text: string): string | null {
  if (!text) return null;
  const match = text.match(/123mart[a-zA-Z0-9_-]+/i);
  return match ? match[0] : null;
}

export function SkuProvider({ children }: { children: ReactNode }) {
  const [activeSku, setActiveSkuState] = useState<string | null>(() => {
    return localStorage.getItem('123mart_active_sku') || null;
  });

  const [activeProductName, setActiveProductNameState] = useState<string | null>(() => {
    return localStorage.getItem('123mart_active_product_name') || null;
  });

  const [activeProduct, setActiveProductState] = useState<any | null>(() => {
    const saved = localStorage.getItem('123mart_active_product');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const setActiveSku = (sku: string | null, productName?: string | null, product?: any | null) => {
    if (!sku) {
      setActiveSkuState(null);
      setActiveProductNameState(null);
      setActiveProductState(null);
      localStorage.removeItem('123mart_active_sku');
      localStorage.removeItem('123mart_active_product_name');
      localStorage.removeItem('123mart_active_product');
      return;
    }

    const trimmedSku = sku.trim();
    setActiveSkuState(trimmedSku);
    localStorage.setItem('123mart_active_sku', trimmedSku);

    if (productName) {
      setActiveProductNameState(productName);
      localStorage.setItem('123mart_active_product_name', productName);
    }

    if (product) {
      setActiveProductState(product);
      localStorage.setItem('123mart_active_product', JSON.stringify(product));
    }
  };

  const clearActiveSku = () => {
    setActiveSku(null);
  };

  const validateSku = (sku: string | null | undefined): SkuValidationResult => {
    return validateSkuFormat(sku);
  };

  const injectSkuPrompt = (basePrompt: string, customSku?: string, customName?: string): string => {
    const skuToUse = customSku || activeSku;
    const nameToUse = customName || activeProductName || 'Produto em Otimização';

    if (!skuToUse) {
      return basePrompt;
    }

    const header = `[PRODUTO / SKU DE REFERÊNCIA OBRIGATÓRIO: ${skuToUse}]
[NOME DO PRODUTO: "${nameToUse}"]
[REGRA CORPORATIVA INVIOLÁVEL]: O SKU "${skuToUse}" é a âncora absoluta deste produto. Toda análise, pesquisa, cálculo financeiro, benchmark de concorrência ou comunicação entre agentes DEVE ser referenciada pelo SKU "${skuToUse}". É proibido usar identificadores genéricos ou "undefined".
`;

    return `${header}\n${basePrompt}`;
  };

  return (
    <SkuContext.Provider value={{
      activeSku,
      activeProductName,
      activeProduct,
      setActiveSku,
      clearActiveSku,
      validateSku,
      injectSkuPrompt
    }}>
      {children}
    </SkuContext.Provider>
  );
}

export function useSku(): SkuContextType {
  const context = useContext(SkuContext);
  if (!context) {
    throw new Error('useSku deve ser utilizado dentro de um <SkuProvider>');
  }
  return context;
}
