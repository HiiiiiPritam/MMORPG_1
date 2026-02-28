import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, LogOut, Map } from 'lucide-react';

const GameSelect: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);

  const games = [
    {
      id: 1,
      name: "NIT JSR: The Story Simulator",
      description: "Experience the life of an engineering student. Explore DJLHC, hostels, and discover hidden secrets.",
      icon: <Map size={48} color="#3b82f6" />,
      color: "var(--primary)",
      available: true
    },
    {
      id: 2,
      name: "Canteen Rush (Coming Soon)",
      description: "Manage the chaotic crowd at the mega hostel canteen during lunch break.",
      icon: <div style={{width:'48px', height:'48px', background:'rgba(255,255,255,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'24px'}}>☕</div>,
      color: "var(--text-muted)",
      available: false
    }
  ];

  return (
    <div className="page-container" style={{justifyContent: 'flex-start', paddingTop: '80px'}}>
      <div className="bg-orb orb-1 animate-float"></div>
      <div className="bg-orb orb-2 animate-float"></div>

      <header className="header-bar animate-fade-in">
        <div>
          <h1 style={{fontSize: '2rem'}}>Welcome back, <span className="text-gradient">Student</span></h1>
          <p style={{marginTop: '8px'}}>Select a university experience to dive in.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', cursor: 'pointer'}}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </header>

      <div className="game-grid animate-fade-in">
        {games.map((game, idx) => (
          <div 
            key={game.id}
            className={`game-card ${!game.available ? 'locked' : ''}`}
            onMouseEnter={() => setHoveredGame(idx)}
            onMouseLeave={() => setHoveredGame(null)}
            style={{
              borderColor: hoveredGame === idx && game.available ? game.color : '',
            }}
          >
            <div style={{marginBottom: '24px'}}>{game.icon}</div>
            <h3 style={{fontSize: '1.5rem', marginBottom: '12px'}}>{game.name}</h3>
            <p style={{flexGrow: 1, marginBottom: '24px'}}>{game.description}</p>
            
            {game.available ? (
              <button 
                style={{width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s'}}
                onClick={() => navigate('/game/nitjsr')}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <Play size={18} />
                <span>Play Now</span>
              </button>
            ) : (
              <button disabled style={{width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'}}>
                Locked
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameSelect;
