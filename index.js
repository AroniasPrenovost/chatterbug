var app = require('express')();
var express = require('express');
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var users = [];

function getActiveUserStats(arr) {
    var userNames = [];
    arr.forEach((e) => { userNames.push(e.alias); });
    return userNames;
}

// array of all lines drawn
var lineHistory = [];

io.on('connection', function (socket) {
    socket.on('newuser', function (usernameInput) {

        // // handle duplicate connections 
        // for (var i = 0; i < users.length; i++) {
        //  if (users[i].port === socket.request.connection._peername.port) {
        //         io.emit('duplicateUser');
        //  }
        // }

        socket.on('addition', function (data) {
            io.emit('addition', data);
        });

        socket.on('subtraction', function (data) {
            io.emit('subtraction', data);
        });

        socket.on('multiplication', function (data) {
            io.emit('multiplication', data);
        });

        socket.on('division', function (data) {
            io.emit('division', data);
        });

        // draw 
        // send the history to the new client
        for (var i in lineHistory) {
            socket.emit('drawLine', { line: lineHistory[i] });
        }

        // add handler for message type "drawLine".
        socket.on('drawLine', function (data) {
            // add received line to history 
            lineHistory.push(data.line);
            // send line to all clients
            io.emit('drawLine', { line: data.line });
        });

        // add handler for clearing a line 
        socket.on('clearCanvas', function () {
            io.emit('clearCanvas');
        });
        // end draw 

        // { address: '::1', family: 'IPv6', port: 61604 }
        const socket_data = socket.request.connection._peername;
        socket_data.alias = usernameInput;
        socket_data.socket_id = socket.id;
        users.push(socket_data);

        // get names of users 
        var userNames = getActiveUserStats(users);
        io.sockets.emit('userCount', {
            userCount: userNames.length,
            userNameList: userNames
        });

        // chat { message}
        socket.on('chat message', function (msg) {
            io.emit('chatMessage', { alias: socket_data.alias, message: msg });
            socket_data.message = msg;
        });

        // private chat { alias, message}
        socket.on('private message', function (data) {
            if (socket_data.alias === data.alias) {
                console.log('can\'t send messages to yourself');
                return false;
            }

            data.sender = socket_data.alias;
            for (var i = 0; i < users.length; i++) {
                if (users[i].alias === data.alias) {
                    data.receiver = users[i].alias;
                    io.to(users[i].socket_id).emit('privateMessage', data);
                }
            }
        });

        // notify when user enters room 
        socket.join('room', function () {
            io.emit('userJoined', socket_data.alias + ' joined the room');
        });

        // notify when user exits room 
        socket.on('disconnect', function () {
            io.emit('userLeft', socket_data.alias + ' left the room');
            for (var i = 0; i < users.length; i++) {
                if (users[i].port === socket_data.port) {
                    users.splice([i], 1);
                }
            }

            var userNames = getActiveUserStats(users);
            io.sockets.emit('userCount', {
                userCount: userNames.length,
                userNameList: userNames
            });
        });

        // show when user is typing 
        socket.on('typing', function (data) {
            socket.broadcast.emit('typing', socket_data.alias + ' is ' + data);
        });
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});
