document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES --- 
    const SUITS = ['Paus', 'Copas', 'Espadas', 'Ouros'];
    const VALUES = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
    const STARTING_LIVES = 5;
    const TOTAL_CARDS = 40;
    const CARD_STRENGTH = {
        '4 de Paus': 14, '7 de Copas': 13, 'A de Espadas': 12, '7 de Ouros': 11,
        '3': 10, '2': 9, 'A': 8, 'K': 7, 'J': 6, 'Q': 5, '7': 4, '6': 3, '5': 2, '4': 1,
    };

    // --- ELEMENTOS DO DOM ---
    const gameBoard = document.getElementById('game-board');
    const playerCountSelect = document.getElementById('player-count');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameMessage = document.getElementById('game-message');
    const bettingControls = document.getElementById('betting-controls');
    const bettingOptions = document.getElementById('betting-options');
    const bettingInfo = document.getElementById('betting-info');
    const tableCardsContainer = document.getElementById('table-cards-container');

    // --- ESTADO DO JOGO ---
    let gameState = {};

    // --- FUNÇÕES DE LÓGICA DO JOGO ---
    const getCardId = card => `${card.value}-${card.suit}`;
    const getCardStrength = card => CARD_STRENGTH[`${card.value} de ${card.suit}`] || CARD_STRENGTH[card.value] || 0;

    function createDeck() {
        return SUITS.flatMap(suit => VALUES.map(value => ({ value, suit, id: getCardId({value, suit}) })));
    }

    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function nextRound() {
        const numPlayers = parseInt(playerCountSelect.value, 10);
        const isNewGame = !gameState.round || !gameState.players;

        if (!isNewGame && gameState.players.filter(p => p.lives > 0).length <= 1) {
            endGame();
            return;
        }

        let currentRound;
        let roundDirection = gameState.roundDirection || 'up';
        const maxRound = Math.floor(TOTAL_CARDS / numPlayers);

        if (isNewGame) {
            currentRound = 1;
            roundDirection = 'up';
        } else {
            currentRound = gameState.round;
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
        }
        
        const roundStarter = isNewGame ? 0 : (gameState.roundWinner || 0);

        const players = isNewGame 
            ? Array(numPlayers).fill(null).map(() => ({ hand: [], lives: STARTING_LIVES, tricksWon: 0, bet: null }))
            : gameState.players.map(p => ({ ...p, hand: [], tricksWon: 0, bet: null }));

        const deck = createDeck();
        shuffleDeck(deck);
        players.filter(p => p.lives > 0).forEach(player => {
            for (let i = 0; i < currentRound; i++) {
                if(deck.length > 0) player.hand.push(deck.pop());
            }
        });

        gameState = {
            ...gameState,
            round: currentRound,
            roundDirection: roundDirection,
            trick: 1,
            players,
            deck,
            phase: 'betting',
            roundStarter: roundStarter,
            bettingPlayerIndex: roundStarter,
            currentPlayerIndex: roundStarter, 
            trickStarter: roundStarter,
            tableCards: [],
            totalBetSum: 0,
        };

        playerCountSelect.disabled = true;
        startGameBtn.disabled = true;
        startGameBtn.textContent = '...';
        startBettingPhase();
    }

    function startBettingPhase() {
        setMessage(`Rodada ${gameState.round}. Faça sua aposta.`);
        processNextBet();
    }

    function processNextBet() {
        render(); 
        const activePlayers = gameState.players.filter(p => p.lives > 0);
        const numBetsMade = activePlayers.filter(p => p.bet !== null).length;

        if (numBetsMade === activePlayers.length) {
            startTrickPhase();
            return;
        }

        const playerIndex = gameState.bettingPlayerIndex;
        if (gameState.players[playerIndex].lives <= 0) {
            gameState.bettingPlayerIndex = (playerIndex + 1) % gameState.players.length;
            processNextBet();
            return;
        }

        if (playerIndex === 0) {
            showPlayerBettingControls();
        } else {
            hidePlayerBettingControls();
            setTimeout(() => {
                const botBet = getBotBet(playerIndex);
                registerBet(botBet);
            }, 1000);
        }
    }

    function getBotBet(playerIndex) {
        const hand = gameState.players[playerIndex].hand;
        const activePlayers = gameState.players.filter(p => p.lives > 0);
        const numBetsMade = activePlayers.filter(p => p.bet !== null).length;
        let bet = hand.filter(c => getCardStrength(c) >= 11).length;
        
        if (numBetsMade === activePlayers.length - 1) {
            const forbiddenBet = gameState.round - gameState.totalBetSum;
            if (bet === forbiddenBet) bet = (bet + 1) % (gameState.round + 1);
        }
        return bet;
    }

    function registerBet(bet) {
        const playerIndex = gameState.bettingPlayerIndex;
        gameState.players[playerIndex].bet = bet;
        gameState.totalBetSum += bet;

        gameState.bettingPlayerIndex = (playerIndex + 1) % gameState.players.length;
        processNextBet();
    }

    function startTrickPhase() {
        hidePlayerBettingControls();
        gameState.phase = 'playing';
        gameState.currentPlayerIndex = gameState.trickStarter;
        playTrick();
    }

    function playTrick() {
        const activePlayers = gameState.players.filter(p => p.lives > 0);
        if (gameState.tableCards.length === activePlayers.length) {
            endTrick();
            return;
        }
        
        const playerIndex = gameState.currentPlayerIndex;
        if(gameState.players[playerIndex].lives <= 0) {
             gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
             playTrick();
             return;
        }

        setMessage(`Vez do Jogador ${playerIndex + 1} jogar uma carta.`);
        render(); 

        if (playerIndex !== 0) {
            setTimeout(() => {
                const botHand = gameState.players[playerIndex].hand;
                const cardToPlay = botHand.length > 0 
                    ? botHand.reduce((weakest, c) => getCardStrength(c) < getCardStrength(weakest) ? c : weakest, botHand[0])
                    : null;
                if(cardToPlay) playCard(playerIndex, cardToPlay.id);
            }, 1500);
        }
    }

    function playCard(playerIndex, cardId) {
        if (playerIndex !== gameState.currentPlayerIndex) return;

        const player = gameState.players[playerIndex];
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const card = player.hand.splice(cardIndex, 1)[0];
        gameState.tableCards.push({ card, playerIndex });

        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        playTrick();
    }

    function findTrickWinner(cardsInPlay) {
        if (cardsInPlay.length === 0) return null;

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

    function endTrick() {
        const winningCardInfo = findTrickWinner(gameState.tableCards);
    
        if (winningCardInfo) {
            const trickWinnerIndex = winningCardInfo.playerIndex;
            gameState.players[trickWinnerIndex].tricksWon++;
            gameState.roundWinner = trickWinnerIndex;
            gameState.currentPlayerIndex = trickWinnerIndex;
            gameState.trickStarter = trickWinnerIndex;
            setMessage(`Jogador ${trickWinnerIndex + 1} venceu a Rodada!`);
        } else {
            gameState.currentPlayerIndex = gameState.trickStarter;
            setMessage("Rodada completamente empatada! Ninguém leva.");
        }

        render();

        setTimeout(() => {
            gameState.tableCards = [];
            const handsRemaining = gameState.players.filter(p=> p.lives > 0).some(p => p.hand.length > 0);
            if (handsRemaining) {
                gameState.trick++;
                playTrick();
            } else {
                endRound();
            }
        }, 2500);
    }

    function endRound() {
        let roundSummary = "Fim da rodada! Vidas perdidas:<br>";
        gameState.players.forEach((p, index) => {
            if (p.lives > 0) {
                const diff = Math.abs(p.bet - p.tricksWon);
                p.lives -= diff;
                roundSummary += `Jogador ${index + 1}: ${diff} | `;
            }
        });
        
        setMessage(roundSummary.slice(0, -2));
        
        const activePlayers = gameState.players.filter(p => p.lives > 0);
        if (activePlayers.length <= 1) {
            setTimeout(endGame, 3000);
        } else {
            startGameBtn.textContent = 'Próxima Rodada';
            startGameBtn.disabled = false;
            render();
        }
    }

    function endGame() {
        const survivors = gameState.players?.filter(p => p.lives > 0);

        if (!survivors || survivors.length === 0) {
            setMessage("Fim de jogo! Empate, todos foram eliminados.");
        } else if (survivors.length === 1) {
            const winnerIndex = gameState.players.indexOf(survivors[0]) + 1;
            setMessage(`Fim de jogo! O grande vencedor é o Jogador ${winnerIndex}!`);
        } else {
            const winnerByLives = survivors.sort((a,b) => b.lives - a.lives)[0];
            const winnerIndex = gameState.players.indexOf(winnerByLives) + 1;
            setMessage(`Fim de jogo! O vencedor é o Jogador ${winnerIndex} com mais vidas!`);
        }
        
        startGameBtn.textContent = 'Jogar Novamente';
        startGameBtn.disabled = false;
        playerCountSelect.disabled = false;
        render();
    }

    function initializeGame() {
        setMessage('Bem-vindo ao Filho da Puta! Escolha o número de jogadores e inicie o jogo.');
        startGameBtn.textContent = 'Iniciar Jogo';
        startGameBtn.disabled = false;
        playerCountSelect.disabled = false;
        gameState = {};
        hidePlayerBettingControls();
        render();
    }

    function render() {
        if (!gameState.players) {
            gameBoard.innerHTML = '';
            tableCardsContainer.innerHTML = '';
            return;
        }

        tableCardsContainer.innerHTML = '';
        gameState.tableCards.forEach(played => {
            tableCardsContainer.appendChild(createCardElement(played.card, true, false, -1));
        });

        gameBoard.innerHTML = '';
        gameState.players.forEach((player, index) => {
            const playerArea = document.createElement('div');
            const isActive = (gameState.phase === 'playing' && gameState.currentPlayerIndex === index) || (gameState.phase === 'betting' && gameState.bettingPlayerIndex === index);
            playerArea.className = `player-area ${isActive ? 'active-player' : ''} ${player.lives <= 0 ? 'eliminated' : ''}`;
            
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            const betText = player.bet !== null ? `Aposta: ${player.bet}` : (gameState.phase === 'betting' && player.lives > 0 ? 'Apostando...' : '-');
            const tricksText = `Pontos: ${player.tricksWon}`;
            const livesText = `<span class="lives">${player.lives}</span>`;
            playerInfo.innerHTML = `<h3>Jogador ${index + 1}</h3><div class="player-stats"><span>${betText}</span> | <span>${tricksText}</span> | ${livesText}</div>`;

            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';

            if (player.lives > 0) {
                player.hand.forEach(card => {
                    const cardElement = createCardElement(card, index === 0, true, index);
                    cardContainer.appendChild(cardElement);
                });
            } else {
                 cardContainer.innerHTML = '<div class="eliminated-text">ELIMINADO</div>';
            }

            playerArea.appendChild(playerInfo);
            playerArea.appendChild(cardContainer);
            gameBoard.appendChild(playerArea);
        });
    }

    function createCardElement(card, isPlayer, isHand, playerIndex) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.cardId = card.id;

        const isOneCardRound = gameState.round === 1;
        let isVisible = isPlayer;
        if (isOneCardRound && isHand) {
            isVisible = !isPlayer; // Inverte a lógica: vê os outros, não a si mesmo
        }

        if (isVisible) cardElement.classList.add('flipped');
        
        const isPlayerTurn = gameState.phase === 'playing' && gameState.currentPlayerIndex === playerIndex;
        if (isHand && isPlayerTurn) {
            cardElement.classList.add('playable');
            cardElement.onclick = () => playCard(playerIndex, card.id);
        }

        const suitInfo = getSuitSymbol(card.suit);
        cardElement.innerHTML = `
            <div class="card-face card-back"></div>
            <div class="card-face card-front">
                <div class="card-value">${card.value}</div>
                <div class="card-suit ${suitInfo.color}">${suitInfo.symbol}</div>
            </div>
        `;
        return cardElement;
    }

    function getSuitSymbol(suit) {
        const symbols = { Paus: '♣', Copas: '♥', Espadas: '♠', Ouros: '♦' };
        const colors = { Copas: 'red', Ouros: 'red', Paus: 'black', Espadas: 'black' };
        return { symbol: symbols[suit] || '', color: colors[suit] || 'black' };
    }

    function showPlayerBettingControls() {
        bettingControls.classList.remove('hidden');
        bettingOptions.innerHTML = '';
        const activePlayers = gameState.players.filter(p => p.lives > 0);
        const numBetsMade = activePlayers.filter(p => p.bet !== null).length;
        const isLastToBet = numBetsMade === activePlayers.length - 1;
        
        const totalBetSumOfActivePlayers = gameState.players.reduce((sum, p) => p.bet !== null ? sum + p.bet : sum, 0);
        const forbiddenBet = isLastToBet ? gameState.round - totalBetSumOfActivePlayers : -1;

        for (let i = 0; i <= gameState.round; i++) {
            const btn = document.createElement('button');
            btn.className = 'bet-btn';
            btn.textContent = i;
            btn.dataset.bet = i;
            if (i === forbiddenBet) btn.disabled = true;
            btn.onclick = () => registerBet(i);
            bettingOptions.appendChild(btn);
        }
        bettingInfo.textContent = isLastToBet && forbiddenBet !== -1 ? `A soma das apostas não pode ser ${gameState.round}.` : '';
    }

    function hidePlayerBettingControls() { bettingControls.classList.add('hidden'); }
    function setMessage(msg) { gameMessage.innerHTML = msg; gameMessage.classList.remove('hidden'); }

    startGameBtn.addEventListener('click', () => {
        const action = startGameBtn.textContent;
        if (action === 'Jogar Novamente') {
            initializeGame();
        } else {
            nextRound();
        }
    });
    
    initializeGame();
});
