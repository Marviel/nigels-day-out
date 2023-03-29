import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Typography,
} from '@mui/material';

import GameBoard from '../components/Gameboard';

// Description of a character named nigel, a gnome, in json format
export const nigel = {
  name: 'Nigel',
  description: 'Nigel is a gnome',
  job: 'Wizard',
};

// Description of a character named riffraff, a goblin, in json format
export const riffraff = {
  name: 'Riffraff',
  description: 'Riffraff is a half-elf',
  job: 'Bard',
};

const players = [
  nigel,
  riffraff
]


export default function Web() {
  return (
    <div>
      <Typography variant='h4'>Nigel's Day Out</Typography>
      <Button variant="contained">Boop</Button>
      <GameBoard />
      <Accordion>
        <AccordionSummary>
          Players
        </AccordionSummary>
        <AccordionDetails>
          {
            players.map((player) => {
              return (
                <div key={player.name}>
                  <h2>{player.name}</h2>
                  <p><i>Description: </i>{player.description}</p>
                  <p><i>Job: </i>{player.job}</p>
                </div>
              )
            })
          }
        </AccordionDetails>
      </Accordion>

    </div>
  );
}
