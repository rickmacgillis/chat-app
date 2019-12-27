const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const messages = require('./utils/messages.js');
const users = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicDir = path.join(__dirname, '../public');

app.use(express.static(publicDir));

io.on('connection', (socket) => {

    console.log('New WebSocket connection');

    socket.on('join', ({ username, room }, ack) => {

        const { error, user } = users.addUser({ id: socket.id, username, room });

        if (error !== undefined) {
            return ack(error);
        }

        socket.join(user.room);

        socket.emit('message', messages.generateMessage('[system]', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', messages.generateMessage('[system]', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: users.getUsersInRoom(user.room)
        });

        ack();

    });

    socket.on('sendMessage', (message, ack) => {
        
        const user = users.getUser(socket.id);

        if (user === undefined) {
            return {
                error: 'You are not part of any room.',
            };
        }

        const filter = new Filter();
        if (filter.isProfane(message)) {
            return ack('Bitch slappin\' the asshole is not allowed!');
        }

        io.to(user.room).emit('message', messages.generateMessage(user.username, message));
        ack();

    });
    
    socket.on('sendLocation', ({ latitude, longitude }, ack) => {

        const user = users.getUser(socket.id);

        io.to(user.room).emit('locationMessage', messages.generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`));
        ack();

    });

    socket.on('disconnect', () => {
        
        const user = users.removeUser(socket.id);
        if (user === undefined) {
            return;
        }

        io.to(user.room).emit('message', messages.generateMessage('[system]', `${user.username} has left.`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: users.getUsersInRoom(user.room)
        });

    });

});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});
