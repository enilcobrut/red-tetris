class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId;
        this.isOwner = false;
        this.currentPieceIndex = 0;
        this.currentPiece = null;
        this.score = 0;
        this.dropped = false;
        this.fall = false;
        this.updateInterval = null; // Reference to the interval
        this.dropInterval = 0;
    }
}
module.exports = Player;
