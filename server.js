const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Bcrypt = require("bcryptjs");
const Users = require('./models/user');
const chatRooms = require('./models/rooms');
// const mongodb = require('mongodb');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const jwt = require('jsonwebtoken');

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();

app.use(bodyParser.json());
const server = http.createServer(app);
const io = socketio(server);
mongoose.connect('mongodb://localhost:27017/Advanced-Chat-App', {useNewUrlParser: true});

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('getRoomUsers', (user) => {
    getUserDetailsBasedOnToken(user.token, (user) => {
      if (user){
        const filtereduser =  Users.find({ _id: { $nin: [user.user._id]}}, 
          (err, users) => {
            socket.emit('allUsers', users);
          });
          const filteredRooms = chatRooms.find({users: { $in: [user.user._id]}, isGroup: true},
            (err, rooms) => {
              socket.emit('userRooms', rooms);
            });
      } else{
        socket.emit('inValidToken');
      }
    
    })
    // const dataFromToken = getUserDetailsBasedOnToken(user.token);
    // console.log(dataFromToken);
    // if (dataFromToken){

    // } else{

    // }
  })
  // console.log(JSON.stringify(socket));
  socket.on('joinRoom', ({ id, name, selected }) => {
      socket.join(name);
      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));
      // Broadcast when a user connects
      socket.broadcast
        .to(name)
        .emit(
          'message',
          formatMessage(botName, `test has joined the chat`)
        );
    if(selected.isGroupChat){
        const roomss = chatRooms.find({_id: id}, (err, res) => {
          console.log(res[0].messages);
            socket.emit('Allmessages', res[0].messages);
        });
    } else{
      const filteredRooms = chatRooms.find({users: { $all: [selected.id, selected._id]}, isGroup: false},
        (err, res) => {
          console.log(res);
          if (!res.length){
            const dd = {
              name: selected.roomName,
              users: [selected.id, selected._id],
              messages:[],
              isGroup: false
            }
            var chatRm = new chatRooms(dd);
            chatRm.save((err, users) => {
              console.log(err);
              if (err){
                res.status(500).send(null);
              } else{
                console.log(users);
              }
            })
          } else{
            console.log(res[0].messages);
            socket.emit('Allmessages', res[0].messages);
          }
        });
      console.log(selected.roomName)
    }
    
  });

  // Listen for chatMessage
  socket.on('chatMessage', (data) => {
    console.log(data);
    var forData = {
      id: data.user.user._id,
      name: data.user.user.username,
      message: data.msg,
      time: new Date()
    }
    if (data.isGroupChat){
      chatRooms.findByIdAndUpdate(data.id,
        {$push: {messages: forData}},
        {safe: true, upsert: true, useFindAndModify: true},
        function(err, res) {
          console.log(res)
            if(err){
            console.log(err);
            }else{
            //do stuff
            }
        }
    );
    } else{
      chatRooms.findOneAndUpdate({name: data.roomName},
        {$push: {messages: forData}},
        {safe: true, upsert: true, useFindAndModify: true},
        function(err, res) {
          console.log(res)
            if(err){
            console.log(err);
            }else{
            //do stuff
            }
        });
    }
    // const user = getCurrentUser(socket.id);

     io.to(data.name).emit('message', [forData]);
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    // if (user) {
    //   io.to(user.room).emit(
    //     'message',
    //     formatMessage(botName, `${user.username} has left the chat`)
    //   );

    //   // Send users and room info
    //   io.to(user.room).emit('roomUsers', {
    //     room: user.room,
    //     users: getRoomUsers(user.room)
    //   });
    // }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.post('/api/register', (request, res) => { 
  console.log(request.body);
  request.body.password = Bcrypt.hashSync(request.body.password, 10);
  var user = new Users(request.body);
  user.save((err, users) => {
    console.log(err);
    if (err){
      res.status(401).send(null);
    } else{
      console.log(users);
      res.send(users);
    }
  })
});

app.post('/api/login', (request, res) => { 
  Users.findOne({username: request.body.username}, { username: 1, password: 1, email: 1 }, (err, user) => {
    if (!user){
      return res.status(400).send({ message: "User Name is invalid" });
    }
    if(!Bcrypt.compareSync(request.body.password, user.password)) {
        return res.status(400).send({ message: "The password is invalid" });
    } else{
        const token =  jwt.sign({user: user},'qwerty',{
          expiresIn: "1h"
        });
        user.token = token;
        return res.json({
          user: user,
          token: token
        });
    }
  });
});

app.post('/api/createRoom', (request, res) => { 
  getUserDetailsBasedOnToken(request.body.token, (user) => {
    console.log(user);
    request.body.users.push(user.user._id);
    var chatRm = new chatRooms(request.body);
    chatRm.save((err, users) => {
      console.log(err);
      if (err){
        res.status(500).send(null);
      } else{
        console.log(users);
        res.send(users);
      }
    })
  });
 
  // Users.findOne({username: request.body.username}, { password: 1, email: 1 }, (err, user) => {
  //   if (!user){
  //     return res.status(400).send({ message: "User Name is invalid" });
  //   }
  //   if(!Bcrypt.compareSync(request.body.password, user.password)) {
  //       return res.status(400).send({ message: "The password is invalid" });
  //   } else{
  //       const token =  jwt.sign({user: user},'qwerty',{
  //         expiresIn: "1h"
  //       });
  //       user.token = token;
  //       return res.json({
  //         user: user,
  //         token: token
  //       });
  //   }
  // });
});
function getUserDetailsBasedOnToken(token, callback) {
  jwt.verify(token, 'qwerty', (err, res) => {
    console.log(res);
    callback(res);
  })
}
