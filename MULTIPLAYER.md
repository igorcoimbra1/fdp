# 🎮 FDP - Jogo de Cartas Multiplayer

## 🌟 Como Jogar Online

### **Iniciando o Servidor**
```bash
npm install
node server.js
```

O servidor estará disponível em: `http://localhost:3000`

### **🎯 Modos de Jogo**

#### **🌐 Multiplayer Online**
- Acesse `http://localhost:3000` 
- Digite seu nome
- Crie uma nova sala ou entre em uma existente
- Compartilhe o ID da sala com seus amigos
- Aguarde todos os jogadores ficarem prontos
- O host inicia o jogo

#### **🎮 Jogo Offline**
- Acesse `http://localhost:3000/offline`
- Jogue contra bots localmente

### **📱 Recursos Implementados**

✅ **Sistema de Salas**
- Criação automática de salas
- Compartilhamento de ID
- Sistema de host/convidados

✅ **Sincronização em Tempo Real**
- Apostas sincronizadas
- Jogadas em tempo real
- Estado do jogo compartilhado

✅ **Regras Completas**
- Sistema de vidas (5 por jogador)
- Rodadas de ida e volta
- Regra da soma proibida
- Regra da rodada cega (1 carta)
- Sistema de empate (garrar)

✅ **Interface Responsiva**
- Otimizado para smartphones
- Controles touch-friendly
- Layout adaptativo

### **🔧 Tecnologias Utilizadas**

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Comunicação**: WebSockets em tempo real
- **Responsividade**: CSS Grid + Flexbox

### **🚀 Possíveis Melhorias Futuras**

- 🔐 Sistema de autenticação
- 💾 Histórico de partidas
- 🏆 Sistema de ranking
- 📊 Estatísticas de jogadores
- 🎨 Temas personalizáveis
- 🔊 Efeitos sonoros
- 📱 Progressive Web App (PWA)

### **🌍 Deploy para Produção**

Para hospedar online, você pode usar:
- **Heroku**: Plataforma gratuita para deploy
- **Railway**: Alternativa moderna ao Heroku
- **Vercel**: Para sites estáticos
- **DigitalOcean**: Para VPS próprio

### **🎮 Como Hospedar no Heroku**

1. Instale o Heroku CLI
2. Faça login: `heroku login`
3. Crie um app: `heroku create seu-fdp-game`
4. Faça deploy: `git push heroku main`
5. O app estará disponível em: `https://seu-fdp-game.herokuapp.com`

### **📞 Suporte**

Se encontrar algum bug ou tiver sugestões, sinta-se à vontade para reportar!

---
**Divirta-se jogando FDP com seus amigos! 🃏✨**
