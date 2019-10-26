// globals 
var nameTag = document.getElementById('nameTag');
var usernameModal = document.getElementById('modal');
var usernameForm = document.getElementById('usernameForm');
var usernameInput = document.getElementById('usernameInput');
usernameInput.focus();
var userName;

var privatemessageModal = document.getElementById('privatemessageModal');
var privatemessageForm = document.getElementById('privatemessageForm');
var privatemessageInput = document.getElementById('privatemessageInput');

var tabContent = document.getElementById('tabContent');
var tabs = document.getElementById('tabs');

var privateMessages = document.getElementById('privateMessages');

var messages = document.getElementById('messages');
var chatmessageInput = document.getElementById('message');

var userTally = document.getElementById('userCount');
var userList = document.getElementById('userList');

// editor tools 
var eraseBtn = document.getElementById('eraser');
var additionBtn = document.getElementById('addition');
var subtractionBtn = document.getElementById('subtraction');
var divisionBtn = document.getElementById('division');
var multiplicationBtn = document.getElementById('multiplication');

// get canvas element and create context
var canvas = document.getElementById('drawing');
var context = canvas.getContext('2d');
var width = window.innerWidth;
var height = window.innerHeight;
canvas.width = width;
canvas.height = height;

////////////
// 
// Match problem generators 
//
////////////

// args = 'addition', 'subtraction', 'division', 'multiplation'
// to do: add more 

function generateRandomNumbers() {
    var arr = []
    while (arr.length < 8) {
        var randomnumber = Math.ceil(Math.random() * 100)
        if (arr.indexOf(randomnumber) === -1) { arr.push(randomnumber) }
    }
    return arr;
}

function generateEquation(type, maxIntSize, evenOrOdd) {

    var a = generateRandomNumbers()[0];
    var b = generateRandomNumbers()[1];
    var equation;

    if (evenOrOdd === null) {
        evenOrOdd = false;
    }

    if (evenOrOdd !== 'random') {
        while ((a / b) % 2 !== 0) {
            a = generateRandomNumbers()[0];
            b = generateRandomNumbers()[0];
        }
    }

    // 2x digit
    while (a.toString().length === 1 || a.toString().length > maxIntSize) {
        a = generateRandomNumbers()[0];
    }
    // prepend 0 
    if (b.toString().length === 1) {
        b = '0' + b;
    }

    var line = `____`;
    switch (type) {
        case 'addition':
            equation = `${type}\n${a}\n+ ${b}\n${line}`;
            break;
        case 'subtraction':
            equation = `${type}\n${a}\n- ${b}\n${line}`;
            break;
        case 'multiplication':
            equation = `${type}\n${a}\nx ${b}\n${line}`;
            break;
        case 'division':
            while (b.toString().length > 1) {
                b = generateRandomNumbers()[0];
            }
            while (b.toString().length > 1) {
                b = generateRandomNumbers()[0];
            }
            equation = `${type}\n${b}/${a} =`;
            break;
        default:
        // 'invalid argument'
    }
    return equation;
}

