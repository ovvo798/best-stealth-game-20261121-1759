// The three houses Miso sneaks through. Each level is data only: border walls plus
// interior walls, tall furniture that blocks sight and movement, guard patrol routes,
// fish to steal, shadow patches that hide the cat, lamplight that exposes it, the
// player's start and the cat flap exit. No code lives here, so a level is easy to tune.

const BORDER = 24;

function borderWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: BORDER },
    { x: 0, y: 720 - BORDER, w: 1280, h: BORDER },
    { x: 0, y: 0, w: BORDER, h: 720 },
    { x: 1280 - BORDER, y: 0, w: BORDER, h: 720 },
  ];
}

export const LEVELS = [
  {
    name: '1 · The Kitchen',
    story: 'The fish bowl is on the far counter. Two sleepy dogs patrol — stay out of their lamplight.',
    playerStart: { x: 90, y: 640 },
    exit: { x: 1150, y: 620, w: 70, h: 56 },
    walls: [
      ...borderWalls(),
      { x: 620, y: 24, w: 26, h: 260 },
      { x: 180, y: 430, w: 380, h: 26 },
    ],
    furniture: [
      { x: 300, y: 130, w: 190, h: 95, kind: 'table', label: 'TABLE' },
      { x: 830, y: 110, w: 210, h: 85, kind: 'sofa', label: 'SOFA' },
      { x: 930, y: 430, w: 95, h: 95, kind: 'crate', label: 'CRATES' },
      { x: 180, y: 540, w: 230, h: 70, kind: 'counter', label: 'COUNTER' },
      { x: 610, y: 540, w: 62, h: 62, kind: 'plant', label: 'PLANT' },
    ],
    shadows: [
      { x: 480, y: 470, r: 95 },
      { x: 1020, y: 210, r: 80 },
    ],
    lights: [
      { x: 640, y: 170, r: 105 },
      { x: 290, y: 600, r: 90 },
    ],
    fish: [
      { x: 395, y: 178 },
      { x: 1105, y: 300 },
      { x: 700, y: 630 },
    ],
    guards: [
      {
        x: 300, y: 340,
        waypoints: [
          { x: 300, y: 340 },
          { x: 950, y: 340 },
          { x: 950, y: 580 },
          { x: 300, y: 580 },
        ],
      },
      {
        x: 1020, y: 150,
        waypoints: [
          { x: 1020, y: 150 },
          { x: 1020, y: 600 },
          { x: 700, y: 600 },
          { x: 700, y: 150 },
        ],
      },
    ],
  },
  {
    name: '2 · The Living Room',
    story: 'Three dogs now, and the rug is lit like a stage. Cross it only when the patrol turns away.',
    playerStart: { x: 80, y: 90 },
    exit: { x: 1160, y: 90, w: 70, h: 56 },
    walls: [
      ...borderWalls(),
      { x: 430, y: 24, w: 26, h: 300 },
      { x: 820, y: 396, w: 26, h: 300 },
      { x: 200, y: 500, w: 300, h: 26 },
    ],
    furniture: [
      { x: 520, y: 120, w: 220, h: 90, kind: 'sofa', label: 'SOFA' },
      { x: 560, y: 300, w: 170, h: 95, kind: 'table', label: 'COFFEE TABLE' },
      { x: 940, y: 120, w: 200, h: 80, kind: 'shelf', label: 'SHELF' },
      { x: 940, y: 480, w: 100, h: 100, kind: 'crate', label: 'CRATES' },
      { x: 120, y: 330, w: 200, h: 75, kind: 'counter', label: 'SIDEBOARD' },
      { x: 660, y: 560, w: 62, h: 62, kind: 'plant', label: 'PLANT' },
      { x: 1080, y: 330, w: 62, h: 62, kind: 'plant', label: 'PLANT' },
    ],
    shadows: [
      { x: 300, y: 620, r: 90 },
      { x: 1120, y: 560, r: 85 },
      { x: 660, y: 430, r: 70 },
    ],
    lights: [
      { x: 640, y: 250, r: 120 },
      { x: 1010, y: 430, r: 95 },
    ],
    fish: [
      { x: 630, y: 165 },
      { x: 1030, y: 160 },
      { x: 250, y: 610 },
    ],
    guards: [
      {
        x: 500, y: 470,
        waypoints: [
          { x: 500, y: 470 },
          { x: 800, y: 470 },
          { x: 800, y: 640 },
          { x: 500, y: 640 },
        ],
      },
      {
        x: 1100, y: 300,
        waypoints: [
          { x: 1100, y: 300 },
          { x: 1100, y: 620 },
          { x: 900, y: 620 },
          { x: 900, y: 300 },
        ],
      },
      {
        x: 250, y: 250,
        waypoints: [
          { x: 250, y: 250 },
          { x: 250, y: 430 },
          { x: 120, y: 430 },
          { x: 120, y: 250 },
        ],
      },
    ],
  },
  {
    name: '3 · The Grand Hall',
    story: 'The last house. Four dogs, long sightlines, and moonlight on the marble. Patience wins.',
    playerStart: { x: 90, y: 640 },
    exit: { x: 90, y: 90, w: 70, h: 56 },
    walls: [
      ...borderWalls(),
      { x: 300, y: 24, w: 26, h: 220 },
      { x: 954, y: 476, w: 26, h: 220 },
      { x: 560, y: 347, w: 300, h: 26 },
    ],
    furniture: [
      { x: 420, y: 110, w: 220, h: 90, kind: 'table', label: 'BANQUET TABLE' },
      { x: 420, y: 520, w: 220, h: 90, kind: 'sofa', label: 'SOFA' },
      { x: 880, y: 120, w: 200, h: 85, kind: 'shelf', label: 'SHELF' },
      { x: 880, y: 520, w: 100, h: 100, kind: 'crate', label: 'CRATES' },
      { x: 160, y: 300, w: 62, h: 62, kind: 'plant', label: 'PLANT' },
      { x: 1080, y: 330, w: 62, h: 62, kind: 'plant', label: 'PLANT' },
      { x: 640, y: 420, w: 150, h: 70, kind: 'counter', label: 'SIDEBOARD' },
    ],
    shadows: [
      { x: 240, y: 520, r: 85 },
      { x: 1040, y: 180, r: 85 },
      { x: 720, y: 620, r: 75 },
    ],
    lights: [
      { x: 640, y: 180, r: 115 },
      { x: 640, y: 540, r: 115 },
      { x: 1010, y: 430, r: 90 },
    ],
    fish: [
      { x: 530, y: 155 },
      { x: 980, y: 165 },
      { x: 700, y: 455 },
    ],
    guards: [
      {
        x: 640, y: 240,
        waypoints: [
          { x: 640, y: 240 },
          { x: 900, y: 240 },
          { x: 900, y: 300 },
          { x: 640, y: 300 },
        ],
      },
      {
        x: 400, y: 450,
        waypoints: [
          { x: 400, y: 450 },
          { x: 400, y: 640 },
          { x: 800, y: 640 },
          { x: 800, y: 450 },
        ],
      },
      {
        x: 1100, y: 400,
        waypoints: [
          { x: 1100, y: 400 },
          { x: 1100, y: 620 },
          { x: 950, y: 620 },
          { x: 950, y: 400 },
        ],
      },
      {
        x: 220, y: 150,
        waypoints: [
          { x: 220, y: 150 },
          { x: 220, y: 300 },
          { x: 420, y: 300 },
          { x: 420, y: 150 },
        ],
      },
    ],
  },
];
