// Cliente Multiplayer para FDP - Versão Completa
console.log('🚀 Carregando multiplayer.js...');

class MultiplayerGame {
    constructor() {
        console.log('Inicializando MultiplayerGame...');
        
        this.socket = io();
        this.playerId = this.generatePlayerId();
        this.playerName = '';
        this.roomId = '';
        this.isHost = false;
        this.gameState = null;
        this.myPlayerIndex = -1;
        this.myHand = [];
        this.isOneCardRound = false;
        
        this.initializeElements();
        this.bindEvents();
        this.bindSocketEvents();
    }
    
    generatePlayerId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    initializeElements() {
        // Telas
        this.lobbyScreen = document.getElementById('lobby-screen');
        this.waitingRoom = document.getElementById('waiting-room');
        this.multiplayerGame = document.getElementById('multiplayer-game');
        
        // Lobby
        this.playerNameInput = document.getElementById('player-name');
        this.roomIdInput = document.getElementById('room-id');
        this.joinGameBtn = document.getElementById('join-game-btn');
        
        // Sala de espera
        this.currentRoomId = document.getElementById('current-room-id');
        this.playersContainer = document.getElementById('players-container');
        this.readyBtn = document.getElementById('ready-btn');
        this.startMultiplayerBtn = document.getElementById('start-multiplayer-btn');
        this.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.copyRoomBtn = document.getElementById('copy-room-btn');
        this.roomMessage = document.getElementById('room-message');
        
        // Jogo
        this.gameBoard = document.getElementById('game-board');
        this.gameMessage = document.getElementById('game-message');
        this.tableCardsContainer = document.getElementById('table-cards-container');
        this.bettingControls = document.getElementById('betting-controls');
        this.bettingOptions = document.getElementById('betting-options');
        this.bettingInfo = document.getElementById('betting-info');
        this.gameRoomId = document.getElementById('game-room-id');
        this.gameRoundInfo = document.getElementById('game-round-info');
    }
    
