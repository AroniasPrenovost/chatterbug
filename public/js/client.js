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

// flags: 'time', 'other', 'self', 'userlist'
function appendLi(str, e, flag) {
    var li = document.createElement('LI');
    var msgNode = document.createTextNode(str);
    var div = document.createElement('DIV');
    div.appendChild(msgNode);
    switch (flag) {
        case 'time':
            div.classList.add('timeChatLi');
            break;
        case 'other':
            div.classList.add('otherChatLi');
            break;
        case 'self':
            div.classList.add('selfChatLi');
            break;
        case 'userlist':
            div.classList.add('userListLi');
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
        var lastItem = listItems[listItems.length - 1];
        if (lastItem.textContent.includes('is typing...')) {
            lastItem.parentNode.removeChild(lastItem);
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
    // appendLi(formatDate(new Date()), messages, 'time');

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
            appendLi(data, messages);
            removeIsTypingDuplicates(data);
        }
        removeTrailingTyping();
    });
});
