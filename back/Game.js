const Player = require('./Player');
const Piece = require('./Piece');

/*an instance of game is created when someone create a room*/


class Game {
    constructor(roomName, onDelete) {
        this.roomName = roomName; //name of the room
        this.players = []; // list of  players who joined 
        this.owner = null; // the owner of the room (not set yet I think)
        this.pieceQueue = []; // list of the piece that will be used for the game (same for every players)
        this.updateInterval = 0; // useless now
        this.grids = new Map(); // map with all grid for all players, socket will be the keys, for each grid's case there will be a boolean, if its filled or not, and a color
        this.cols = 10;
        this.rows = 20;
        this.currentPieces = new Map(); // each players will have a map which their own list of piece (parce que ca causait beaucoup de probleme d utiliser celle de la classe pour tout le monde) (but there is maybe a better way to do)
        this.onDelete = onDelete; // callBack to delete inside the class
    }

    /*Piece Fonction START , I tried to do inside the Piece class but it didnt work so .. */


    /* generate the pieces for a game */
        generatePieces(count = 1000) {
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

    /* rotate the piece when keyup is pressed , and update grid */

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
                        grid[y][x] = { filled: false, color: 'transparent' };
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
                        grid[y][x] = { filled: true, color: currentPiece.color };
                    }
                }
            });
        });
        this.broadcastGridUpdate(io, socketId);
    }
    
    /*usefull function to rotate piece thx chatgpt*/

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

    /*Piece Function END*/


    /*grid function START */

    createEmptyGrid() {
        return Array.from({ length: 20 }, () => 
            Array.from({ length: 10 }, () => ({ filled: false, color: 'transparent' })));
    }

    // not used yet but will be used to show the spect
    getGridData() {
        const gridData = {};
        this.players.forEach(player => {
            const grid = this.grids.get(player.socketId);
            if (grid) {
                gridData[player.socketId] = grid.map(row => 
                    row.map(cell => ({ filled: cell.filled, color: cell.color }))
                );
            }
        });
        return gridData;
    }

    /*very usefull function that will update the grid with a new piece and new positions :)*/

    updateGrid(grid, piece, newPosition) {
        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const x = dx + piece.position.x;
                    const y = dy + piece.position.y;
                    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                        grid[y][x] = { filled: false, color: 'transparent' };
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
                        grid[y][x] = { filled: true, color: piece.color };
                    }
                }
            });
        });
        piece.position = newPosition;
    }

    /*grid function END*/

    /*useful fonction to find player, add player into the game etc */

    findPlayer(username) {
        return this.players.find(player => player.username === username);
    }

    addPlayer(username, socketId, isOwner = false) {
        const player = new Player(username, socketId);
        if (isOwner || this.players.length === 0) {
            player.isOwner = true;
            this.owner = player;
        }
        this.players.push(player);
        console.log(`${username} joined room ${this.roomName}`);
    }

    /*redirect all players to the game*/

    redirectGame(io) {
        io.to(this.roomName).emit('redirect_game', {
            room: this.roomName,
            url: `/${this.roomName}/${this.owner.username}`
        });
    }
    
    /*start the game, generate the piece, initialise the grid for each player then start the interval (every players has his own interval so when someone loose it doesnt stop for the rest*/
    startGame(io) {
        this.generatePieces();
        // this.pieceQueue.slice(0, 10).forEach((piece, index) => { // was just to show the if the piece were correct because.. hehe
        //     console.log(`Piece ${index + 1}: ${piece.color}`);
        // });
        this.players.forEach(player => {
            this.grids.set(player.socketId, this.createEmptyGrid());
            let initialPiece = this.getNextPiece(player);
            this.currentPieces.set(player.socketId, initialPiece);
            this.startPlayerInterval(io, player);

        });
    }




    /*start the movement, every second*/
    startPlayerInterval(io, player) {
        if (player.updateInterval) {
            clearInterval(player.updateInterval);
        }
        player.updateInterval = setInterval(() => {
            this.movePieceDownForPlayer(io, player);
        }, 1000);
    }
    
    /*make the pieces move, check the colision, update the grid, and check cleared lines then get the next piece and updategrid again*/
    movePieceDownForPlayer(io, player) {
        console.log(player)
        if (!player) {
            player = this.players.find(player => player.socketId === socketId);
        }
        const grid = this.grids.get(player.socketId);
        const currentPiece = this.currentPieces.get(player.socketId);
        console.log(currentPiece)
        let newPosition = { ...currentPiece.position, y: currentPiece.position.y + 1 };
    
        if (this.isValidPlacement(grid, currentPiece.shape, newPosition)) {
            this.updateGrid(grid, currentPiece, newPosition);
            this.broadcastGridUpdate(io, player.socketId);
        } else {
            this.clearFullLines(grid, player);
            const newPiece = this.getNextPiece(player);
            if (!this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
                clearInterval(player.updateInterval);
                io.to(player.socketId).emit('game_over');
                console.log(`Game over for player ${player.username}`);
                this.removePlayer(player.socketId);
            } else {
                this.currentPieces.set(player.socketId, newPiece);
                this.updateGrid(grid, newPiece, newPiece.position);
                this.broadcastGridUpdate(io, player.socketId);

            }
        }
    }

    /*check the cohision for every direction .. (horrible function I agree)*/
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
    
    

    /*delete the line and update score*/
    //TODO check if the line==4 for a special score tetris? idk the rules
    clearFullLines(grid, player) {
        let linesCleared = 0;
        for (let row = 0; row < this.rows; row++) {
            if (grid[row].every(cell => cell.filled)) {
                grid.splice(row, 1);
                grid.unshift(new Array(this.cols).fill({ filled: false, color: 'transparent' }));
                linesCleared++;
            }
        }
        const scorePerLine = 100;
        player.score += scorePerLine * linesCleared;
    }



    



    /* event START*/

    /*left, move the piece check cohision update the grid*/
    movePlayerPieceLeft(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);
        if (!player) return;

        const currentPiece = this.currentPieces.get(socketId);
        const newPosition = { ...currentPiece.position, x: currentPiece.position.x - 1 };

       // console.log("left pressed");
        if (this.isValidPlacement(this.grids.get(socketId), currentPiece.shape, newPosition, 'left')) {
            this.updateGrid(this.grids.get(socketId), currentPiece, newPosition);
            this.currentPieces.set(socketId, {...currentPiece, position: newPosition});
            this.broadcastGridUpdate(io, socketId);

        }
    }

    /*same but right*/

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

    /*when keydown is press, clear interval and use another more faster*/
    fall(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);
        if (player) {
            player.fall = true;
            clearInterval(player.updateInterval);
            player.updateInterval = setInterval(() => {
                this.movePieceDownForPlayer(io, player);
            }, 100);
          //  console.log("fall !")
        }
    }


    /*when keydown isnt press anymore, clear interval and use 1s*/


    stopFall(io, socketId) {
        const player = this.players.find(player => player.socketId === socketId);

        if (player) {
            player.fall = true;
            clearInterval(player.updateInterval);

            player.updateInterval = setInterval(() => {
                this.movePieceDownForPlayer(io, player);
            }, 1000);
          //  console.log("fall !")
        }
    }


    /* when space is press*/
    dropPiece(io, socketId) {
        const grid = this.grids.get(socketId);
        const currentPiece = this.currentPieces.get(socketId);
        let newPosition = { ...currentPiece.position };
        const player = this.players.find(player => player.socketId === socketId);
        player.dropped = true;
        while (this.isValidPlacement(grid, currentPiece.shape, { ...newPosition, y: newPosition.y + 1 })) {
            newPosition.y += 1;
        }
    
        this.updateGrid(grid, currentPiece, newPosition);
    
        this.broadcastGridUpdate(io, socketId);
            this.clearFullLines(grid, player);
            const newPiece = this.getNextPiece(player);
            if (!this.isValidPlacement(grid, newPiece.shape, newPiece.position)) {
                clearInterval(player.updateInterval);
                io.to(player.socketId).emit('game_over');
                console.log(`Game over for player ${player.username}`);
                this.removePlayer(player.socketId);

            } else {
                this.currentPieces.set(socketId, newPiece);
                this.updateGrid(grid, newPiece, newPiece.position);
                this.broadcastGridUpdate(io, socketId);
                player.dropped = false;
            }
    }
    

    /*event END*/

    /* delete a player from the game room when its game over for him */
    
    removePlayer(socketId) {
        this.players = this.players.filter(p => p.socketId !== socketId);
        this.grids.delete(socketId);
        this.currentPieces.delete(socketId);
        if (this.players.length === 0) {
            this.onDelete(this.roomName);
        }
    }
    


    broadcastGridUpdate(io, socketId) {
        const grid = this.grids.get(socketId);
        io.to(socketId).emit('grid_update', { grid });
    }
        
    getNextPiece(player) {
        if (player.currentPieceIndex >= this.pieceQueue.length) {
            this.generatePieces(1000);
        }
        const pieceTemplate = this.pieceQueue[player.currentPieceIndex++];
        return Piece.createFromTemplate(pieceTemplate);
    }

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
