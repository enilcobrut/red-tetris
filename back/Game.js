const Player = require('./Player');
const Piece = require('./Piece');
const { readJsonFile, writeJsonFile, PERSONAL_BEST_FILE, LEADERBOARD_FILE, STAT_FILE } = require('./JsonHandlers');

const DEFAULT_PIECES = 1000;
const DEFAULT_INTERVAL = 1000;
const DEFAULT_SCORE = 100;
const SCORE_MULTIPLIER_INCREMENT = 0.2;
const INTERVAL_DECREMENT = 50;
const MINIMUM_INTERVAL = 150;
const LINES_PER_LEVEL = 4;

/**
 * An instance of Game is created when someone creates a room.
 */
class Game {
    constructor(roomName, onDelete, isSinglePlayerJourney = false) {
        this.roomName = roomName; // Name of the room
        this.players = []; // List of players who joined
        this.owner = null; // Owner of the room (initially not set)
        this.pieceQueue = []; // List of pieces that will be used for the game (same for every player)
        this.grids = new Map(); // Map with grids for all players; socket IDs are keys, grid cells contain boolean and color
        this.cols = 10; // Number of columns in the grid
        this.rows = 20; // Number of rows in the grid
        this.currentPieces = new Map(); // Each player has their own list of pieces
        this.onDelete = onDelete; // Callback to delete the game room
        this.pendingPenalties = new Map(); // Map to store pending penalty lines for each player
        this.originalPlayerCount = 0; // Track the number of players at the start of the game
        this.started = false; // Track if the game has started
        this.logs = []; // New property to track logs
        this.remindingPlayer = 0;
        this.isJourney = isSinglePlayerJourney;
    }

    /**
     * Generate pieces for the game.
     * @param {number} count - Number of pieces to generate.
     */
    generatePieces(count = DEFAULT_PIECES) {
        const templates = [
            { shape: [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]], color: 'cyan', position: { x: 5, y: 0 } },
            { shape: [[1, 1], [1, 1]], color: 'yellow', position: { x: 5, y: 0 } },
            { shape: [[0, 1, 0], [1, 1, 1],[0,0,0]], color: 'purple', position: { x: 5, y: 0 } },
            { shape: [[1, 0, 0], [1, 1, 1], [0,0,0]], color: 'orange', position: { x: 5, y: 0 } },
            { shape: [[0, 0, 1], [1, 1, 1], [0,0,0]], color: 'blue', position: { x: 5, y: 0 } },
            { shape: [[0, 1, 1], [1, 1, 0],[0,0,0]], color: 'red', position: { x: 5, y: 0 } },
            { shape: [[1, 1, 0], [0, 1, 1],[0,0,0]], color: 'green', position: { x: 5, y: 0 } }
        ];

