# Visão Geral do Projeto: Jogo de Vazante (Filha da Puta)

Este projeto implementa o jogo de cartas de vaza conhecido como "Filha da Puta" (ou "Vazante"). O objetivo é criar uma aplicação web interativa e fiel às regras, onde o objetivo final é ser o último jogador a manter suas "vidas".

## Funcionalidades e Design

*   **Nome da Interface:** Jogo de Vazante
*   **Baralho:** Baralho padrão de 40 cartas (remove-se as cartas 8, 9 e 10).
*   **Ordem das Cartas (Ranking):** A força das cartas segue a ordem do truco mineiro, com manilhas fixas.
*   **Jogadores:** Suporte para 2 a 8 jogadores.

### Regras do Jogo

*   **Sistema de Vidas:** Cada jogador começa o jogo com 5 vidas.
*   **Rodadas de Ida e Volta:** A contagem de cartas começa em 1, sobe até o máximo possível, desce até 1 novamente, e o ciclo se repete.
*   **Regra da Rodada de 1 Carta (Rodada Cega):** Em rodadas com apenas uma carta, a visibilidade é invertida. O jogador vê as cartas de todos os oponentes, mas a sua própria permanece virada para baixo.
*   **Apostas:** No início de cada rodada, os jogadores apostam quantas vazas acreditam que vão ganhar.
*   **Regra da Soma Proibida:** O último jogador a apostar não pode fazer uma aposta que faça com que a soma total das apostas seja igual ao número de vazas da rodada.
*   **Disputa da Vaza:** O jogador com a carta mais forte vence a vaza e começa a próxima.
*   **Regra de Empate (Garrar):** Se as cartas mais fortes da vaza forem duas ou mais cartas comuns de mesmo valor, elas se anulam. A carta mais forte entre as restantes vence.
*   **Cálculo de Vidas:** Ao final de cada rodada, o jogador perde um número de vidas igual à diferença absoluta entre sua aposta e as vazas ganhas (`| aposta - vazasGanhas |`).
*   **Condição de Vitória:** O último jogador com vidas restantes é o vencedor.

## Plano de Implementação (Histórico)

*   **Etapa 1:** Estrutura inicial e lógica de baralho.
*   **Etapa 2:** Implementação de rodadas, apostas e ciclo de vazas.
*   **Etapa 3:** Correções de bugs de interface.
*   **Etapa 4:** Implementação da regra de empate (garrar).
*   **Etapa 5:** Refatoração para o sistema de vidas.
*   **Etapa 6:** Implementação da progressão de rodadas de "ida e volta".
*   **Etapa 7 (Atual):** Implementação da regra da "rodada cega" (1 carta).
