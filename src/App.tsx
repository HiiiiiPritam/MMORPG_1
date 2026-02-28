import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import GameSelect from './pages/GameSelect';
import StorySimulator from './pages/StorySimulator';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/select" element={<GameSelect />} />
        <Route path="/game/nitjsr" element={<StorySimulator />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
