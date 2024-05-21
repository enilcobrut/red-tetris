const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sanitizeHtml = require('sanitize-html');
const Game = require('./Game');
const Piece = require('./Piece');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Set up Socket.IO server with CORS configuration
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

// Object to store active games by room name
const activeGames = {};

// Helper function to find a game by player socket ID
function findGameByPlayer(socketId) {
    return Object.values(activeGames).find(game => 
        game.players.some(player => player.socketId === socketId)
    );
}

// Handle new socket connections
io.on('connection', socket => {
    console.log('A user connected', socket.id);

    // Validate username event
    socket.on('validate_username', ({ username }, callback) => {
        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            callback({ success: false, error: 'Invalid username' });
            return;
        }
        const cleanUsername = sanitizeHtml(username, {
            allowedTags: [],
            allowedAttributes: {}
        });
        callback({ success: true, username: cleanUsername });
    });

    // Join room event
    socket.on('join_room', ({ username, room }) => {
        socket.join(room);
        if (!activeGames[room]) {
            activeGames[room] = new Game(room, () => {
                console.log(`Deleting room ${room}`);
                delete activeGames[room];
            });
            activeGames[room].addPlayer(username, socket.id, true);
        } else {
            activeGames[room].addPlayer(username, socket.id);
        }
        io.to(room).emit('room_update', activeGames[room].getRoomData());
    });

    // Redirect game event
    socket.on('redirect_game', ({ username, room }) => {
        const game = activeGames[room];
        if (game && game.findPlayer(username).isOwner) {
            game.redirectGame(io);
            console.log(`Game started in room ${room} by ${username}`);
        }
    });

    // Game started event
    socket.on('game_started', ({ username, room }) => {
        const game = activeGames[room];
        if (game) {
            game.startGame(io);
        } else {
            console.error('Attempt to start game in a non-existent room');
        }
    });

    // Rotate piece event
    socket.on('rotate', () => { 
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.rotate(io, socket.id);
        }
    });

    // Fall piece event
    socket.on('fall', () => { 
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.fall(io, socket.id);
        }
    });

    // Stop fall piece event
    socket.on('stopFall', () => { 
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.stopFall(io, socket.id);
        }
    });

    // Move piece event
    socket.on('move', ({ direction }) => {
        const game = findGameByPlayer(socket.id);
        if (game) {
            if (direction === 'left') {
                game.movePlayerPieceLeft(io, socket.id);
            } else if (direction === 'right') {
                game.movePlayerPieceRight(io, socket.id);
            }
        }
    });

    // Drop piece event
    socket.on('drop', () => {
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.dropPiece(io, socket.id);
        }
    });

    // Disconnect event
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);

        let found = false;
    
        // Check each game to see if the disconnected socket has an impact
        Object.keys(activeGames).forEach(room => {
            if (activeGames[room].players.some(player => player.socketId === socket.id)) {
                found = true;  // Marquer comme trouvé
                console.log("uwuwuwu");
                if (activeGames[room].handleDisconnect(io, socket.id)) {
                    console.log(`Deleting room ${room}`);
                    delete activeGames[room];
                }
            }
        });
        console.log("EEE");
        if (!found) {
            console.log("CCC");
            io.to(socket.id).emit('handle_disconnect', {
                message: "You were not in any game room, but the disconnect was handled."
            });
        }
    });
    
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});