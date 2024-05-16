const Player = require('../Player');

describe('Player class', () => {
    test('should create a Player instance with the given username and socketId', () => {
        const username = 'player1';
        const socketId = 'socket1';
        
        const player = new Player(username, socketId);
        
        expect(player.username).toBe(username);
        expect(player.socketId).toBe(socketId);
        expect(player.isOwner).toBe(false);
        expect(player.currentPieceIndex).toBe(0);
        expect(player.currentPiece).toBeNull();
        expect(player.score).toBe(0);
        expect(player.dropped).toBe(false);
        expect(player.fall).toBe(false);
        expect(player.updateInterval).toBeNull();
    });
});
