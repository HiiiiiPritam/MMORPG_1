import React, { useState, useEffect } from 'react';
import { Flame, Droplet, Zap, Shield, Sparkles } from 'lucide-react';

interface PokemonArenaProps {
  socket: any;
  roomId: string;
  isChallenger: boolean;
  onEnd: () => void;
  awardFun: () => void;
}

const CARDS = [
  { id: 'fire', name: 'Fire Blast', type: 'attack', power: 35, icon: <Flame size={32} color="#f97316"/>, bg: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)' },
  { id: 'water', name: 'Aqua Jet', type: 'attack', power: 25, icon: <Droplet size={32} color="#0ea5e9"/>, bg: 'linear-gradient(135deg, #082f49 0%, #0284c7 100%)' },
  { id: 'thunder', name: 'Thunder Strike', type: 'attack', power: 45, icon: <Zap size={32} color="#eab308"/>, bg: 'linear-gradient(135deg, #713f12 0%, #ca8a04 100%)' },
  { id: 'heal', name: 'Synthesis', type: 'heal', power: 30, icon: <Sparkles size={32} color="#10b981"/>, bg: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)' },
  { id: 'shield', name: 'Protect', type: 'defend', power: 100, icon: <Shield size={32} color="#94a3b8"/>, bg: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)' }
];

