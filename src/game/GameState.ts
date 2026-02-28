import { useState, useCallback, useEffect } from 'react';

export interface PlayerStats {
  energy: number;
  knowledge: number;
  health: number;
  fun: number;
}

export const useGameState = () => {
  const [stats, setStats] = useState<PlayerStats>({
    energy: 100,
    knowledge: 10,
    health: 100,
    fun: 80,
  });

  const [activeMapId, setActiveMapId] = useState<string>('main_campus');

  // Mini-game triggers
  const [activeMiniGame, setActiveMiniGame] = useState<'lecture' | 'tictactoe' | 'gangfight' | 'single_tt' | 'single_basketball' | null>(null);

  const updateStat = useCallback((stat: keyof PlayerStats, amount: number) => {
    setStats(prev => ({
      ...prev,
      // Clamp between 0 and 100
      [stat]: Math.max(0, Math.min(100, prev[stat] + amount))
    }));
  }, []);

  // Life Simulation Stat Decay Timer
  useEffect(() => {
    const decayInterval = setInterval(() => {
        setStats(prev => ({
            energy: Math.max(0, prev.energy - 1),
            fun: Math.max(0, prev.fun - 1),
            health: Math.max(0, prev.health - 1), // slowly drains if not careful
            knowledge: prev.knowledge // Knowledge doesn't decay naturally
        }));
    }, 15000); // Every 15 seconds, lose 1 stat point

    return () => clearInterval(decayInterval);
  }, []);

  const triggerSleep = useCallback(() => {
    updateStat('energy', 100); // Fully restore
    updateStat('health', 20);  // Heal a bit
    updateStat('fun', -10);    // Sleeping isn't fun
    return "You slept soundly in your hostel bed. Energy restored!";
  }, [updateStat]);

  const completeLecture = useCallback((success: boolean) => {
    setActiveMiniGame(null);
    if (success) {
      updateStat('knowledge', 15);
      updateStat('energy', -20);
      updateStat('fun', -15);
      return "You successfully attended the lecture! Gained Knowledge, lost Energy.";
    } else {
      updateStat('energy', -10);
      updateStat('fun', -20);
      return "You fell asleep during the lecture...";
    }
  }, [updateStat]);

  return {
    stats,
    updateStat,
    activeMapId,
    setActiveMapId,
    triggerSleep,
    activeMiniGame,
    setActiveMiniGame,
    completeLecture
  };
};
