function before (object, method, fn, args_mid) {
	var originalMethod = object[method];
	object[method] = function () {
		fn.apply(object, args_mid.concat(arguments));
		originalMethod.apply(object, arguments);
	};
}
function after (object, method, fn, args_mid) {
	var originalMethod = object[method];
	object[method] = function () {
		originalMethod.apply(object, arguments);
		fn.apply(object, args_mid.concat(arguments));
	};
}

var SocketIOChat = function(socket, options){
	var o = options || {};
	var events = o.events || {};
	var room_emiters = o.room_emiters || {};
	var before_event = o.before_event || {};
	var after_event = o.after_event || {};

	var user = o.user || false;

	if(typeof user != 'object'){
		console.log('You need to set the user when creating the SocketIOChat object');
		return;
	}

	this.user = user;

	this.rooms = [];
	this.default_room = false;
	
	this.socket = socket;

	this.events = {
		sendMessage:events.sendMessage || this.sendMessage,
		disconnect:events.disconnect || this.onDisconnect,
		startTyping:events.startTyping || this.onStartTyping,
		stopTyping:events.stopTyping || this.onStopTyping
	};

	this.room_emiters = {
		onUserDisconnect:room_emiters.userDisconnect || 'userDisconnect',
		onUserConnect:room_emiters.userConnect || 'userConnect',
		onJoinRoom:room_emiters.userJoinendRoom || 'userJoinendRoom',
		onUserSentMessage:room_emiters.userSentMessage || 'userSentMessage',
		onUserStartTyping:room_emiters.userStartedTyping || 'userStartedTyping',
		onUserStopTyping:room_emiters.userStoppedTyping || 'userStoppedTyping',
	};

	this.before_event = before_event;

	this.after_event = after_event;
};

SocketIOChat.install = function(socket, user){
	if(!socket.socketIOChat){
		socket.socketIOChat = new SocketIOChat(socket, user);
	}

	for(var i in socket.socketIOChat.events){
		var event = socket.socketIOChat.events[i];

		if(socket.socketIOChat.before_event[i]){
			var bf_event = socket.socketIOChat.before_event[i];
			before(socket.socketIOChat.events, i, bf_event, [socket.socketIOChat, socket]);
		}

		if(socket.socketIOChat.after_event[i]){
			var af_event = socket.socketIOChat.after_event[i];
			after(socket.socketIOChat.events, i, af_event, [socket.socketIOChat, socket]);
		}

		socket.on(i, socket.socketIOChat.events[i]);
	}
};

SocketIOChat.prototype.user = null;

SocketIOChat.prototype.getUserData = function(){
	return this.user;
};

SocketIOChat.prototype.resolveRoom = function(data){
	var room = data.room || this.default_room || false;
	var broadcaster = this.roomBroadcaster(room);
	return broadcaster;
};

SocketIOChat.prototype.joinRoom = function(name){
	if(name && this.rooms.indexOf(name) === -1){
		if(this.default_room === false){
			this.default_room = name;
		}
		this.rooms.push(name);
		this.socket.join(name);

		this.roomBroadcaster(name).emit(this.room_emiters.onJoinRoom, this.user);
	}
};

SocketIOChat.prototype.leaveRoom = function(name){
	this.socket.leave(name);
	var index = this.rooms.indexOf(name);
	if(index > -1){
		this.rooms.splice(index, 1);
	}
};

SocketIOChat.prototype.roomBroadcaster = function(room){
	var _room = room || this.default_room || false;
	if(_room !== false){
		if(this.rooms.indexOf(_room) === -1){
			this.joinRoom(_room);
		}
	}else{
		return false;
	}

	return this.socket.broadcast.to(room);
};

SocketIOChat.prototype.sendMessage = function(data, callback){
	data['user_id'] = this.socketIOChat.user.id;
	this.socketIOChat.resolveRoom(data).emit(this.socketIOChat.room_emiters.onUserSentMessage, data);
};

SocketIOChat.prototype.onDisconnect = function(data, callback){
	for(var i in this.socketIOChat.rooms){
		var broadcaster = this.socketIOChat.roomBroadcaster(this.socketIOChat.rooms[i]);
		broadcaster.emit(this.socketIOChat.room_emiters.onUserDisconnect, this.socketIOChat.getUserData());
	}
};

SocketIOChat.prototype.onStartTyping = function(data, callback){
	data['user_id'] = this.socketIOChat.user.id;
	this.socketIOChat.resolveRoom(data).emit(this.socketIOChat.room_emiters.onUserStartTyping, data);
};

SocketIOChat.prototype.onStopTyping = function(data, callback){
	data['user_id'] = this.socketIOChat.user.id;
	this.socketIOChat.resolveRoom(data).emit(this.socketIOChat.room_emiters.onUserStopTyping, data);
};

module.exports = SocketIOChat;