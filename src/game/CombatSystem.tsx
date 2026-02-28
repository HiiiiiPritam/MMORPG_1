import React, { useState, useEffect } from 'react';
import { Shield, Swords, Frown, Zap } from 'lucide-react';

interface CombatSystemProps {
  socket: any;
  roomId: string;
  isChallenger: boolean;
  onEnd: () => void;
}

interface Move {
  action: 'jab' | 'kick' | 'block' | 'taunt';
  rng: number;
}

const CombatSystem: React.FC<CombatSystemProps> = ({ socket, roomId, isChallenger, onEnd }) => {
  const [myHealth, setMyHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  
  const [myTaunt, setMyTaunt] = useState(false);
  const [enemyTaunt, setEnemyTaunt] = useState(false);

  const [log, setLog] = useState<string[]>(['FIGHT! Choose your RPG action.']);
  const [winner, setWinner] = useState<string | null>(null);

  const [myMove, setMyMove] = useState<Move | null>(null);
  const [enemyMove, setEnemyMove] = useState<Move | null>(null);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('combat_move_received', (data: { packet: Move, isFromChallenger: boolean }) => {
      if (data.isFromChallenger !== isChallenger) {
         setEnemyMove(data.packet);
      }
    });

    return () => {
       socket.off('combat_move_received');
    }
  }, [socket, isChallenger]);

  useEffect(() => {
     if (myMove && enemyMove) {
         let newMyHp = myHealth;
         let newOpHp = opponentHealth;
         let newMyTaunt = myTaunt;
         let newOpTaunt = enemyTaunt;
         let roundLogs: string[] = [];

         // Enemy Damage phase
         let enemyDmg = 0;
         if (enemyMove.action === 'jab') enemyDmg = 10;
         if (enemyMove.action === 'kick') {
             if (enemyMove.rng <= 0.6) enemyDmg = 30;
             else roundLogs.push("Opponent completely missed their Heavy Kick!");
         }
         
         if (enemyTaunt && enemyDmg > 0) { 
             enemyDmg *= 2; 
             newOpTaunt = false; // consume taunt
         }
         
         if (myMove.action === 'block' && enemyDmg > 0) { 
             enemyDmg = Math.floor(enemyDmg * 0.25); 
             roundLogs.push("You blocked! Reduced incoming damage by 75%."); 
         }
         
         if (enemyDmg > 0) {
             newMyHp -= enemyDmg;
             roundLogs.push(`Opponent hit you with ${enemyMove.action} for ${enemyDmg} DMG!`);
         }

         // My Damage phase
         let myDmg = 0;
         if (myMove.action === 'jab') myDmg = 10;
         if (myMove.action === 'kick') {
             if (myMove.rng <= 0.6) myDmg = 30;
             else roundLogs.push("You completely missed your Heavy Kick!");
         }

         if (myTaunt && myDmg > 0) { 
             myDmg *= 2; 
             newMyTaunt = false; // consume taunt
         }
         
         if (enemyMove.action === 'block' && myDmg > 0) { 
             myDmg = Math.floor(myDmg * 0.25); 
             roundLogs.push("Opponent blocked! Your damage is reduced by 75%."); 
         }
         
         if (myDmg > 0) {
             newOpHp -= myDmg;
             roundLogs.push(`You hit opponent with ${myMove.action} for ${myDmg} DMG!`);
         }

         // Status applications
         if (myMove.action === 'taunt') {
            newMyTaunt = true;
            roundLogs.push("You taunted! Your next attack will deal DOUBLE damage.");
         }
         if (enemyMove.action === 'taunt') {
            newOpTaunt = true;
            roundLogs.push("Opponent taunted! Their next attack will be deadly.");
         }

         if (roundLogs.length === 0) roundLogs.push("Both fighters stared each other down.");

         setMyHealth(Math.max(0, newMyHp));
         setOpponentHealth(Math.max(0, newOpHp));
         setMyTaunt(newMyTaunt);
         setEnemyTaunt(newOpTaunt);
         
         // Prepend to top
         setLog(prev => [...roundLogs.reverse(), ...prev].slice(0, 8));
         
         if (newMyHp <= 0 && newOpHp <= 0) setWinner('Draw');
         else if (newMyHp <= 0) setWinner('Opponent');
         else if (newOpHp <= 0) setWinner('You');

         setTimeout(() => {
            setMyMove(null);
            setEnemyMove(null);
         }, 2500);
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMove, enemyMove]);

  const selectMove = (action: Move['action']) => {
      if (myMove || winner) return;
      const packet: Move = { action, rng: Math.random() };
      setMyMove(packet);
      socket.emit('combat_move', { roomId, packet, isFromChallenger: isChallenger });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <div className="glass-panel" style={{ width: '450px', maxWidth: '95vw', textAlign: 'center', padding: '32px', position: 'relative' }}>
           <h2 style={{ marginBottom: '8px', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
               <Swords /> RPG Gang Fight <Swords />
           </h2>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-end' }}>
               <div style={{ textAlign: 'left' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>You</div>
                   {myTaunt && <span style={{fontSize:'10px', color:'#eab308'}}>TAUNTED (2x DMG)</span>}
                   <div style={{ color: '#f43f5e', fontSize: '24px', fontWeight: 'bold' }}>{myHealth} HP</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Opponent</div>
                   {enemyTaunt && <span style={{fontSize:'10px', color:'#eab308'}}>TAUNTED (2x DMG)</span>}
                   <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>{opponentHealth} HP</div>
               </div>
           </div>

           {!winner && (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
                   <button className="btn-primary" disabled={myMove !== null} style={{ padding: '12px', background: myMove?.action === 'jab' ? '#f43f5e' : 'rgba(244,63,94,0.2)' }} onClick={() => selectMove('jab')}>
                       <Swords size={20} style={{ marginRight: '8px' }} /> Jab <small style={{display:'block'}}>(10 DMG, 100%)</small>
                   </button>
                   <button className="btn-primary" disabled={myMove !== null} style={{ padding: '12px', background: myMove?.action === 'kick' ? '#f97316' : 'rgba(249,115,22,0.2)' }} onClick={() => selectMove('kick')}>
                       <Zap size={20} style={{ marginRight: '8px' }} /> Kick <small style={{display:'block'}}>(30 DMG, 60%)</small>
                   </button>
                   <button className="btn-primary" disabled={myMove !== null} style={{ padding: '12px', background: myMove?.action === 'block' ? '#3b82f6' : 'rgba(59,130,246,0.2)' }} onClick={() => selectMove('block')}>
                       <Shield size={20} style={{ marginRight: '8px' }} /> Block <small style={{display:'block'}}>(-75% DMG)</small>
                   </button>
                   <button className="btn-primary" disabled={myMove !== null} style={{ padding: '12px', background: myMove?.action === 'taunt' ? '#eab308' : 'rgba(234,179,8,0.2)' }} onClick={() => selectMove('taunt')}>
                       <Frown size={20} style={{ marginRight: '8px' }} /> Taunt <small style={{display:'block'}}>(Next Atk x2)</small>
                   </button>
               </div>
           )}

           {myMove && !enemyMove && !winner && <p style={{ color: '#eab308', fontSize: '12px', margin: '16px 0' }}>Waiting for opponent...</p>}

           <div style={{ height: '140px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '12px', overflowY: 'auto', fontSize: '13px', textAlign: 'left', color: '#cbd5e1' }}>
               {log.map((l, i) => (
                   <div key={i} style={{ marginBottom: '6px', opacity: 1 - (Math.min(i, 4) * 0.2), paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{l}</div>
               ))}
           </div>

           {winner && (
               <div style={{ marginTop: '24px' }}>
                   <h3 style={{ color: '#eab308' }}>{winner === 'Draw' ? 'Mutually Assured Destruction!' : `${winner} Won!`}</h3>
                   <button className="btn-primary" style={{ marginTop: '16px' }} onClick={onEnd}>Flee Scene</button>
               </div>
           )}
       </div>
    </div>
  );
};

export default CombatSystem;
