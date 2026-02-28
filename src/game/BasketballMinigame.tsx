import React, { useState, useEffect } from 'react';
import { Target, Trophy, XCircle, Activity } from 'lucide-react';

interface SinglePlayerBasketballProps {
  onEnd: () => void;
  awardFun: () => void;
}

const BasketballMinigame: React.FC<SinglePlayerBasketballProps> = ({ onEnd, awardFun }) => {
  const [power, setPower] = useState(0);
  const [moving, setMoving] = useState(true);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState<'aiming' | 'scored' | 'missed'>('aiming');
  const [score, setScore] = useState(0);
  const [throws, setThrows] = useState(0);

  // Power bar animation
  useEffect(() => {
    if (!moving) return;
    
    const interval = setInterval(() => {
      setPower(p => {
        let next = p + (direction * 5);
        if (next >= 100) { setDirection(-1); return 100; }
        if (next <= 0) { setDirection(1); return 0; }
        return next;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [moving, direction]);

  const shoot = () => {
    if (!moving) return;
    setMoving(false);
    
    // The "Green Zone" for a perfect shot is between 75% and 85% power.
    const isGoal = power >= 70 && power <= 90;
    
    if (isGoal) {
        setStatus('scored');
        setScore(s => s + 1);
    } else {
        setStatus('missed');
    }
    setThrows(t => t + 1);
  };

  const nextThrow = () => {
    if (throws >= 5) {
        if (score >= 3) {
            awardFun();
        }
        onEnd();
    } else {
        setStatus('aiming');
        setPower(0);
        setDirection(1);
        setMoving(true);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
        <div className="glass-panel" style={{ textAlign: 'center', width: '350px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target color="#f59e0b" /> Free Throws
                </h2>
                <button onClick={onEnd} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                   <XCircle size={20} />
                </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                Stop the bar in the green zone! (Throws: {throws}/5)
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Score</span>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{score}</div>
                </div>
            </div>

            {status === 'aiming' ? (
                <>
                    <div style={{ width: '100%', height: '30px', background: '#1e293b', borderRadius: '15px', position: 'relative', overflow: 'hidden', marginBottom: '24px', border: '2px solid rgba(255,255,255,0.1)' }}>
                        {/* Green Zone indicator */}
                        <div style={{ position: 'absolute', left: '70%', width: '20%', height: '100%', background: 'rgba(16, 185, 129, 0.4)', zIndex: 1 }} />
                        
                        <div style={{ 
                            width: `${power}%`, height: '100%', 
                            background: power >= 70 && power <= 90 ? '#10b981' : (power > 90 ? '#ef4444' : '#3b82f6'), 
                            transition: 'width 0.05s linear',
                            boxShadow: '0 0 10px rgba(255,255,255,0.5)', zIndex: 2, position: 'relative'
                        }} />
                    </div>

                    <button 
                        className="btn-primary" 
                        onClick={shoot}
                        style={{ width: '100%', padding: '12px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <Activity size={20} /> SHOOT!
                    </button>
                </>
            ) : (
                <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                     {status === 'scored' ? (
                          <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <Trophy size={48} />
                              <h3 style={{ margin: 0 }}>SWISH! +1 Point</h3>
                          </div>
                     ) : (
                          <div style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <XCircle size={48} />
                              <h3 style={{ margin: 0 }}>BRICK! Missed it.</h3>
                          </div>
                     )}

                     {throws >= 5 ? (
                         <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px', width: '100%' }}>
                             <h4>Game Over!</h4>
                             <p>You scored {score} out of 5.</p>
                             {score >= 3 ? (
                                <p style={{ color: '#10b981', fontWeight: 'bold', marginTop: '8px' }}>Excellent! +15 Fun!</p>
                             ) : (
                                <p style={{ color: '#94a3b8', marginTop: '8px' }}>Need more practice...</p>
                             )}
                             <button className="btn-primary" onClick={onEnd} style={{ width: '100%', marginTop: '16px' }}>Finish Training</button>
                         </div>
                     ) : (
                         <button className="btn-primary" onClick={nextThrow} style={{ width: '100%' }}>Next Ball</button>
                     )}
                </div>
            )}
        </div>
    </div>
  );
};

export default BasketballMinigame;
