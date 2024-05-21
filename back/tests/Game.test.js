const Game = require('../Game');
const Player = require('../Player');

console.log = jest.fn(); // Suppress console.log
jest.useFakeTimers();

jest.mock('../Player', () => {
    return jest.fn().mockImplementation((username, socketId) => {
        return { username, socketId, isOwner: false, score: 0, updateInterval: null }; // Add any other default properties you expect
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
        expect(game.updateInterval).toBe(0);
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
        expect(grid[0][0]).toEqual({ filled: false, color: 'transparent' });
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
        const grid = game.createEmptyGrid();
        grid[0].fill({ filled: true, color: 'red' });
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);

        game.clearFullLines(grid, player);

        expect(grid[0].every(cell => !cell.filled)).toBe(true);
        expect(player.score).toBe(100);
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
        const player = new Player('testUser', 'testSocketId');
        game.players.push(player);

        game.removePlayer(player.socketId);

        expect(game.players.length).toBe(0);
        expect(game.grids.size).toBe(0);
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
});
