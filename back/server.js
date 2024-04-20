const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sanitizeHtml = require('sanitize-html');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",  // Remplacez '*' par vos URLs de frontend en production
        methods: ["GET", "POST"]
    }
});

const rooms = {};

io.on('connection', socket => {
    console.log('A user connected', socket.id);

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
        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = { roomName: room, players: [] };
        }
        if (!rooms[room].players.includes(username)) {
            rooms[room].players.push(username);
        }
        setTimeout(() => {
            io.to(room).emit('room_update', rooms[room]);
        }, 300);
    });

    socket.on('disconnecting', () => {
        Object.keys(socket.rooms).forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
                if (rooms[room]) {
                    rooms[room].players = rooms[room].players.filter(player => player !== socket.id);
                    if (rooms[room].players.length === 0) {
                        delete rooms[room];
                    } else {
                        io.to(room).emit('room_update', rooms[room]);
                    }
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
