// The pixel starfield from the countdown screens' club look. Seeded, so the prerendered
// page and the hydrated one draw the same sky.
let seed = 24;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const stars = Array.from({ length: 46 }, (_, i) => {
  const gold = rand() < .3;
  return {
    key: i,
    x: +(rand() * 1000).toFixed(1),
    y: +(rand() * 600).toFixed(1),
    size: Math.round(1.5 + rand() * 2.5),
    gold,
    twinkle: rand() < .4 ? 1 + (i % 3) : 0,
  };
});

export default function Starfield() {
  return (
    <svg className="starfield" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      {stars.map(star => (
        <rect
          key={star.key}
          x={star.x}
          y={star.y}
          width={star.size}
          height={star.size}
          className={`star${star.gold ? ' star--gold' : ''}${star.twinkle ? ` star--t${star.twinkle}` : ''}`}
        />
      ))}
    </svg>
  );
}
