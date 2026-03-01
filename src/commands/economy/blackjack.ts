import { styleText, getCurrencyName } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

interface Card {
    suit: string;
    value: string;
}

interface BlackJackGame {
    bet: number;
    playerHand: Card[];
    dealerHand: Card[];
    startedAt: number;
}

const SUITS = ['♠️', '♥️', '♣️', '♦️'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function drawCard(): Card {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const value = VALUES[Math.floor(Math.random() * VALUES.length)];
    return { suit, value };
}

function calculateScore(hand: Card[]): number {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10;
        } else if (card.value === 'A') {
            aces += 1;
            score += 11;
        } else {
            score += parseInt(card.value);
        }
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
}

function formatHand(hand: Card[], hideFirst = false): string {
    if (hideFirst) {
        return `[🎴] ${hand.slice(1).map(c => `[${c.value}${c.suit}]`).join(' ')}`;
    }
    return hand.map(c => `[${c.value}${c.suit}]`).join(' ');
}

async function sendTable(ctx: CommandContext, game: BlackJackGame, showDealer = false) {
    const pScore = calculateScore(game.playerHand);
    let dScoreDisplay: string | number = '?';
    if (showDealer) {
        dScoreDisplay = calculateScore(game.dealerHand);
    }
    
    let text = `╭────── ೀ ──────╮\n`;
    text += `│ *BlackJack*\n`;
    text += `╰────────────────╯\n\n`;
    text += `› *Dealer* (${dScoreDisplay})\n`;
    text += `> ${formatHand(game.dealerHand, !showDealer)}\n\n`;
    text += `› *Tú* (${pScore})\n`;
    text += `> ${formatHand(game.playerHand)}\n\n`;
    text += `✧ *Apuesta* » ${game.bet.toLocaleString()}\n`;
    if (!showDealer) {
        text += `\n> *#bj hit* (Pedir) | *#bj stand* (Plantarse)`;
    }
    await ctx.reply(styleText(text));
}

async function finishGame(ctx: CommandContext, game: BlackJackGame, result: string, message: string) {
    const { bet } = game;
    let winnings = 0;
    const currencyName = await getCurrencyName(ctx);
    
    if (result === 'blackjack') winnings = Math.floor(bet * 2.5);
    else if (result === 'win') winnings = bet * 2;
    else if (result === 'tie') winnings = bet;
    
    if (winnings > 0) {
        const user = await ctx.dbService.getUser(ctx.sender);
        const newBalance = (user.economy?.coins || 0) + winnings;
        await ctx.dbService.updateUser(ctx.sender, { 'economy.coins': newBalance });
    }
    
    let finalMsg = `\n╭────────────────╮\n`;
    finalMsg += `│ ${message}\n`;
    if (winnings > 0) finalMsg += `│ 💰 +${winnings.toLocaleString()} ${currencyName}\n`;
    if (result === 'lose') finalMsg += `│ › Pierdes ${bet.toLocaleString()} ${currencyName}\n`;
    finalMsg += `╰────────────────╯`;
    await ctx.reply(styleText(finalMsg));
}

async function dealerTurn(ctx: CommandContext, game: BlackJackGame) {
    let dScore = calculateScore(game.dealerHand);
    while (dScore < 17) {
        game.dealerHand.push(drawCard());
        dScore = calculateScore(game.dealerHand);
    }
    const pScore = calculateScore(game.playerHand);
    let result = '';
    let message = '';
    
    if (dScore > 21) {
        result = 'win';
        message = 'ꕣ ¡El dealer se pasó! Ganas.';
    } else if (pScore > dScore) {
        result = 'win';
        message = 'ꕣ ¡Tienes mejor mano! Ganas.';
    } else if (dScore > pScore) {
        result = 'lose';
        message = 'ꕢ El dealer gana.';
    } else {
        result = 'tie';
        message = 'ꕢ Empate. Recuperas tu apuesta.';
    }
    
    await sendTable(ctx, game, true);
    await finishGame(ctx, game, result, message);
    (ctx as any).cacheManager.delete(`bj_${ctx.sender}`);
}

const command: Command = {
    commands: ['blackjack', 'bj', '21'],
    async execute(ctx: CommandContext) {
        const { args, dbService } = ctx;
        const cacheManager = (ctx as any).cacheManager;
        const sender = ctx.sender;
        const gameKey = `bj_${sender}`;
        
        let game = cacheManager.get(gameKey) as BlackJackGame | undefined;
        
        if (game) {
            const action = args[0]?.toLowerCase();
            if (['hit', 'pedir', 'h'].includes(action)) {
                const card = drawCard();
                game.playerHand.push(card);
                const score = calculateScore(game.playerHand);
                if (score > 21) {
                    await sendTable(ctx, game, true);
                    await finishGame(ctx, game, 'lose', 'ꕢ ¡Te pasaste de 21!');
                    cacheManager.delete(gameKey);
                    return;
                } else if (score === 21) {
                    cacheManager.set(gameKey, game);
                    await sendTable(ctx, game, false);
                    await ctx.reply(styleText('✨ ¡Llegaste a 21! Turno del dealer...'));
                    await dealerTurn(ctx, game);
                    return;
                }
                cacheManager.set(gameKey, game);
                return await sendTable(ctx, game, false);
            } else if (['stand', 'plantarse', 's'].includes(action)) {
                await dealerTurn(ctx, game);
                return;
            } else {
                return await ctx.reply(styleText(
                    `╭──────  ೀ ──────╮\n` +
                    `│ *Juego en curso*\n` +
                    `╰────────────────╯\n` +
                    `> Usa *#bj hit* para pedir carta.\n` +
                    `> Usa *#bj stand* para plantarte.`
                ));
            }
        }

        const bet = parseInt(args[0]);
        if (!bet || isNaN(bet) || bet <= 0) {
            return await ctx.reply(styleText(`ꕢ Uso: *#bj <apuesta>*`));
        }

        const user = await dbService.getUser(sender);
        const currencyName = await getCurrencyName(ctx);
        const currentCoins = user.economy?.coins || 0;
        
        if (currentCoins < bet) {
            return await ctx.reply(styleText(`ꕢ No tienes suficientes ${currencyName}.`));
        }

        await dbService.updateUser(sender, { 'economy.coins': currentCoins - bet });
        
        const playerHand = [drawCard(), drawCard()];
        const dealerHand = [drawCard(), drawCard()];
        
        const newGame: BlackJackGame = {
            bet,
            playerHand,
            dealerHand,
            startedAt: Date.now()
        };

        const playerScore = calculateScore(playerHand);
        const dealerScore = calculateScore(dealerHand);

        if (playerScore === 21 && dealerScore === 21) {
            await sendTable(ctx, newGame, true);
            await finishGame(ctx, newGame, 'tie', 'ꕢ Ambos tienen Blackjack. Empate.');
            return;
        } else if (playerScore === 21) {
            await sendTable(ctx, newGame, true);
            await finishGame(ctx, newGame, 'blackjack', 'ꕢ ¡BLACKJACK NATURAL!');
            return;
        } else if (dealerScore === 21) {
            await sendTable(ctx, newGame, true);
            await finishGame(ctx, newGame, 'lose', 'ꕢ El dealer tiene Blackjack.');
            return;
        } else {
            cacheManager.set(gameKey, newGame, 120);
            await sendTable(ctx, newGame, false);
        }
    }
};

export default command;
