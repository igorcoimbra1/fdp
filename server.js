const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'multiplayer.html'));
});

// Rota para jogo offline (original)
app.get('/offline', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Estado do jogo
class GameRoom {
    constructor(roomId, maxPlayers = 4) {
        this.roomId = roomId;
        this.maxPlayers = maxPlayers;
        this.players = new Map();
        this.gameState = null;
        this.isGameStarted = false;
        this.hostId = null;
    }

    addPlayer(playerId, playerName, socketId) {
        if (this.players.size >= this.maxPlayers) return false;
        
        const player = {
            id: playerId,
            name: playerName,
            socketId: socketId,
            isReady: false,
            hand: [],
            lives: 5,
            tricksWon: 0,
            bet: null
        };
        
        this.players.set(playerId, player);
        
        // Primeiro jogador se torna o host
        if (!this.hostId) {
            this.hostId = playerId;
        }
        
        return true;
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        
        // Se o host saiu, escolher novo host
        if (this.hostId === playerId && this.players.size > 0) {
            this.hostId = this.players.keys().next().value;
        }
    }

    getPlayersList() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            isReady: p.isReady,
            isHost: p.id === this.hostId
        }));
    }

    canStartGame() {
        return this.players.size >= 2 && 
               Array.from(this.players.values()).every(p => p.isReady);
    }
}

// Gerenciador de salas
const gameRooms = new Map();

// Funções auxiliares do jogo (copiadas do main.js original)
const SUITS = ['Paus', 'Copas', 'Espadas', 'Ouros'];
const VALUES = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
const CARD_STRENGTH = {
    '4 de Paus': 14, '7 de Copas': 13, 'A de Espadas': 12, '7 de Ouros': 11,
    '3': 10, '2': 9, 'A': 8, 'K': 7, 'J': 6, 'Q': 5, '7': 4, '6': 3, '5': 2, '4': 1,
};

