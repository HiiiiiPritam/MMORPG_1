import React, { useState, useEffect } from 'react';
import { Target, MoveUpRight, MoveDownRight, Activity } from 'lucide-react';

interface TTProps {
  socket: any;
  roomId: string;
  isChallenger: boolean;
  onEnd: () => void;
  awardFun?: () => void;
}

interface TTMove {
  action: 'smash' | 'spin' | 'drop';
}

const TableTennis: React.FC<TTProps> = ({ socket, roomId, isChallenger, onEnd, awardFun }) => {
  const [myScore, setMyScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  
  const [log, setLog] = useState<string[]>(['Match Started! First to 5 points wins.']);
  const [winner, setWinner] = useState<string | null>(null);

  const [myMove, setMyMove] = useState<TTMove | null>(null);
  const [enemyMove, setEnemyMove] = useState<TTMove | null>(null);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('tabletennis_move_received', (data: { packet: TTMove, isFromChallenger: boolean }) => {
      console.log("[TT] Received  tt move from server:", data);
      if (data.isFromChallenger !== isChallenger) {
         setEnemyMove(data.packet);
      } else {
         console.warn("[TT] Ignored own relayed move.");
      }
    });

    return () => {
       socket.off('tabletennis_move_received');
    }
  }, [socket, isChallenger]);

  useEffect(() => {
     if (myMove && enemyMove) {
         let newMyScore = myScore;
         let newEnScore = enemyScore;
         let msg = '';

         // RPS Logic: Smash > Spin > Drop > Smash
         if (myMove.action === enemyMove.action) {
             msg = `Both played ${myMove.action.toUpperCase()}! Epic Rally! No points awarded.`;
         } else if (
             (myMove.action === 'smash' && enemyMove.action === 'spin') ||
             (myMove.action === 'spin' && enemyMove.action === 'drop') ||
             (myMove.action === 'drop' && enemyMove.action === 'smash')
         ) {
             msg = `Your ${myMove.action.toUpperCase()} countered their ${enemyMove.action.toUpperCase()}! Point to You!`;
             newMyScore += 1;
         } else {
             msg = `Opponent's ${enemyMove.action.toUpperCase()} countered your ${myMove.action.toUpperCase()}! Point to Opponent.`;
             newEnScore += 1;
         }

         setMyScore(newMyScore);
         setEnemyScore(newEnScore);
         setLog(prev => [msg, ...prev].slice(0, 6));
         
         if (newMyScore >= 5) {
             setWinner('You');
             if (awardFun) awardFun();
         } else if (newEnScore >= 5) {
             setWinner('Opponent');
         }

         setTimeout(() => {
            setMyMove(null);
            setEnemyMove(null);
         }, 2500);
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMove, enemyMove]);

  const selectMove = (action: TTMove['action']) => {
      if (myMove || winner) return;
      const packet: TTMove = { action };
      setMyMove(packet);
      socket.emit('tabletennis_move', { roomId, packet, isFromChallenger: isChallenger });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <div className="glass-panel" style={{ width: '450px', maxWidth: '95vw', textAlign: 'center', padding: '32px', position: 'relative' }}>
           <h2 style={{ marginBottom: '8px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               <Target /> Table Tennis Match <Target />
           </h2>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-end', padding: '0 20px' }}>
               <div style={{ textAlign: 'left' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>You</div>
                   <div style={{ color: '#10b981', fontSize: '32px', fontWeight: 'bold' }}>{myScore}</div>
               </div>
               <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                   First to 5
               </div>
               <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Opponent</div>
                   <div style={{ color: '#f43f5e', fontSize: '32px', fontWeight: 'bold' }}>{enemyScore}</div>
               </div>
           </div>

           {!winner && (
               <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                   <button className="btn-primary" disabled={myMove !== null} style={{ flex: 1, padding: '12px', background: myMove?.action === 'smash' ? '#f43f5e' : 'rgba(244,63,94,0.2)' }} onClick={() => selectMove('smash')}>
                       <Activity size={20} style={{ margin: '0 auto 8px auto' }} /> Smash
                   </button>
                   <button className="btn-primary" disabled={myMove !== null} style={{ flex: 1, padding: '12px', background: myMove?.action === 'spin' ? '#3b82f6' : 'rgba(59,130,246,0.2)' }} onClick={() => selectMove('spin')}>
                       <MoveUpRight size={20} style={{ margin: '0 auto 8px auto' }} /> Spin
                   </button>
                   <button className="btn-primary" disabled={myMove !== null} style={{ flex: 1, padding: '12px', background: myMove?.action === 'drop' ? '#eab308' : 'rgba(234,179,8,0.2)' }} onClick={() => selectMove('drop')}>
                       <MoveDownRight size={20} style={{ margin: '0 auto 8px auto' }} /> Drop Shot
                   </button>
               </div>
           )}

           {myMove && !enemyMove && !winner && <p style={{ color: '#eab308', fontSize: '12px', margin: '16px 0' }}>Waiting for opponent to hit...</p>}

           <div style={{ height: '120px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '12px', overflowY: 'auto', fontSize: '13px', textAlign: 'left', color: '#cbd5e1' }}>
               {log.map((l, i) => (
                   <div key={i} style={{ marginBottom: '6px', opacity: 1 - (Math.min(i, 4) * 0.2), paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{l}</div>
               ))}
           </div>

           {winner && (
               <div style={{ marginTop: '24px' }}>
                   <h3 style={{ color: '#eab308' }}>{winner === 'Draw' ? 'Mutually Assured Destruction!' : `${winner} Won the Match!`}</h3>
                   <button className="btn-primary" style={{ marginTop: '16px' }} onClick={onEnd}>Exit Game</button>
               </div>
           )}
       </div>
    </div>
  );
};

export default TableTennis;
