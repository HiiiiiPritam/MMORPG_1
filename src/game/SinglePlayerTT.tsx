import React, { useState, useEffect } from 'react';
import { Trophy, XCircle, Bot } from 'lucide-react';

interface SinglePlayerTTProps {
  onEnd: () => void;
  awardFun: () => void;
}

const SinglePlayerTT: React.FC<SinglePlayerTTProps> = ({ onEnd, awardFun }) => {
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [matchLog, setMatchLog] = useState<string[]>(['Match against TT Bot started. Best of 5 points.']);
  const [gameOver, setGameOver] = useState(false);

  // Auto-scroll log
  useEffect(() => {
    const logDiv = document.getElementById('tt-bot-log');
    if (logDiv) {
      logDiv.scrollTop = logDiv.scrollHeight;
    }
  }, [matchLog]);

  const addLog = (msg: string) => {
    setMatchLog((prev) => [...prev, msg].slice(-10));
  };

  const playRound = (playerMove: 'smash' | 'spin' | 'drop') => {
      if (gameOver) return;

      const moves: ('smash'|'spin'|'drop')[] = ['smash', 'spin', 'drop'];
      const botMove = moves[Math.floor(Math.random() * moves.length)];

      let resultText = `You played ${playerMove.toUpperCase()}, Bot played ${botMove.toUpperCase()}. `;

      if (playerMove === botMove) {
          resultText += 'Draw! Rally continues.';
          addLog(resultText);
          return;
      }

      let playerWins = false;
      if (
          (playerMove === 'smash' && botMove === 'spin') ||
          (playerMove === 'spin' && botMove === 'drop') ||
          (playerMove === 'drop' && botMove === 'smash')
      ) {
          playerWins = true;
          resultText += 'You win the rally! Point scored.';
      } else {
          resultText += 'Bot wins the rally! Point lost.';
      }

      addLog(resultText);

      if (playerWins) {
          setPlayerScore(s => {
              const newScore = s + 1;
              if (newScore >= 5) {
                  setGameOver(true);
                  addLog('🎉 YOU WIN THE MATCH!');
                  awardFun();
              }
              return newScore;
          });
      } else {
          setBotScore(s => {
              const newScore = s + 1;
              if (newScore >= 5) {
                  setGameOver(true);
                  addLog('💀 TT BOT WINS THE MATCH!');
              }
              return newScore;
          });
      }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
        <div className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', height: '80vh', maxHeight: '600px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot color="#10b981" /> TT Bot Match
                </h2>
                <button onClick={onEnd} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                   <XCircle size={20} />
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                 <div style={{ textAlign: 'center' }}>
                     <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>YOU</div>
                     <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{playerScore}</div>
                 </div>
                 <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#94a3b8' }}>-</div>
                 <div style={{ textAlign: 'center' }}>
                     <div style={{ color: '#ef4444', fontWeight: 'bold' }}>BOT</div>
                     <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{botScore}</div>
                 </div>
            </div>

            <div 
                id="tt-bot-log"
                style={{ 
                    flex: 1, background: '#0f172a', borderRadius: '8px', padding: '12px', 
                    overflowY: 'auto', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}
            >
                {matchLog.map((log, i) => (
                    <div key={i} style={{ 
                        fontSize: '14px', 
                        color: log.includes('WIN THE MATCH') ? '#10b981' : (log.includes('Bot wins') ? '#ef4444' : '#e2e8f0'),
                        borderLeft: log.includes('You win') ? '3px solid #10b981' : (log.includes('Bot wins') ? '3px solid #ef4444' : '3px solid transparent'),
                        paddingLeft: '8px'
                    }}>
                        {log}
                    </div>
                ))}
            </div>

            {!gameOver ? (
                <div>
                     <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '16px', fontSize: '13px' }}>
                         Smash counters Spin. Spin counters Drop. Drop counters Smash.
                     </p>
                     <div style={{ display: 'flex', gap: '8px' }}>
                         <button className="btn-primary" onClick={() => playRound('smash')} style={{ flex: 1, background: '#ef4444' }}>💥 SMASH</button>
                         <button className="btn-primary" onClick={() => playRound('spin')} style={{ flex: 1, background: '#3b82f6' }}>🌪️ SPIN</button>
                         <button className="btn-primary" onClick={() => playRound('drop')} style={{ flex: 1, background: '#eab308' }}>🎾 DROP</button>
                     </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    {playerScore >= 5 ? (
                         <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', marginBottom: '16px' }}>
                             <Trophy size={32} style={{ marginBottom: '8px' }} />
                             <h3>Victory! +15 Fun</h3>
                         </div>
                    ) : (
                         <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', marginBottom: '16px' }}>
                             <XCircle size={32} style={{ marginBottom: '8px' }} />
                             <h3>Defeat!</h3>
                         </div>
                    )}
                    <button className="btn-primary" onClick={onEnd} style={{ width: '100%' }}>Return to Gym</button>
                </div>
            )}
        </div>
    </div>
  );
};

export default SinglePlayerTT;