function createDeck() {
    return SUITS.flatMap(suit => VALUES.map(value => ({ 
        value, 
        suit, 
        id: `${value}-${suit}` 
    })));
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Conexões Socket.IO
io.on('connection', (socket) => {
    console.log(`✅ Usuário conectado: ${socket.id}`);
    
    // Criar ou entrar em uma sala
    socket.on('join-room', (data) => {
        console.log('📥 Recebido join-room:', data);
        const { roomId, playerName, playerId } = data;
        
        // Criar sala se não existir
        if (!gameRooms.has(roomId)) {
            console.log(`🏠 Criando nova sala: ${roomId}`);
            gameRooms.set(roomId, new GameRoom(roomId));
        }
        
        const room = gameRooms.get(roomId);
        console.log(`👥 Tentando adicionar jogador ${playerName} à sala ${roomId}`);
        
        // Tentar adicionar jogador
        if (room.addPlayer(playerId, playerName, socket.id)) {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.playerId = playerId;
            
            console.log(`✅ Jogador ${playerName} adicionado à sala ${roomId}`);
            
            // Notificar todos na sala
            io.to(roomId).emit('player-joined', {
                players: room.getPlayersList(),
                message: `${playerName} entrou na sala`
            });
            
            socket.emit('joined-room', {
                roomId: roomId,
                isHost: room.hostId === playerId,
                players: room.getPlayersList()
            });
            
            console.log(`📤 Enviando joined-room para ${playerName}`);
        } else {
            console.log(`❌ Sala ${roomId} está cheia`);
            socket.emit('room-full', { message: 'Sala está cheia' });
        }
    });
    
    // Jogador pronto
    socket.on('player-ready', () => {
        const room = gameRooms.get(socket.roomId);
        if (room && room.players.has(socket.playerId)) {
            const player = room.players.get(socket.playerId);
            player.isReady = !player.isReady;
            
            io.to(socket.roomId).emit('player-ready-update', {
                players: room.getPlayersList(),
                canStart: room.canStartGame()
            });
        }
    });
    
    // Iniciar jogo (apenas host)
    socket.on('start-game', () => {
        const room = gameRooms.get(socket.roomId);
        if (room && room.hostId === socket.playerId && room.canStartGame()) {
            startGameInRoom(room);
        }
    });
    
    // Ações do jogo
    socket.on('place-bet', (bet) => {
        const room = gameRooms.get(socket.roomId);
        if (room && room.gameState) {
            processBet(room, socket.playerId, bet);
        }
    });
    
    socket.on('play-card', (cardId) => {
        const room = gameRooms.get(socket.roomId);
        if (room && room.gameState) {
            processCardPlay(room, socket.playerId, cardId);
        }
    });
    
    // Desconexão
    socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.id}`);
        
        if (socket.roomId && socket.playerId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
                room.removePlayer(socket.playerId);
                
                if (room.players.size === 0) {
                    gameRooms.delete(socket.roomId);
                } else {
                    io.to(socket.roomId).emit('player-left', {
                        players: room.getPlayersList(),
                        message: 'Um jogador saiu da sala'
                    });
                }
            }
        }
    });
});

// Funções do jogo
function startGameInRoom(room) {
    room.isGameStarted = true;
    const players = Array.from(room.players.values());
    
    // Distribuir cartas (começar com 1 carta)
    const deck = createDeck();
    shuffleDeck(deck);
    
    players.forEach(player => {
        player.hand = [deck.pop()];
        player.lives = 5;
        player.tricksWon = 0;
        player.bet = null;
    });
    
    room.gameState = {
        round: 1,
        phase: 'betting',
        currentPlayerIndex: 0,
        bettingPlayerIndex: 0,
        tableCards: [],
        totalBetSum: 0,
        deck: deck
    };
    
    // Enviar estado inicial para todos
    io.to(room.roomId).emit('game-started', {
        gameState: getPublicGameState(room),
        message: 'Jogo iniciado! Fase de apostas.'
    });
    
    // Enviar cartas privadas para cada jogador
    players.forEach((player, index) => {
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
            playerSocket.emit('private-hand', {
                hand: player.hand,
                playerIndex: index,
                isOneCardRound: room.gameState.round === 1
            });
        }
    });
}

function processBet(room, playerId, bet) {
    const player = room.players.get(playerId);
    const players = Array.from(room.players.values());
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    if (playerIndex === room.gameState.bettingPlayerIndex) {
        // Verificar regra da soma proibida
        const activePlayers = players.filter(p => p.lives > 0);
        const numBetsMade = activePlayers.filter(p => p.bet !== null).length;
        const isLastToBet = numBetsMade === activePlayers.length - 1;
        
        if (isLastToBet) {
            const totalBetSumOfOthers = players.reduce((sum, p) => 
                p.bet !== null && p.id !== playerId ? sum + p.bet : sum, 0);
            const forbiddenBet = room.gameState.round - totalBetSumOfOthers;
            
            if (bet === forbiddenBet) {
                // Aposta proibida
                const playerSocket = io.sockets.sockets.get(player.socketId);
                if (playerSocket) {
                    playerSocket.emit('bet-invalid', {
                        message: `Aposta ${bet} não permitida. A soma não pode ser ${room.gameState.round}.`
                    });
                }
                return;
            }
        }
        
        player.bet = bet;
        room.gameState.totalBetSum += bet;
        
        // Próximo jogador
        do {
            room.gameState.bettingPlayerIndex = (room.gameState.bettingPlayerIndex + 1) % players.length;
        } while (players[room.gameState.bettingPlayerIndex].lives <= 0 && 
                 !players.every(p => p.lives <= 0 || p.bet !== null));
        
        // Verificar se todos apostaram
        if (activePlayers.every(p => p.bet !== null)) {
            room.gameState.phase = 'playing';
            room.gameState.currentPlayerIndex = 0;
        }
        
        io.to(room.roomId).emit('bet-placed', {
            gameState: getPublicGameState(room),
            playerIndex: playerIndex,
            bet: bet
        });
    }
}

function processCardPlay(room, playerId, cardId) {
    const player = room.players.get(playerId);
    const players = Array.from(room.players.values());
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    if (playerIndex === room.gameState.currentPlayerIndex) {
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
            const card = player.hand.splice(cardIndex, 1)[0];
            room.gameState.tableCards.push({ card, playerIndex });
            
            room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % players.length;
            
            io.to(room.roomId).emit('card-played', {
                gameState: getPublicGameState(room),
                playerIndex: playerIndex,
                card: card
            });
            
            // Verificar fim da rodada
            if (room.gameState.tableCards.length === players.length) {
                setTimeout(() => endTrick(room), 2000);
            }
        }
    }
}

function endTrick(room) {
    const winningCardInfo = findTrickWinner(room.gameState.tableCards);
    const players = Array.from(room.players.values());
    
    if (winningCardInfo) {
        const trickWinnerIndex = winningCardInfo.playerIndex;
        players[trickWinnerIndex].tricksWon++;
        room.gameState.currentPlayerIndex = trickWinnerIndex;
        
        io.to(room.roomId).emit('trick-ended', {
            gameState: getPublicGameState(room),
            winner: trickWinnerIndex,
            message: `${players[trickWinnerIndex].name} venceu a rodada!`
        });
    } else {
        io.to(room.roomId).emit('trick-ended', {
            gameState: getPublicGameState(room),
            winner: -1,
            message: "Rodada completamente empatada! Ninguém leva."
        });
    }
    
    setTimeout(() => {
        room.gameState.tableCards = [];
        
        // Verificar se ainda há cartas
        const handsRemaining = players.some(p => p.hand.length > 0);
        if (handsRemaining) {
            // Próxima rodada
            io.to(room.roomId).emit('next-trick', {
                gameState: getPublicGameState(room)
            });
        } else {
            endRound(room);
        }
    }, 2500);
}

function findTrickWinner(cardsInPlay) {
    if (cardsInPlay.length === 0) return null;

    const getCardStrength = (card) => {
        return CARD_STRENGTH[`${card.value} de ${card.suit}`] || CARD_STRENGTH[card.value] || 0;
    };

    const sortedCards = cardsInPlay.slice().sort((a, b) => getCardStrength(b.card) - getCardStrength(a.card));
    const maxStrength = getCardStrength(sortedCards[0].card);
    const tiedCards = sortedCards.filter(c => getCardStrength(c.card) === maxStrength);

    if (tiedCards.length > 1 && maxStrength < 11) {
        const remainingCards = cardsInPlay.filter(c => getCardStrength(c.card) < maxStrength);
        return findTrickWinner(remainingCards);
    } else {
        return sortedCards[0];
    }
}

function endRound(room) {
    const players = Array.from(room.players.values());
    let roundSummary = "Fim da rodada! Vidas perdidas:<br>";
    
    players.forEach((player, index) => {
        const diff = Math.abs(player.bet - player.tricksWon);
        player.lives -= diff;
        roundSummary += `${player.name}: ${diff} | `;
        
        // Reset para próxima rodada
        player.tricksWon = 0;
        player.bet = null;
    });
    
    io.to(room.roomId).emit('round-ended', {
        gameState: getPublicGameState(room),
        summary: roundSummary.slice(0, -2)
    });
    
    const alivePlayers = players.filter(p => p.lives > 0);
    if (alivePlayers.length <= 1) {
        setTimeout(() => endGame(room), 3000);
    } else {
        setTimeout(() => nextRound(room), 3000);
    }
}

function nextRound(room) {
    const players = Array.from(room.players.values());
    const alivePlayers = players.filter(p => p.lives > 0);
    const numPlayers = alivePlayers.length;
    const maxRound = Math.floor(40 / numPlayers);
    
    let currentRound = room.gameState.round;
    let roundDirection = room.gameState.roundDirection || 'up';
    
    if (roundDirection === 'up') {
        if (currentRound + 1 > maxRound) {
            roundDirection = 'down';
            currentRound--;
        } else {
            currentRound++;
        }
    } else {
        if (currentRound - 1 < 1) {
            roundDirection = 'up';
            currentRound++;
        } else {
            currentRound--;
        }
    }
    
    // Distribuir cartas
    const deck = createDeck();
    shuffleDeck(deck);
    
    alivePlayers.forEach(player => {
        player.hand = [];
        for (let i = 0; i < currentRound; i++) {
            if (deck.length > 0) player.hand.push(deck.pop());
        }
    });
    
    room.gameState = {
        ...room.gameState,
        round: currentRound,
        roundDirection: roundDirection,
        phase: 'betting',
        bettingPlayerIndex: 0,
        currentPlayerIndex: 0,
        tableCards: [],
        totalBetSum: 0,
        deck: deck
    };
    
    io.to(room.roomId).emit('new-round', {
        gameState: getPublicGameState(room),
        message: `Rodada ${currentRound}. Faça suas apostas.`
    });
    
    // Enviar cartas privadas
    players.forEach((player, index) => {
        if (player.lives > 0) {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
                playerSocket.emit('private-hand', {
                    hand: player.hand,
                    playerIndex: index,
                    isOneCardRound: currentRound === 1
                });
            }
        }
    });
}

function endGame(room) {
    const players = Array.from(room.players.values());
    const survivors = players.filter(p => p.lives > 0);
    
    let message;
    if (survivors.length === 0) {
        message = "Fim de jogo! Empate, todos foram eliminados.";
    } else if (survivors.length === 1) {
        message = `Fim de jogo! O grande vencedor é ${survivors[0].name}!`;
    } else {
        const winner = survivors.sort((a, b) => b.lives - a.lives)[0];
        message = `Fim de jogo! O vencedor é ${winner.name} com mais vidas!`;
    }
    
    io.to(room.roomId).emit('game-ended', {
        gameState: getPublicGameState(room),
        message: message,
        survivors: survivors.map(p => ({ name: p.name, lives: p.lives }))
    });
    
    // Reset da sala
    room.isGameStarted = false;
    room.gameState = null;
    players.forEach(p => {
        p.isReady = false;
        p.hand = [];
        p.lives = 5;
        p.tricksWon = 0;
        p.bet = null;
    });
}

function getPublicGameState(room) {
    const players = Array.from(room.players.values());
    return {
        round: room.gameState.round,
        phase: room.gameState.phase,
        currentPlayerIndex: room.gameState.currentPlayerIndex,
        bettingPlayerIndex: room.gameState.bettingPlayerIndex,
        tableCards: room.gameState.tableCards,
        players: players.map((p, index) => ({
            name: p.name,
            lives: p.lives,
            tricksWon: p.tricksWon,
            bet: p.bet,
            handSize: p.hand.length
        }))
    };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎮 Servidor FDP rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
