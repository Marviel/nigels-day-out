import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import styles from './GameBoard.module.css';

// Define the types of gems/blocks
type GemType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'block';

// Define a gem as a first-class object
interface Gem {
    id: string;      // Unique identifier for the gem
    type: GemType;   // The type/color of the gem
    falling: boolean; // Whether the gem is currently falling
}

// Define a position in the grid
interface Position {
    row: number;
    col: number;
}

// Define the game state
interface GameState {
    playerBoard: Gem[][];
    opponentBoard: Gem[][];
    score: number;
    comboCount: number;
    isSwapping: boolean;
    selectedCell: Position | null;
    swappedCells: { pos1: Position; pos2: Position } | null;
}

const BOARD_SIZE = 8;
const MATCH_SIZE = 3;
const GEM_TYPES: GemType[] = ['red', 'blue', 'green', 'yellow', 'purple'];

// Create a new gem with a random type
const createGem = (type?: GemType): Gem => {
    return {
        id: Math.random().toString(36).substring(2, 9),
        type: type || getRandomGemType(),
        falling: false
    };
};

// Generate a random gem type
const getRandomGemType = (): GemType => {
    const index = Math.floor(Math.random() * GEM_TYPES.length);
    return GEM_TYPES[index];
};

// Create an initial board with random gems but no matches
const createInitialBoard = (): Gem[][] => {
    const board: Gem[][] = [];

    // First, fill the board with random gems
    for (let row = 0; row < BOARD_SIZE; row++) {
        const newRow: Gem[] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            newRow.push(createGem());
        }
        board.push(newRow);
    }

    // Then, check for and fix any initial matches
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // Check horizontal matches (3 in a row)
            if (col >= 2) {
                if (board[row][col].type === board[row][col - 1].type &&
                    board[row][col].type === board[row][col - 2].type) {
                    // Found a match, change the current gem's type
                    let newType;
                    do {
                        newType = getRandomGemType();
                    } while (newType === board[row][col].type);

                    board[row][col].type = newType;
                }
            }

            // Check vertical matches (3 in a column)
            if (row >= 2) {
                if (board[row][col].type === board[row - 1][col].type &&
                    board[row][col].type === board[row - 2][col].type) {
                    // Found a match, change the current gem's type
                    let newType;
                    do {
                        newType = getRandomGemType();
                    } while (newType === board[row][col].type);

                    board[row][col].type = newType;
                }
            }
        }
    }

    return board;
};

