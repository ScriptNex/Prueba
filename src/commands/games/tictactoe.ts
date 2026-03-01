import { styleText } from '../../utils/helpers.js';
import { Command, CommandContext } from '../../types/Command.js';

interface TTTGame {
    playerX: string;
    playerO: string;
    turn: 'X' | 'O';
    board: (string | null)[];
}

const tttGames = new Map<string, TTTGame>();

const command: Command = {
    commands: ['tictactoe', 'ttt', 'gato'],
    tags: ['game'],
    help: ['tictactoe @user'],
    async before(ctx: CommandContext) {
        const { chatId, sender, msg, dbService, body, isCmd, reply } = ctx;
        if (!tttGames.has(chatId) || isCmd) return;
        
        const game = tttGames.get(chatId)!;
        const msgAny: any = msg;
        let inputText = (body || msgAny.message?.conversation || msgAny.message?.extendedTextMessage?.text || '').trim();
        
        if (!/^[1-9]$/.test(inputText)) return;
        
        const normalizedSender = sender.replace('@lid', '@s.whatsapp.net');
        const normalizedPlayerX = game.playerX.replace('@lid', '@s.whatsapp.net');
        const normalizedPlayerO = game.playerO.replace('@lid', '@s.whatsapp.net');
        
        const isPlayerX = normalizedSender === normalizedPlayerX;
        const isPlayerO = normalizedSender === normalizedPlayerO;
        
        if (!isPlayerX && !isPlayerO) return;
        
        if ((isPlayerX && game.turn !== 'X') || (isPlayerO && game.turn !== 'O')) { 
            return await reply(styleText(`⏳ No es tu turno. Espera a que juegue ${game.turn === 'X' ? '❌' : '⭕'}`)); 
        }
        
        const pos = parseInt(inputText) - 1;
        if (game.board[pos] !== null) { 
            return await reply(styleText('❌ Esa casilla ya está ocupada. Elige otra (1-9)')); 
        }
        
        game.board[pos] = game.turn;
        const winner = checkWin(game.board);
        
        if (winner) {
            const winPlayer = winner === 'X' ? game.playerX : game.playerO;
            const reward = Math.floor(Math.random() * 2000) + 1000;
            const userData = dbService.getUser(winPlayer);
            dbService.updateUser(winPlayer, { 'economy.coins': (userData.economy?.coins || 0) + reward });
            tttGames.delete(chatId);
            return await reply(styleText(`${renderBoard(game.board)}\n\n🎉 *¡GANADOR!*\n${winner === 'X' ? '❌' : '⭕'} @${winPlayer.split('@')[0]} ganó el juego!\n💰 Ganaste *${reward}* coins`), { mentions: [winPlayer] });
        }
        
        if (game.board.every(cell => cell !== null)) {
            tttGames.delete(chatId);
            return await reply(styleText(`${renderBoard(game.board)}\n\n🤝 *¡EMPATE!*\nEl tablero está lleno. No hay ganador.`));
        }
        
        game.turn = game.turn === 'X' ? 'O' : 'X';
        const nextPlayer = game.turn === 'X' ? game.playerX : game.playerO;
        await reply(styleText(`${renderBoard(game.board)}\n\n${game.turn === 'O' ? '❌' : '⭕'} @${normalizedSender.split('@')[0]} jugó en ${inputText}\n${game.turn === 'X' ? '❌' : '⭕'} Turno de @${nextPlayer.split('@')[0]}`), { mentions: [normalizedSender, nextPlayer] });
        return true;
    },
    async execute(ctx: CommandContext) {
        const { chatId, sender, msg, reply } = ctx;
        const msgAny: any = msg;
        const mentioned = msgAny.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (tttGames.has(chatId)) return await reply(styleText('⚠️ Ya hay un juego en curso.'));
        if (!mentioned?.length) return await reply(styleText('⚠️ Etiqueta a alguien: #ttt @user'));
        
        const opponent = mentioned[0];
        if (opponent === sender) return await reply(styleText('🤔 No puedes jugar solo.'));
        
        tttGames.set(chatId, { playerX: sender, playerO: opponent, turn: 'X', board: Array(9).fill(null) });
        await reply(styleText(`🎮 *TIC TAC TOE*\n\n❌ @${sender.split('@')[0]} VS ⭕ @${opponent.split('@')[0]}\n\n${renderBoard(Array(9).fill(null))}\n\n▶️ Comienza: ❌ @${sender.split('@')[0]}`), { mentions: [sender, opponent] });
    }
};

function checkWin(board: (string | null)[]): string | null {
    const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, b, c] of wins) { 
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]; 
    }
    return null;
}

function renderBoard(b: (string | null)[]): string {
    const symbols: Record<string, string> = { 'X': '❌', 'O': '⭕' };
    const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    const cells = b.map((v, i) => v ? symbols[v] : numbers[i]);
    return `╔═══╦═══╦═══╗\n║ ${cells[0]} ║ ${cells[1]} ║ ${cells[2]} ║\n╠═══╬═══╬═══╣\n║ ${cells[3]} ║ ${cells[4]} ║ ${cells[5]} ║\n╠═══╬═══╬═══╣\n║ ${cells[6]} ║ ${cells[7]} ║ ${cells[8]} ║\n╚═══╩═══╩═══╝`.trim();
}

export default command;