const PokemonArena: React.FC<PokemonArenaProps> = ({ socket, roomId, isChallenger, onEnd, awardFun }) => {
  const [myHealth, setMyHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [hand, setHand] = useState<any[]>([]);
  const [myCard, setMyCard] = useState<any | null>(null);
  const [enemyCardId, setEnemyCardId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(['Battle Started! Pick a mysterious card.']);

  // Deal 3 random cards at start of round
  const dealHand = () => {
    const newHand = [];
    for(let i=0; i<3; i++) {
        newHand.push(CARDS[Math.floor(Math.random() * CARDS.length)]);
    }
    setHand(newHand);
    setMyCard(null);
    setEnemyCardId(null);
    setReveal(false);
  };

  useEffect(() => {
    dealHand();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleMove = (data: { cardId: string, isFromChallenger: boolean }) => {
      if (data.isFromChallenger !== isChallenger) {
         setEnemyCardId(data.cardId);
      }
    };

    socket.on('pokemon_move_received', handleMove);

    return () => {
       socket.off('pokemon_move_received', handleMove);
    }
  }, [socket, isChallenger]);

  useEffect(() => {
     let timer: ReturnType<typeof setTimeout>;
     if (myCard && enemyCardId) {
         setReveal(true);
         const opCard = CARDS.find(c => c.id === enemyCardId)!;
         
         timer = setTimeout(() => {
             let newMyHp = myHealth;
             let newOpHp = enemyHealth;
             let msg = `You used ${myCard.name}! Enemy used ${opCard.name}!`;

             // Resolution logic
             // Defend blocks 1 attack
             // Heal restores HP
             // Attack deals Damage

             let myDmgAssigned = opCard.type === 'attack' ? opCard.power : 0;
             let opDmgAssigned = myCard.type === 'attack' ? myCard.power : 0;

             if (myCard.type === 'defend') {
                 if (opCard.type === 'attack') msg = `You protected yourself from ${opCard.name}!`;
                 else msg = `You defended, but opponent used ${opCard.name}.`;
                 myDmgAssigned = 0;
             }
             if (opCard.type === 'defend') {
                 if (myCard.type === 'attack') msg = `Opponent protected against your ${myCard.name}!`;
                 else msg = `Opponent defended, but you used ${myCard.name}.`;
                 opDmgAssigned = 0;
             }

             if (myCard.type === 'heal') newMyHp += myCard.power;
             if (opCard.type === 'heal') newOpHp += opCard.power;

             newMyHp -= myDmgAssigned;
             newOpHp -= opDmgAssigned;

             setMyHealth(Math.min(100, Math.max(0, newMyHp)));
             setEnemyHealth(Math.min(100, Math.max(0, newOpHp)));
             
             setLog(prev => [msg, ...prev].slice(0, 5));

             if (newMyHp <= 0 && newOpHp <= 0) {
                 setWinner('Draw');
             } else if (newMyHp <= 0) {
                 setWinner('Defeat');
             } else if (newOpHp <= 0) {
                 setWinner('Victory');
                 awardFun(); // Stat boost!
             } else {
                 setTimeout(dealHand, 2500); // Next round
             }
         }, 1500);
     }
     return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCard, enemyCardId]);

  const selectCard = (card: any) => {
      if (myCard || winner) return;
      setMyCard(card);
      // Remove other cards from hand visually
      setHand([card]); 
      socket.emit('pokemon_move', { roomId, cardId: card.id, isFromChallenger: isChallenger });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       <div className="glass-panel" style={{ width: '600px', textAlign: 'center', padding: '32px', position: 'relative' }}>
           <h2 style={{ marginBottom: '8px', color: '#eab308' }}>Pokemon Card Arena</h2>
           <p style={{ marginBottom: '24px', fontSize: '12px', color: '#94a3b8' }}>Pick a face-down card to battle!</p>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '0 24px' }}>
               <div style={{ textAlign: 'left' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>You</div>
                   <div style={{ width: '150px', height: '10px', background: '#333', borderRadius: '5px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(0, myHealth)}%`, height: '100%', background: myHealth > 40 ? '#10b981' : '#ef4444', transition: 'width 0.5s' }} />
                   </div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{myHealth} HP</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Opponent</div>
                   <div style={{ width: '150px', height: '10px', background: '#333', borderRadius: '5px', marginTop: '4px', overflow: 'hidden', marginLeft: 'auto' }}>
                      <div style={{ width: `${Math.max(0, enemyHealth)}%`, height: '100%', background: enemyHealth > 40 ? '#10b981' : '#ef4444', transition: 'width 0.5s' }} />
                   </div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{enemyHealth} HP</div>
               </div>
           </div>

           {/* Battle Area */}
           <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', height: '160px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '110px', height: '150px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {myCard ? (
                     <div className="animate-fade-in" style={{ width: '100%', height: '100%', borderRadius: '10px', background: myCard.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                        {myCard.icon}
                        <b style={{ fontSize: '10px', marginTop: '8px' }}>{myCard.name}</b>
                     </div>
                 ) : <span style={{color: '#64748b'}}>Your Card</span>}
              </div>

              <div style={{ fontSize: '24px', fontWeight: 'bold', fontStyle: 'italic', color: '#f43f5e' }}>VS</div>

              <div style={{ width: '110px', height: '150px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {enemyCardId ? (
                     reveal ? (
                         <div className="animate-fade-in" style={{ width: '100%', height: '100%', borderRadius: '10px', background: CARDS.find(c => c.id === enemyCardId)!.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                            {CARDS.find(c => c.id === enemyCardId)!.icon}
                            <b style={{ fontSize: '10px', marginTop: '8px' }}>{CARDS.find(c => c.id === enemyCardId)!.name}</b>
                         </div>
                     ) : (
                         <div style={{ width: '100%', height: '100%', borderRadius: '10px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '32px' }}>?</span>
                         </div>
                     )
                 ) : <span style={{color: '#64748b'}}>Enemy Card</span>}
              </div>
           </div>

           {/* Hand Selection */}
           {!winner && !myCard && (
               <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                   {hand.map((card, idx) => (
                       <div key={idx} onClick={() => selectCard(card)} style={{ width: '90px', height: '130px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.1)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                          <span style={{ fontSize: '24px' }}>?</span>
                       </div>
                   ))}
               </div>
           )}

           {/* Logs */}
           <div style={{ marginTop: '24px', height: '60px', color: '#cbd5e1', fontSize: '12px' }}>
               <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{log[0]}</div>
               {log[1] && <div style={{ opacity: 0.5 }}>{log[1]}</div>}
           </div>

           {winner && (
               <div style={{ marginTop: '16px' }}>
                   <h2 style={{ color: winner === 'Victory' ? '#10b981' : (winner === 'Defeat' ? '#ef4444' : '#eab308') }}>{winner}!</h2>
                   {winner === 'Victory' && <p style={{ color: '#10b981', fontSize: '12px' }}>+20 Fun Gained!</p>}
                   <button className="btn-primary" style={{ marginTop: '16px' }} onClick={onEnd}>Exit Arena</button>
               </div>
           )}
       </div>
    </div>
  );
};

export default PokemonArena;
