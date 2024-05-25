const Player = require('./Player');
const Piece = require('./Piece');
const { readJsonFile, writeJsonFile, PERSONAL_BEST_FILE, LEADERBOARD_FILE, HISTORY_FILE } = require('./JsonHandlers');

const DEFAULT_PIECES = 1000;
const DEFAULT_INTERVAL = 1000;

/**
 * An instance of Game is created when someone creates a room.
 */
class Game {
    constructor(roomName, onDelete) {
        this.roomName = roomName; // Name of the room
        this.players = []; // List of players who joined
        this.owner = null; // Owner of the room (initially not set)
        this.pieceQueue = []; // List of pieces that will be used for the game (same for every player)
        this.updateInterval = 0; // Currently not used
        this.grids = new Map(); // Map with grids for all players; socket IDs are keys, grid cells contain boolean and color
        this.cols = 10; // Number of columns in the grid
        this.rows = 20; // Number of rows in the grid
        this.currentPieces = new Map(); // Each player has their own list of pieces
        this.onDelete = onDelete; // Callback to delete the game room
        this.pendingPenalties = new Map(); // Map to store pending penalty lines for each player
    }

    /**
     * Generate pieces for the game.
     * @param {number} count - Number of pieces to generate.
     */
    generatePieces(count = DEFAULT_PIECES) {
        const templates = [
            { shape: [[1], [1], [1], [1]], color: 'cyan', position: { x: 5, y: 0 } },
            { shape: [[1, 1], [1, 1]], color: 'yellow', position: { x: 5, y: 0 } },
            { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple', position: { x: 5, y: 0 } },
            { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange', position: { x: 5, y: 0 } },
            { shape: [[0, 0, 1], [1, 1, 1]], color: 'blue', position: { x: 5, y: 0 } },
            { shape: [[0, 1, 1], [1, 1, 0]], color: 'red', position: { x: 5, y: 0 } },
            { shape: [[1, 1, 0], [0, 1, 1]], color: 'green', position: { x: 5, y: 0 } }
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
        if (!currentPiece) return;

        currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const x = dx + currentPiece.position.x;
                    const y = dy + currentPiece.position.y;
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        grid[y][x] = { filled: false, color: 'transparent', indestructible: grid[y][x].indestructible };
                    }
                }
            });
        });

        const newShape = this.rotateMatrix(currentPiece.shape, clockwise);
        const newPiece = new Piece(newShape, currentPiece.color, { ...currentPiece.position });

        if (this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
            currentPiece.shape = newShape;
        }

        currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const x = dx + currentPiece.position.x;
                    const y = dy + currentPiece.position.y;
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        grid[y][x] = { filled: true, color: currentPiece.color, indestructible: grid[y][x].indestructible };
                    }
                }
            });
        });

        this.broadcastGridUpdate(io, socketId);
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
        return Array.from({ length: 20 }, () => 
            Array.from({ length: 10 }, () => ({ filled: false, color: 'transparent', indestructible: false })));
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

        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const x = dx + newPosition.x;
                    const y = dy + newPosition.y;
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        grid[y][x] = { filled: true, color: piece.color, indestructible: grid[y][x].indestructible };
                    }
                }
            });
        });

        piece.position = newPosition;
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
        this.generatePieces();

        this.players.forEach(player => {
            this.grids.set(player.socketId, this.createEmptyGrid());
            let initialPiece = this.getNextPiece(player);
            this.currentPieces.set(player.socketId, initialPiece);
            this.startPlayerInterval(io, player);
        });
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
        if (!player) {
            player = this.players.find(player => player.socketId === socketId);
        }
        const grid = this.grids.get(player.socketId);
        const currentPiece = this.currentPieces.get(player.socketId);
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

        const newPiece = this.getNextPiece(player);
        if (!this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
            clearInterval(player.updateInterval);
            io.to(player.socketId).emit('game_over');
            console.log(`Game over for player ${player.username}`);
            console.log("uwu");
            this.removePlayer(player.socketId);

            const remainingPlayers = this.players.filter(p => p.socketId !== player.socketId);
            if (remainingPlayers.length === 1) {
                const lastPlayer = remainingPlayers[0];
                console.log("here last playerr");
                console.log(lastPlayer);
                clearInterval(lastPlayer.updateInterval);
                io.to(lastPlayer.socketId).emit('game_over');
                console.log(`Game over for player ${lastPlayer.username}`);
                this.removePlayer(lastPlayer.socketId);
            }
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
        player.dropInterval = 0;
        let linesCleared = 0;
        for (let row = 0; row < this.rows; row++) {
            if (grid[row].every(cell => cell.filled && !cell.indestructible)) {
                if (player.dropInterval == 0) {
                    player.dropInterval = 150;
                }
                grid.splice(row, 1);
                grid.unshift(new Array(this.cols).fill({ filled: false, color: 'transparent', indestructible: false }));
                linesCleared++;
            }
        }
        if (linesCleared > 0) {
            const scorePerLine = 100;
            player.score += scorePerLine * linesCleared;
            if (linesCleared === 4) {
                player.score += 400;
                console.log(`Player ${player.username} cleared a Tetris!`);
            } else {
                console.log(`Player ${player.username} cleared ${linesCleared} lines.`);
            }
            if (linesCleared > 1) {
                this.sendPenaltyLines(io, player, linesCleared - 1);
            } 
        }
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
        const newPosition = { ...currentPiece.position, x: currentPiece.position.x - 1 };

        if (this.isValidPlacement(this.grids.get(socketId), currentPiece.shape, newPosition, 'left')) {
            this.updateGrid(this.grids.get(socketId), currentPiece, newPosition);
            this.currentPieces.set(socketId, {...currentPiece, position: newPosition});
            this.broadcastGridUpdate(io, socketId);
        }
    }

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
    
        // Send grid spectrum to everyone expect the player itself
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
            }, DEFAULT_INTERVAL);
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
        let newPosition = { ...currentPiece.position };

        while (this.isValidPlacement(grid, currentPiece.shape, { ...newPosition, y: newPosition.y + 1 })) {
            newPosition.y += 1;
        }

        this.updateGrid(grid, currentPiece, newPosition);
        this.broadcastGridUpdate(io, socketId);
        this.clearFullLines(io, grid, player);

        setTimeout(() => {
            this.checkSommet(io, grid, player);

            const newPiece = this.getNextPiece(player);
            if (!this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
                clearInterval(player.updateInterval);
                io.to(player.socketId).emit('game_over');
                console.log(`Game over for player ${player.username}`);
                this.removePlayer(player.socketId);
                
                const remainingPlayers = this.players.filter(p => p.socketId !== player.socketId);

                if (remainingPlayers.length === 1) {
                    const lastPlayer = remainingPlayers[0];
                    console.log("here last playerr");
                    console.log(lastPlayer);    
                    clearInterval(lastPlayer.updateInterval);
                    io.to(lastPlayer.socketId).emit('game_over');
                    console.log(`Game over for player ${lastPlayer.username}`);
                    this.removePlayer(lastPlayer.socketId);
                }
            } else {
                this.applyPendingPenalties(grid, player.socketId);
                this.currentPieces.set(socketId, newPiece);
                this.updateGrid(grid, newPiece, newPiece.position);
                this.broadcastGridUpdate(io, socketId);
                player.updateInterval = setInterval(() => {
                    this.movePieceDownForPlayer(io, player);
                }, DEFAULT_INTERVAL);
            }
        }, player.dropInterval);

    }

    /**
     * Remove a player from the game room when it's game over for them.
     * @param {string} socketId - Player's socket ID.
     */
    removePlayer(socketId) {
        const player = this.players.find(p => p.socketId === socketId);
        const originalPlayerCount = this.players.length;

        if (player) {
            if (originalPlayerCount === 1) {
                this.updatePersonalBest(player.username, player.score);
                this.updateLeaderboard(player.username, player.score);
            }
            // Remove the player from the game
            this.players = this.players.filter(p => p.socketId !== socketId);
            this.grids.delete(socketId);
            this.currentPieces.delete(socketId);
            this.updateHistory(player.username, false, originalPlayerCount > 1);

            // Check if there are no players left
            if (this.players.length === 0) {
                this.onDelete(this.roomName);
            } else if (this.players.length === 1 && originalPlayerCount > 1) {
                // If only one player remains, update their history as a win
                const lastPlayer = this.players[0];
                clearInterval(lastPlayer.updateInterval);
                this.updateHistory(lastPlayer.username, true, true);
                console.log(`Game over for player ${lastPlayer.username}`);
                io.to(lastPlayer.socketId).emit('game_over');
                this.removePlayer(lastPlayer.socketId);
            }
        }
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
        const leaderboard = readJsonFile(LEADERBOARD_FILE);

        leaderboard.push({ username, score });
        leaderboard.sort((a, b) => b.score - a.score);
        const top50 = leaderboard.slice(0, 50);

        writeJsonFile(LEADERBOARD_FILE, top50);
    }

    /**
     * Update the History file for the player.
     * @param {string} username - The player's username.
     * @param {boolean} win - Whether the player won or lost.
     * @param {boolean} isMultiplayer - Whether the game was multiplayer.
     */
    updateHistory(username, win, isMultiplayer) {
        const history = readJsonFile(HISTORY_FILE);

        let playerHistory = history.find(entry => entry.username === username);
        if (playerHistory) {
            playerHistory.played += 1;
            if (isMultiplayer) {
                if (win) {
                    playerHistory.win += 1;
                } else {
                    playerHistory.loss += 1;
                }
            }
        } else {
            history.push({ 
                username, 
                played: 1, 
                win: isMultiplayer && win ? 1 : 0, 
                loss: isMultiplayer && !win ? 1 : 0 
            });
        }

        writeJsonFile(HISTORY_FILE, history);
    }

    /**
     * Broadcast the updated grid to a player.
     * @param {object} io - Socket.io instance.
     * @param {string} socketId - Player's socket ID.
     */
    broadcastGridUpdate(io, socketId) {
        const grid = this.grids.get(socketId);
        io.to(socketId).emit('grid_update', { grid });
    }

    /**
     * Get the next piece for a player.
     * @param {object} player - The player object.
     * @returns {object} The next piece.
     */
    getNextPiece(player) {
        if (player.currentPieceIndex >= this.pieceQueue.length) {
            this.generatePieces(DEFAULT_PIECES);
        }
        const pieceTemplate = this.pieceQueue[player.currentPieceIndex++];
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
     * Remove a player from the game room when he leave and update the new owner.
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
    handleDisconnect(io, socketId) {
        this.players.forEach(player => {
            io.to(player.socketId).emit('game_over', {
                message: "Game has ended due to a player disconnecting. You will be redirected."
            });
            clearInterval(player.updateInterval);
        });

        clearInterval(this.updateInterval);
        this.pieceQueue = [];
        this.players.currentPieceIndex = 0;
        this.players = [];

        return true;
    }
}

module.exports = Game;