        while (this.pieceQueue.length < count) {
            let bag = templates.slice();
            while (bag.length > 0 && this.pieceQueue.length < count) {
                const randomIndex = Math.floor(Math.random() * bag.length);
                const template = bag.splice(randomIndex, 1)[0];
                this.pieceQueue.push(Piece.createFromTemplate(template));
            }
        }
        console.log(`Generated ${count} pieces for the game.`);
    }

    /**
     * Rotate the current piece for a player and update the grid.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     * @param {boolean} clockwise - Direction of rotation.
     */
    rotate(io, socketId, clockwise = true) {
        const grid = this.grids.get(socketId);
        const currentPiece = this.currentPieces.get(socketId);
        const player = this.players.find(player => player.socketId === socketId);

        clearInterval(player.updateInterval);
        if (!currentPiece) return;

        this.clearPieceFromGrid(grid, currentPiece);

        const newShape = this.rotateMatrix(currentPiece.shape, clockwise);
        const newPiece = new Piece(newShape, currentPiece.color, { ...currentPiece.position });

        if (this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
            currentPiece.shape = newShape;
            player.rotationCounter++; // Increment rotation counter
        }

        this.placePieceOnGrid(grid, currentPiece);

        this.broadcastGridUpdate(io, socketId);

        player.updateInterval = setInterval(() => {
            this.movePieceDownForPlayer(io, player);
        }, player.finalInterval || DEFAULT_INTERVAL);

        if (player.rotationCounter > 50) {
            player.score = -42;
            console.log(`Cheater! Player ${player.username} rotated the piece excessively.`);
            io.to(player.socketId).emit('game_over', { message: "Cheater!" });
            this.removePlayer(io, player.socketId);
        }
    }

    /**
     * Rotate a matrix (piece shape).
     * @param {array} matrix - The matrix to rotate.
     * @param {boolean} clockwise - Direction of rotation.
     * @returns {array} The rotated matrix.
     */
    rotateMatrix(matrix, clockwise) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        let rotatedMatrix = Array.from({ length: cols }, () => Array(rows));

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (clockwise) {
                    rotatedMatrix[col][rows - 1 - row] = matrix[row][col];
                } else {
                    rotatedMatrix[cols - 1 - col][row] = matrix[row][col];
                }
            }
        }

        return rotatedMatrix;
    }

    /**
     * Create an empty grid for a player.
     * @returns {array} The empty grid.
     */
    createEmptyGrid() {
        return Array.from({ length: this.rows }, () => 
            Array.from({ length: this.cols }, () => ({ filled: false, color: 'transparent', indestructible: false })));
    }

    /**
     * Get grid data for all players.
     * @returns {object} The grid data.
     */
    getGridData() {
        const gridData = {};
        this.players.forEach(player => {
            const grid = this.grids.get(player.socketId);
            if (grid) {
                gridData[player.socketId] = grid.map(row => 
                    row.map(cell => ({ filled: cell.filled, color: cell.color, indestructible: cell.indestructible }))
                );
            }
        });
        return gridData;
    }

    /**
     * Update the grid with the new piece position.
     * @param {array} grid - The grid to update.
     * @param {object} piece - The piece to place.
     * @param {object} newPosition - The new position of the piece.
     */
    updateGrid(grid, piece, newPosition) {
        this.clearPieceFromGrid(grid, piece);
        piece.position = newPosition;
        this.placePieceOnGrid(grid, piece);
    }

    /**
     * Clear a piece from the grid.
     * @param {array} grid - The grid to clear the piece from.
     * @param {object} piece - The piece to clear.
     */
    clearPieceFromGrid(grid, piece) {
        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const x = dx + piece.position.x;
                    const y = dy + piece.position.y;
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        grid[y][x] = { filled: false, color: 'transparent', indestructible: grid[y][x].indestructible };
                    }
                }
            });
        });
    }

    /**
     * Place a piece on the grid.
     * @param {array} grid - The grid to place the piece on.
     * @param {object} piece - The piece to place.
     */
    placePieceOnGrid(grid, piece) {
        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const x = dx + piece.position.x;
                    const y = dy + piece.position.y;
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        grid[y][x] = { filled: true, color: piece.color, indestructible: grid[y][x].indestructible };
                    }
                }
            });
        });
    }

    /**
     * Apply pending penalty lines to a player's grid.
     * @param {array} grid - The player's grid.
     * @param {string} socketId - The player's socket ID.
     */
    applyPendingPenalties(grid, socketId) {
        const penalties = this.pendingPenalties.get(socketId) || 0;
        if (penalties > 0) {
            this.addPenaltyLines(grid, penalties);
            this.pendingPenalties.set(socketId, 0); // Reset pending penalties
        }
    }    

    /**
     * Find a player by username.
     * @param {string} username - The username to search for.
     * @returns {object} The player object, or undefined if not found.
     */
    findPlayer(username) {
        return this.players.find(player => player.username === username);
    }

    /**
     * Add a player to the game.
     * @param {string} username - The player's username.
     * @param {string} socketId - The player's socket ID.
     * @param {boolean} isOwner - Whether the player is the room owner.
     */
    addPlayer(username, socketId, isOwner = false) {
        const player = new Player(username, socketId);
        if (isOwner || this.players.length === 0) {
            player.isOwner = true;
            this.owner = player;
        }
        this.players.push(player);
        console.log(`${username} joined room ${this.roomName}`);
    }

    /**
     * Redirect all players to the game.
     * @param {object} io - Socket.io instance.
     */
    redirectGame(io) {
        io.to(this.roomName).emit('redirect_game', {
            room: this.roomName,
            url: `/${this.roomName}/${this.owner.username}`
        });
    }

    /**
     * Start the game: generate pieces, initialize grids, and start intervals for players.
     * @param {object} io - Socket.io instance.
     */
    startGame(io) {
        this.originalPlayerCount = this.players.length;
        this.remindingPlayer = this.players.length;
        this.generatePieces();
    
        this.players.forEach(player => {
            //this.broadcastNextPiece(io, player.socketId)
            this.grids.set(player.socketId, this.createEmptyGrid());
            let initialPiece = this.getNextPiece(player, io);
            this.currentPieces.set(player.socketId, initialPiece);
            this.startPlayerInterval(io, player);
        });
        this.started = true;
        if (this.originalPlayerCount > 1) {
            console.log(`Multiplayer game started in room ${this.roomName}.`);
        } else if (this.isJourney){
            console.log(`Single player journey started in room ${this.roomName}.`);
        } else {
            console.log(`Single player started in room ${this.roomName}.`);
        }
        
        this.emitLogUpdate(io);
    }    

    /**
     * Start the movement interval for a player.
     * @param {object} io - Socket.io instance.
     * @param {object} player - The player object.
     */
    startPlayerInterval(io, player) {
        if (player.updateInterval) {
            clearInterval(player.updateInterval);
        }
        player.updateInterval = setInterval(() => {
            if (player.dropped) {
                clearInterval(player.updateInterval);
            }
            this.movePieceDownForPlayer(io, player);
        }, DEFAULT_INTERVAL);
    }

    /**
     * Move the current piece down for a player, check for collisions, and update the grid.
     * @param {object} io - Socket.io instance.
     * @param {object} player - The player object.
     */
    movePieceDownForPlayer(io, player) {
        const grid = this.grids.get(player.socketId);
        const currentPiece = this.currentPieces.get(player.socketId);
        if (!currentPiece)
            return ;
        let newPosition = { ...currentPiece.position, y: currentPiece.position.y + 1 };

        if (this.isValidPlacement(grid, currentPiece.shape, newPosition)) {
            this.updateGrid(grid, currentPiece, newPosition);
            this.broadcastGridUpdate(io, player.socketId);
        } else {
            this.handlePieceLanding(io, grid, player);
        }
    }

    /**
     * Handle the landing of a piece.
     * @param {object} io - Socket.io instance.
     * @param {array} grid - The grid.
     * @param {object} player - The player.
     */
    handlePieceLanding(io, grid, player) {
        this.clearFullLines(io, grid, player);
        this.checkSommet(io, grid, player);

        const newPiece = this.getNextPiece(player, io);
        if (!this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
            clearInterval(player.updateInterval);
            console.log(`Handle Piece Landing: Game over for player ${player.username}`);
            this.removePlayer(io, player.socketId);
        } else {
            this.applyPendingPenalties(grid, player.socketId);
            this.currentPieces.set(player.socketId, newPiece);
            this.updateGrid(grid, newPiece, newPiece.position);
            this.broadcastGridUpdate(io, player.socketId);
        }
    }

    /**
     * Check if a piece can be placed at a given position on the grid.
     * @param {array} grid - The grid to check.
     * @param {array} shape - The piece shape.
     * @param {object} position - The position to check.
     * @param {string} direction - The direction to check (default is 'down').
     * @returns {boolean} True if the placement is valid, false otherwise.
     */
    isValidPlacement(grid, shape, position, direction = 'down') {
        const { x, y } = position;
        const numRows = grid.length;
        const numCols = grid[0].length;

        if (direction === 'down') {
            const lowestPoints = new Array(shape[0].length).fill(-1);
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] === 1) {
                        lowestPoints[col] = row;
                    }
                }
            }

            for (let col = 0; col < lowestPoints.length; col++) {
                if (lowestPoints[col] !== -1) {
                    const row = lowestPoints[col];
                    const gridX = x + col;
                    const gridY = y + row;

                    if (gridY >= numRows || gridX >= numCols || gridX < 0 || gridY < 0 || (gridY < numRows && grid[gridY][gridX] && grid[gridY][gridX].filled)) {
                        return false;
                    }
                }
            }
        } else if (direction === 'left') {
            const leftmostPoints = new Array(shape.length).fill(-1);
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] === 1) {
                        leftmostPoints[row] = col;
                        break;
                    }
                }
            }

            for (let row = 0; row < leftmostPoints.length; row++) {
                if (leftmostPoints[row] !== -1) {
                    const col = leftmostPoints[row];
                    const gridX = x + col;
                    const gridY = y + row;
                    if (gridX < 0 || gridX >= numCols || gridY < 0 || gridY >= numRows || (gridY < numRows && grid[gridY][gridX] && grid[gridY][gridX].filled)) {
                        return false;
                    }
                }
            }
        } else if (direction === 'right') {
            const rightmostPoints = new Array(shape.length).fill(-1);
            for (let row = 0; row < shape.length; row++) {
                for (let col = shape[row].length - 1; col >= 0; col--) {
                    if (shape[row][col] === 1) {
                        rightmostPoints[row] = col;
                        break;
                    }
                }
            }

            for (let row = 0; row < rightmostPoints.length; row++) {
                if (rightmostPoints[row] !== -1) {
                    const col = rightmostPoints[row];
                    const gridX = x + col;
                    const gridY = y + row;
                    if (gridX >= numCols || gridY < 0 || gridY >= numRows || (gridY < numRows && grid[gridY][gridX] && grid[gridY][gridX].filled)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Clear full lines and update the player's score.
     * Notify other players about the lines cleared.
     * @param {object} io - Socket.io instance.
     * @param {array} grid - The grid to clear lines from.
     * @param {object} player - The player object.
     */
    clearFullLines(io, grid, player) {
        player.rotationCounter = 0;
        player.dropInterval = 0;
        let linesCleared = 0;
        for (let row = 0; row < this.rows; row++) {
            if (grid[row].every(cell => cell.filled && !cell.indestructible)) {
                if (player.dropInterval === 0) {
                    player.dropInterval = 150;
                }
                grid.splice(row, 1);
                grid.unshift(new Array(this.cols).fill({ filled: false, color: 'transparent', indestructible: false }));
                linesCleared++;
            }
        }
        if (linesCleared > 0) {
            player.linesCleared = (player.linesCleared || 0) + linesCleared; // Track lines cleared
            player.score = Math.floor(player.score + (DEFAULT_SCORE * linesCleared * player.scoreMultiplier));
        
            if (this.isJourney) {
                // Check if player has cleared enough lines to level up
                const level = 1 + Math.floor(player.linesCleared / LINES_PER_LEVEL);
                player.scoreMultiplier = 1.0 + ((level - 1) * SCORE_MULTIPLIER_INCREMENT);
                const newInterval = DEFAULT_INTERVAL - (level * INTERVAL_DECREMENT);
                player.finalInterval = Math.max(newInterval, MINIMUM_INTERVAL);
    
                if (level > (player.level || 1)) {
                    player.level = level;
                    const bonus_point = Math.floor(level * DEFAULT_SCORE / 2);
                    player.score = Math.floor(player.score + bonus_point);
                    
                    this.logs.push(`Player ${player.username} leveled up to level ${level}!`);
                    this.logs.push(`Bonus points: ${bonus_point}!`);
                    console.log(`Player ${player.username} leveled up to level ${level}!`);
                    console.log(`Bonus points: ${bonus_point}!`);
                    console.log(`Player ${player.username} has a new interval of ${player.finalInterval}!`);
                    console.log(`Player ${player.username} has a new score multiplier of ${player.scoreMultiplier.toFixed(2)}!`);
                }
            }
        
            if (linesCleared === 4 && this.isPerfectClear(grid)) {
                player.score = Math.floor(player.score + (DEFAULT_SCORE * player.scoreMultiplier * 50)); // Reward points for a Perfect Clear
                this.sendPenaltyLines(io, player, 10); // Send 10 penalty lines to opponents
                console.log(`Player ${player.username} achieved a Perfect Clear!`);
                this.logs.push(`Player ${player.username} achieved a Perfect Clear!`);
            } else {
                if (linesCleared === 4) {
                    player.tetrisScored = (player.tetrisScored || 0) + 1; // Track Tetris scored
                    player.score = Math.floor(player.score + (DEFAULT_SCORE * player.scoreMultiplier * 4)); // Additional 400 points for clearing 4 lines (Tetris)
                    console.log(`Player ${player.username} cleared a Tetris!`);
                    this.logs.push(`Player ${player.username} cleared a Tetris!`);
                    this.sendPenaltyLines(io, player, linesCleared - 1);
                } else if (linesCleared > 1) {
                    this.sendPenaltyLines(io, player, linesCleared - 1);
                    console.log(`Player ${player.username} cleared ${linesCleared} lines.`);
                    this.logs.push(`Player ${player.username} cleared ${linesCleared} lines.`);
                } else {
                    console.log(`Player ${player.username} cleared ${linesCleared} lines.`);
                }
            }
            
            let linesClearedData = {
                score: player.score,
                linesCleared: player.linesCleared,
                tetrisScored: player.tetrisScored || 0,
                level: this.isJourney ? player.level : 1
            };
            
            io.to(player.socketId).emit('lines_cleared', linesClearedData);
        
            this.emitLogUpdate(io); // Emit log update
        }
    }
        
    /**
     * Check if the grid is completely empty (Perfect Clear).
     * @param {array} grid - The grid to check.
     * @returns {boolean} True if the grid is empty, false otherwise.
     */
    isPerfectClear(grid) {
        return grid.every(row => row.every(cell => !cell.filled));
    }

    /**
     * Send penalty lines to other players.
     * @param {object} io - Socket.io instance.
     * @param {object} clearingPlayer - The player who cleared lines.
     * @param {number} penaltyLines - The number of penalty lines to send.
     */
    sendPenaltyLines(io, clearingPlayer, penaltyLines) {
        if (penaltyLines <= 0) return;

        this.players.forEach(player => {
            if (player.socketId !== clearingPlayer.socketId) {
                const currentPenalties = this.pendingPenalties.get(player.socketId) || 0;
                this.pendingPenalties.set(player.socketId, currentPenalties + penaltyLines);
                this.broadcastGridUpdate(io, player.socketId);
            }
        });
    }

    /**
     * Add penalty lines to a player's grid.
     * @param {array} grid - The player's grid.
     * @param {number} penaltyLines - The number of penalty lines to add.
     */
    addPenaltyLines(grid, penaltyLines) {
        const penaltyRow = new Array(this.cols).fill({ filled: true, color: 'gray', indestructible: true });
    
        for (let i = 0; i < penaltyLines; i++) {
            grid.shift(); // Remove the top row
            grid.push([...penaltyRow]); // Add a penalty line at the bottom
        }
    }    

    /**
     * Move the current piece left for a player.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    movePlayerPieceLeft(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);
        if (!player) return;

        const currentPiece = this.currentPieces.get(socketId);
        if (!currentPiece)
            return;
        const newPosition = { ...currentPiece.position, x: currentPiece.position.x - 1 };

        if (this.isValidPlacement(this.grids.get(socketId), currentPiece.shape, newPosition, 'left')) {
            this.updateGrid(this.grids.get(socketId), currentPiece, newPosition);
            this.currentPieces.set(socketId, {...currentPiece, position: newPosition});
            this.broadcastGridUpdate(io, socketId);
        }
    }

    /**
     * Check and update the sommet (top) of the grid for a player.
     * @param {object} io - Socket.io instance.
     * @param {array} grid - The grid to check.
     * @param {object} player - The player object.
     */
    checkSommet(io, grid, player) {
        const spectrumGrid = this.createEmptyGrid();

        for (let col = 0; col < this.cols; col++) {
            let firstFilledFound = false;
    
            for (let row = 0; row < this.rows; row++) {
                if (!firstFilledFound && grid[row][col].filled) {
                    firstFilledFound = true;
                }
                if (firstFilledFound) {
                    spectrumGrid[row][col] = { filled: true, color: 'gray', indestructible: grid[row][col].indestructible };
                }
            }
        }
    
        // Send grid spectrum to everyone except the player itself
        io.to(this.roomName).emit('update_spectrums', { playerSocketId: player.socketId, spectrumGrid });
    }

    /**
     * Move the current piece right for a player.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    movePlayerPieceRight(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);
        if (!player) return;

        const currentPiece = this.currentPieces.get(socketId);
        if (!currentPiece)
            return;
        const newPosition = { ...currentPiece.position, x: currentPiece.position.x + 1 };

        if (this.isValidPlacement(this.grids.get(socketId), currentPiece.shape, newPosition, 'right')) {
            this.updateGrid(this.grids.get(socketId), currentPiece, newPosition);
            this.currentPieces.set(socketId, {...currentPiece, position: newPosition});
            this.broadcastGridUpdate(io, player.socketId);
        }
    }

    /**
     * Make the piece fall faster when the down key is pressed.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    fall(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);
        if (player) {
            player.fall = true;
            clearInterval(player.updateInterval);
            player.updateInterval = setInterval(() => {
                this.movePieceDownForPlayer(io, player);
            }, 70);
        }
    }

    /**
     * Restore the normal falling speed when the down key is released.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    stopFall(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);
        if (player) {
            player.fall = true;
            clearInterval(player.updateInterval);
            player.updateInterval = setInterval(() => {
                this.movePieceDownForPlayer(io, player);
            }, player.finalInterval || DEFAULT_INTERVAL);
        }
    }

    /**
     * Drop the current piece to the bottom when the space key is pressed.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    dropPiece(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);
        player.dropped = true;
        clearInterval(player.updateInterval);
        const grid = this.grids.get(socketId);
        const currentPiece = this.currentPieces.get(socketId);
        if (!currentPiece) return;

        let newPosition = { ...currentPiece.position };

        while (this.isValidPlacement(grid, currentPiece.shape, { ...newPosition, y: newPosition.y + 1 })) {
            newPosition.y += 1;
        }

        this.updateGrid(grid, currentPiece, newPosition);
        this.broadcastGridUpdate(io, socketId);
        this.clearFullLines(io, grid, player);

        // if (this.isJourney == true) {
        //     player.dropInterval = 0;
        // }
        // Commented out for now, it causes crash 0.005% of the time
        //setTimeout(() => {
            this.checkSommet(io, grid, player);

            const newPiece = this.getNextPiece(player, io);
            if (!this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
                console.log(`Timeout: Game over for player ${player.username}`);
                this.removePlayer(io, player.socketId);
            } else {
                this.applyPendingPenalties(grid, player.socketId);
                this.currentPieces.set(socketId, newPiece);
                this.updateGrid(grid, newPiece, newPiece.position);
                this.broadcastGridUpdate(io, socketId);
                player.updateInterval = setInterval(() => {
                    this.movePieceDownForPlayer(io, player);
                }, player.finalInterval || DEFAULT_INTERVAL);
            }
        //}, player.dropInterval);

    }

    /**
     * Remove a player from the game room when it's game over for them.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    removePlayer(io, socketId) {
        const player = this.players.find(p => p.socketId === socketId);

        if (player) {
            console.log(`Removing player ${player.username} with score ${player.score}`);
            const isMultiplayer = this.originalPlayerCount > 1;
            const isWinner = isMultiplayer && this.players.length === 1;

            // Log the player's result
            if (isWinner) {
                console.log(`Player ${player.username} won with a score of ${player.score}`);
                this.logs.push(`Player ${player.username} won with a score of ${player.score}`);
            } else {
                if (isMultiplayer) {
                    console.log(`Player ${player.username} lost with a score of ${player.score}`);
                    this.logs.push(`Player ${player.username} lost with a score of ${player.score}`);
                } else {
                    console.log(`Game over for player ${player.username} with a score of ${player.score}`);
                    this.logs.push(`Game over for player ${player.username} with a score of ${player.score}`);
                }
            }

            io.to(player.socketId).emit('game_over', { score: player.score, isWinner });
            this.remindingPlayer = this.remindingPlayer - 1;

            clearInterval(player.updateInterval);

            if (this.originalPlayerCount === 1) {
                if (this.isJourney) {
                    this.updatePersonalBest(player.username, player.score);
                    this.updateLeaderboard(player.username, player.score);
                }
                this.updateStatistics(player.username, false, false, player.linesCleared || 0, player.tetrisScored || 0, true);
            } else {
                this.updateStatistics(player.username, false, isMultiplayer, player.linesCleared || 0, player.tetrisScored || 0);
            }

            // Remove the player from the game
            this.players = this.players.filter(p => p.socketId !== socketId);
            this.grids.delete(socketId);
            this.currentPieces.delete(socketId);

            // Check if there is only one player left in a multiplayer game
            if (isMultiplayer && this.players.length === 1) {
                const lastPlayer = this.players[0];
                this.updateStatistics(lastPlayer.username, true, true, lastPlayer.linesCleared || 0, lastPlayer.tetrisScored || 0);
                console.log(`Game over for player ${lastPlayer.username}! He won the game!`);
                // this.logs.push(`Game over for player ${lastPlayer.username}! He won the game!`);
                io.to(lastPlayer.socketId).emit('game_over');
                this.removePlayer(io, lastPlayer.socketId);
            }

            // Check if there are no players left
            if (this.players.length === 0 && this.areAllResourcesCleared()) {
                this.onDelete(this.roomName);
            } else if (this.players.length === 0) {
                this.clearAllResources();
                this.onDelete(this.roomName);
            }

            this.emitLogUpdate(io, this.remindingPlayer);
        }
    }
    
    /**
     * Check if all resources are cleared.
     * @returns {boolean} True if all resources are cleared, false otherwise.
     */
    areAllResourcesCleared() {
        return this.players.length === 0 && 
               this.grids.size === 0 && 
               this.currentPieces.size === 0 &&
               this.pieceQueue.length === 0 &&
               this.pendingPenalties.size === 0;
    }
    
    /**
     * Clear all resources.
     */
    clearAllResources() {
        this.players.forEach(player => clearInterval(player.updateInterval));
        this.players = [];
        this.grids.clear();
        this.currentPieces.clear();
        this.pieceQueue = [];
        this.pendingPenalties.clear();
    }
    
    
    /**
     * Update the Personal Best file for the player.
     * @param {string} username - The player's username.
     * @param {number} score - The player's score.
     */
    updatePersonalBest(username, score) {
        const personalBest = readJsonFile(PERSONAL_BEST_FILE);

        let userScores = personalBest.find(entry => entry.username === username);
        if (userScores) {
            userScores.scores.push(score);
            userScores.scores.sort((a, b) => b - a);
            userScores.scores = userScores.scores.slice(0, 10);
        } else {
            personalBest.push({ username, scores: [score] });
        }

        writeJsonFile(PERSONAL_BEST_FILE, personalBest);
    }

    /**
     * Update the Leaderboard file with the player's score.
     * @param {string} username - The player's username.
     * @param {number} score - The player's score.
     */
    updateLeaderboard(username, score) {
        if (username == 'BOT') return;
        const leaderboard = readJsonFile(LEADERBOARD_FILE);

        leaderboard.push({ username, score });
        leaderboard.sort((a, b) => b.score - a.score);
        const top25 = leaderboard.slice(0, 25);

        writeJsonFile(LEADERBOARD_FILE, top25);
    }

    /**
     * Update the Statistics file for the player.
     * @param {string} username - The player's username.
     * @param {boolean} win - Whether the player won or lost.
     * @param {boolean} isMultiplayer - Whether the game was multiplayer.
     */
    updateStatistics(username, win, isMultiplayer, linesCleared = 0, tetrisScored = 0, isSinglePlayer = false) {
        const history = readJsonFile(STAT_FILE);
    
        let playerHistory = history.find(entry => entry.username === username);
        if (playerHistory) {
            playerHistory.played += 1;
            playerHistory.linesCleared = (playerHistory.linesCleared || 0) + linesCleared;
            playerHistory.tetrisScored = (playerHistory.tetrisScored || 0) + tetrisScored;
            if (isMultiplayer) {
                if (win) {
                    playerHistory.win += 1;
                    playerHistory.loss -= 1;
                    playerHistory.played -= 1;
                } else {
                    playerHistory.loss += 1;
                }
            } else if (isSinglePlayer) {
                playerHistory.single = (playerHistory.single || 0) + 1;
            }
        } else {
            history.push({
                username,
                played: 1,
                win: isMultiplayer && win ? 1 : 0,
                loss: isMultiplayer && !win ? 1 : 0,
                linesCleared: linesCleared,
                tetrisScored: tetrisScored,
                single: isSinglePlayer ? 1 : 0
            });
        }
    
        writeJsonFile(STAT_FILE, history);
    }

    /**
     * Broadcast the updated grid to a player.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    broadcastGridUpdate(io, socketId) {
        const player = this.players.find(p => p.socketId === socketId);
        const grid = this.grids.get(socketId);
        const score = player ? player.score : 0;  // Assurez-vous que player existe pour éviter les erreurs
        io.to(socketId).emit('grid_update', { grid, score });
    }


    broadcastNextPiece(io, socketId) {
        const player = this.players.find(p => p.socketId === socketId);
        player.nextPieceIndex++;
        const nextPieceIndex = player.nextPieceIndex % this.pieceQueue.length;
        const pieceTemplate = this.pieceQueue[nextPieceIndex];    
        const nextPiece = Piece.createFromTemplate(pieceTemplate);
        io.to(socketId).emit('next_piece', {
            shape: nextPiece.shape,
            color: nextPiece.color,
        });
    }


    /**
     * Get the next piece for a player.
     * @param {object} player - The player object.
     * @returns {object} The next piece.
     */
    getNextPiece(player, io) {

        this.broadcastNextPiece(io, player.socketId)
        const nextPieceIndex = player.currentPieceIndex % DEFAULT_PIECES;
        const pieceTemplate = this.pieceQueue[nextPieceIndex];
        player.currentPieceIndex++;
        return Piece.createFromTemplate(pieceTemplate);
    }

    /**
     * Get data about the game room.
     * @returns {object} The room data.
     */
    getRoomData() {
        return {
            roomName: this.roomName,
            players: this.players.map(player => ({
                name: player.username,
                socketId: player.socketId,
                isOwner: player.isOwner
            })),
            owner: this.owner.username
        };
    }

    /**
     * Remove a player from the game room when they leave and update the new owner.
     * @param {string} socketId - Player's socket ID.
     */
    removePlayerRoom(socketId) {
        const playerIndex = this.players.findIndex(player => player.socketId === socketId);
        if (playerIndex === -1) {
            console.log('Player not found.');
            return;
        }

        const [removedPlayer] = this.players.splice(playerIndex, 1);
        console.log(`${removedPlayer.username} has left the room ${this.roomName}`);

        if (removedPlayer.isOwner) {
            if (this.players.length > 0) {
                this.players[0].isOwner = true;
                this.owner = this.players[0];
                console.log(`${this.owner.username} is now the owner of the room.`);
            } else {
                this.owner = null;
                console.log('No players left in the room. Room will be deleted.');
                this.onDelete();
            }
        }
        this.grids.delete(socketId);
        this.currentPieces.delete(socketId);
        this.pendingPenalties.delete(socketId);
    }

    /**
     * Handle player disconnection.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     * @returns {boolean} True if disconnection is handled.
     */
    handleDisconnect(io) {
        this.players.forEach(player => {
            io.to(player.socketId).emit('game_over', {
                message: "Game has ended due to a player disconnecting. You will be redirected."
            });
            clearInterval(player.updateInterval);
        });

        this.pieceQueue = [];
        this.players.currentPieceIndex = 0;
        this.players = [];

        return true;
    }

    /**
     * Emit log updates to the front end.
     * @param {object} io - Socket.io instance.
     */
    emitLogUpdate(io, includeRemindingPlayer = false) {
        const data = {
            logs: this.logs.slice(-10)
        };
        if (includeRemindingPlayer) {
            data.remindingPlayer = this.remindingPlayer;
        }
        io.to(this.roomName).emit('log_update', data);
    }
}

module.exports = Game;
