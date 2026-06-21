// Sweepstake configuration — EDIT THIS to match your pool.
//
// Each participant drew one or more teams. `teams` holds the team names
// exactly as football-data.org returns them (the `name` field, e.g.
// "Brazil", "England", "United States"). If a name doesn't match, that
// team simply scores 0 — check the Teams tab for the exact spelling.

export const PARTICIPANTS = [
  { name: 'Dominic', teams: ['Germany', 'Japan'] },
  { name: 'Frankie', teams: ['Argentina', 'Switzerland'] },
  { name: 'Sadhbh', teams: ['Spain', 'Morocco'] },
  { name: 'Andrew', teams: ['England', 'United States'] },
  { name: 'Aenea', teams: ['France', 'Colombia'] },
  { name: 'Cathal', teams: ['Netherlands', 'Ecuador'] },
  { name: 'Tino', teams: ['Belgium', 'Uruguay'] },
  { name: 'Rory', teams: ['Portugal', 'Mexico'] },
  { name: 'Sol', teams: ['Brazil', 'Norway'] },
]

// Teams that have mathematically qualified for the next round.
export const QUALIFIED_TEAMS = ['Germany', 'United States', 'Mexico']

// Points awarded per finished match, per team.
export const SCORING = {
  win: 3,
  draw: 1,
  goal: 1,
}
