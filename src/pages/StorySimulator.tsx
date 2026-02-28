import React, { useState } from 'react';
import GameEngine from '../game/GameEngine';

const StorySimulator: React.FC = () => {
  const [characterGender, setCharacterGender] = useState<'boy' | 'girl' | null>(null);

  if (!characterGender) {
    return (
      <div className="page-container">
        <div className="glass-panel animate-fade-in text-center" style={{maxWidth: '800px'}}>
          <h1 className="mb-4" style={{ color: 'white' }}>Choose Your <span className="text-gradient">Character</span></h1>
          <p className="mb-8" style={{ color: '#cbd5e1' }}>Select your avatar to begin your NIT JSR journey.</p>
          
          <div style={{display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap'}}>
            
            <div 
              style={{flex: '1', minWidth:'250px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center'}}
              onClick={() => setCharacterGender('boy')}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <div style={{background: 'rgba(0,0,0,0.3)', width: '120px', height: '120px', borderRadius: '50%', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                <img src="/sprites/boy_student_sprite.png" alt="Boy Student" style={{width: '200%', height: '200%', objectFit: 'contain'}} />
              </div>
              <h3 style={{fontSize: '1.5rem', marginBottom: '8px', color: 'white'}}>Male Student</h3>
              <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>Ready to hack through the semester.</p>
            </div>
            
            <div 
              style={{flex: '1', minWidth:'250px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center'}}
              onClick={() => setCharacterGender('girl')}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <div style={{background: 'rgba(0,0,0,0.3)', width: '120px', height: '120px', borderRadius: '50%', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
                <img src="/sprites/girl_student_sprite.png" alt="Girl Student" style={{width: '200%', height: '200%', objectFit: 'contain'}} />
              </div>
              <h3 style={{fontSize: '1.5rem', marginBottom: '8px', color: 'white'}}>Female Student</h3>
              <p style={{fontSize: '0.9rem', color: '#94a3b8'}}>Prepared to top the engineering branch.</p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const email = localStorage.getItem('nitjsr_email') || 'test@nitjsr.ac.in';
  return <GameEngine characterGender={characterGender} email={email} />;
};

export default StorySimulator;
