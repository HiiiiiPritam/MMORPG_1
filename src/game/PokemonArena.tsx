import React, { useState, useEffect } from 'react';
import { Flame, Droplet, Zap, Shield, Sparkles, Leaf, Snowflake, Swords, Skull, Mountain, Wind, Brain, Bug as BugIcon, Diamond, Ghost, Crown, Moon, Wrench, Circle, Info, X } from 'lucide-react';

interface PokemonArenaProps {
  socket: any;
  roomId: string;
  isChallenger: boolean;
  onEnd: () => void;
  awardFun: () => void;
}

const CARDS = [
  { id: 'normal', name: 'Tackle', type: 'normal', power: 40, icon: <Circle size={32} color="#cbd5e1"/>, bg: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)' },
  { id: 'fire', name: 'Fire Blast', type: 'fire', power: 50, icon: <Flame size={32} color="#f97316"/>, bg: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)' },
  { id: 'water', name: 'Aqua Jet', type: 'water', power: 30, icon: <Droplet size={32} color="#38bdf8"/>, bg: 'linear-gradient(135deg, #082f49 0%, #0284c7 100%)' },
  { id: 'grass', name: 'Solar Beam', type: 'grass', power: 60, icon: <Leaf size={32} color="#4ade80"/>, bg: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)' },
  { id: 'electric', name: 'Thunder Bolt', type: 'electric', power: 50, icon: <Zap size={32} color="#facc15"/>, bg: 'linear-gradient(135deg, #713f12 0%, #ca8a04 100%)' },
  { id: 'ice', name: 'Ice Beam', type: 'ice', power: 50, icon: <Snowflake size={32} color="#7dd3fc"/>, bg: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)' },
  { id: 'fighting', name: 'Cross Chop', type: 'fighting', power: 60, icon: <Swords size={32} color="#f87171"/>, bg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)' },
  { id: 'poison', name: 'Sludge Bomb', type: 'poison', power: 50, icon: <Skull size={32} color="#c084fc"/>, bg: 'linear-gradient(135deg, #581c87 0%, #9333ea 100%)' },
  { id: 'ground', name: 'Earthquake', type: 'ground', power: 60, icon: <Mountain size={32} color="#fbbf24"/>, bg: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)' },
  { id: 'flying', name: 'Hurricane', type: 'flying', power: 60, icon: <Wind size={32} color="#bae6fd"/>, bg: 'linear-gradient(135deg, #1e3a8a 0%, #60a5fa 100%)' },
  { id: 'psychic', name: 'Psychic', type: 'psychic', power: 50, icon: <Brain size={32} color="#f472b6"/>, bg: 'linear-gradient(135deg, #831843 0%, #db2777 100%)' },
  { id: 'bug', name: 'Bug Buzz', type: 'bug', power: 50, icon: <BugIcon size={32} color="#a3e635"/>, bg: 'linear-gradient(135deg, #3f6212 0%, #65a30d 100%)' },
  { id: 'rock', name: 'Stone Edge', type: 'rock', power: 60, icon: <Diamond size={32} color="#fcd34d"/>, bg: 'linear-gradient(135deg, #451a03 0%, #92400e 100%)' },
  { id: 'ghost', name: 'Shadow Ball', type: 'ghost', power: 45, icon: <Ghost size={32} color="#818cf8"/>, bg: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)' },
  { id: 'dragon', name: 'Draco Meteor', type: 'dragon', power: 70, icon: <Crown size={32} color="#818cf8"/>, bg: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)' },
  { id: 'dark', name: 'Dark Pulse', type: 'dark', power: 45, icon: <Moon size={32} color="#64748b"/>, bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  { id: 'steel', name: 'Iron Tail', type: 'steel', power: 50, icon: <Wrench size={32} color="#cbd5e1"/>, bg: 'linear-gradient(135deg, #334155 0%, #64748b 100%)' },
  { id: 'fairy', name: 'Moonblast', type: 'fairy', power: 50, icon: <Sparkles size={32} color="#fbcfe8"/>, bg: 'linear-gradient(135deg, #831843 0%, #db2777 100%)' }
];

const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, water: 0.5, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, water: 0.5, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

const MAX_HP = 200;

const PokemonArena: React.FC<PokemonArenaProps> = ({ socket, roomId, isChallenger, onEnd, awardFun }) => {
  const [myHealth, setMyHealth] = useState(MAX_HP);
  const [enemyHealth, setEnemyHealth] = useState(MAX_HP);
  const [hand, setHand] = useState<any[]>([]);
  const [myCard, setMyCard] = useState<any | null>(null);
  const [enemyCardId, setEnemyCardId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(['Battle Started!', 'Pick a card from your hand.']);
  const [showInfo, setShowInfo] = useState(false);

  // Deal 3 random cards at start of battle
  useEffect(() => {
    const initialHand = [];
    for(let i=0; i<3; i++) {
        initialHand.push(CARDS[Math.floor(Math.random() * CARDS.length)]);
    }
    setHand(initialHand);
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

             const myEffectiveness = TYPE_EFFECTIVENESS[myCard.type]?.[opCard.type] ?? 1;
             const opEffectiveness = TYPE_EFFECTIVENESS[opCard.type]?.[myCard.type] ?? 1;

             let opDmgAssigned = Math.floor(myCard.power * myEffectiveness);
             let myDmgAssigned = Math.floor(opCard.power * opEffectiveness);

             let myMsg = `${myCard.name} dealt ${opDmgAssigned} DMG!`;
             if (myEffectiveness > 1) myMsg += " It's super effective!";
             if (myEffectiveness < 1 && myEffectiveness > 0) myMsg += " It's not very effective...";
             if (myEffectiveness === 0) myMsg += " It had no effect!";

             let opMsg = `Enemy's ${opCard.name} dealt ${myDmgAssigned} DMG!`;
             if (opEffectiveness > 1) opMsg += " It was super effective!";
             if (opEffectiveness < 1 && opEffectiveness > 0) opMsg += " It was not very effective...";
             if (opEffectiveness === 0) opMsg += " It had no effect!";

             newMyHp -= myDmgAssigned;
             newOpHp -= opDmgAssigned;

             setMyHealth(Math.min(MAX_HP, Math.max(0, newMyHp)));
             setEnemyHealth(Math.min(MAX_HP, Math.max(0, newOpHp)));
             
             setLog(prev => [myMsg, opMsg, ...prev].slice(0, 5));

             if (newMyHp <= 0 && newOpHp <= 0) {
                 setWinner('Draw');
             } else if (newMyHp <= 0) {
                 setWinner('Defeat');
             } else if (newOpHp <= 0) {
                 setWinner('Victory');
                 awardFun(); // Stat boost!
             } else {
                 setTimeout(() => {
                     // Next turn: draw a new random card to replace the empty slot
                     setHand(prev => {
                         const newHand = [...prev];
                         const emptyIndex = newHand.findIndex(c => c === null);
                         if (emptyIndex !== -1) {
                             newHand[emptyIndex] = CARDS[Math.floor(Math.random() * CARDS.length)];
                         }
                         return newHand;
                     });
                     setMyCard(null);
                     setEnemyCardId(null);
                     setReveal(false);
                 }, 2500); 
             }
         }, 1500);
     }
     return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCard, enemyCardId]);

  const selectCard = (card: any, index: number) => {
      if (myCard || winner || !card) return;
      setMyCard(card);
      
      // Remove the carefully selected card from hand (leaving a null gap)
      setHand(prev => {
          const newHand = [...prev];
          newHand[index] = null;
          return newHand;
      });

      socket.emit('pokemon_move', { roomId, cardId: card.id, isFromChallenger: isChallenger });
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
       
       {showInfo && (
           <div className="glass-panel animate-fade-in" style={{ position: 'absolute', zIndex: 110, padding: '24px', width: '80%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', background: 'rgba(15, 23, 42, 0.95)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <h2 style={{ color: '#38bdf8' }}>Type Matchups Manual</h2>
                   <button onClick={() => setShowInfo(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
               </div>
               <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                   Different elemental types have strengths and weaknesses against each other. Damage modifiers stack based on the opponent's card type:
                   <br/> <span style={{ color: '#4ade80' }}>2x (Super Effective)</span>, <span style={{ color: '#f87171' }}>0.5x (Not Very Effective)</span>, <span style={{ color: '#94a3b8' }}>0x (No Effect)</span>. Default is 1x.
               </p>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', fontSize: '12px' }}>
                   {Object.keys(TYPE_EFFECTIVENESS).map(type => (
                       <div key={type} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                           <strong style={{ textTransform: 'capitalize', color: '#fcd34d' }}>{type} Type</strong>
                           <ul style={{ paddingLeft: '16px', marginTop: '8px', color: '#cbd5e1' }}>
                               {Object.entries(TYPE_EFFECTIVENESS[type]).map(([targetType, mult]) => (
                                   <li key={targetType} style={{ color: mult === 2 ? '#4ade80' : (mult === 0.5 ? '#f87171' : '#94a3b8') }}>
                                       vs {targetType.charAt(0).toUpperCase() + targetType.slice(1)}: {mult}x
                                   </li>
                               ))}
                           </ul>
                       </div>
                   ))}
               </div>
           </div>
       )}

       <div className="glass-panel" style={{ width: '600px', textAlign: 'center', padding: '32px', position: 'relative' }}>
           <button onClick={() => setShowInfo(true)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={16} />
           </button>
           
           <h2 style={{ marginBottom: '8px', color: '#eab308' }}>Pokemon Card Arena</h2>
           <p style={{ marginBottom: '24px', fontSize: '12px', color: '#94a3b8' }}>Play a card to counter your opponent!</p>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '0 24px' }}>
               <div style={{ textAlign: 'left' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>You</div>
                   <div style={{ width: '150px', height: '10px', background: '#333', borderRadius: '5px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(myHealth / MAX_HP) * 100}%`, height: '100%', background: myHealth > (MAX_HP * 0.4) ? '#10b981' : '#ef4444', transition: 'width 0.5s' }} />
                   </div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{myHealth} / {MAX_HP} HP</div>
               </div>
               <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Opponent</div>
                   <div style={{ width: '150px', height: '10px', background: '#333', borderRadius: '5px', marginTop: '4px', overflow: 'hidden', marginLeft: 'auto' }}>
                      <div style={{ width: `${(enemyHealth / MAX_HP) * 100}%`, height: '100%', background: enemyHealth > (MAX_HP * 0.4) ? '#10b981' : '#ef4444', transition: 'width 0.5s' }} />
                   </div>
                   <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{enemyHealth} / {MAX_HP} HP</div>
               </div>
           </div>

           {/* Battle Area */}
           <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', height: '160px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '110px', height: '150px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {myCard ? (
                     <div className="animate-fade-in" style={{ width: '100%', height: '100%', borderRadius: '10px', background: myCard.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                        {myCard.icon}
                        <b style={{ fontSize: '10px', marginTop: '8px' }}>{myCard.name}</b>
                        <span style={{ fontSize: '10px', color: '#cbd5e1', textTransform: 'uppercase', marginTop: '4px' }}>{myCard.type}</span>
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
                            <span style={{ fontSize: '10px', color: '#cbd5e1', textTransform: 'uppercase', marginTop: '4px' }}>{CARDS.find(c => c.id === enemyCardId)!.type}</span>
                         </div>
                     ) : (
                         <div style={{ width: '100%', height: '100%', borderRadius: '10px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame size={32} color="rgba(255,255,255,0.2)" />
                            <span style={{ position: 'absolute', fontSize: '32px' }}>?</span>
                         </div>
                     )
                 ) : <span style={{color: '#64748b'}}>Enemy Card</span>}
              </div>
           </div>

           {/* Hand Selection */}
           {!winner && (
               <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                   {hand.map((card, idx) => (
                       <div 
                           key={idx} 
                           onClick={() => selectCard(card, idx)} 
                           style={{ 
                               width: '90px', height: '130px', 
                               background: card ? card.bg : 'rgba(255,255,255,0.05)', 
                               borderRadius: '8px', 
                               cursor: card && !myCard ? 'pointer' : 'default', 
                               display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                               border: '2px solid rgba(255,255,255,0.1)', 
                               transition: 'transform 0.2s',
                               opacity: (!card || myCard) ? 0.5 : 1
                           }} 
                           onMouseOver={e => { if(card && !myCard) e.currentTarget.style.transform = 'translateY(-10px)' }} 
                           onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                       >
                          {card ? (
                              <>
                                 {card.icon}
                                 <b style={{ fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>{card.name}</b>
                                 <span style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '4px', textTransform: 'capitalize' }}>{card.type}</span>
                                 <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>{card.power} DMG</span>
                              </>
                          ) : (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>Waiting...</span>
                          )}
                       </div>
                   ))}
               </div>
           )}

           {/* Logs */}
           <div style={{ marginTop: '24px', height: '60px', color: '#cbd5e1', fontSize: '12px' }}>
               <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{log[0]}</div>
               {log[1] && <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: '13px' }}>{log[1]}</div>}
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
