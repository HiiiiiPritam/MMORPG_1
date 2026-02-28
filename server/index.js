import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory gamestate
const players = {};
const activeChallenges = {};

io.on('connection', (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  // When a player logs in and spawns
  socket.on('join_game', (data) => {
    players[socket.id] = {
      id: socket.id,
      email: data.email,
      characterGender: data.characterGender,
      mapId: data.mapId,
      x: data.x,
      y: data.y,
      stats: data.stats, // { energy, knowledge, fun, health }
      isWalking: false
    };

    // Broadcast list of everyone to this player
    socket.emit('current_players', players);

    // Broadcast this new player to everyone else
    socket.broadcast.emit('player_joined', players[socket.id]);
  });

  // Player moved
  socket.on('player_move', (data) => {
    if (players[socket.id]) {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].mapId = data.mapId;
        players[socket.id].isWalking = data.isWalking;
        
        // Broadcast the move to EVERYONE (including the sender could be done, but broadcast is faster)
        socket.broadcast.emit('player_moved', players[socket.id]);
    }
  });

  // Chat message
  socket.on('send_chat', (data) => {
     // data: { text, mapId }
     io.emit('receive_chat', {
         playerId: socket.id,
         email: players[socket.id]?.email?.split('@')[0] || 'Unknown',
         text: data.text,
         mapId: data.mapId
     });
  });

  // ------------------ Challenge System ------------------

  socket.on('send_challenge', (data) => {
      // data: { targetId, type: 'tictactoe' | 'fight' }
      const targetId = data.targetId;
      console.log(`[!] ${socket.id} challenged ${targetId} to ${data.type}`);
      if (players[targetId]) {
          io.to(targetId).emit('challenge_received', {
              challengerId: socket.id,
              challengerEmail: players[socket.id]?.email?.split('@')[0] || 'Unknown',
              type: data.type
          });
      }
  });

  socket.on('accept_challenge', (data) => {
      // data: { challengerId, type }
      const roomId = `room_${data.challengerId}_${socket.id}`;
      socket.join(roomId);
      
      // We must make the challenger join this room too
      const challengerSocket = io.sockets.sockets.get(data.challengerId);
      if (challengerSocket) {
          challengerSocket.join(roomId);
          io.to(roomId).emit('challenge_started', {
               roomId,
               players: [data.challengerId, socket.id],
               type: data.type
          });
      }
  });

  // Tic-Tac-Toe Moves
  socket.on('tictactoe_move', (data) => {
      // data: { roomId, index, symbol }
      socket.to(data.roomId).emit('tictactoe_move_received', data);
  });

  // Gang Fight Moves (Rock Paper Scissors approach)
  // data: { roomId, action: 'attack' | 'defend' | 'heal', ... }
  socket.on('combat_move', (data) => {
      socket.to(data.roomId).emit('combat_move_received', data);
  });

  // Pokemon Card Moves
  socket.on('pokemon_move', (data) => {
      console.log(`[+] Pokemon move received from ${socket.id} for room ${data.roomId}`, data);
      socket.to(data.roomId).emit('pokemon_move_received', data);
  });

  // Table Tennis Moves
  socket.on('tabletennis_move', (data) => {
      console.log(`[+] Table Tennis move from ${socket.id} in room ${data.roomId}:`, data.packet);
      socket.to(data.roomId).emit('tabletennis_move_received', data);
  });

  // ------------------------------------------------------

  socket.on('disconnect', () => {
    console.log(`[-] Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('player_left', socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🔥 NIT JSR MMORPG Server running on port ${PORT}`);
});