function drawEquation(args) {
    // equation = `${b} / ${a}`
    // first line is equation key 
    var lines = args.split('\n');
    for (var i = 0; i < lines.length; i++) {
        context.font = '40px Arial';
        var indent = 0;
        var lineheight = 50;
        if (i === 0) { continue; }
        if (lines[0] === 'multiplication' ||
            lines[0] === 'addition' ||
            lines[0] === 'subtraction') {
            if (i === 1) { indent = 30; }
            if (i === 3) { lineheight = 35; }
        }
        context.fillText(lines[i], ((canvas.width / 4) + indent), ((canvas.height / 2) + (i * lineheight)));
    }
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

////////////
// 
// Messaging UI 
//
////////////

// private message tabs 
var d = document,
    tabs = d.querySelector('.tabs'),
    tab = d.querySelectorAll('li'),
    contents = d.querySelectorAll('.content');
tabs.addEventListener('click', function (e) {
    if (e.target && e.target.nodeName === 'LI') {
        // change tabs
        for (var i = 0; i < tab.length; i++) {
            tab[i].classList.remove('active');
        }
        e.target.classList.toggle('active');

        // change content
        for (i = 0; i < contents.length; i++) {
            contents[i].classList.remove('active');
        }

        var tabId = '#' + e.target.dataset.tabId;
        d.querySelector(tabId).classList.toggle('active');
    }
});

// fix chat log overflow scroll to bottom 
function fixScrollToBottom(str) {
    var e = document.querySelector('#' + str);
    e.scrollTop = e.scrollHeight - e.clientHeight;
}

// flags: 'time', 'other', 'self', 'userlist'
function appendLi(str, e, flag) {
    var li = document.createElement('LI');
    var msgNode = document.createTextNode(str);
    var div = document.createElement('DIV');
    div.appendChild(msgNode);

    switch (flag) {
        case 'other':
            div.classList.add('otherChatLi');
            break;
        case 'self':
            div.classList.add('selfChatLi');
            break;
        case 'userlist':
            div.classList.add('userListLi');
            break;
        case 'generic':
            div.classList.add('genericChatLi');
            break;
        case 'typing':
            div.classList.add('isTypingLi');
            break;
        default:
            div.classList.add('genericChatLi');
    }

    li.appendChild(div);
    e.appendChild(li);
    fixScrollToBottom('messages'); // pass parent container 
}

function formatDate(date) {
    var monthNames = [
        'January', 'February', 'March',
        'April', 'May', 'June', 'July',
        'August', 'September', 'October',
        'November', 'December'
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return monthNames[monthIndex] + ' ' + day + ', ' + year;
}

function removeIsTypingDuplicates(str) {
    var listItems = document.querySelectorAll('#messages li');
    for (var i = 0; i < listItems.length; i++) {
        if (i !== listItems.length - 1) {
            if (listItems[i].textContent === str) {
                listItems[i].parentNode.removeChild(listItems[i]);
            }
        }
    }
}

function removeTrailingTyping() {
    setTimeout(function () {
        var listItems = document.querySelectorAll('#messages li');
        var index = 1;
        var len = (listItems.length / 2) + 1;
        for (var i = 0; i < len; i++) {
            var lastItem = listItems[listItems.length - index];
            if (lastItem.childNodes[0].innerText.includes('is typing...')) {
                lastItem.parentNode.removeChild(lastItem);
            } else { index++ }
        }
    }, 1000);
}

function createPrivateChatId(a, b) {
    var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var x = [a, b].sort();
    x = x[0].concat(x[1]).replace(/ /g, '');
    return x;
}

// update private messages args {}
function updatePrivateMessageLog(args) {

    // {'alias':'Michael','message':'It's good to hear from you.','sender':'Patty','receiver':'Michael'}
    var uniqueChatId = createPrivateChatId(args.sender, args.receiver);

    // search tabs for unique chat id 
    var tabItems = document.querySelectorAll('#tabs li');

    for (var i = 0; i < tabItems.length; i++) {
        if (tabItems[i].attributes['data-tab-id'].nodeValue === uniqueChatId) {
            var log = document.getElementById(uniqueChatId + '_logs');
            var li = document.createElement('LI');
            li.innerHTML = `<span>${args.sender}: ${args.message}</span>`;
            log.appendChild(li);
            return false;
        }
    }

    // create new private message tab 
    var tabLi = document.createElement('LI');
    tabLi.innerHTML = `<span>From: ${args.sender}</span>`;
    if (tabItems.length < 1) tabLi.className = 'active';
    tabLi.setAttribute('data-tab-id', uniqueChatId);
    tabs.appendChild(tabLi);

    // private chat log container
    var div = document.createElement('div');
    div.classList.add('content');
    if (tabItems.length < 1) div.classList.add('active');
    div.id = uniqueChatId;

    // private chat log 
    var ul = document.createElement('UL');
    ul.id = uniqueChatId + '_logs';
    var chatLi = document.createElement('LI');
    chatLi.innerHTML = `<span>${args.sender}: ${args.message}</span>`;

    ul.appendChild(chatLi);
    div.appendChild(ul);
    tabContent.appendChild(div);
}

// initialize sockets  
var socket = io();
socket.on('connect', function () {

    // socket.on('duplicateUser', function () {
    //     socket.disconnect();
    // });

    // add timestamp somewhere in chatlog 
    appendLi(formatDate(new Date()), messages, 'generic');

    ////////////
    // 
    // Draw tools  
    //
    ////////////

    // draw
    var mouse = {
        click: false,
        move: false,
        pos: { x: 0, y: 0 },
        pos_prev: false
    };

    // register mouse event handlers
    canvas.onmousedown = function (e) { mouse.click = true; };

    canvas.onmouseup = function (e) { mouse.click = false; };

    canvas.onmousemove = function (e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = e.clientX / width;
        mouse.pos.y = e.clientY / (height + 75);
        mouse.move = true;
    };

    // screenshot canvas
    // to do... 

    additionBtn.addEventListener('click', function () {
        socket.emit('clearCanvas');
        var equation = generateEquation(this.id, 2, null);
        socket.emit(this.id, equation);
    });

    subtractionBtn.addEventListener('click', function () {
        socket.emit('clearCanvas');
        var equation = generateEquation(this.id, 2, null);
        socket.emit(this.id, equation);
    });

    divisionBtn.addEventListener('click', function () {
        socket.emit('clearCanvas');
        var equation = generateEquation(this.id, 2, 'random');
        socket.emit(this.id, equation);
    });

    multiplicationBtn.addEventListener('click', function () {
        socket.emit('clearCanvas');
        var equation = generateEquation(this.id, 2, null);
        socket.emit(this.id, equation);
    });

    eraseBtn.addEventListener('click', function () {
        socket.emit('clearCanvas');
    });

    socket.on('addition', function (d) { drawEquation(d); });
    socket.on('subtraction', function (d) { drawEquation(d); });
    socket.on('division', function (d) { drawEquation(d); });
    socket.on('multiplication', function (d) { drawEquation(d); });
    socket.on('clearCanvas', function () { clearCanvas(); });

    // socket data below    
    // draw line received from server
    socket.on('drawLine', function (data) {
        var line = data.line;
        context.beginPath();
        context.moveTo(line[0].x * width, line[0].y * height);
        context.lineTo(line[1].x * width, line[1].y * height);
        context.stroke();
    });

    // main loop, running every 25ms
    function mainLoop() {

        // check if the user is drawing
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            socket.emit('drawLine', { line: [mouse.pos, mouse.pos_prev] });
            mouse.move = false;
        }
        mouse.pos_prev = { x: mouse.pos.x, y: mouse.pos.y };
        setTimeout(mainLoop, 25);
    }
    mainLoop();
    // end draw 

    ////////////
    // 
    // Form inputs  
    //
    ////////////

    // set username
    usernameForm.addEventListener('submit', function (e) {
        e.preventDefault();
        socket.emit('newuser', usernameInput.value);
        userName = usernameInput.value;
        nameTag.innerText = `Username: ${userName}`;
        document.title = 'Socket.IO chatroom - ' + usernameInput.value;
        usernameModal.style.display = 'none';
        usernameInput.value = '';
    });

    // chatroom message 
    chatMessageForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (chatmessageInput.value) {
            socket.emit('chat message', chatmessageInput.value);
            chatmessageInput.value = '';
        }
    });

    socket.on('chatMessage', function (msg) {
        if (!msg.includes(userName)) {
            appendLi(msg, messages, 'other');
        } else {
            appendLi(msg, messages, 'self');
        }
    });

    // private message 
    var messageTargetAlias;
    userList.addEventListener('click', function (e) {
        privatemessageModal.style.display = 'block';
        privatemessageInput.focus();
        if (e.target && e.target.matches('li')) {
            messageTargetAlias = e.target.innerText;
        }
    });

    privatemessageForm.addEventListener('submit', function (e) {
        e.preventDefault();
        socket.emit('private message', {
            alias: messageTargetAlias,
            message: privatemessageInput.value
        }); // update sender client  
        updatePrivateMessageLog({
            alias: messageTargetAlias,
            message: privatemessageInput.value,
            sender: userName,
            receiver: messageTargetAlias
        });
        privatemessageModal.style.display = 'none';
        privatemessageInput.value = '';
    });

    // { data.sender, data.message }
    socket.on('privateMessage', function (data) {
        updatePrivateMessageLog(data);
    });

    // user activity 
    socket.on('userCount', function (data) {
        userTally.innerText = `Active users: ${data.userCount}`;
        userList.innerHTML = '';
        var list = data.userNameList;
        for (var i = 0; i < list.length; i++) {
            if (list[i] === userName) {
                appendLi(list[i] + (' { you } '), userList, 'userlist');
            } else {
                appendLi(list[i], userList, 'userlist');
            }
        }
    });

    socket.on('userJoined', function (data) {
        if (!data.includes(userName)) {
            appendLi(data, messages);
        }
    });

    socket.on('userLeft', function (data) {
        appendLi(data, messages);
    });

    // notify room when a user is typing 
    var timeout;
    function timeoutFunction() {
        typing = false;
        socket.emit('typing', false);
    }

    message.addEventListener('keyup', function () {
        typing = true;
        socket.emit('typing', 'typing...');
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 2000);
    });

    socket.on('typing', function (data) {
        if (data && !data.includes('is false')) {
            appendLi(data, messages, 'typing');
            removeIsTypingDuplicates(data);
        }
        removeTrailingTyping();
    });
});
