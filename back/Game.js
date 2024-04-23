const Player = require('./Player');
const Piece = require('./Piece');

class Game {
    constructor(roomName) {
        this.roomName = roomName;
        this.players = [];
        this.owner = null;
        this.pieceQueue = [];
        this.currentPieceIndex = 0;
        this.initialPieceBroadcasted = false; // Nouveau drapeau pour suivre la première diffusion

    }
    generateNewPiece() {
        this.currentPiece = new Piece();  // Générer une nouvelle pièce et la stocker
    }
    getCurrentPiece() {
        return this.currentPiece;  // Retourner la pièce courante
    }

    broadcastInitialPieces(io) {
        console.log(`Broadcasting initial piece to all players in room ${this.roomName}`);
        const piece = Piece.getRandomPiece(); // Assurez-vous d'avoir une pièce à envoyer
        this.players.forEach(player => {
            io.to(player.socketId).emit('new_piece', { piece });
        });
    }
    requestInitialPiece(io) {
        if (!this.initialPieceBroadcasted) {
            this.broadcastNextPiece(io);
            this.initialPieceBroadcasted = true; // Assurez-vous que cela ne se produit qu'une fois
        }
    }


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

    resetPieceReceptionFlags() {
        this.players.forEach(player => {
            player.hasReceivedPiece = false;
        });
    }

    startGame(io) {
        // Avertir tous les joueurs que le jeu va commencer
        io.to(this.roomName).emit('game_started', {
            room: this.roomName,
            url: `/${this.roomName}/${this.owner.username}`
        });
    }


    broadcastNextPiece(io) {
        console.log(`Broadcasting next piece to room ${this.roomName}`);
        if (this.currentPieceIndex >= this.pieceQueue.length) {
            this.generatePieces(5);  // Ne générer des pièces que si nécessaire
        }
        const piece = this.pieceQueue[this.currentPieceIndex++];
        io.to(this.roomName).emit('new_piece', { piece });
        console.log(`Piece broadcasted to room ${this.roomName}:`, piece);
    }
    

    getNextPiece() {
        if (this.currentPieceIndex >= this.pieceQueue.length) {
            this.generatePieces(5);
        }
        return this.pieceQueue[this.currentPieceIndex++];
    }

    // generatePieces(count) {
    //     for (let i = 0; i < count; i++) {
    //         this.pieceQueue.push(Piece.getRandomPiece());
    //     }
    // }

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

    handleDisconnect(socketId) {
        this.players = this.players.filter(player => player.socketId !== socketId);
        if (this.players.length == 0) {
            this.pieceQueue = [];
            this.currentPieceIndex = 0;
            return true;
        }
        return false;
    }
}

module.exports = Game;
