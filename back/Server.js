const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sanitizeHtml = require('sanitize-html');
const Game = require('./Game');
const path = require('path');
const fs = require('fs');

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

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
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

    const sendData = (event, filePath, filterFn) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                socket.emit(event, { error: 'Error reading file' });
                return;
            }

            const jsonData = JSON.parse(data);
            const filteredData = filterFn ? jsonData.filter(filterFn) : jsonData;
           // console.log(`Sending data for ${event}:`, filteredData);
            socket.emit(event, filteredData);
        });
    };
    
    // Handle getData event from client
    socket.on('getData', () => {
        const filePath = path.join(__dirname, 'db/Leaderboard.json');
        sendData('data', filePath);
    });

    socket.on('getPlayerScores', (username) => {
        const filePath = path.join(__dirname, 'db/PersonalBest.json');
        sendData('playerScores', filePath, player => player.username === username);
    });

    socket.on('getPlayerHistory', (username) => {
        const filePath = path.join(__dirname, 'db/Statistics.json');
        sendData('playerHistory', filePath, player => player.username === username);
    });


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
    socket.on('join_room', ({ username, room }) => {
        if (activeGames[room] && activeGames[room].started) {
            console.error("Game already started!");
            socket.emit('join_error', { message: 'Cannot join. The game has already started.' });
        } else {
            socket.join(room);
            if (!activeGames[room]) {
                activeGames[room] = new Game(room, () => {
                    console.log(`Deleting room ${room}`);
                    delete activeGames[room];
                });
            }
            
            if (!activeGames[room].started) {
                activeGames[room].addPlayer(username, socket.id, activeGames[room].players.length === 0);
            }
    
            io.to(room).emit('room_update', activeGames[room].getRoomData());
        }
    });
    
    

    socket.on('leave_room', ({ room, username }) => {
        const game = activeGames[room];
        if (!game) {
            console.error("Room not found");
            return;
        }

        game.removePlayerRoom(socket.id);

        // Check if the game should be deleted or not
        if (game.players.length === 0) {
            console.log("no more room must ");

        } else {
            io.to(room).emit('room_update', game.getRoomData());
            console.log(`Updated room data sent after ${username} left the room.`);
        }
    });


    socket.on('leave_game', ({ room, username }) => {
        const game = activeGames[room];
        if (!game) {
            console.error("Room not found");
            return;
        }    
        // Find the player using the username
        const player = game.findPlayer(username);
        if (player) {
            console.log("playeur found");
            game.removePlayer(io, player.socketId);
        } else {
            console.error("Player not found in room");
        }
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
                found = true;
                if (activeGames[room].handleDisconnect(io, socket.id)) {
                    console.log(`Deleting room ${room}`);

                    delete activeGames[room];
                }
            }
        });
        if (!found) {
            io.to(socket.id).emit('handle_disconnect', {
                message: "You were not in any game room, but the disconnect was handled."
            });
        }
    });
    
});

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.REACT_APP_SOCKET_URL || "localhost";
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});
