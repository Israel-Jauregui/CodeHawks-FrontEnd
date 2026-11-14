import { useEffect, useRef, useState } from 'react';
import { club } from '../constants/club';
import PixelWord from './PixelWord';
import RetroWindow from './RetroWindow';

const checks = ['hackathons', 'programming contests', 'community'];

// The terminal that boots the club. The old site typed "ADC" into a command prompt; this one
// types SWE. The whole sequence is CSS (see .boot in styles.css), so the text is in the page
// for search engines and screen readers, and nothing waits on JavaScript.
export default function BootTerminal() {
  const [run, setRun] = useState(0);
  const frame = useRef<HTMLDivElement>(null);

  // On a phone the terminal starts below the fold and would finish before anyone sees it,
  // so play it again the first time it scrolls into view. Changing `key` remounts the
  // lines, which restarts their animations.
  useEffect(() => {
    const element = frame.current;
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (element.getBoundingClientRect().top < innerHeight) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setRun(count => count + 1);
      observer.disconnect();
    }, { threshold: .4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="boot-frame" ref={frame}>
      <RetroWindow
        className="win--boot"
        title={<><span className="win__dir">C:\CODEHAWKS\</span>SWE.EXE</>}
        menu={
          <>
            <span className="win__menu-items" aria-hidden="true"><span>File</span><span>Edit</span><span>Hack</span></span>
            <span className="win__menu-gap" />
            <button type="button" onClick={() => setRun(count => count + 1)}>Run again</button>
          </>
        }
        status={['~/ung // swe', club.campus]}
      >
        <div className="boot" key={run}>
          <p className="boot__line"><span className="boot__ps">C:\CODEHAWKS&gt;</span> <span className="boot__type boot__type--run">swe.exe</span></p>
          <PixelWord word="SWE" className="boot__art" />
          <p className="boot__line boot__name"><span className="boot__type boot__type--name">{club.name}</span></p>
          <ul className="boot__checks">
            {checks.map(check => <li key={check}><span className="boot__ok">[ ok ]</span> {check}</li>)}
          </ul>
          <p className="boot__line boot__last">
            <span className="boot__ps">C:\CODEHAWKS&gt;</span>{' '}
            <a className="boot__type boot__type--join" href={club.links.discord}>join --discord</a>
            <span className="cursor" aria-hidden="true" />
          </p>
        </div>
      </RetroWindow>
    </div>
  );
}
