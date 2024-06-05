// src/components/Board.tsx
import React, { useState } from 'react';

const ROWS = 6;
const COLUMNS = 7;

const createEmptyBoard = (): (string | null)[][] => {
  return Array(ROWS).fill(null).map(() => Array(COLUMNS).fill(null));
};

const Board: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('Red');
  const [winner, setWinner] = useState<string | null>(null);

  const handleCellClick = (columnIndex: number) => {
    if (winner) return;

    const rowIndex = findEmptyRow(columnIndex);
    if (rowIndex === -1) return;

    const updatedBoard = board.map(row => [...row]);
    updatedBoard[rowIndex][columnIndex] = currentPlayer;
    setBoard(updatedBoard);

    if (checkForWinner(updatedBoard, rowIndex, columnIndex)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 'Red' ? 'Blue' : 'Red');
    }
  };

  const findEmptyRow = (columnIndex: number): number => {
    for (let rowIndex = ROWS - 1; rowIndex >= 0; rowIndex--) {
      if (!board[rowIndex][columnIndex]) {
        return rowIndex;
      }
    }
    return -1;
  };

  const checkForWinner = (board: (string | null)[][], rowIndex: number, columnIndex: number): boolean => {
    const directions = [
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 }
    ];

    for (const { dx, dy } of directions) {
      let count = 1;
      for (let step = 1; step < 4; step++) {
        const r = rowIndex + dy * step;
        const c = columnIndex + dx * step;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLUMNS || board[r][c] !== currentPlayer) break;
        count++;
      }
      for (let step = 1; step < 4; step++) {
        const r = rowIndex - dy * step;
        const c = columnIndex - dx * step;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLUMNS || board[r][c] !== currentPlayer) break;
        count++;
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('Red');
    setWinner(null);
  };

  const renderCell = (rowIndex: number, columnIndex: number) => {
    const color = board[rowIndex][columnIndex];
    return (
      <div
        key={columnIndex}
        className={`w-12 h-12 border border-gray-700 flex items-center justify-center cursor-pointer ${color === 'Red' ? 'bg-red-500' : color === 'Blue' ? 'bg-blue-500' : 'bg-white'}`}
        onClick={() => handleCellClick(columnIndex)}
      />
    );
  };

  const renderRow = (row: (string | null)[], rowIndex: number) => {
    return (
      <div key={rowIndex} className="flex">
        {row.map((_, columnIndex) => renderCell(rowIndex, columnIndex))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {winner ? (
        <div className="text-2xl mb-4">{winner} wins!</div>
      ) : (
        <div className="text-2xl mb-4">{currentPlayer}'s turn</div>
      )}
      <div className="bg-gray-300 p-2">
        {board.map((row, rowIndex) => renderRow(row, rowIndex))}
      </div>
      <button 
        onClick={resetGame} 
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Reset Game
      </button>
    </div>
  );
};

export default Board;
