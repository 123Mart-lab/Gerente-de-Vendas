

const WEBHOOK_URL = 'http://127.0.0.1:3000/webhook/openwa';

const clientes = [
  {
    nome: 'João (Vendas)',
    phone: '5511911111111@c.us',
    text: 'Bom dia! Vi um anúncio no Instagram e queria saber o preço do fone de ouvido Bluetooth.'
  },
  {
    nome: 'Maria (Suporte)',
    phone: '5511922222222@c.us',
    text: 'Comprei uma TV com vocês semana passada e ela simplesmente parou de ligar! Quero ajuda ou meu dinheiro de volta!'
  },
  {
    nome: 'Agência (Outros)',
    phone: '5511933333333@c.us',
    text: 'Olá, somos da Agência XYZ e fazemos tráfego pago. Teria interesse em terceirizar o seu marketing?'
  },
  {
    nome: 'Pedro (Vendas)',
    phone: '5511944444444@c.us',
    text: 'Vocês aceitam PIX? Tem desconto se eu levar a geladeira à vista?'
  },
  {
    nome: 'Lucas (Aquecimento - Primo)',
    phone: '5511999999999@c.us',
    text: 'E aí primo, tudo bem? Como estão as coisas no trabalho e a saúde da tia?'
  }
];

async function dispararMensagem(cliente: typeof clientes[0]) {
  console.log(`\n🚀 [Simulador] Disparando mensagem de ${cliente.nome}...`);
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'onMessage',
        data: {
          from: cliente.phone,
          body: cliente.text,
          isGroupMsg: false
        }
      })
    });
    
    if (response.ok) {
      console.log(`✅ [Simulador] Mensagem de ${cliente.nome} recebida pelo servidor!`);
    } else {
      console.error(`❌ [Simulador] Erro no servidor: ${response.statusText}`);
    }
  } catch (err) {
    console.error(`❌ [Simulador] Falha ao conectar. O servidor (npm run dev) está rodando?`);
  }
}

async function rodarSimulacao() {
  console.log('=============================================');
  console.log('🧪 INICIANDO TESTE DE STRESS E ROTEAMENTO 🧪');
  console.log('=============================================');
  
  for (const cliente of clientes) {
    await dispararMensagem(cliente);
    // Pausa de 1 segundo entre envios para facilitar a leitura no console
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Disparos concluídos. Observe o painel do seu servidor para ver o Roteador e os Vendedores trabalhando!');
}

rodarSimulacao();
