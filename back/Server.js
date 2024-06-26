const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sanitizeHtml = require('sanitize-html');
const Game = require('./Game');
const path = require('path');
const fs = require('fs');

// Mute the console logs and errors
//console.log = function() {};
console.error = function() {};

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

    function getTop10Users(jsonData, category) {
        const filteredData = jsonData.filter(user => user[category] !== undefined);
        filteredData.sort((a, b) => b[category] - a[category]);
        return filteredData.slice(0, 10);
    }


    const sendData = (event, filePath, filterFn, defaultValue) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                socket.emit(event, { error: 'Error reading file' });
                return;
            }
            const jsonData = JSON.parse(data);
            const filteredData = filterFn ? jsonData.filter(filterFn) : jsonData;
            if (filteredData.length === 0) {
                socket.emit(event, defaultValue);
            } else {
                socket.emit(event, filteredData);
            }
        });
    };

    function sendScores(event, filePath, data, category) {
        fs.readFile(filePath, 'utf8', (err, fileData) => {
            if (err) {
                console.error('Error reading file:', err);
                socket.emit(event, { error: 'Error reading file' });
                return;
            }
    
            const jsonData = JSON.parse(fileData);
            const userScores = [];
    
            // Iterate through each user
            jsonData.forEach(user => {
                // Check if the user has scores
                if (user.scores && user.scores.length > 0) {
                    // Get the highest score for the user
                    const highestScore = Math.max(...user.scores);
                    // Push the username and highest score to the array
                    userScores.push({ username: user.username, score: highestScore });
                }
            });
    
            // Sort the userScores array based on score in descending order
            userScores.sort((a, b) => b.score - a.score);
    
            // Get the top 10 users based on highest score
            const topTenUsers = userScores.slice(0, 10);
    
            // Emit the top 10 users to the client
            socket.emit(event, topTenUsers);
        });
    }    
 
    const sendDataStatistics = (event, filePath, defaultValue, category) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                socket.emit(event, { error: 'Error reading file' });
                return;
            }
    
            const jsonData = JSON.parse(data);
    
            // Filter out entries where the category is undefined
            const validEntries = jsonData.filter(entry => entry[category] !== undefined);
    
            // Sorting the validEntries based on the category descending
            validEntries.sort((a, b) => b[category] - a[category]);
            
            // Extracting top 10 entries
            const topTen = validEntries.slice(0, 10).map(entry => ({
                username: entry.username,
                [category]: entry[category]
            }));
    
            // Checking if we have entries
            if (topTen.length === 0) {
                socket.emit(event, defaultValue);
            } else {
                socket.emit(event, topTen);
            }
        });
    };
    // Handle getData event from client
    socket.on('getData', (data) => {
        let filePath = '';
        let category = '';

        if (data.sort == 'Win') {
            category ='win';
        }
        else if (data.sort == 'Loss') {
            category ='loss';
        }
        else if (data.sort == 'Played') {
            category = 'played';
        }
        else if (data.sort == 'Lines') {
            category = 'linesCleared';
        }
        else if (data.sort == 'Tetris') {
            category ='tetrisScored';
        } else if (data.sort == 'Score') {
            category = 'Score';
        } else if (data.sort == 'Scores') {
            category = 'Scores';
        }

        if (category == 'Score') {
            filePath = path.join(__dirname, 'db/Leaderboard.json');
            sendData('data', filePath);
        } else if (category == 'Scores') {
            filePath = path.join(__dirname, 'db/PersonalBest.json');
            sendScores('data', filePath, data, category);
        }
        else {
            filePath = path.join(__dirname, 'db/Statistics.json');
            sendDataStatistics('data', filePath, data, category);
        }
    });
    
    socket.on('getPlayerScores', (username) => {
        const filePath = path.join(__dirname, 'db/PersonalBest.json');
        const defaultScores = { username, scores: [] };
        sendData('playerScores', filePath, player => player.username === username, defaultScores);
    });

    socket.on('getPlayerHistory', (username) => {
        const filePath = path.join(__dirname, 'db/Statistics.json');
        const defaultHistory = { username, played: 0, single: 0, win: 0, loss: 0, linesCleared: 0, tetrisScored: 0 };
        sendData('playerHistory', filePath, player => player.username === username, defaultHistory);
    });

    // Validate username event
    socket.on('validate_username', ({ username }, callback) => {
        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Invalid username' });
            }
            return;
        }
        const cleanUsername = sanitizeHtml(username, {
            allowedTags: [],
            allowedAttributes: {}
        }).trim();
    
        const usernameRegex = /^[a-zA-Z0-9]{3,10}$/;
    
        if (!usernameRegex.test(cleanUsername)) {
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Username must be 3-10 characters long and contain only alphanumeric characters.' });
            }
            return;
        }
    
        if (typeof callback === 'function') {
            callback({ success: true, username: cleanUsername });
        }
    });

    socket.on('join_room', ({ username, room }) => {
        if (!isValidRoomName(room)) {
            console.error("Invalid room name!");
            socket.emit('join_error', { message: 'Cannot join. Invalid room name.' });
            return;
        }
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
            
            if (!activeGames[room].started || !activeGames[room].isJourney) {
                activeGames[room].addPlayer(username, socket.id, activeGames[room].players.length === 0);
            }

            if (!activeGames[room].isJourney)
                io.to(room).emit('room_update', activeGames[room].getRoomData());
            else
                socket.emit('join_error', { message: 'Cannot join. Journey is going on in that room.' });
        }
    });

    socket.on('sendAllActiveRooms', () => {
        const roomNames = Object.keys(activeGames);
        socket.emit('activeRooms', { rooms: roomNames });
    });

    socket.on('join_room_journey', ({ username, room }) => {
        if (!isValidRoomName(room)) {
            console.error("Invalid room name!");
            socket.emit('join_error_journey', { message: 'Cannot join. Invalid room name.' });
            return;
        }
        if (activeGames[room]) {
            // Send an error message back to the client if the game has already started
            socket.emit('join_error_journey', { message: 'Cannot join. The game has already started.' });
        } else {
            socket.join(room);
            if (!activeGames[room]) {
                activeGames[room] = new Game(room, () => {
                    console.log(`Deleting room ${room}`);
                    delete activeGames[room];
                }, true);
            }
    
            if (!activeGames[room].started) {
                activeGames[room].addPlayer(username, socket.id, activeGames[room].players.length === 0);
                socket.emit('room_update_journey', activeGames[room].getRoomData()); // Emit only to the joining socket
            }
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
            console.log("Room is empty. Deleting room.");
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
    socket.on('game_started', ({ room }) => {
        const game = activeGames[room];
        if (game) {
            game.startGame(io);
            //console.log(game.players);
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

function isValidRoomName(room) {
    const roomNameRegex = /^[a-zA-Z0-9]{1,10}$/;
    return roomNameRegex.test(room);
}

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.REACT_APP_SOCKET_URL || "localhost";
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});
