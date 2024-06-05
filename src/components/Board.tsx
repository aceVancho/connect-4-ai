import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ROWS = 6;
const COLUMNS = 7;

const createEmptyBoard = (): (string | null)[][] => {
  return Array(ROWS).fill(null).map(() => Array(COLUMNS).fill(null));
};

const Board: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState('Red');
  const [winner, setWinner] = useState<string | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const isWaitingForAiRef = useRef(false);

  useEffect(() => {
    if (isAiMode && currentPlayer === 'Blue' && !winner && !isWaitingForAiRef.current) {
      makeAiMove(board);
    }
  }, [currentPlayer, isAiMode, winner, board]);

  const handleCellClick = (columnIndex: number) => {
    console.log('isWaitingForAiRef.current', isWaitingForAiRef.current)
    if (winner || isWaitingForAiRef.current) return;

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
      { deltaX: 0, deltaY: 1 },
      { deltaX: 1, deltaY: 0 },
      { deltaX: 1, deltaY: 1 },
      { deltaX: 1, deltaY: -1 }
    ];

    for (const { deltaX, deltaY } of directions) {
      let count = 1;
      for (let step = 1; step < 4; step++) {
        const newRow = rowIndex + deltaY * step;
        const newColumn = columnIndex + deltaX * step;
        if (newRow < 0 || newRow >= ROWS || newColumn < 0 || newColumn >= COLUMNS || board[newRow][newColumn] !== currentPlayer) break;
        count++;
      }
      for (let step = 1; step < 4; step++) {
        const newRow = rowIndex - deltaY * step;
        const newColumn = columnIndex - deltaX * step;
        if (newRow < 0 || newRow >= ROWS || newColumn < 0 || newColumn >= COLUMNS || board[newRow][newColumn] !== currentPlayer) break;
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
    isWaitingForAiRef.current = false;
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

  const makeAiMove = async (updatedBoard: (string | null)[][]) => {
    isWaitingForAiRef.current = true;
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const createBoardString = (board: (string | null)[][]): string => {
        return board.map(row => row.map(cell => cell || '-').join(' ')).join('\n');
    };
    console.log(JSON.stringify(updatedBoard))
    console.log(createBoardString(board))
    const prompt = `
    You are a Connect 4 AI assistant. 
    You will be given a current board state and are to make the next move as the Blue player.
    String view of board state: ${createBoardString(board)}.
    Matrix view of board state: ${JSON.stringify(updatedBoard)}
    Responses are required to be in JSON format like: {"column": <column_index>}
    Ensure the column is not full before choosing it.
    Do NOT let Red get 4 in a row
    `;
    
    const messages = [
      { role: "user", content: prompt },
    ];

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o",
        messages: messages,
        functions: [
          {
            name: "verify_ai_move",
            description: "Verifies the AI's move in Connect 4",
            parameters: {
              type: "object",
              properties: {
                column: {
                  type: "integer",
                  description: "The column index for the AI's move"
                }
              },
              required: ["column"]
            }
          }
        ],
        function_call: "auto",
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const aiResponse = response.data.choices[0];
      let aiColumnIndex;

      if (aiResponse.message.content) {
        const aiMove = JSON.parse(aiResponse.message.content);
        aiColumnIndex = aiMove.column;
      } else if (aiResponse.message.function_call) {
        aiColumnIndex = JSON.parse(aiResponse.message.function_call.arguments).column;
      }

      if (aiColumnIndex !== undefined) {
        isWaitingForAiRef.current = false;
        console.log('handleAiMove:', aiColumnIndex)
        handleAiMove(aiColumnIndex);
      } else {
        console.error("Could not determine AI move from response:", aiResponse);
      }
    } catch (error) {
      console.error("Error making AI move:", error);
    }
  };

  const handleAiMove = (columnIndex: number) => {
    if (winner || isWaitingForAiRef.current) return;

    const rowIndex = findEmptyRow(columnIndex);
    if (rowIndex === -1) return;

    const updatedBoard = board.map(row => [...row]);
    updatedBoard[rowIndex][columnIndex] = 'Blue';
    setBoard(updatedBoard);

    if (checkForWinner(updatedBoard, rowIndex, columnIndex)) {
      setWinner('Blue');
    } else {
      setCurrentPlayer('Red');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <button 
          onClick={() => setIsAiMode(false)} 
          className={`mr-2 px-4 py-2 ${!isAiMode ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
        >
          Player vs Player
        </button>
        <button 
          onClick={() => setIsAiMode(true)} 
          className={`px-4 py-2 ${isAiMode ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
        >
          Player vs AI
        </button>
      </div>
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
