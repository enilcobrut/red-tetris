class Player {
    constructor(username, socketId) {
        this.username = username;
        this.socketId = socketId;
        this.isOwner = false;
    }
}
module.exports = Player;
