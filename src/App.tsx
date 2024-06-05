import React from 'react';
import Board from './components/Board';

const App: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Connect 4</h1>
        <Board />
      </div>
    </div>
  );
};

export default App;
