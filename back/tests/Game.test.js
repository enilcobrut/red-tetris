const fs = require('fs');
const path = require('path');
const Game = require('../Game');
const Player = require('../Player');
const Piece = require('../Piece');
const {
    readJsonFile,
    writeJsonFile,
    PERSONAL_BEST_FILE,
    LEADERBOARD_FILE,
    STAT_FILE
} = require('../JsonHandlers');

console.log = jest.fn(); // Suppress console.log
jest.useFakeTimers();

// Mock the fs methods
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn()
}));

jest.mock('../Player', () => {
    return jest.fn().mockImplementation((username, socketId) => {
        return { 
            username, 
            socketId, 
            isOwner: false, 
            score: 0, 
            dropInterval: 0 // Add dropInterval property here
        }; 
    });
});

jest.mock('../Piece', () => {
    return {
        createFromTemplate: jest.fn((template) => ({
            ...template,
            shape: [[1, 1], [1, 1]], // Provide a valid default shape
            position: { x: 0, y: 0 },
            color: 'red'
        }))
    };
});

describe('Game class', () => {
    let game;
    const mockRoomName = 'testRoom';
    const mockOnDelete = jest.fn();

    beforeEach(() => {
        game = new Game(mockRoomName, mockOnDelete);
        jest.clearAllMocks();
    });

    test('constructor initializes properties correctly', () => {
        expect(game.roomName).toBe(mockRoomName);
        expect(game.players).toEqual([]);
        expect(game.owner).toBeNull();
        expect(game.pieceQueue).toEqual([]);
        expect(game.grids.size).toBe(0);
        expect(game.cols).toBe(10);
        expect(game.rows).toBe(20);
        expect(game.currentPieces.size).toBe(0);
        expect(game.onDelete).toBe(mockOnDelete);
    });

    test('generatePieces creates pieces correctly', () => {
        const count = 1000;
        game.generatePieces(count);
        expect(game.pieceQueue.length).toBe(count);
    });

    test('valid placement down', () => {
        const grid = [
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }]
        ];
        const shape = [
            [1, 1],
            [1, 0]
        ];
        const position = { x: 1, y: 1 };
        const direction = 'down';

        expect(game.isValidPlacement(grid, shape, position, direction)).toBe(true);
    });

    test('invalid placement down - out of bounds', () => {
        const grid = [
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }]
        ];
        const shape = [
            [1, 1],
            [1, 0]
        ];
        const position = { x: 2, y: 2 };
        const direction = 'down';

        expect(game.isValidPlacement(grid, shape, position, direction)).toBe(false);
    });

    test('invalid placement down - collision', () => {
        const grid = [
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: true }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }]
        ];
        const shape = [
            [1, 1],
            [1, 0]
        ];
        const position = { x: 1, y: 0 };
        const direction = 'down';

        expect(game.isValidPlacement(grid, shape, position, direction)).toBe(false);
    });

    test('valid placement left', () => {
        const grid = [
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }]
        ];
        const shape = [
            [1, 1],
            [0, 1]
        ];
        const position = { x: 1, y: 1 };
        const direction = 'left';

        expect(game.isValidPlacement(grid, shape, position, direction)).toBe(true);
    });

    test('valid placement right', () => {
        const grid = [
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }]
        ];
        const shape = [
            [1, 1],
            [1, 0]
        ];
        const position = { x: 0, y: 1 };
        const direction = 'right';

        expect(game.isValidPlacement(grid, shape, position, direction)).toBe(true);
    });

    test('invalid placement right - out of bounds', () => {
        const grid = [
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }],
            [{ filled: false }, { filled: false }, { filled: false }]
        ];
        const shape = [
            [1, 1],
            [1, 0]
        ];
        const position = { x: 2, y: 1 };
        const direction = 'right';

        expect(game.isValidPlacement(grid, shape, position, direction)).toBe(false);
    });

    test('rotateMatrix rotates matrix correctly', () => {
        const matrix = [[1, 0], [1, 1]];
        const expectedClockwise = [[1, 1], [1, 0]];
        const expectedCounterClockwise = [[0, 1], [1, 1]];

        expect(game.rotateMatrix(matrix, true)).toEqual(expectedClockwise);
        expect(game.rotateMatrix(matrix, false)).toEqual(expectedCounterClockwise);
    });

    test('createEmptyGrid returns correct grid', () => {
        const grid = game.createEmptyGrid();
        expect(grid.length).toBe(20);
        expect(grid[0].length).toBe(10);
        expect(grid[0][0]).toEqual({ filled: false, color: 'transparent', indestructible: false });
    });

    test('getGridData returns correct data', () => {
        const player = { socketId: 'testSocketId' };
        game.players.push(player);
        game.grids.set(player.socketId, game.createEmptyGrid());

        const gridData = game.getGridData();
        expect(gridData[player.socketId]).toBeDefined();
        expect(gridData[player.socketId].length).toBe(20);
    });

    test('updateGrid updates grid correctly', () => {
        const grid = game.createEmptyGrid();
        const piece = { shape: [[1, 1], [1, 0]], color: 'red', position: { x: 0, y: 0 } };
        const newPosition = { x: 1, y: 1 };

        game.updateGrid(grid, piece, newPosition);

        expect(grid[1][1].filled).toBe(true);
        expect(grid[1][1].color).toBe('red');
    });

    test('findPlayer returns the correct player', () => {
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);

        const foundPlayer = game.findPlayer('testUser');
        expect(foundPlayer).toBe(player);
    });

    test('addPlayer adds a player correctly', () => {
        const username = 'testUser';
        const socketId = 'testSocketId';
        game.addPlayer(username, socketId, true);

        expect(game.players.length).toBe(1);
        expect(game.players[0].username).toBe(username);
        expect(game.players[0].socketId).toBe(socketId);
        expect(game.owner.username).toBe(username);
    });

    test('redirectGame emits correct event', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);
        game.owner = player;
    
        game.redirectGame(io);
    
        expect(io.to).toHaveBeenCalledWith(mockRoomName);
        expect(io.emit).toHaveBeenCalledWith('redirect_game', {
            room: mockRoomName,
            url: `/${mockRoomName}/${player.username}`
        });
    });
    
    test('startGame initializes game correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);

        game.startGame(io);

        expect(game.grids.size).toBe(1);
        expect(game.currentPieces.size).toBe(1);
    });

    test('startPlayerInterval sets interval correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');

        game.startPlayerInterval(io, player);

        expect(player.updateInterval).toBeDefined();
        clearInterval(player.updateInterval);
    });

    test('movePieceDownForPlayer moves piece correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        const piece = { shape: [[1, 1], [1, 0]], color: 'red', position: { x: 0, y: 0 } };
        game.players.push(player);
        game.grids.set(player.socketId, game.createEmptyGrid());
        game.currentPieces.set(player.socketId, piece);

        game.movePieceDownForPlayer(io, player);

        expect(io.to).toHaveBeenCalledWith(player.socketId);
        expect(io.emit).toHaveBeenCalledWith('grid_update', expect.any(Object));
    });

    test('isValidPlacement returns correct result', () => {
        const grid = game.createEmptyGrid();
        const shape = [[1, 1], [1, 0]];
        const position = { x: 0, y: 0 };

        expect(game.isValidPlacement(grid, shape, position)).toBe(true);

        position.y = 19;
        expect(game.isValidPlacement(grid, shape, position)).toBe(false);
    });

    test('clearFullLines clears lines and updates score correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const grid = game.createEmptyGrid();
        grid[0].fill({ filled: true, color: 'red' });
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);
        game.grids.set(player.socketId, grid);
    
        game.clearFullLines(io, grid, player);
    
        expect(grid[0].every(cell => !cell.filled)).toBe(true);
        expect(player.score).toBe(100);
    });

    test('sendPenaltyLines adds penalties to pendingPenalties', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player1 = new Player('player1', 'socket1');
        const player2 = new Player('player2', 'socket2');
        game.players.push(player1, player2);
    
        game.sendPenaltyLines(io, player1, 2);
    
        expect(game.pendingPenalties.get('socket2')).toBe(2);
    });

    test('applyPendingPenalties correctly applies penalties', () => {
        const grid = game.createEmptyGrid();
        const socketId = 'testSocketId';
        game.pendingPenalties.set(socketId, 2);
    
        game.applyPendingPenalties(grid, socketId);
    
        expect(grid[18].every(cell => cell.filled && cell.indestructible)).toBe(true);
        expect(grid[19].every(cell => cell.filled && cell.indestructible)).toBe(true);
        expect(game.pendingPenalties.get(socketId)).toBe(0);
    });
    
    test('movePlayerPieceLeft moves piece correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        const piece = { shape: [[1, 1], [1, 0]], color: 'red', position: { x: 1, y: 0 } };
        game.players.push(player);
        game.grids.set(player.socketId, game.createEmptyGrid());
        game.currentPieces.set(player.socketId, piece);

        game.movePlayerPieceLeft(io, player.socketId);

        expect(game.currentPieces.get(player.socketId).position.x).toBe(0);
    });

    test('movePlayerPieceRight moves piece correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        const piece = { shape: [[1, 1], [1, 0]], color: 'red', position: { x: 0, y: 0 } };
        game.players.push(player);
        game.grids.set(player.socketId, game.createEmptyGrid());
        game.currentPieces.set(player.socketId, piece);

        game.movePlayerPieceRight(io, player.socketId);

        expect(game.currentPieces.get(player.socketId).position.x).toBe(1);
    });

    test('fall and stopFall correctly adjust the update interval', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);

        game.fall(io, player.socketId);
        expect(player.updateInterval).toBeDefined();

        game.stopFall(io, player.socketId);
        expect(player.updateInterval).toBeDefined();
    });

    test('dropPiece drops piece correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        const piece = { shape: [[1, 1], [1, 0]], color: 'red', position: { x: 0, y: 0 } };
        game.players.push(player);
        game.grids.set(player.socketId, game.createEmptyGrid());
        game.currentPieces.set(player.socketId, piece);
    
        game.generatePieces(1); // Ensure there is a piece to get
    
        const initialPiece = game.getNextPiece(player); // Get the initial piece
    
        // Set the initial piece to ensure there's a piece to drop
        game.currentPieces.set(player.socketId, initialPiece);
    
        game.dropPiece(io, player.socketId);
    
        expect(io.to).toHaveBeenCalledWith(player.socketId);
        expect(io.emit).toHaveBeenCalledWith('grid_update', expect.any(Object));
    });    

    test('removePlayer removes player correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);
        game.originalPlayerCount = 1; // Ensure this is set for the test
    
        // Mock the methods
        game.updatePersonalBest = jest.fn();
        game.updateLeaderboard = jest.fn();
        game.updateStatistics = jest.fn();
    
        game.removePlayer(io, player.socketId);
    
        expect(game.players.length).toBe(0);
        expect(game.grids.size).toBe(0);
        expect(game.currentPieces.size).toBe(0); // Ensure currentPieces is also cleared
        expect(game.updatePersonalBest).toHaveBeenCalledWith(player.username, player.score);
        expect(game.updateLeaderboard).toHaveBeenCalledWith(player.username, player.score);
        expect(game.updateStatistics).toHaveBeenCalledWith(player.username, false, false, 0, 0, true);
        expect(io.to).toHaveBeenCalledWith(player.socketId); // Ensure 'game_over' event is emitted
        expect(io.emit).toHaveBeenCalledWith('game_over', { isWinner: false, score: player.score });
    });    
    
    test('broadcastGridUpdate emits correct event', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);
        game.grids.set(player.socketId, game.createEmptyGrid());

        game.broadcastGridUpdate(io, player.socketId);

        expect(io.to).toHaveBeenCalledWith(player.socketId);
        expect(io.emit).toHaveBeenCalledWith('grid_update', expect.any(Object));
    });

    test('dropPiece drops piece correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        const piece = { shape: [[1, 1], [1, 0]], color: 'red', position: { x: 0, y: 0 } };
        game.players.push(player);
        game.grids.set(player.socketId, game.createEmptyGrid());
        game.currentPieces.set(player.socketId, piece);
    
        game.generatePieces(1); // Ensure there is a piece to get
    
        const initialPiece = game.getNextPiece(player); // Get the initial piece
    
        // Set the initial piece to ensure there's a piece to drop
        game.currentPieces.set(player.socketId, initialPiece);
    
        game.dropPiece(io, player.socketId);
    
        expect(io.to).toHaveBeenCalledWith(player.socketId);
        expect(io.emit).toHaveBeenCalledWith('grid_update', expect.any(Object));
    });
    
    test('getNextPiece returns the correct piece', () => {
        game.generatePieces(1); // Ensure there is at least one piece generated
        const player = new Player('testUser', 'testSocketId');
        player.currentPieceIndex = 0;
        game.players.push(player);
    
        const piece = game.getNextPiece(player);
    
        expect(piece).toBeDefined();
        expect(player.currentPieceIndex).toBe(1);
    });

    test('getRoomData returns correct room data', () => {
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);
        game.owner = player;

        const roomData = game.getRoomData();

        expect(roomData.roomName).toBe(mockRoomName);
        expect(roomData.players.length).toBe(1);
        expect(roomData.owner).toBe(player.username);
    });

    test('handleDisconnect handles disconnection correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);

        const result = game.handleDisconnect(io, player.socketId);

        expect(result).toBe(true);
        expect(io.to).toHaveBeenCalledWith(player.socketId);
        expect(io.emit).toHaveBeenCalledWith('game_over', expect.any(Object));
        expect(game.players.length).toBe(0);
    });

    test('checkSommet updates spectrum correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const socketId = 'testSocketId';
        const player = new Player('testUser', socketId);
        game.players.push(player);
        const grid = game.createEmptyGrid();

        // Fill some cells in the grid to create a spectrum
        grid[18][0].filled = true;
        grid[17][1].filled = true;
        grid[16][2].filled = true;
        grid[15][3].filled = true;

        game.grids.set(socketId, grid);

        game.checkSommet(io, grid, player);

        const spectrumGrid = game.createEmptyGrid();
        for (let row = 15; row < game.rows; row++) {
            spectrumGrid[row][0] = { filled: true, color: 'gray', indestructible: false };
            spectrumGrid[row][1] = { filled: true, color: 'gray', indestructible: false };
            spectrumGrid[row][2] = { filled: true, color: 'gray', indestructible: false };
            spectrumGrid[row][3] = { filled: true, color: 'gray', indestructible: false };
        }

        expect(io.to).toHaveBeenCalledWith(game.roomName);
    });

    test('handlePieceLanding handles piece landing correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const player = new Player('testUser', 'testSocketId');
        const grid = game.createEmptyGrid();
    
        // Simulate a piece landing
        grid[19].fill({ filled: true, color: 'red' });
    
        game.players.push(player);
        game.grids.set(player.socketId, grid);
        game.currentPieces.set(player.socketId, {
            shape: [[1, 1], [1, 0]],
            color: 'red',
            position: { x: 0, y: 18 }
        });
    
        // Mock methods to observe their calls
        game.clearFullLines = jest.fn();
        game.checkSommet = jest.fn();
        game.getNextPiece = jest.fn(() => ({
            shape: [[1, 1], [1, 0]],
            color: 'red',
            position: { x: 0, y: 0 }
        }));
        game.isValidPlacement = jest.fn(() => true);
        game.applyPendingPenalties = jest.fn();
        game.updateGrid = jest.fn();
        game.broadcastGridUpdate = jest.fn();
        game.removePlayer = jest.fn();
    
        // Call the method
        game.handlePieceLanding(io, grid, player);
    
        // Assert that the methods were called correctly
        expect(game.clearFullLines).toHaveBeenCalledWith(io, grid, player);
        expect(game.checkSommet).toHaveBeenCalledWith(io, grid, player);
        expect(game.getNextPiece).toHaveBeenCalledWith(player);
        expect(game.isValidPlacement).toHaveBeenCalledWith(grid, expect.any(Array), { x: 0, y: 0 });
        expect(game.applyPendingPenalties).toHaveBeenCalledWith(grid, player.socketId);
        expect(game.updateGrid).toHaveBeenCalledWith(grid, expect.any(Object), { x: 0, y: 0 });
        expect(game.broadcastGridUpdate).toHaveBeenCalledWith(io, player.socketId);
    
        // Assert that game over is not called in this scenario
        expect(io.to).not.toHaveBeenCalledWith(player.socketId, 'game_over');
        expect(game.removePlayer).not.toHaveBeenCalled();
    });    

    test('updatePersonalBest updates the personal best correctly', () => {
        const mockData = [
            { username: 'testUser', scores: [200, 150, 100] }
        ];
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
        fs.writeFileSync.mockResolvedValueOnce();

        game.updatePersonalBest('testUser', 250);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            PERSONAL_BEST_FILE,
            JSON.stringify([
                { username: 'testUser', scores: [250, 200, 150, 100] }
            ], null, 2),
            'utf8'
        );
    });

    test('updateLeaderboard updates the leaderboard correctly', () => {
        const mockData = [
            { username: 'testUser1', score: 200 },
            { username: 'testUser2', score: 150 }
        ];
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
        fs.writeFileSync.mockResolvedValueOnce();

        game.updateLeaderboard('testUser', 250);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            LEADERBOARD_FILE,
            JSON.stringify([
                { username: 'testUser', score: 250 },
                { username: 'testUser1', score: 200 },
                { username: 'testUser2', score: 150 }
            ], null, 2),
            'utf8'
        );
    });

    test('updateStatistics updates the history correctly for win', () => {
        const mockData = [
            { username: 'testUser', played: 11, win: 5, loss: 6, linesCleared: 100, tetrisScored: 10}
        ];
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
        fs.writeFileSync.mockResolvedValueOnce();

        game.updateStatistics('testUser', true, true);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            STAT_FILE,
            JSON.stringify([
                { username: 'testUser', played: 11, win: 6, loss: 5, linesCleared: 100, tetrisScored: 10}
            ], null, 2),
            'utf8'
        );
    });

    test('updateStatistics updates the history correctly for loss', () => {
        const mockData = [
            { username: 'testUser', played: 10, win: 5, loss: 5, linesCleared: 100, tetrisScored: 10}
        ];
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
        fs.writeFileSync.mockResolvedValueOnce();

        game.updateStatistics('testUser', false, true, 0, 0);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            STAT_FILE,
            JSON.stringify([
                { username: 'testUser', played: 11, win: 5, loss: 6, linesCleared: 100, tetrisScored: 10}
            ], null, 2),
            'utf8'
        );
    });

    test('clearFullLines handles Perfect Clear correctly', () => {
        const io = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
        const grid = game.createEmptyGrid();
    
        // Fill the grid such that the entire grid will be cleared
        for (let row = 0; row < 4; row++) {
            grid[row].fill({ filled: true, color: 'red' });
        }
    
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);
        game.grids.set(player.socketId, grid);
    
        const opponent = new Player('opponentUser', 'opponentSocketId');
        game.players.push(opponent);
    
        // Mock the sendPenaltyLines method to observe its calls
        game.sendPenaltyLines = jest.fn();
    
        // Call the clearFullLines method
        game.clearFullLines(io, grid, player);
    
        // Check that the player's score has been updated correctly
        expect(player.score).toBe(5400); // 5400 points for a Perfect Clear
    
        // Check that 10 penalty lines were sent to the opponent
        expect(game.sendPenaltyLines).toHaveBeenCalledWith(io, player, 10);
    
        // Check that the grid is empty after the Perfect Clear
        expect(grid.every(row => row.every(cell => !cell.filled))).toBe(true);
    
        // Check the console log for Perfect Clear message
        expect(console.log).toHaveBeenCalledWith(`Player ${player.username} achieved a Perfect Clear!`);
    });
    
});
