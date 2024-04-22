const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sanitizeHtml = require('sanitize-html');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
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
            rooms[room] = {
                roomName: room,
                players: [{ name: username, socketId: socket.id, isOwner: true }],
                owner: username
            };
        } else {
            if (!rooms[room].players.find(player => player.name === username)) {
                rooms[room].players.push({ name: username, socketId: socket.id, isOwner: false });
            }
        }
        io.to(room).emit('room_update', rooms[room]);
    });
    
    
    

    socket.on('start_game', ({ username, room }) => {
        console.log("start back");
        const roomData = rooms[room];
        console.log("Room Data:", roomData);
    
        if (!roomData) {
            console.log(`No room data found for room: ${room}`);
            return;
        }
    
        const player = roomData.players.find(p => p.name === username);
        if (player && player.isOwner) {
            console.log("just before redirect");
            io.to(room).emit('game_started', { room, url: `/${room}/${username}` });
        } else {
            console.log("User is not the owner or player data is missing", { username, isOwner: player ? player.isOwner : "Player not found" });
        }
    });
    
    
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
