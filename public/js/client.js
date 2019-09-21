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


// fix chat log overflow scroll to bottom 
function fixScrollToBottom(str) {
    var e = document.querySelector('.' + str);
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
    // if (e.id === 'messages') {
    //     var img = document.createElement('IMG');
    //     img.className = 'avatar';
    //     img.src = 'https://o.aolcdn.com/images/dims?quality=85&image_uri=http%3A%2F%2Fo.aolcdn.com%2Fhss%2Fstorage%2Fmidas%2F435cb131770743748354d25c1a3823c5%2F206697768%2Fcarmack-ed.jpg&client=amp-blogside-v2&signature=c231e2d87f936926eab52654ebeaad997d2c2e86';
    //     li.appendChild(img);
    // }


    li.appendChild(div);
    e.appendChild(li);
    fixScrollToBottom('leftColumn');
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
    // appendLi(formatDate(new Date()), messages, 'generic');

    // draw 
    var mouse = {
        click: false,
        move: false,
        pos: { x: 0, y: 0 },
        pos_prev: false
    };
    var btn = document.getElementById('btn');
    // get canvas element and create context
    var canvas = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var width = window.innerWidth;
    var height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // register mouse event handlers
    canvas.onmousedown = function (e) { mouse.click = true; };
    canvas.onmouseup = function (e) { mouse.click = false; };

    canvas.onmousemove = function (e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = e.clientX / width;
        mouse.pos.y = e.clientY / (height - 45);
        mouse.move = true;
    };


    btn.addEventListener('click', function (e) {
        // add event listerner 
        socket.emit('clearCanvas');
    });

    socket.on('clearCanvas', function (data) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    });

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

    // set username
    usernameForm.addEventListener('submit', function (e) {
        e.preventDefault();
        socket.emit('newuser', usernameInput.value);
        userName = usernameInput.value;
        nameTag.innerText = `Username: ${userName}.`;
        document.title = 'Socket.IO chatroom - ' + usernameInput.value;
        usernameModal.style.display = 'none';
        usernameInput.value = '';
    });

    // chatroom message 
    chatMessageForm.addEventListener('submit', function (e) {
        e.preventDefault();
        socket.emit('chat message', chatmessageInput.value);
        chatmessageInput.value = '';
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
        userTally.innerText = data.userCount;
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
