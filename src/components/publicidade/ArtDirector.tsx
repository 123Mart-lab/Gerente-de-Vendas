import React, { useState } from 'react';
import { Palette, ImageIcon, Video } from 'lucide-react';
import PhotoProduction from '../marketing/PhotoProduction';
import VideoProduction from '../marketing/VideoProduction';
import TaskAuditPanel, { AuditTask } from './TaskAuditPanel';

export default function ArtDirector() {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  const mockHistory: AuditTask[] = [
    {
      id: 'task-004',
      date: 'Hoje, 10:52',
      productName: 'Faca de Aço Inoxidável 12" Top Chef',
      receivedPrompt: 'O SEO já foi otimizado. Crie banners e imagens publicitárias focadas no posicionamento "Premium Acessível".\n\nDiretrizes Visuais:\n- Destacar o fio da lâmina brilhando (durabilidade).\n- Mostrar o cabo ergonômico em uso.\n- Criar apelo visual de alta conversão. Salve as mídias direto no produto.',
      sentResponse: 'Imagens e Banners Criados com Sucesso!\n\nMelhorias:\n- Gerei um lifestyle mostrando a faca cortando carne nobre (apelo premium).\n- Criei uma imagem infográfica apontando para o material do cabo antiderrapante.\n- Substituí a foto de fundo branco de baixa qualidade original.\n\nResultado salvo na Nuvemshop.',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Palette className="w-6 h-6 text-sky-600" />
          Diretor de Arte e Audiovisual
        </h2>
        <div className="prose prose-slate max-w-none text-slate-600 mt-4">
          <p className="font-medium text-slate-700">Criação e Produção</p>
          <ul className="space-y-2 mt-4 list-disc pl-5">
            <li>Responsável pela concepção visual das campanhas.</li>
            <li>Cria e edita fotos, vídeos e banners de alta conversão para os produtos do catálogo.</li>
            <li><strong>Fluxo de Operação:</strong> Recebe o prompt de comando do Gestor de Projetos. Cria as imagens e vídeos publicitários do anúncio, de acordo com o solicitado.</li>
            <li><strong>Relatórios Entregues:</strong> Salva tudo na Nuvemshop e envia para o Gerente de Projetos o relatório com o resultado final, a melhoria de conversão visual promovida, o que modificou no anúncio e o porquê.</li>
          </ul>
          
          <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Persona e Configuração da IA</h3>
            <p className="text-sm text-slate-500 italic mb-4">Insira aqui a descrição detalhada da persona e instruções de sistema para este agente...</p>
            <textarea 
              className="w-full h-48 p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              defaultValue="Você é um Diretor de Arte Sênior especializado em conversão visual. Você recebe ordens do Gerente de Projetos. Sua função é criar as imagens e vídeos publicitários do anúncio de acordo com as especificações da equipe. Salve tudo diretamente na Nuvemshop. Em seguida, envie para o Gerente de Projetos um relatório com o resultado final de seu trabalho, a melhoria visual promovida, o que modificou no anúncio e por que modificou."
            />
          </div>

          <TaskAuditPanel mockTasks={mockHistory} />
        </div>
      </div>
      
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('photos')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'photos'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Produção de Fotos
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'videos'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Video className="w-4 h-4" />
            Produção de Vídeos
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'photos' ? <PhotoProduction /> : <VideoProduction />}
      </div>
    </div>
  );
}
