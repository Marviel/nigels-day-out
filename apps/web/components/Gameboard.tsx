import React, { Component } from 'react';

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
        else if (key === 'a') {
            if (playerPosition.x <= 0) {
                return;
            }
            else {
                const newPlayerPosition = {
                    ...playerPosition,
                    x: playerPosition.x - 1,
                };
                this.setState({ playerPosition: newPlayerPosition });
            }
        }
        else if (key === 'd') {
            if (playerPosition.x >= 9) {
                return;
            }
            else {
                const newPlayerPosition = {
                    ...playerPosition,
                    x: playerPosition.x + 1,
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

                cells.push(<div key={`cell-${x}-${y}`}></div>);
            }
        }

        return <div>
            {cells}
        </div>;
    }
}

export default GameBoard;