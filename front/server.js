const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require("socket.io");
const sanitizeHtml = require('sanitize-html');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const rooms = {};  // Stocke l'état des salles

app.prepare().then(() => {
    const server = express();
    const httpServer = http.createServer(server);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",  // Configurer correctement en production
            methods: ["GET", "POST"]
        }
    });

    // Log de démarrage du serveur HTTP et WebSocket
    io.on('connection', socket => {
        console.log('A user connected', socket.id);

        socket.on('validate_username', ({ username }, callback) => {
            if (!username || typeof username !== 'string' || username.trim().length === 0) {
                callback({ success: false, error: 'Invalid username' });
                return;
            }
            const cleanUsername = sanitizeHtml(username);
            callback({ success: true, username: cleanUsername });
            console.log(`Username validation success: ${cleanUsername}`);
        });

        socket.on('join_room', ({ username, room }) => {
            socket.join(room);
            console.log(`User ${username} joined room: ${room}`);
            if (!rooms[room]) {
                rooms[room] = { roomName: room, players: [] };
                console.log(`Room created: ${room}`);
            }
            if (!rooms[room].players.includes(username)) {
                rooms[room].players.push(username);
                console.log(`Player ${username} added to room: ${room}`);
            }
            setTimeout(() => {
                io.to(room).emit('room_update', rooms[room]);
                console.log(`Room ${room} updated with delay:`, rooms[room]);
            }, 300);
        });

        socket.on('disconnecting', () => {
            console.log(`User disconnecting: ${socket.id}`);
            for (let room of socket.rooms) {
                if (room !== socket.id) {
                    socket.leave(room);
                    console.log(`User ${socket.id} left room: ${room}`);
                    if (rooms[room]) {
                        rooms[room].players = rooms[room].players.filter(player => player !== socket.id);
                        if (rooms[room].players.length === 0) {
                            delete rooms[room];
                            console.log(`Room deleted: ${room}`);
                        } else {
                            io.to(room).emit('room_update', rooms[room]);
                        }
                    }
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    server.all('*', (req, res) => handle(req, res));

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log(`HTTP and WebSocket server listening on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Error starting server:', err);
});
