class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId;
        this.isOwner = false;
        this.currentPieceIndex = 0;
        this.nextPieceIndex = 0;
        this.currentPiece = null;
        this.score = 0;
        this.dropped = false;
        this.fall = false;
        this.updateInterval = null; // Reference to the interval
        this.dropInterval = 0;
        this.level = 1;
        this.finalInterval = 1000;
        this.rotationCounter = 0; // New property to track rotations
    }
}
module.exports = Player;
