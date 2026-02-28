import React, { useState, useEffect } from 'react';
import { X, Circle } from 'lucide-react';

interface TicTacToeProps {
  socket: any;
  roomId: string;
  isChallenger: boolean;
  onEnd: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ socket, roomId, isChallenger, onEnd }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [myTurn, setMyTurn] = useState(isChallenger); // Challenger goes first
  const [winner, setWinner] = useState<string | null>(null);

  const mySymbol = isChallenger ? 'X' : 'O';

  useEffect(() => {
    if (!socket) return;
    socket.on('tictactoe_move_received', (data: { index: number, symbol: string }) => {
       setBoard(prev => {
          const newBoard = [...prev];
          newBoard[data.index] = data.symbol;
          checkWinner(newBoard);
          return newBoard;
       });
       setMyTurn(true);
    });

    return () => {
       socket.off('tictactoe_move_received');
    }
  }, [socket]);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            setWinner(squares[a]);
            return;
        }
    }
    if (!squares.includes(null)) {
        setWinner('Draw');
    }
  };

  const handleClick = (index: number) => {
    if (board[index] || winner || !myTurn) return;

    const newBoard = [...board];
    newBoard[index] = mySymbol;
    setBoard(newBoard);
    setMyTurn(false);
    
    socket.emit('tictactoe_move', { roomId, index, symbol: mySymbol });
    checkWinner(newBoard);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <div className="glass-panel" style={{ textAlign: 'center', padding: '32px' }}>
           <h2 style={{ marginBottom: '16px', color: '#eab308' }}>Multiplayer Tic-Tac-Toe</h2>
           <p style={{ marginBottom: '24px', fontSize: '14px', color: '#94a3b8' }}>
               {winner ? (winner === 'Draw' ? 'It\'s a Draw!' : `Winner: ${winner}!`) : (myTurn ? "Your turn!" : "Waiting for opponent...")}
           </p>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>
              {board.map((cell, idx) => (
                  <div key={idx} onClick={() => handleClick(idx)} style={{ width: '80px', height: '80px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (myTurn && !cell && !winner) ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                      {cell === 'X' && <X size={48} color="#3b82f6" />}
                      {cell === 'O' && <Circle size={48} color="#f43f5e" />}
                  </div>
              ))}
           </div>

           {winner && (
               <button className="btn-primary" style={{ marginTop: '24px' }} onClick={onEnd}>Return to Game</button>
           )}
       </div>
    </div>
  );
};

export default TicTacToe;
