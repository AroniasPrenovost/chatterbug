var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var userCount = 0;
var users = [];

io.on('connection', function (socket) {

    // { address: '::1', family: 'IPv6', port: 61604 }
    const socket_data = socket.request.connection._peername;
    users.push(socket_data);

    // count # of connections 
    userCount++;

    // get names of users 
    var userNames = [];
    users.forEach((element) => {
        userNames.push(element.port);
    });
    io.sockets.emit('userCount', {
        userCount: userCount,
        userList: userNames
    });

    // chat 
    socket.on('chat message', function (msg) {
        io.emit('chat message', socket_data.port + ': ' + msg);
    });

    // notify when user enters room 
    socket.join('room', function () {
        io.emit('userJoined', socket_data.port + ' joined the room');
    });

    // notify when user exits room 
    socket.on('disconnect', function () {
        io.emit('userLeft', socket_data.port + ' left the room');
        userCount--;
        for (var i = 0; i < users.length; i++) {
            if (users[i].port === socket_data.port) {
                users.splice([i], 1);
            }
        }

        var userNames = [];
        users.forEach((element) => {
            userNames.push(element.port);
        });
        io.sockets.emit('userCount', {
            userCount: userCount,
            userList: userNames
        });
    });

    // show when user is typing 
    socket.on('typing', function (data) {
        socket.broadcast.emit('typing', socket_data.port + ' is ' + data);
    });

});

http.listen(3000, function () {
    console.log('listening on *:3000');
});
