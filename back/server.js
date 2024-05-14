// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const sanitizeHtml = require('sanitize-html');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// const rooms = {};
 //const { getRandomPiece } = require('./tetris/pieces');
// io.on('connection', socket => {
//     console.log('A user connected', socket.id);

//     socket.on('validate_username', ({ username }, callback) => {
//         if (!username || typeof username !== 'string' || username.trim().length === 0) {
//             callback({ success: false, error: 'Invalid username' });
//             return;
//         }
//         const cleanUsername = sanitizeHtml(username, {
//             allowedTags: [],
//             allowedAttributes: {}
//         });
//         callback({ success: true, username: cleanUsername });
//     });

//     socket.on('join_room', ({ username, room }) => {
//         socket.join(room);
//         if (!rooms[room]) {
//             rooms[room] = {
//                 roomName: room,
//                 players: [{ name: username, socketId: socket.id, isOwner: true }],
//                 owner: username
//             };
//         } else {
//             if (!rooms[room].players.find(player => player.name === username)) {
//                 rooms[room].players.push({ name: username, socketId: socket.id, isOwner: false });
//             }
//         }
//         io.to(room).emit('room_update', rooms[room]);
//     });
    
    
    
//     socket.on('start_game', ({ username, room }) => {
//         const roomData = rooms[room];
//         if (!roomData) {
//             console.log(`No room data found for room: ${room}`);
//             return;
//         }
    
//         const player = roomData.players.find(p => p.name === username);
//         if (player && player.isOwner) {
//             console.log("Starting game and redirecting users");
//             io.to(room).emit('game_started', { room, url: `/${room}/${username}` });
//         } else {
//             console.log("User is not the owner or player data is missing", { username, isOwner: player ? player.isOwner : "Player not found" });
//         }
//     });
    
//     socket.on('request_pieces', ({ username, room }) => {
//         const roomData = rooms[room];
//         if (roomData && roomData.players.find(p => p.name === username)) {
//             console.log("Generating and sending new pieces");
//             const piece = getRandomPiece();
//             socket.emit('new_piece', { piece });
//         }
//     });
    
    
    
    
//     socket.on('disconnect', () => {
//         console.log(`User disconnected: ${socket.id}`);
//     });
// });

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//     console.log(`Server listening on http://localhost:${PORT}`);
// });


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sanitizeHtml = require('sanitize-html');
const Game = require('./Game');
const Piece = require('./Piece');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const games = {}; // Utiliser `games` pour toutes les références

io.on('connection', socket => {
    console.log('A user connected', socket.id);

    socket.on('validate_username', ({ username }, callback) => {
        if (!username || typeof username !== 'string' || username.trim().length == 0) {
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
        socket.join(room);
        if (!games[room]) {
            games[room] = new Game(room, () => {
                console.log(`Deleting room ${room}`);
                delete games[room];
            });
            games[room].addPlayer(username, socket.id, true);
        } else {
            games[room].addPlayer(username, socket.id);
        }
        io.to(room).emit('room_update', games[room].getRoomData());
    });
    

    socket.on('redirect_game', ({ username, room }) => {
        const game = games[room];
        if (game && game.findPlayer(username).isOwner) {
            game.redirectGame(io);
            console.log(`Game started in room ${room} by ${username}`);
        }
    });

    socket.on('game_started', ({ username, room }) => {
        const game = games[room];
        if (game) {
            game.startGame(io);
        } else {
            console.error('Tentative de démarrage de jeu dans une salle inexistante');
        }
    });
    
    socket.on('rotate', () => { 
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.rotate(io, socket.id);
        }

    })  

    socket.on('fall', () => { 
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.fall(io, socket.id);
        }

    })  


    socket.on('stopFall', () => { 
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.stopFall(io, socket.id);
        }

    })  
    socket.on('move', ({ direction }) => {
        const game = findGameByPlayer(socket.id); // Trouver le jeu du joueur
        if (game) {
            if (direction === 'left') {
                game.movePlayerPieceLeft(io, socket.id);
            } else if (direction === 'right') {
                game.movePlayerPieceRight(io, socket.id);
            }
        // io.to(game.roomName).emit('grid_update', game.getGridData());
        }
    });

    socket.on('drop', () => {
        const game = findGameByPlayer(socket.id);
        if (game) {
            game.dropPiece(io, socket.id);
        }
    });

    

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
    
        // Itérer sur chaque jeu pour voir si le socket déconnecté a un impact
        Object.keys(games).forEach(room => {
            if (games[room].handleDisconnect(io, socket.id)) {
                console.log(`Deleting room ${room}`);
                delete games[room];  // Supprimer la salle si le jeu indique qu'il doit être terminé
            }
        });
    });
});

function findGameByPlayer(socketId) {
    // Recherche dans tous les jeux pour trouver où ce socketId est utilisé
    return Object.values(games).find(game => 
        game.players.some(player => player.socketId === socketId));
}


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
