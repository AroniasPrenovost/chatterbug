var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var users = [];

io.on('connection', function (socket) {
    socket.on('newuser', function (usernameInput) {

        // handle duplicate connections 
        // for (var i = 0; i < users.length; i++) {
        //     if (users[i].port === socket.request.connection._peername.port) {
        //         io.emit('duplicateUser');
        //     }
        // }

        // { address: '::1', family: 'IPv6', port: 61604 }
        const socket_data = socket.request.connection._peername;
        socket_data.alias = usernameInput;
        users.push(socket_data);

        // get names of users 
        var userNames = [];
        users.forEach((e) => { userNames.push(e.alias); });
        io.sockets.emit('userCount', {
            userCount: userNames.length,
            userList: userNames
        });

        // chat 
        socket.on('chat message', function (msg) {
            io.emit('chatMessage', socket_data.alias + ': ' + msg);
            socket_data.message = msg;
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

            var userNames = [];
            users.forEach((e) => { userNames.push(e.alias); });
            io.sockets.emit('userCount', {
                userCount: userNames.length,
                userList: userNames
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
