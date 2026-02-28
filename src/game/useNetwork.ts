import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PlayerStats } from './GameState';

export interface RemotePlayer {
  id: string;
  email: string;
  characterGender: 'boy' | 'girl';
  mapId: string;
  x: number;
  y: number;
  stats: PlayerStats;
  isWalking: boolean;
}

export interface ChatMessage {
  playerId: string;
  email: string;
  text: string;
  mapId: string;
  timestamp: number;
}

const SOCKET_SERVER_URL = 'http://localhost:3002';

export const useNetwork = (
  email: string | null,
  characterGender: 'boy' | 'girl',
  activeMapId: string,
  playerX: number,
  playerY: number,
  stats: PlayerStats,
  isWalking: boolean
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<Record<string, RemotePlayer>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Challenge states
  const [incomingChallenge, setIncomingChallenge] = useState<{challengerId: string, challengerEmail: string, type: string} | null>(null);
  const [activeChallengeRoom, setActiveChallengeRoom] = useState<{roomId: string, type: string} | null>(null);

  useEffect(() => {
    if (!email) return;

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_game', {
        email,
        characterGender,
        mapId: activeMapId,
        x: playerX,
        y: playerY,
        stats
      });
    });

    newSocket.on('current_players', (players: Record<string, RemotePlayer>) => {
      setRemotePlayers(players);
    });

    newSocket.on('player_joined', (player: RemotePlayer) => {
      setRemotePlayers(prev => ({ ...prev, [player.id]: player }));
    });

    newSocket.on('player_left', (playerId: string) => {
      setRemotePlayers(prev => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    });

    newSocket.on('player_moved', (player: RemotePlayer) => {
      setRemotePlayers(prev => ({ ...prev, [player.id]: player }));
    });

    newSocket.on('receive_chat', (msg: Omit<ChatMessage, 'timestamp'>) => {
      setChatMessages(prev => [...prev, { ...msg, timestamp: Date.now() }]);
    });

    newSocket.on('challenge_received', (data) => {
       setIncomingChallenge(data);
    });

    newSocket.on('challenge_started', (data) => {
       setIncomingChallenge(null);
       setActiveChallengeRoom({ roomId: data.roomId, type: data.type });
    });

    return () => {
      newSocket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]); // Only re-run when user logs in

  // Sync position on every movement
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('player_move', {
        x: playerX,
        y: playerY,
        mapId: activeMapId,
        isWalking
      });
    }
  }, [socket, playerX, playerY, activeMapId, isWalking]);

  const sendChat = useCallback((text: string) => {
     if (socket && socket.connected && text.trim()) {
         socket.emit('send_chat', { text, mapId: activeMapId });
     }
  }, [socket, activeMapId]);

  const sendChallenge = useCallback((targetId: string, type: 'tictactoe' | 'fight' | 'pokemon' | 'tabletennis') => {
     if (socket && socket.connected) {
         socket.emit('send_challenge', { targetId, type });
     }
  }, [socket]);

  const acceptChallenge = useCallback((challengerId: string, type: string) => {
     if (socket && socket.connected) {
         socket.emit('accept_challenge', { challengerId, type });
     }
  }, [socket]);

  const rejectChallenge = useCallback(() => {
      setIncomingChallenge(null);
  }, []);
  
  const leaveChallenge = useCallback(() => {
      setActiveChallengeRoom(null);
  }, []);

  return {
    socket,
    remotePlayers,
    chatMessages,
    sendChat,
    incomingChallenge,
    activeChallengeRoom,
    sendChallenge,
    acceptChallenge,
    rejectChallenge,
    leaveChallenge
  };
};
