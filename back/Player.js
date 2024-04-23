class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId;
        this.isOwner = false;
        this.hasReceivedPiece = false; // Nouveau drapeau pour suivre si le joueur a reçu la pièce
    }
}
module.exports = Player;
