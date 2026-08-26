export const openwaService = {
  /**
   * Dispara uma requisição REST para o container do OpenWA enviar a mensagem.
   */
  async sendMessage(phone: string, text: string) {
    // Estas variáveis devem ser configuradas no seu .env futuramente
    const OPENWA_URL = process.env.OPENWA_URL || 'http://localhost:2785';
    const SESSION_ID = process.env.OPENWA_SESSION_ID || 'default';
    const API_KEY = process.env.OPENWA_API_KEY || ''; // Chave anotada no dashboard do OpenWA

    try {
      const response = await fetch(`${OPENWA_URL}/api/sessions/${SESSION_ID}/messages/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          chatId: phone, // O webhook já manda como "numero@c.us"
          text: text
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ [OpenWA API] Falha ao enviar mensagem:', errorData);
        return;
      }
      
      console.log(`[📤 OpenWA] Mensagem disparada via REST para ${phone}`);
    } catch (error) {
      console.error('❌ [OpenWA API] Erro fatal de comunicação (Container Offline?):', error);
    }
  },

  /**
   * Verifica se o número possui WhatsApp ativo no OpenWA.
   */
  async checkNumberStatus(phone: string): Promise<boolean> {
    const OPENWA_URL = process.env.OPENWA_URL || 'http://localhost:2785';
    const SESSION_ID = process.env.OPENWA_SESSION_ID || 'default';
    const API_KEY = process.env.OPENWA_API_KEY || '';

    try {
      const response = await fetch(`${OPENWA_URL}/api/sessions/${SESSION_ID}/client/checkNumberStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          contactId: phone.includes('@c.us') ? phone : `${phone}@c.us`
        })
      });

      if (!response.ok) {
        console.error('❌ [OpenWA API] Falha ao verificar número');
        // Em caso de erro da API, vamos assumir true para não perder lead, ou false dependendo da estratégia.
        // Simulando que retorna um objeto com 'canReceiveMessage' ou similar.
        return true; 
      }

      const data = await response.json();
      // O OpenWA retorna um objeto, por exemplo: { id: { server: 'c.us', user: '...', _serialized: '...' }, status: 200, isBusiness: false, canReceiveMessage: true }
      return data?.canReceiveMessage === true;

    } catch (error) {
      console.error('❌ [OpenWA API] Erro fatal na verificação:', error);
      return true; // fail-safe
    }
  }
};
