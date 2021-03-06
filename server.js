var express = require('express');
var uuid = require('node-uuid');
var app = express();
var server;
var playerIndex = 1;
var ballIndex = 1;

require('./lib/game');

console.log(new Game());

app.configure(function() {
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'y7SD56DGs68sdy89gsdg9ysdg' }));
});

server = app.listen(3000);
var io = require('socket.io').listen(server);
console.log('Listening at http://localhost:3000');

var players = {};
var game = new Game();

io.sockets.on("connection", function(socket){
  var player = new Player(socket);
  console.log(player.id + " has entered the Alley Maze!");

  game.addPlayer(player);

  socket.on("success", function(ball) {
    player.reset();

    game.nextStage(player);
  });

  socket.on("failure", function(ball) {
    player.lose();
    if (!player.isAlive()) {
      socket.emit("game_over");
      game.removePlayer(player);
    } else {
      // reset the ball
      socket.emit("reset");
    }
  });

  socket.on("ready", function() {
    socket.emit("next");
  });

  socket.on("disconnect", function() {
    game.removePlayer(player);
  });
});

var transition = {};

app.post('/gamestate', function(req, res) {
    var player = current_user(req);

    var ball = null;
    if (player && player.pending) {
        for (var i in player.pending) {
            ball = player.pending[i];
            delete player.pending[i];
            ball.id = i;
            break;
        }
    }
    return res.send({ ball: ball });
});

try {
    var domain = require('domain').create();
    domain.add(server);
    domain.on('error', function (e){
        console.log('Got', e);
        server.close();
    });
} catch (e) {
    console.log('require("domain") failed');
}

