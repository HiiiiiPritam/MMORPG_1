import React, { useState, useEffect, useCallback, useRef } from 'react';
import { maps, isWalkable, getTileInteraction, TILE_SIZE, type GameMap } from './MapData';
import { useGameState } from './GameState';
import { useNetwork } from './useNetwork';
import { MessageSquareText, Zap, Brain, Heart, Gamepad2, Send, Swords, XCircle, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TicTacToe from './TicTacToe';
import CombatSystem from './CombatSystem';
import PokemonArena from './PokemonArena';
import TableTennis from './TableTennis';
import SinglePlayerTT from './SinglePlayerTT';
import BasketballMinigame from './BasketballMinigame';

interface GameEngineProps {
  email: string | null;
  characterGender: 'boy' | 'girl';
}

const GameEngine: React.FC<GameEngineProps> = ({ email, characterGender }) => {
  const navigate = useNavigate();
  const { 
    stats, activeMapId, setActiveMapId, 
    triggerSleep, activeMiniGame, setActiveMiniGame, completeLecture, updateStat
  } = useGameState();

  const currentMap: GameMap = maps[activeMapId];

  const [viewport, setViewport] = useState({ width: 13, height: 9 });
  const [isMobile, setIsMobile] = useState(false);
  const [playerPos, setPlayerPos] = useState(currentMap.spawnPos); 
  const [interaction, setInteraction] = useState<string | null>(null);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isWalking = (currentTime - lastMoveTime) < 200;

  // Initialize Multiplayer Network Manager
  const { 
    socket, remotePlayers, chatMessages, sendChat,
    incomingChallenge, activeChallengeRoom, sendChallenge, acceptChallenge, rejectChallenge, leaveChallenge
  } = useNetwork(email, characterGender, activeMapId, playerPos.x, playerPos.y, stats, isWalking);

  // Focus ref so walking doesn't trigger if typing in chat
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlayerPos(maps[activeMapId].spawnPos);
    setInteraction(null);
  }, [activeMapId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 100);
    
    const handleResize = () => {
      let w = Math.ceil(window.innerWidth / TILE_SIZE);
      let h = Math.ceil(window.innerHeight / TILE_SIZE);
      if (w % 2 === 0) w += 1;
      if (h % 2 === 0) h += 1;
      setViewport({ width: Math.max(7, w), height: Math.max(7, h) });
      setIsMobile(window.innerWidth <= 800);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
       clearInterval(timer);
       window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Check for players nearby (within 1 tile)
  const getNearbyPlayer = () => {
      const nearby = Object.values(remotePlayers).find(p => 
          p.id !== socket?.id &&
          p.mapId === activeMapId &&
          Math.abs(p.x - playerPos.x) <= 1 && 
          Math.abs(p.y - playerPos.y) <= 1
      );
      return nearby || null;
  };
  const nearbyPlayer = getNearbyPlayer();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // If typing in chat, do nothing
    if (document.activeElement === chatInputRef.current) return;

    if (interaction || activeMiniGame) {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        setInteraction(null);
      }
      return;
    }

    let newX = playerPos.x;
    let newY = playerPos.y;

    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': newY -= 1; break;
      case 'ArrowDown': case 's': case 'S': newY += 1; break;
      case 'ArrowLeft': case 'a': case 'A': newX -= 1; break;
      case 'ArrowRight': case 'd': case 'D': newX += 1; break;
      case 'c': case 'C': 
        if (nearbyPlayer) {
            // Default to TicTacToe challenge if pressing C
            sendChallenge(nearbyPlayer.id, 'tictactoe');
            setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to Tic-Tac-Toe!`);
        }
        return;
      case 'f': case 'F': 
        if (nearbyPlayer) {
            sendChallenge(nearbyPlayer.id, 'fight');
            setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to a Gang Fight!`);
        }
        break;
      case 'p': case 'P': 
        if (nearbyPlayer) {
            sendChallenge(nearbyPlayer.id, 'pokemon');
            setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to a Pokemon Card Battle!`);
        }
        return;
      case 't': case 'T':
        if (nearbyPlayer) {
            sendChallenge(nearbyPlayer.id, 'tabletennis');
            setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to Table Tennis!`);
        }
        return;
      case ' ': case 'Enter': case 'e': case 'E':
        const checkPoints = [
          {x: playerPos.x, y: playerPos.y - 1}, {x: playerPos.x, y: playerPos.y + 1},
          {x: playerPos.x - 1, y: playerPos.y}, {x: playerPos.x + 1, y: playerPos.y},
          {x: playerPos.x, y: playerPos.y} 
        ];
        
        for (let pt of checkPoints) {
            const result = getTileInteraction(activeMapId, pt.x, pt.y);
            if (result) {
              if (result.type === 'interact_bed') {
                const msg = triggerSleep();
                setInteraction(msg);
                return;
              } else if (result.type === 'interact_desk') {
                setActiveMiniGame('lecture');
                return;
              } else if (result.type === 'interact_tt') {
                setActiveMiniGame('single_tt');
                return;
              } else if (result.type === 'interact_basketball') {
                setActiveMiniGame('single_basketball');
                return;
              } else if (result.type === 'portal' && pt.x === playerPos.x && pt.y === playerPos.y) {
                 setActiveMapId(result.target || 'main_campus');
                 return;
              }
            }
        }
        return;
      default:
        return;
    }

    if (isWalkable(activeMapId, newX, newY)) {
      setPlayerPos({ x: newX, y: newY });
      setLastMoveTime(Date.now());
      
      const autoMsg = getTileInteraction(activeMapId, newX, newY);
      if (autoMsg?.type === 'portal') {
         setActiveMapId(autoMsg.target || 'main_campus');
      }
    }
  }, [playerPos, interaction, activeMiniGame, activeMapId, setActiveMapId, triggerSleep, setActiveMiniGame, nearbyPlayer, sendChallenge]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const startX = playerPos.x - Math.floor(viewport.width / 2);
  const startY = playerPos.y - Math.floor(viewport.height / 2);

  const walkSuffix = (playerPos.x + playerPos.y) % 2 === 0 ? '_walk1' : '_walk2';
  const spriteSrc = `/sprites/${characterGender}_student_sprite${isWalking ? walkSuffix : ''}.png`;

  const handleChatSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (chatInput.trim()) {
          sendChat(chatInput);
          setChatInput("");
      }
  };

  const renderMapTiles = () => {
    const tiles = [];
    for (let y = 0; y < viewport.height; y++) {
      for (let x = 0; x < viewport.width; x++) {
        const mapX = startX + x;
        const mapY = startY + y;
        
        let tileType = -1;
        if (mapX >= 0 && mapX < currentMap.width && mapY >= 0 && mapY < currentMap.height) {
          tileType = currentMap.grid[mapY][mapX];
        }

        let bgImage = '';
        let bgColor = 'transparent';
        let customStyle: React.CSSProperties = {
          width: TILE_SIZE,
          height: TILE_SIZE,
          position: 'absolute',
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          border: tileType >= 0 ? '1px solid rgba(255,255,255,0.02)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px' // For emojis
        };

        if (tileType === -1) bgColor = '#020617';
        else if (tileType === 11) bgColor = '#0f172a'; // Darker wall lines
        else if (tileType === 13) {
             // Sports Complex Exterior "Concrete Roof" texture
             bgColor = '#334155'; // Slate 700
             bgImage = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 4px)';
             customStyle.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.5)';
        }
        else if ([2, 4, 10, 12].includes(tileType)) { 
            bgColor = 'rgba(59, 130, 246, 0.5)'; bgImage = 'url(/sprites/path_tile.png)'; 
        }
        else if ([14, 15, 16].includes(tileType)) {
            bgColor = 'rgba(251, 191, 36, 0.7)'; // Glowing Amber
            customStyle.boxShadow = '0 0 20px #fbbf24';
            customStyle.zIndex = 2;
        }
        else if (tileType === 0) bgImage = 'url(/sprites/grass_texture.png)';
        else if (tileType === 1) bgImage = 'url(/sprites/path_tile.png)';
        else if (tileType === 6) bgImage = 'url(/sprites/floor_tile_marble.png)';
        else if (tileType === 7) bgImage = 'url(/sprites/floor_wood_tile.png)';
        else if (tileType === 8) bgImage = 'url(/sprites/bed_sprite.png)';
        else if (tileType === 9) bgImage = 'url(/sprites/desk_sprite.png)';
        
        // --- CUSTOM HUB STYLES ---
        if (tileType === 17) {
             bgColor = '#16a34a'; // Ping Pong Green
             customStyle.boxShadow = 'inset 0 0 0 2px white'; // Table border
             if (mapY % 2 === 0) customStyle.borderBottom = '4px dashed white'; // The Net
        }

        if ((activeMapId === 'sports_complex' || activeMapId === 'arena') && tileType === 6) {
             bgImage = 'radial-gradient(circle, rgba(255,255,255,0.1) 2px, transparent 2px)';
             bgColor = '#1e3a8a'; // Deep blue gym floor
             customStyle.backgroundSize = '16px 16px';
        }

        let tileContent = null;
        if (activeMapId === 'basketball_court' && tileType === 7) {
             bgColor = '#d97706'; // Orange court
             bgImage = 'repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255,255,255,0.2) 31px, rgba(255,255,255,0.2) 32px)';
             
             // Paint the key/hoop zones
             if ((mapX === 2 || mapX === 11) && mapY === 4) {
                 tileContent = '🏀';
                 bgColor = '#b45309';
             }
        }

        const floatingLabel = (text: string) => <span style={{fontSize:'10px', fontWeight:'bold', color:'white', transform:'translateY(-30px)', position:'absolute', whiteSpace:'nowrap', background:'rgba(0,0,0,0.5)', padding:'2px 4px', borderRadius:'4px', zIndex: 10}}>{text}</span>;
        
        if (activeMapId === 'sports_complex') {
            if (tileType === 14) tileContent = floatingLabel('BASKETBALL');
            if (tileType === 15) tileContent = floatingLabel('TT ROOM');
            if (tileType === 16) tileContent = floatingLabel('ARENA');
        }
        if (activeMapId === 'main_campus' && tileType === 12) {
            tileContent = floatingLabel('SPORTS COMPLEX');
        }

        if (activeMapId === 'main_campus' && (tileType === 3 || tileType === 5)) {
           bgImage = 'url(/sprites/grass_texture.png)';
        }

        if (bgImage && !customStyle.backgroundSize) {
           customStyle.backgroundSize = [8, 9].includes(tileType) ? 'contain' : '100% 100%';
        }
        customStyle.backgroundImage = bgImage;
        customStyle.backgroundPosition = 'center';
        customStyle.backgroundColor = bgColor;

        tiles.push(
          <div key={`${mapX}-${mapY}`} style={customStyle}>
             {tileContent}
          </div>
        );
      }
    }
    return tiles;
  };

  const renderBuildings = () => {
    if (activeMapId !== 'main_campus') return null;
    const buildings = [
      { id: 'djlhc', x: 8, y: 2, w: 5, h: 3, src: '/sprites/djlhc_building_sprite.png' },
      { id: 'hostel', x: 1, y: 1, w: 3, h: 3, src: '/sprites/hostel_building_sprite.png' },
    ];
    return buildings.map(b => {
      const relX = b.x - startX;
      const relY = b.y - startY;
      if (relX + b.w < -1 || relX > viewport.width + 1 || relY + b.h < -1 || relY > viewport.height + 1) return null;

      return (
        <div 
          key={b.id}
          style={{
            position: 'absolute', left: relX * TILE_SIZE, top: relY * TILE_SIZE,
            width: b.w * TILE_SIZE, height: b.h * TILE_SIZE, backgroundImage: `url(${b.src})`,
            backgroundSize: '100% 100%', pointerEvents: 'none', zIndex: 5 
          }}
        />
      );
    });
  };

  const renderRemotePlayers = () => {
      return Object.values(remotePlayers).map(rp => {
          if (rp.mapId !== activeMapId || rp.id === socket?.id) return null;
          const relX = rp.x - startX;
          const relY = rp.y - startY;
          if (relX < 0 || relX >= viewport.width || relY < 0 || relY >= viewport.height) return null;

          const rWalkSuffix = (rp.x + rp.y) % 2 === 0 ? '_walk1' : '_walk2';
          const rSprite = `/sprites/${rp.characterGender}_student_sprite${rp.isWalking ? rWalkSuffix : ''}.png`;

          return (
              <div key={rp.id} style={{
                  position: 'absolute', left: relX * TILE_SIZE, top: relY * TILE_SIZE,
                  width: TILE_SIZE, height: TILE_SIZE,
                  zIndex: 8, filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.5))',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'
              }}>
                 <img src={rSprite} alt="Player" style={{ width: '120%', height: '120%', objectFit: 'contain', position: 'absolute', top: -4 }} />
                 <span style={{ 
                     background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', padding: '2px 4px', 
                     borderRadius: '4px', transform: 'translateY(-20px)', whiteSpace: 'nowrap', zIndex: 1
                 }}>
                     {rp.email.split('@')[0]}
                 </span>
              </div>
          );
      });
  };

  const renderHUD = () => (
    <div style={{
      position: 'absolute', top: isMobile ? '60px' : '16px', left: isMobile ? '8px' : '16px', right: isMobile ? '8px' : '16px', zIndex: 50,
      display: 'flex', justifyContent: 'center', gap: isMobile ? '8px' : '16px', flexWrap: 'wrap'
    }}>
      <div className="glass-panel" style={{ padding: '8px 16px', flex: 1, margin: 0, minWidth: isMobile ? '120px' : 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Heart size={14} color="#f43f5e" />
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Health</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.health}%`, height: '100%', background: '#f43f5e', transition: 'width 0.3s' }} />
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '8px 16px', flex: 1, margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Zap size={14} color="#eab308" />
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Energy</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.energy}%`, height: '100%', background: '#eab308', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '8px 16px', flex: 1, margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Brain size={14} color="#3b82f6" />
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Knowledge</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.knowledge}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '8px 16px', flex: 1, margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Gamepad2 size={14} color="#8b5cf6" />
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Fun</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.fun}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ background: '#020617', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      <div 
        style={{ 
          position: 'relative', overflow: 'hidden', width: '100vw', height: '100vh',
          background: '#020617'
        }}
      >
        <button 
           onClick={() => navigate('/select')} 
           style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 60, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
        >
           <LogOut size={16} /> Back
        </button>

        {renderHUD()}
        {renderMapTiles()}
        {renderBuildings()}
        {renderRemotePlayers()}

        {/* Local Player Sprite */}
        <div 
          style={{
            position: 'absolute', left: Math.floor(viewport.width / 2) * TILE_SIZE, top: Math.floor(viewport.height / 2) * TILE_SIZE,
            width: TILE_SIZE, height: TILE_SIZE,
            zIndex: 10, filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.5))',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'
          }}
        >
             <img src={spriteSrc} alt="You" style={{ width: '120%', height: '120%', objectFit: 'contain', position: 'absolute', top: -4 }} />
             <span style={{ 
                     background: 'rgba(59, 130, 246, 0.9)', color: 'white', fontSize: '10px', padding: '2px 4px', 
                     borderRadius: '4px', transform: 'translateY(-20px)', whiteSpace: 'nowrap', zIndex: 1
                 }}>
                     You
             </span>
        </div>

        {/* Prompt for nearby player */}
        {nearbyPlayer && !interaction && !activeMiniGame && !activeChallengeRoom && !incomingChallenge && (
            <div style={{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', zIndex: 40, background: 'rgba(0,0,0,0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'white' }}>
                    <Swords size={16} style={{display:'inline', verticalAlign:'text-bottom', marginRight:'6px', color:'#f43f5e'}}/>
                    Nearby: <b>{nearbyPlayer.email.split('@')[0]}</b>
                </p>
                 <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button onClick={() => { sendChallenge(nearbyPlayer.id, 'tictactoe'); setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to Tic-Tac-Toe!`); }} style={{ fontSize: '10px', background: '#1e293b', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Press <b>C</b> to Play</button>
                    <button onClick={() => { sendChallenge(nearbyPlayer.id, 'fight'); setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to a Gang Fight!`); }} style={{ fontSize: '10px', background: '#4c1d95', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Press <b>F</b> to Fight</button>
                    <button onClick={() => { sendChallenge(nearbyPlayer.id, 'pokemon'); setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to a Pokemon Card Battle!`); }} style={{ fontSize: '10px', background: '#b45309', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Press <b>P</b> for Pokemon</button>
                    <button onClick={() => { sendChallenge(nearbyPlayer.id, 'tabletennis'); setInteraction(`Challenged ${nearbyPlayer.email.split('@')[0]} to Table Tennis!`); }} style={{ fontSize: '10px', background: '#10b981', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Press <b>T</b> for Ping Pong</button>
                </div>
            </div>
        )}

        {/* Challenge Receiver Modal */}
         {incomingChallenge && (
          <div className="interaction-modal animate-fade-in" style={{ bottom: '80px', maxWidth: '400px', zIndex: 60, border: '1px solid #eab308' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1rem', color: 'white', fontWeight: '500' }}>
                  <b>{incomingChallenge.challengerEmail}</b> wants to play <b>{incomingChallenge.type}</b>!
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn-primary" style={{ padding: '8px' }} onClick={() => acceptChallenge(incomingChallenge.challengerId, incomingChallenge.type)}>
                      <CheckCircle size={16} style={{marginRight:'4px'}}/> Accept
                  </button>
                  <button className="btn-primary" style={{ padding: '8px', background: 'rgba(255,255,255,0.1)' }} onClick={rejectChallenge}>
                      <XCircle size={16} />
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            position: 'absolute',
            bottom: isMobile ? '120px' : '16px',
            right: '16px',
            zIndex: 50,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isChatOpen ? 'var(--primary-hover)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            cursor: 'pointer'
          }}
        >
          {isChatOpen ? <XCircle size={24} /> : <MessageSquareText size={24} />}
        </button>

        {/* Chat UI overlay */}
        {isChatOpen && (
          <div className="animate-fade-in" style={{
              position: 'absolute', bottom: isMobile ? '190px' : '80px', right: '16px',
              width: isMobile ? 'calc(100vw - 32px)' : '320px', height: isMobile ? '180px' : '300px', 
              background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)', zIndex: 45, display: 'flex', flexDirection: 'column',
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
              <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatMessages.filter(m => m.mapId === activeMapId).map((msg, i) => (
                      <div key={i} style={{ fontSize: '13px', lineHeight: '1.4' }}>
                          <strong style={{ color: msg.email === email?.split('@')[0] ? '#3b82f6' : '#94a3b8' }}>{msg.email}: </strong>
                          <span style={{ color: 'white' }}>{msg.text}</span>
                      </div>
                  ))}
              </div>
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  <input 
                      ref={chatInputRef}
                      type="text" 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px', color: 'white', outline: 'none', fontSize: '13px' }}
                  />
                  <button type="submit" style={{ background: 'transparent', border: 'none', padding: '0 12px', color: '#3b82f6', cursor: 'pointer' }}>
                      <Send size={18} />
                  </button>
              </form>
          </div>
        )}

        {/* Interaction Modal */}
        {interaction && (
          <div className="interaction-modal animate-fade-in" style={{ bottom: '40px', maxWidth: '600px', left: 'auto', right: '16px', width: '400px' }}>
            <div style={{ color: 'var(--primary)' }}>
              <MessageSquareText size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1rem', lineHeight: '1.5', color: 'white', fontWeight: '500' }}>{interaction}</p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '12px' }}>Press [Space] to close</p>
            </div>
          </div>
        )}

        {/* Mini-Games Overlays */}
        {activeMiniGame === 'lecture' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} className="animate-fade-in">
              <div className="glass-panel" style={{ textAlign: 'center' }}>
                <Brain size={48} color="var(--primary)" style={{ margin: '0 auto 24px auto' }} />
                <h2 style={{ marginBottom: '16px' }}>Advanced Data Structures</h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button className="btn-primary" onClick={() => { const res = completeLecture(true); setInteraction(res); }}>Pay Attention (-E, +K)</button>
                  <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => { const res = completeLecture(false); setInteraction(res); }}>Sleep (-F)</button>
                </div>
              </div>
          </div>
        )}

        {/* Single Player Sports Bots */}
        {activeMiniGame === 'single_tt' && (
            <SinglePlayerTT onEnd={() => setActiveMiniGame(null)} awardFun={() => updateStat('fun', 15)} />
        )}
        {activeMiniGame === 'single_basketball' && (
            <BasketballMinigame onEnd={() => setActiveMiniGame(null)} awardFun={() => updateStat('fun', 15)} />
        )}

        {/* Multiplayer Mini Games */}
        {activeChallengeRoom?.type === 'tictactoe' && socket && (
            <TicTacToe socket={socket} roomId={activeChallengeRoom.roomId} isChallenger={socket.id === activeChallengeRoom.roomId.split('_')[1]} onEnd={leaveChallenge} />
        )}
        {activeChallengeRoom?.type === 'fight' && socket && (
            <CombatSystem socket={socket} roomId={activeChallengeRoom.roomId} isChallenger={socket.id === activeChallengeRoom.roomId.split('_')[1]} onEnd={leaveChallenge} />
        )}
        {activeChallengeRoom?.type === 'pokemon' && socket && (
            <PokemonArena socket={socket} roomId={activeChallengeRoom.roomId} isChallenger={socket.id === activeChallengeRoom.roomId.split('_')[1]} onEnd={leaveChallenge} awardFun={() => updateStat('fun', 20)} />
        )}
        {activeChallengeRoom?.type === 'tabletennis' && socket && (
            <TableTennis socket={socket} roomId={activeChallengeRoom.roomId} isChallenger={socket.id === activeChallengeRoom.roomId.split('_')[1]} onEnd={leaveChallenge} awardFun={() => updateStat('fun', 15)} />
        )}

        {/* Mobile On-Screen Controls */}
        {isMobile && (
          <>
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                 <button onTouchStart={(e) => { e.preventDefault(); handleKeyDown({key: 'ArrowUp'} as any) }} style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                 <div style={{ display: 'flex', gap: '8px' }}>
                     <button onTouchStart={(e) => { e.preventDefault(); handleKeyDown({key: 'ArrowLeft'} as any) }} style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>
                     <div style={{ width: '50px', height: '50px' }} />
                     <button onTouchStart={(e) => { e.preventDefault(); handleKeyDown({key: 'ArrowRight'} as any) }} style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
                 </div>
                 <button onTouchStart={(e) => { e.preventDefault(); handleKeyDown({key: 'ArrowDown'} as any) }} style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
            </div>
            
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 100, display: 'flex', gap: '16px' }}>
                 <button onTouchStart={(e) => { e.preventDefault(); handleKeyDown({key: 'Enter'} as any) }} style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(59,130,246,0.6)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>ACT</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameEngine;
