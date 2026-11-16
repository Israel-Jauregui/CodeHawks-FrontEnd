import { useEffect, useRef } from 'react';
import { club } from '../constants/club';
import { createSpinner } from '../lib/steeple-spinner';

const FRONT = '/brand/steeple-front.svg';
const BACK = '/brand/steeple-back.svg';
// Seconds for one full turn.
const TURN = 7;

// An easter egg: the stress ball from hacklonega.dev, shrunk and left spinning beside the
// logo. It links to that site. Without WebGL, or with reduced motion, it is the flat
// steeple artwork, which is also what the prerendered page shows until the ball is ready.
export default function SteepleSpinner() {
  const root = useRef<HTMLAnchorElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const [link, view] = [root.current, canvas.current];
    if (!link || !view || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const abort = new AbortController();
    let frame = 0;
    let stop = () => {};

    createSpinner(view, FRONT, BACK, abort.signal).then(spinner => {
      let visible = true;
      let angle = 0, last = 0;
      const tick = (now: number) => {
        frame = 0;
        if (!visible || document.hidden) return;
        // Advance by elapsed time, capped so the ball does not jump after the tab was away.
        angle += Math.min((now - (last || now)) / 1000, .1) * (Math.PI * 2 / TURN);
        last = now;
        spinner.resize(Math.round(view.clientWidth * Math.min(devicePixelRatio || 1, 2)));
        spinner.draw(angle);
        frame = requestAnimationFrame(tick);
      };
      const wake = () => {
        if (frame) return;
        last = 0;
        frame = requestAnimationFrame(tick);
      };
      // Only spend frames while the header is on screen and the tab is in front.
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
      observer.observe(link);
      document.addEventListener('visibilitychange', wake, { signal: abort.signal });
      view.addEventListener('webglcontextlost', () => delete link.dataset.live, { signal: abort.signal });
      stop = () => { observer.disconnect(); spinner.dispose(); };
      spinner.resize(Math.round(view.clientWidth * Math.min(devicePixelRatio || 1, 2)));
      spinner.draw(0);
      link.dataset.live = '';
      wake();
    }).catch(() => { /* No WebGL: the flat artwork stays. */ });

    return () => {
      abort.abort();
      cancelAnimationFrame(frame);
      stop();
      delete link.dataset.live;
    };
  }, []);

  return (
    <a className="steeple-spin" href={club.links.hacklonega} ref={root} aria-label="Hacklonega, our hackathon" title="hacklonega.dev">
      <img src={FRONT} alt="" width="256" height="256" />
      <canvas ref={canvas} aria-hidden="true" />
    </a>
  );
}
