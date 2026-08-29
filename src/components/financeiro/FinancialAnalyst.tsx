import React from 'react';
import { DollarSign } from 'lucide-react';
import TaskAuditPanel, { AuditTask } from '../publicidade/TaskAuditPanel';

export default function FinancialAnalyst() {
  const mockHistory: AuditTask[] = [
    {
      id: 'task-fin-001',
      date: 'Ontem, 16:30',
      productName: 'Churrasqueira Elétrica Portátil (Viabilidade)',
      receivedPrompt: 'Recebemos as análises dos links dos concorrentes.\nO produto tem alta aceitação e preço médio de mercado de R$ 149,90.\nNosso custo de aquisição (fornecedor) é R$ 65,00.\nImpostos (Simples): 8%.\nTaxas de Cartão/Gateway: 5%.\nCusto de Embalagem: R$ 3,50.\n\nCalcule o preço mínimo de venda para obtermos pelo menos 25% de lucro líquido e avalie se é viável vender frente à concorrência.',
      sentResponse: 'Análise de Viabilidade Financeira Concluída.\n\nCustos Fixos/Diretos (Imposto 8% + Gateway 5% = 13%):\nCusto de Produto + Embalagem = R$ 68,50.\n\nPara 25% de lucro líquido (R$ 30,00 reais limpos na conta):\nPreço sugerido mínimo de venda: R$ 119,90.\n(Sobram R$ 119,90 - 13% - R$ 68,50 = R$ 35,80 de lucro real líquido por peça - ~29% de margem).\n\nConclusão: É ALTAMENTE VIÁVEL.\nPodemos vender abaixo do preço médio de mercado (R$ 149,90) cobrando R$ 119,90 a R$ 129,90, sermos os mais baratos, e ainda superar a expectativa de lucro líquido de 25%.',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-sky-600" />
          Analista Financeiro
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Análise Financeira e Viabilidade</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Analisa a viabilidade financeira de comercializarmos um novo produto.</li>
            <li>Calcula os preços praticados pelo mercado e realiza o abatimento de custos com impostos, embalagem, compras, e taxas de comercialização.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Cria o preço mínimo de venda de acordo com as expectativas de lucro.</li>
            <li><strong>Relatórios Entregues:</strong> Cria relatórios completos de viabilidade financeira e envia ao Gestor de Projetos.</li>
          </ul>
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-48 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              defaultValue="Você é um Analista Financeiro especializado em viabilidade de produtos de e-commerce. Você recebe ordens do Gerente de Projetos. Sua função é analisar a viabilidade financeira de comercializar um produto de acordo com os preços praticados pela concorrência. Você deve analisar o preço de venda praticado no mercado, subtrair nossos custos com impostos, embalagem, custo de compra do produto, e custos de comercialização (taxas). Finalmente, você deve criar um preço mínimo de venda de acordo com nossas expectativas de lucro. Crie relatórios detalhados e envie-os ao Gestor de Projetos."
            />
          </div>

          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
    </div>
  );
}