const GameBoard: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>({
        playerBoard: createInitialBoard(),
        opponentBoard: createInitialBoard(),
        score: 0,
        comboCount: 0,
        isSwapping: false,
        selectedCell: null,
        swappedCells: null
    });

    // Check for matches in the board
    const checkForMatches = useCallback((board: Gem[][]): { matches: boolean, newBoard: Gem[][], matchCount: number } => {
        // Create a deep copy of the board
        const newBoard = board.map(row => row.map(gem => ({ ...gem })));
        let hasMatches = false;
        let matchCount = 0;

        // Create a map to track cells that should be marked as blocks
        const cellsToMark = new Set<string>();

        // Check horizontal matches
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col <= BOARD_SIZE - MATCH_SIZE; col++) {
                const type = newBoard[row][col].type;
                if (type === 'block') continue;

                let isMatch = true;
                for (let i = 1; i < MATCH_SIZE; i++) {
                    if (newBoard[row][col + i].type !== type) {
                        isMatch = false;
                        break;
                    }
                }

                if (isMatch) {
                    hasMatches = true;
                    matchCount++;
                    for (let i = 0; i < MATCH_SIZE; i++) {
                        cellsToMark.add(`${row}-${col + i}`);
                    }
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < BOARD_SIZE; col++) {
            for (let row = 0; row <= BOARD_SIZE - MATCH_SIZE; row++) {
                const type = newBoard[row][col].type;
                if (type === 'block') continue;

                let isMatch = true;
                for (let i = 1; i < MATCH_SIZE; i++) {
                    if (newBoard[row + i][col].type !== type) {
                        isMatch = false;
                        break;
                    }
                }

                if (isMatch) {
                    hasMatches = true;
                    matchCount++;
                    for (let i = 0; i < MATCH_SIZE; i++) {
                        cellsToMark.add(`${row + i}-${col}`);
                    }
                }
            }
        }

        // Mark all matched cells as blocks
        cellsToMark.forEach(key => {
            const [row, col] = key.split('-').map(Number);
            // Replace the gem with a block gem, preserving the position but changing the object
            newBoard[row][col] = createGem('block');
        });

        return { matches: hasMatches, newBoard, matchCount };
    }, []);

    // Apply gravity to the board (make gems fall)
    const applyGravity = useCallback((board: Gem[][]): { newBoard: Gem[][], hasFalling: boolean } => {
        const newBoard = board.map(row => row.map(gem => ({ ...gem })));
        let hasFalling = false;

        // Process each column from bottom to top
        for (let col = 0; col < BOARD_SIZE; col++) {
            // First, collect all non-block gems in this column
            const gemsInColumn: Gem[] = [];

            for (let row = 0; row < BOARD_SIZE; row++) {
                if (newBoard[row][col].type !== 'block') {
                    gemsInColumn.push({ ...newBoard[row][col] });
                }
            }

            // Count how many gems we need to fill from the top
            const emptySpaces = BOARD_SIZE - gemsInColumn.length;

            // Create new gems for the empty spaces at the top
            for (let i = 0; i < emptySpaces; i++) {
                const newGem = createGem();
                newGem.falling = true;
                gemsInColumn.unshift(newGem); // Add to the beginning
                hasFalling = true;
            }

            // Now place all gems back into the column, from bottom to top
            for (let row = 0; row < BOARD_SIZE; row++) {
                const gem = gemsInColumn[row];

                // If the gem has moved, mark it as falling
                if (row < BOARD_SIZE - emptySpaces) {
                    gem.falling = true;
                    hasFalling = true;
                }

                newBoard[row][col] = gem;
            }
        }

        return { newBoard, hasFalling };
    }, []);

    // Add blocks to opponent's board
    const addBlocksToOpponent = useCallback((count: number) => {
        if (count <= 0) return;

        setGameState(prevState => {
            const newOpponentBoard = prevState.opponentBoard.map(row => row.map(gem => ({ ...gem })));

            // Add blocks to random positions at the bottom of the board
            const positions = new Set<number>();
            while (positions.size < Math.min(count, BOARD_SIZE)) {
                positions.add(Math.floor(Math.random() * BOARD_SIZE));
            }

            // Shift everything up in the affected columns
            positions.forEach(col => {
                for (let row = 0; row < BOARD_SIZE - 1; row++) {
                    newOpponentBoard[row][col] = newOpponentBoard[row + 1][col];
                }

                // Add a block at the bottom
                newOpponentBoard[BOARD_SIZE - 1][col] = createGem('block');
            });

            return {
                ...prevState,
                opponentBoard: newOpponentBoard
            };
        });
    }, []);

    // Process the game board after a move
    const processBoard = useCallback(() => {
        setGameState(prevState => {
            // Create a proper deep copy of the board
            let currentBoard = prevState.playerBoard.map(row =>
                row.map(gem => ({ ...gem }))
            );

            let comboCount = 0;
            let totalMatches = 0;
            let newScore = prevState.score;

            // Process matches until no more are found
            let result = checkForMatches(currentBoard);

            // If no initial matches, return unchanged state
            if (!result.matches) {
                return {
                    ...prevState,
                    isSwapping: false
                };
            }

            while (result.matches) {
                comboCount++;
                totalMatches += result.matchCount;
                newScore += result.matchCount * 100 * comboCount; // Score increases with combos

                // Apply gravity
                const gravityResult = applyGravity(result.newBoard);
                currentBoard = gravityResult.newBoard;

                // Check for new matches
                result = checkForMatches(currentBoard);
            }

            // If we had combos, add blocks to opponent
            if (comboCount > 1) {
                // Schedule adding blocks to opponent
                setTimeout(() => {
                    addBlocksToOpponent(comboCount - 1);
                }, 500);
            }

            return {
                ...prevState,
                playerBoard: currentBoard,
                score: newScore,
                comboCount: comboCount > prevState.comboCount ? comboCount : prevState.comboCount,
                isSwapping: false
            };
        });
    }, [checkForMatches, applyGravity, addBlocksToOpponent]);

    // Handle cell click
    const handleCellClick = (row: number, col: number) => {
        if (gameState.isSwapping) return;

        setGameState(prevState => {
            // If no cell is selected, select this one
            if (!prevState.selectedCell) {
                return {
                    ...prevState,
                    selectedCell: { row, col }
                };
            }

            const { row: selectedRow, col: selectedCol } = prevState.selectedCell;

            // If clicking the same cell, deselect it
            if (selectedRow === row && selectedCol === col) {
                return {
                    ...prevState,
                    selectedCell: null
                };
            }

            // Check if the cells are adjacent
            const isAdjacent =
                (Math.abs(selectedRow - row) === 1 && selectedCol === col) ||
                (Math.abs(selectedCol - col) === 1 && selectedRow === row);

            if (!isAdjacent) {
                // If not adjacent, select the new cell instead
                return {
                    ...prevState,
                    selectedCell: { row, col }
                };
            }

            // Create a deep copy of the board
            const newBoard = prevState.playerBoard.map(boardRow =>
                boardRow.map(gem => ({ ...gem }))
            );

            // Swap the entire gem objects, not just their types
            const tempGem = { ...newBoard[row][col] };
            newBoard[row][col] = { ...newBoard[selectedRow][selectedCol] };
            newBoard[selectedRow][selectedCol] = tempGem;

            // Check if the swap creates a match
            const { matches } = checkForMatches(newBoard);

            // Record the swapped positions
            const swappedCells = {
                pos1: { row, col },
                pos2: { row: selectedRow, col: selectedCol }
            };

            // Process the board after the swap if there are matches
            if (matches) {
                setTimeout(() => {
                    processBoard();
                }, 300);
            }

            return {
                ...prevState,
                playerBoard: newBoard,
                selectedCell: null,
                swappedCells: swappedCells,
                isSwapping: matches
            };
        });
    };

    // Get cell style based on gem type and state
    const getCellStyle = (type: GemType, falling: boolean, isSelected: boolean, isSwapped: boolean) => {
        const baseStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: falling ? 'all 0.3s ease' : 'all 0.2s ease',
            transform: falling ? 'translateY(-20px)' : 'translateY(0)',
            boxShadow: isSelected
                ? '0 0 10px 5px white'
                : isSwapped
                    ? '0 0 8px 3px rgba(255, 255, 255, 0.7)'
                    : 'none',
            cursor: type === 'block' ? 'not-allowed' : 'pointer',
            position: 'relative',
            fontSize: '10px',
            color: 'white',
            textShadow: '1px 1px 1px black',
            fontWeight: 'bold'
        };

        switch (type) {
            case 'red':
                return { ...baseStyle, backgroundColor: '#ff5252' };
            case 'blue':
                return { ...baseStyle, backgroundColor: '#4285f4' };
            case 'green':
                return { ...baseStyle, backgroundColor: '#0f9d58' };
            case 'yellow':
                return { ...baseStyle, backgroundColor: '#ffeb3b', color: 'black', textShadow: 'none' };
            case 'purple':
                return { ...baseStyle, backgroundColor: '#9c27b0' };
            case 'block':
                return { ...baseStyle, backgroundColor: '#424242' };
            default:
                return baseStyle;
        }
    };

    // Check if a cell is part of the swapped pair
    const isSwappedCell = (row: number, col: number) => {
        if (!gameState.swappedCells) return false;

        const { pos1, pos2 } = gameState.swappedCells;
        return (
            (row === pos1.row && col === pos1.col) ||
            (row === pos2.row && col === pos2.col)
        );
    };

    // Reset falling state and swapped cells after animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setGameState(prevState => {
                const playerBoard = prevState.playerBoard.map(row =>
                    row.map(gem => ({ ...gem, falling: false }))
                );

                const opponentBoard = prevState.opponentBoard.map(row =>
                    row.map(gem => ({ ...gem, falling: false }))
                );

                return {
                    ...prevState,
                    playerBoard,
                    opponentBoard,
                    swappedCells: null // Reset swapped cells after animation
                };
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [gameState.playerBoard, gameState.opponentBoard]);

    return (
        <div className={styles.gameContainer}>
            <div className={styles.scoreBoard}>
                <div>Score: {gameState.score}</div>
                <div>Max Combo: {gameState.comboCount}</div>
            </div>

            <div className={styles.boardsContainer}>
                <div className={styles.boardWrapper}>
                    <h3>Your Board</h3>
                    <div className={styles.gameBoard}>
                        {gameState.playerBoard.map((row, rowIndex) => (
                            row.map((gem, colIndex) => (
                                <div
                                    key={`player-${rowIndex}-${colIndex}-${gem.id}`}
                                    className={styles.cell}
                                    onClick={() => handleCellClick(rowIndex, colIndex)}
                                >
                                    <div
                                        style={getCellStyle(
                                            gem.type,
                                            gem.falling,
                                            gameState.selectedCell?.row === rowIndex && gameState.selectedCell?.col === colIndex,
                                            isSwappedCell(rowIndex, colIndex)
                                        )}
                                    >
                                        {gem.id.substring(0, 4)}
                                    </div>
                                </div>
                            ))
                        ))}
                    </div>
                </div>

                <div className={styles.boardWrapper}>
                    <h3>Opponent's Board</h3>
                    <div className={styles.gameBoard}>
                        {gameState.opponentBoard.map((row, rowIndex) => (
                            row.map((gem, colIndex) => (
                                <div
                                    key={`opponent-${rowIndex}-${colIndex}-${gem.id}`}
                                    className={styles.cell}
                                >
                                    <div style={getCellStyle(gem.type, gem.falling, false, false)}>
                                        {gem.id.substring(0, 4)}
                                    </div>
                                </div>
                            ))
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameBoard;