import './HacklonegaAd.css';

const glyphs: Record<string, string[]> = {
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
};

// These pixel maps are copied directly from the approved Hacklonega graphic.
const steeple = [
  '...................g.................',
  '...................gg................',
  '..................ggg................',
  '..................ggg................',
  '.................gggg................',
  '.................gggg................',
  '................ggggggg..............',
  '................ggggg.g..............',
  '...............gggggg.g..............',
  '...............gggggg.g..............',
  '..............ggggggg.gg.............',
  '..............ggggggg.gg.............',
  '..............ggggggg.gg.............',
  '.............gggggggg.ggg............',
  '.............gggggggg..gg............',
  '............ggggggggg..ggg...........',
  '............ggg.gggggg.gggg..........',
  '...........ggg...ggggg.gggg..........',
  '..........gggg....gg...gggg..........',
  '.........gggg...........gg...........',
  '........ggg....ww...w................',
  '..............wwwwwww......g.........',
  '...........wwwwwwwwww..w...g.........',
  '.........wwwwwwwwwwww..www.gg........',
  '..........wwwwwwwwwww..www..g........',
  '..........wwwwwwwwwww..wwww..g.......',
  '..........wwwwwwwwwww..wwww..........',
  '..........wwwwwwwwwww..wwww..........',
  '..........wwwwwwwwwww..wwww..........',
  '..........wwwwwwwwwww..wwww..........',
  '..........wwwwwwwwwww..wwww..........',
  '..........wwwww........wwww..........',
  '..........www............ww..........',
  '..........ww....wwwwwww..............',
  '..............wwwwwwwwwww............',
  '............wwww.........ww..........',
  '...........www.......................',
  '.........www.........................',
];

const ngMonogram = [
  '..wwww....wwww.........',
  '..wwwww...wwww.........',
  '...wwwww...www.........',
  '...wwwww...www.........',
  '...wwwwww..www.........',
  '...www.www.wwwwwwwww...',
  '...www.wwwwwwwwwwwwww..',
  '...www..wwwwww....www..',
  '...www...wwwww.....ww..',
  '...www....wwww.........',
  '...www....wwww...wwww..',
  '...........www...wwww..',
  '...........www.....ww..',
  '...........www.....ww..',
  '...........wwwwwwwwww..',
  '...........wwwwwwwwww..',
  '............wwwwwwww...',
];

function PixelWord({ word }: { word: string }) {
  return (
    <div className="hacklonega-pixel-word" aria-hidden="true">
      {word.split('').map((letter, letterIndex) => (
        <span className="hacklonega-pixel-letter" key={`${letter}-${letterIndex}`}>
          {glyphs[letter].flatMap((row, rowIndex) =>
            row.split('').map((cell, columnIndex) => (
              <i
                className={cell === '1' ? 'hacklonega-pixel-cell is-filled' : 'hacklonega-pixel-cell'}
                key={`${rowIndex}-${columnIndex}`}
              />
            )),
          )}
        </span>
      ))}
    </div>
  );
}

function PixelSteeple() {
  return (
    <div className="hacklonega-pixel-steeple" aria-hidden="true">
      {steeple.flatMap((row, rowIndex) =>
        row.split('').map((cell, columnIndex) => (
          <i
            className={`hacklonega-steeple-pixel hacklonega-steeple-pixel--${cell}`}
            key={`${rowIndex}-${columnIndex}`}
          />
        )),
      )}
    </div>
  );
}

export function HacklonegaNgMark() {
  return (
    <span className="hacklonega-pixel-ng" aria-hidden="true">
      {ngMonogram.flatMap((row, rowIndex) =>
        row.split('').map((cell, columnIndex) => (
          <i
            className={cell === 'w' ? 'hacklonega-ng-pixel is-filled' : 'hacklonega-ng-pixel'}
            key={`${rowIndex}-${columnIndex}`}
          />
        )),
      )}
    </span>
  );
}

export default function HacklonegaAd() {
  return (
    <article className="hacklonega-artwork" aria-labelledby="hacklonega-title">
      <div className="hacklonega-event">
        <div className="hacklonega-screen-grid" aria-hidden="true"></div>

        <div className="hacklonega-event-copy">
          <div className="hacklonega-event-kicker">
            <span className="hacklonega-prompt-glyph" aria-hidden="true">&gt;_</span>
            <p>DAHLONEGA&apos;S FIRST HACKATHON</p>
          </div>

          <h2 id="hacklonega-title" className="hacklonega-visually-hidden">Hacklonega</h2>
          <PixelWord word="HACKLONEGA" />

          <div className="hacklonega-tagline-row">
            <span className="hacklonega-tagline-rule" aria-hidden="true"></span>
            <p>
              HACK THE MOUNTAINS. <time dateTime="2026-10-24">OCT 24TH, 2026</time> @ MCCB.
            </p>
          </div>

          <div className="hacklonega-event-location">
            <span className="hacklonega-location-pin" aria-hidden="true"><i></i></span>
            <div>
              <strong>UNIVERSITY OF NORTH GEORGIA</strong>
              <span>DAHLONEGA, GEORGIA</span>
            </div>
          </div>
        </div>

        <aside className="hacklonega-campus-panel" aria-label="UNG Dahlonega campus motif">
          <div className="hacklonega-panel-label"><span>UNG</span> // DAHLONEGA</div>
          <div className="hacklonega-tower-stage">
            <PixelSteeple />
          </div>
        </aside>
      </div>

      <footer className="hacklonega-statusbar">
        <span>CODEHAWKS @ UNG</span>
      </footer>
    </article>
  );
}
