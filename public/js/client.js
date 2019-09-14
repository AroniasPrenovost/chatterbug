


// private message ui code 
(function () {
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
})();


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

function appendLi(str, e) {
    var li = document.createElement('LI');
    var msgNode = document.createTextNode(str);
    li.appendChild(msgNode);
    e.appendChild(li);
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
    return x
}

// update private messages args {}
function updatePrivateMessageLog(args) {

    // {"alias":"Michael","message":"It's good to hear from you.","sender":"Patty","receiver":"Michael"}
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

    // set username
    usernameForm.addEventListener('submit', function (e) {
        e.preventDefault();
        socket.emit('newuser', usernameInput.value);
        userName = usernameInput.value;
        nameTag.innerText = `Hello, ${userName}.`;
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
        appendLi(msg, messages);
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

    // {data.sender, data.message }
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
                appendLi(list[i] + (' { current } '), userList);
            } else {
                appendLi(list[i], userList);
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