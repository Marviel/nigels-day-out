import React, {
  Component,
  CSSProperties,
} from 'react';

import styles from './GameBoard.module.css';

interface State {
    playerPosition: { x: number; y: number };
}

class GameBoard extends Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            playerPosition: { x: 0, y: 0 },
        };
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyPress);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    handleKeyPress = (event: KeyboardEvent) => {
        // const { playerPosition } = this.state;
        console.log(event, this.state);

        const key = event.key;

        const playerPosition = this.state.playerPosition;

        if (key === 's') {
            if (playerPosition.y >= 9) {
                return;
            }
            else {
                const newPlayerPosition = {
                    ...playerPosition,
                    y: playerPosition.y + 1,
                };
                this.setState({ playerPosition: newPlayerPosition });
            }
        }
        else if (key === 'w') {
            if (playerPosition.y <= 0) {
                return;
            }
            else {
                const newPlayerPosition = {
                    ...playerPosition,
                    y: playerPosition.y - 1,
                };
                this.setState({ playerPosition: newPlayerPosition });
            }
        }
    };

    render() {
        const { playerPosition } = this.state;
        const cells: JSX.Element[] = [];

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const isPlayer = x === playerPosition.x && y === playerPosition.y;
                const cellStyle: CSSProperties = isPlayer ? { ...styles.cell, ...styles.player } : styles.cell;
                cells.push(<div key={`cell-${x}-${y}`} className={cellStyle}></div>);
            }
        }

        return <div className={styles.gameBoard}>{cells}</div>;
    }
}

export default GameBoard;