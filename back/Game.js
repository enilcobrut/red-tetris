const Player = require('./Player');
const Piece = require('./Piece');
const piecesData = require('./tetris/pieces').FORMS;

class Game {
    constructor(roomName, owner) {
        this.roomName = roomName;
        this.players = [];
        this.currentPiece = null;
        this.addPlayer(owner.username, owner.socketId, true);
    }

    addPlayer(username, socketId, isOwner = false) {
        const player = new Player(username, socketId);
        player.isOwner = isOwner;
        this.players.push(player);
    }

    findPlayer(username) {
        return this.players.find(p => p.username === username);
    }

    startGame(io) {
        this.generateNextPiece(io);
        io.to(this.roomName).emit('game_started', {
            room: this.roomName, 
            url: `/${this.roomName}/${this.findOwner().username}`
        });
    }

    generateNextPiece(io) {
        this.currentPiece = Piece.getRandomPiece(piecesData);
        io.to(this.roomName).emit('new_piece', { piece: this.currentPiece });
    }

    findOwner() {
        return this.players.find(p => p.isOwner);
    }

    getRoomData() {
        return {
            roomName: this.roomName,
            players: this.players.map(player => ({
                name: player.username,
                socketId: player.socketId,
                isOwner: player.isOwner
            })),
            owner: this.findOwner().username
        };
    }
}
module.exports = Game;
