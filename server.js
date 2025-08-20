const http = require('http');
const fs = require('fs');
const path = require('path');

const agents = {
  recrutamento: 'Você é um especialista em recrutamento e seleção, ajudando com estratégias para encontrar e contratar os melhores talentos.',
  engajamento: 'Você é um especialista em engajamento de colaboradores, fornecendo dicas para motivação e satisfação no trabalho.',
  treinamento: 'Você é um especialista em treinamento e desenvolvimento, orientando planos de capacitação e crescimento profissional.'
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET') {
    const filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { agent, message } = JSON.parse(body);
        const system = agents[agent] || 'Você é um assistente de RH.';
        const apiKey = process.env.OPENAI_API_KEY;
        let reply = 'Configuração de API ausente.';
        if (apiKey) {
          try {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: system },
                  { role: 'user', content: message }
                ]
              })
            });
            const data = await resp.json();
            reply = data?.choices?.[0]?.message?.content || 'Sem resposta.';
          } catch (e) {
            reply = 'Erro ao consultar o modelo.';
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro no servidor' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
