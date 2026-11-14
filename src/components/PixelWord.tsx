// Block lettering on the styling guide's 5 x 7 grid, with one empty column between letters.
// Drawn as SVG squares rather than text so it looks the same on every device.
const glyphs: Record<string, string[]> = {
  S: ['01110', '10001', '10000', '01110', '00001', '10001', '01110'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
};

export default function PixelWord({ word, className = '' }: { word: string; className?: string }) {
  const letters = word.split('').map(letter => glyphs[letter]);
  const columns = letters.length * 6 - 1;
  const pixels = letters.flatMap((rows, letter) =>
    rows.flatMap((row, y) => row.split('').flatMap((on, x) => (on === '1' ? [{ x: letter * 6 + x, y }] : []))));
  return (
    <svg className={`pixel-word ${className}`} viewBox={`0 0 ${columns + .35} 7.35`} aria-hidden="true" focusable="false" shapeRendering="crispEdges">
      <g className="pixel-word__shadow">{pixels.map(({ x, y }) => <rect key={`${x}-${y}`} x={x + .35} y={y + .35} width="1" height="1" />)}</g>
      <g className="pixel-word__face">{pixels.map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}</g>
    </svg>
  );
}