    bindEvents() {
        this.joinGameBtn.addEventListener('click', () => this.joinRoom());
        this.readyBtn.addEventListener('click', () => this.toggleReady());
        this.startMultiplayerBtn.addEventListener('click', () => this.startGame());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.copyRoomBtn.addEventListener('click', () => this.copyRoomId());
        
        // Enter para entrar na sala
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
        this.roomIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });
    }
    
    bindSocketEvents() {
        this.socket.on('connect', () => {
            console.log('✅ Conectado ao servidor');
        });
        
        this.socket.on('joined-room', (data) => {
            this.roomId = data.roomId;
            this.isHost = data.isHost;
            this.showWaitingRoom();
            this.updatePlayersList(data.players);
            this.currentRoomId.textContent = this.roomId;
            this.gameRoomId.textContent = this.roomId;
        });
        
        this.socket.on('room-full', (data) => {
            alert(data.message);
        });
        
        this.socket.on('player-joined', (data) => {
            this.updatePlayersList(data.players);
            this.showRoomMessage(data.message);
        });
        
        this.socket.on('player-left', (data) => {
            this.updatePlayersList(data.players);
            this.showRoomMessage(data.message);
        });
        
        this.socket.on('player-ready-update', (data) => {
            this.updatePlayersList(data.players);
            this.updateStartButton(data.canStart);
        });
        
        this.socket.on('game-started', (data) => {
            this.gameState = data.gameState;
            this.showGame();
            this.setMessage(data.message);
            this.render();
        });
        
        this.socket.on('private-hand', (data) => {
            this.myHand = data.hand;
            this.myPlayerIndex = data.playerIndex;
            this.isOneCardRound = data.isOneCardRound;
            this.render();
        });
        
        this.socket.on('bet-placed', (data) => {
            this.gameState = data.gameState;
            this.render();
            if (data.playerIndex === this.myPlayerIndex) {
                this.hideBettingControls();
            }
        });
        
        this.socket.on('bet-invalid', (data) => {
            alert(data.message);
        });
        
        this.socket.on('card-played', (data) => {
            this.gameState = data.gameState;
            if (data.playerIndex === this.myPlayerIndex) {
                this.myHand = this.myHand.filter(c => c.id !== data.card.id);
            }
            this.render();
        });
        
        this.socket.on('trick-ended', (data) => {
            this.gameState = data.gameState;
            this.setMessage(data.message);
            this.render();
        });
        
        this.socket.on('next-trick', (data) => {
            this.gameState = data.gameState;
            this.render();
        });
        
        this.socket.on('round-ended', (data) => {
            this.gameState = data.gameState;
            this.setMessage(data.summary);
            this.render();
        });
        
        this.socket.on('new-round', (data) => {
            this.gameState = data.gameState;
            this.setMessage(data.message);
            this.render();
        });
        
        this.socket.on('game-ended', (data) => {
            this.gameState = data.gameState;
            this.setMessage(data.message);
            this.render();
            setTimeout(() => {
                this.showWaitingRoom();
            }, 5000);
        });
        
        this.socket.on('disconnect', () => {
            this.showLobby();
            alert('Conexão perdida com o servidor');
        });
    }
    
    joinRoom() {
        this.playerName = this.playerNameInput.value.trim();
        if (!this.playerName) {
            alert('Digite seu nome!');
            return;
        }
        
        this.roomId = this.roomIdInput.value.trim() || this.generateRoomId();
        
        this.socket.emit('join-room', {
            roomId: this.roomId,
            playerName: this.playerName,
            playerId: this.playerId
        });
    }
    
    generateRoomId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    toggleReady() {
        this.socket.emit('player-ready');
    }
    
    startGame() {
        this.socket.emit('start-game');
    }
    
    leaveRoom() {
        this.socket.disconnect();
        this.socket.connect();
        this.showLobby();
    }
    
    copyRoomId() {
        navigator.clipboard.writeText(this.roomId).then(() => {
            this.showRoomMessage('ID da sala copiado!');
        });
    }
    
    placeBet(bet) {
        this.socket.emit('place-bet', bet);
    }
    
    playCard(cardId) {
        this.socket.emit('play-card', cardId);
    }
    
    // Interface
    showLobby() {
        this.lobbyScreen.classList.remove('hidden');
        this.waitingRoom.classList.add('hidden');
        this.multiplayerGame.classList.add('hidden');
    }
    
    showWaitingRoom() {
        this.lobbyScreen.classList.add('hidden');
        this.waitingRoom.classList.remove('hidden');
        this.multiplayerGame.classList.add('hidden');
    }
    
    showGame() {
        this.lobbyScreen.classList.add('hidden');
        this.waitingRoom.classList.add('hidden');
        this.multiplayerGame.classList.remove('hidden');
    }
    
    updatePlayersList(players) {
        this.playersContainer.innerHTML = '';
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span class="player-name">${player.name}</span>
                ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
                ${player.isReady ? '<span class="ready-badge">✓</span>' : '<span class="not-ready">○</span>'}
            `;
            this.playersContainer.appendChild(playerDiv);
        });
    }
    
    updateStartButton(canStart) {
        if (this.isHost) {
            this.startMultiplayerBtn.classList.remove('hidden');
            this.startMultiplayerBtn.disabled = !canStart;
        }
    }
    
    showRoomMessage(message) {
        this.roomMessage.textContent = message;
        setTimeout(() => {
            this.roomMessage.textContent = '';
        }, 3000);
    }
    
    setMessage(msg) {
        this.gameMessage.innerHTML = msg;
        this.gameMessage.classList.remove('hidden');
    }
    
    render() {
        if (!this.gameState) return;
        
        this.gameRoundInfo.textContent = `Rodada ${this.gameState.round}`;
        
        // Mesa
        this.tableCardsContainer.innerHTML = '';
        this.gameState.tableCards.forEach(played => {
            this.tableCardsContainer.appendChild(this.createCardElement(played.card, true, false));
        });
        
        // Jogadores
        this.gameBoard.innerHTML = '';
        this.gameState.players.forEach((player, index) => {
            const isMe = index === this.myPlayerIndex;
            const isActive = this.gameState.currentPlayerIndex === index || 
                           this.gameState.bettingPlayerIndex === index;
            
            const playerArea = document.createElement('div');
            playerArea.className = `player-area ${isActive ? 'active-player' : ''}`;
            
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            const betText = player.bet !== null ? `Aposta: ${player.bet}` : 
                          (this.gameState.phase === 'betting' ? 'Apostando...' : '-');
            const tricksText = `Pontos: ${player.tricksWon}`;
            const livesText = `<span class="lives">${player.lives}</span>`;
            
            playerInfo.innerHTML = `
                <h3>${player.name} ${isMe ? '(Você)' : ''}</h3>
                <div class="player-stats">
                    <span>${betText}</span> | <span>${tricksText}</span> | ${livesText}
                </div>
            `;
            
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            
            if (isMe) {
                this.myHand.forEach(card => {
                    const shouldShowCard = this.isOneCardRound ? false : true;
                    const cardElement = this.createCardElement(card, shouldShowCard, true);
                    const canPlay = this.gameState.phase === 'playing' && 
                                  this.gameState.currentPlayerIndex === this.myPlayerIndex;
                    
                    if (canPlay) {
                        cardElement.classList.add('playable');
                        cardElement.onclick = (e) => {
                            e.preventDefault();
                            this.playCard(card.id);
                        };
                    }
                    cardContainer.appendChild(cardElement);
                });
            } else {
                for (let i = 0; i < player.handSize; i++) {
                    const shouldShowCard = this.isOneCardRound ? true : false;
                    const dummyCard = shouldShowCard ? { value: 'A', suit: 'Copas' } : null;
                    const cardElement = this.createCardElement(dummyCard, shouldShowCard, false);
                    cardContainer.appendChild(cardElement);
                }
            }
            
            playerArea.appendChild(playerInfo);
            playerArea.appendChild(cardContainer);
            this.gameBoard.appendChild(playerArea);
        });
        
        if (this.gameState.phase === 'betting' && 
            this.gameState.bettingPlayerIndex === this.myPlayerIndex) {
            this.showBettingControls();
        }
    }
    
    createCardElement(card, isVisible, isClickable) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        
        if (isVisible && card) {
            cardElement.classList.add('flipped');
            const suitInfo = this.getSuitSymbol(card.suit);
            cardElement.innerHTML = `
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    <div class="card-value">${card.value}</div>
                    <div class="card-suit ${suitInfo.color}">${suitInfo.symbol}</div>
                </div>
            `;
        } else {
            cardElement.innerHTML = `
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    <div class="card-value">?</div>
                    <div class="card-suit">?</div>
                </div>
            `;
        }
        
        return cardElement;
    }
    
    getSuitSymbol(suit) {
        const symbols = { Paus: '♣', Copas: '♥', Espadas: '♠', Ouros: '♦' };
        const colors = { Copas: 'red', Ouros: 'red', Paus: 'black', Espadas: 'black' };
        return { symbol: symbols[suit] || '', color: colors[suit] || 'black' };
    }
    
    showBettingControls() {
        this.bettingControls.classList.remove('hidden');
        this.bettingOptions.innerHTML = '';
        
        const activePlayers = this.gameState.players.filter((p, i) => p.lives > 0);
        const numBetsMade = activePlayers.filter(p => p.bet !== null).length;
        const isLastToBet = numBetsMade === activePlayers.length - 1;
        
        let forbiddenBet = -1;
        if (isLastToBet) {
            const totalBetSumOfOthers = this.gameState.players.reduce((sum, p) => 
                p.bet !== null ? sum + p.bet : sum, 0);
            forbiddenBet = this.gameState.round - totalBetSumOfOthers;
        }
        
        for (let i = 0; i <= this.gameState.round; i++) {
            const btn = document.createElement('button');
            btn.className = 'bet-btn';
            btn.textContent = i;
            
            if (i === forbiddenBet) {
                btn.disabled = true;
                btn.title = 'Aposta proibida';
            }
            
            btn.onclick = (e) => {
                e.preventDefault();
                if (!btn.disabled) {
                    this.placeBet(i);
                }
            };
            this.bettingOptions.appendChild(btn);
        }
        
        if (isLastToBet && forbiddenBet !== -1) {
            this.bettingInfo.textContent = `A soma das apostas não pode ser ${this.gameState.round}.`;
        } else {
            this.bettingInfo.textContent = '';
        }
    }
    
    hideBettingControls() {
        this.bettingControls.classList.add('hidden');
    }
}

// Inicializar quando estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM carregado, inicializando multiplayer...');
    new MultiplayerGame();
});
