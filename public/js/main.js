const chatForm = document.getElementById('chat-form');
const addRoom = document.getElementById('add-form');

const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
var users = [];
var loggedUser;
var Token;
var selected;
// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const socket = io();

if (!localStorage.getItem('user')){
  window.location = "http://localhost:3000/index.html";
}else{
  var user = JSON.parse(localStorage.getItem('user'));
  loggedUser = user;
  Token = user.token;
}
document.getElementById('new-room').style.display = 'none';
socket.emit('getRoomUsers', {token: user.token});
socket.on('allUsers', (user) => {
  users = user;
  outputUsers(users);
  console.log(users);
  users.forEach(element => {
    var newSelect = document.createElement('option');
    selectHTML = "<option value='" + element._id + "'>" + element.username + "</option>";
    newSelect.innerHTML = selectHTML;
    document.getElementById('selectedUsers').add(newSelect); 
  });
 
});
socket.on('userRooms', (rooms) => {
  console.log(rooms);
  outputRoomName(rooms);
});
socket.on('inValidToken', res => {
  onClickLogout();
});

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', message => {
  console.log(message);
  outputMessage(message);
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', e => {
  e.preventDefault();

  // Get message text
  const msg = e.target.elements.msg.value;
  formateddata = {...selected,
    msg : msg,
    token: Token,
    user: loggedUser
  }
  // Emit message to server
  socket.emit('chatMessage', formateddata);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(messages) {
  if (!messages || !messages.length || !messages[0]){
     return;
  }
  const div = document.createElement('div');
  div.classList.add('message');
  messages.map(message=> {
    var m = new Date(message.time);
    var dateString = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
    div.innerHTML = `${messages.map(message =>`<p class="meta">${message.name} <span>${dateString}</span></p>
    <p class="text">
      ${message.message}
    </p>`)}`;
  });
 
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerHTML = `
    ${room.map(rm => `<li onclick="onClickRoom('${rm._id}', '${rm.name}')" >${rm.name}</li>`).join('')}`;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `
    ${users.map(user => `<li onclick="onClickuser('${user._id}', '${user.username}')">${user.username}</li>`).join('')}
  `;
}
function onClickRoom(id, name){
  var node = document.querySelector('.chat-messages');
  node.innerHTML = "";
  console.log(id);
  selected = {
    isGroupChat: true,
    id: id,
    name: name
  }
  socket.emit('joinRoom', { id, name, selected });
}
socket.on('Allmessages', message => {

  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
function onClickuser(id, username){
  var node = document.querySelector('.chat-messages');
  node.innerHTML = "";
  selected = {
    isGroupChat: false,
    id: id,
    username: username,
    _id: loggedUser.user._id,
    roomName: loggedUser.user.username +'-'+username
  };
  ss = loggedUser.user.username +'-'+username;
  socket.emit('joinRoom', { id, ss, selected });

  console.log(id)
}
/// latest code 
function onClickLogout() {
  localStorage.clear();
  window.location = "http://localhost:3000/index.html";
}
function onClickAddGroup(){
  document.getElementById('new-room').style.display = 'block';
}
function onCancelClick(){
  document.getElementById('new-room').style.display = 'none';
}

// add Group submit
addRoom.addEventListener('submit', async e => {
    e.preventDefault();
    const inputs = e.target.elements;
    console.log(users);

    console.log(inputs);
    const user = [];
    for (item of inputs.selectedUsers.selectedOptions) {
      user.push(users.find(e => e.username === item.value)._id);
    }
    console.log(user);
    const response = await fetch('http://localhost:3000/api/createRoom', {
      method: 'POST',
      body: JSON.stringify({
        'name': inputs.roomName.value,
        'users': user,
        'token': Token
      }), // string or object
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const myJson = await response.json(); 
    if (response.status == 200){
      console.log(myJson);
      document.getElementById('new-room').style.display = 'none';
    }
});

// async function addRoom(){

// }
