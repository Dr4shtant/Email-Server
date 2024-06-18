
const express = require('express');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();

const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.crt', 'utf8');

const credentials = { key: privateKey, cert: certificate };
const server = https.createServer(credentials, app);

const io = socketIo(server);

const users = {};


const sampleUsers = {
    "user1@example.com": "password1",
    "user2@example.com": "password2"
};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('login', ({ username, password }) => {
        if (sampleUsers[username] === password) {
            users[socket.id] = username;
            console.log(`${username} connected with id ${socket.id}`);
            socket.emit('loginSuccess', username);
        } else {
            socket.emit('loginFailure', 'Invalid username or password');
        }
    });

    socket.on('sendMessage', ({ to, subject, message }) => {
        const toSocketId = Object.keys(users).find(id => users[id] === to);
        if (toSocketId && io.sockets.sockets.get(toSocketId)) { // Check if the recipient is connected
            io.to(toSocketId).emit('receiveMessage', { from: users[socket.id], subject, message });
            socket.emit('success', `Email sent to ${to}`);
        } else {
            socket.emit('errorMessage', `User '${to}' not found`);
        }
    });

    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            console.log(`${username} disconnected`);
            delete users[socket.id];
        }
    });
});


app.use(express.static(path.join(__dirname, 'public')));

server.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000 with SSL');
});
