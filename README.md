#socketio-chat

**You should use this project with** [vue-talk](https://github.com/valterlorran/vue-talk)

Simple way to implement a chat with socket.io. This project give you a quick start and set everything you need to start a chat app.

## Installation

```
$ npm install socketio-chat --save
```

## Setup
```js
//require socket.io

var SocketIOChat = require('socketio-chat');

io.on('connection', function (socket) {
	//Initiate the socketio-chat plugin
	SocketIOChat.install.call(this, socket, {
		//sets the current user
		user:{
			name: 'Valter Lorran',
			id: 1,
			image: 'img/img-01.png'
		}
	});

	//join a room 
	socket.socketIOChat.joinRoom('room-test');
});
```
**Notice:** when you install the plugin you'll be able to access the SocketIOChat object in **socket.socketIOChat**

## Events
SocketIOChat sets the following events for you:
- sendMessage: triggered when a user sends a message
- disconnect: triggered when a user disconnects, this event is triggered automatically
- startTyping: triggered when a user start typing
- stopTyping: triggered when a user stop typing

In your client side you should have something like:

```js
function sendMessage(message){
	socket.emit('sendMessage', {message:message});
}

function startTyping(){
	socket.emit('startTyping');
}
```

Each of these events trigger an event to the **room** that the user is in. And each of these events is sent with **user_id**(id that you set when you install the plugin in the socket) appended in the data object.

| Event | Triggers |
| --- | --- |
| when a user joins a room | userJoinendRoom |
| sendMessage | userSentMessage |
| startTyping | userStartedTyping |
| stopTyping | userStoppedTyping |
| disconnect | userDisconnect |

In your client side you should have something like:

```js
socket.on('userSentMessage', function(data){
	var user_id = data.user_id;
	var message = data.message;
	alert('The user ' + user_id + ' sent a message: ' + message);
});

socket.on('userDisconnect', function(data){
	var user_id = data.user_id;
	alert('User ' + user_id + ' disconnected.');
});
```

## Callback Before/After Event

You can add a callback before an event is trigger or after.

```js
SocketIOChat.install.call(this, socket, {
	before_event:{
		sendMessage:function(socketIOChat, socket, data){

		}
	},
	after_event:{
		stopTyping:function(socketIOChat, socket, data){

		}
	},
	user:{/* */}
});
```

You can use it for save a message in the database for example.

##Personalization
###Custom emiters

You can set a custom name for the emits:

```js
SocketIOChat.install.call(this, socket, {
	room_emiters:{
		userDisconnect:'user-got-disconnected',
		userStoppedTyping:'user-is-no-longer-typing'
	}
	user:{/* */}
});
```