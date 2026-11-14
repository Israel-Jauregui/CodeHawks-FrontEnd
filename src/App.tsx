import { club } from './constants/club';
import { events } from './constants/events';
import { photos } from './constants/photos.generated';
import BootTerminal from './components/BootTerminal';
import EventCard from './components/EventCard';
import MountainBackdrop from './components/MountainBackdrop';
import PhotoStrip from './components/PhotoStrip';
import PhotoViewer from './components/PhotoViewer';
import RetroWindow from './components/RetroWindow';
import Starfield from './components/Starfield';

const eventNames = Object.fromEntries(events.map(event => [event.slug, event.name]));
const photosOf = (slug: string) => photos.filter(photo => photo.event === slug);
// Open the viewer on the teams with their shirts in front of the UNG screen.
const viewerStart = Math.max(0, photos.findIndex(photo => photo.slug === 'img-2142'));

const list = (names: string[]) => names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
const shown = events.filter(event => photosOf(event.slug).length).map(event => event.name);
const pending = events.filter(event => !photosOf(event.slug).length).map(event => event.name);
const readme = [
  'We take a camera everywhere we compete.',
  shown.length ? `On screen: ${list(shown)}.` : '',
  pending.length ? `Still developing: ${list(pending)}.` : '',
  'Come to the next one and end up in here.',
].filter(Boolean);

const pillars = [
  {
    file: 'HACKATHONS.TXT',
    title: 'Hackathons',
    text: 'Form a team, pick a problem and ship something before the deadline. We travel to hackathons like HackGT and Hacklanta, and we run our own in Dahlonega.',
  },
  {
    file: 'CONTESTS.TXT',
    title: 'Competitive programming',
    text: 'Solve algorithm problems against the clock. We practice together and send teams to contests like ICPC.',
  },
  {
    file: 'COMMUNITY.TXT',
    title: 'Community',
    text: 'Meet the people who build things at UNG. Show your projects, get unstuck and find teammates. Every major, every skill level.',
  },
];

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <MountainBackdrop />
      <div className="site" id="top">
        <header className="site-header">
          <a className="site-logo" href="#top" aria-label={`${club.name} home`}>
            <img src="/brand/swe-prompt.svg" alt="" width="687" height="183" />
          </a>
          <nav aria-label="Main navigation">
            <a className="nav-link" href="#about">About</a>
            <a className="nav-link" href="#events">Events</a>
            <a className="nav-link" href="#photos">Photos</a>
            <a className="button button--primary button--small" href={club.links.discord}>Discord <Arrow /></a>
          </nav>
        </header>

        <main id="main">
          <section className="hero" aria-labelledby="hero-heading">
            <Starfield />
            <div className="banner-kicker"><p>Software Engineering Club</p><p>{club.university} // {club.campus}</p></div>
            <div className="banner">
              <div className="banner-copy">
                <h1 id="hero-heading">
                  <span className="type-word" aria-hidden="true">swe<span>.</span></span>
                  <span className="hero-name">{club.name}</span>
                </h1>
                <p className="banner-lead"><span className="rule" aria-hidden="true" />{club.mission}</p>
                <p className="banner-description">We get UNG students onto teams for hackathons and programming contests, and we’re building a home for computer science on campus.</p>
                <div className="banner-actions">
                  <a className="button button--primary" href={club.links.discord}>Join the Discord <Arrow /></a>
                  <a className="button" href={club.links.connect}>UNG Connect <Arrow /></a>
                </div>
              </div>
              <BootTerminal />
            </div>
          </section>

          <section className="section" id="about" aria-labelledby="about-heading">
            <div className="section-head">
              <p className="eyebrow">What we do</p>
              <h2 id="about-heading">Team up. Build. Compete.</h2>
              <p>The Software Engineering Club is where UNG students who like making software find each other. Three things keep us busy.</p>
            </div>
            <div className="card-grid">
              {pillars.map(pillar => (
                <RetroWindow key={pillar.file} className="pillar" title={<><span className="win__dir">C:\CODEHAWKS\</span>{pillar.file}</>}>
                  <div className="pillar__body">
                    <h3>{pillar.title}</h3>
                    <p>{pillar.text}</p>
                  </div>
                </RetroWindow>
              ))}
            </div>
          </section>

          <section className="section" id="events" aria-labelledby="events-heading">
            <div className="section-head">
              <p className="eyebrow">Where we’ve been</p>
              <h2 id="events-heading">On the road, and at home.</h2>
              <p>Hackathons and contests our members have competed in, and the one we host.</p>
            </div>
            <div className="card-grid">
              {events.map(event => <EventCard event={event} photos={photosOf(event.slug)} key={event.slug} />)}
            </div>
          </section>

          {photos.length > 0 && (
            <section className="section" id="photos" aria-labelledby="photos-heading">
              <div className="section-head">
                <p className="eyebrow">Photos</p>
                <h2 id="photos-heading">Proof we were there.</h2>
              </div>
              <div className="gallery">
                <PhotoViewer photos={photos} names={eventNames} start={viewerStart} />
                <RetroWindow
                  className="gallery__readme"
                  title={<><span className="win__dir">C:\CODEHAWKS\</span>README.TXT</>}
                  status={['UNG // Dahlonega', `${photos.length} photos`]}
                >
                  <div className="readme">
                    {readme.map((line, i) => <p className="line" key={line}>{line}{i === readme.length - 1 && <span className="cursor" aria-hidden="true" />}</p>)}
                  </div>
                </RetroWindow>
              </div>
              <PhotoStrip photos={photos} names={eventNames} />
            </section>
          )}

          <section className="section" id="join" aria-labelledby="join-heading">
            <div className="join">
              <img className="join__mark" src="/brand/swe-mark.svg" alt="" width="1000" height="1000" loading="lazy" />
              <div>
                <p className="eyebrow">Join</p>
                <h2 id="join-heading">Show up.</h2>
                <p>Meeting announcements live in Discord and on UNG Connect. Join either one and you’ll know when and where. Open to every UNG student, at every skill level.</p>
                <div className="join__actions">
                  <a className="button button--primary" href={club.links.discord}>Join the Discord <Arrow /></a>
                  <a className="button button--dark" href={club.links.connect}>UNG Connect <Arrow /></a>
                </div>
                <p className="join__contact">Recruiting or sponsoring? Email <a href={`mailto:${club.email}`}>{club.email}</a>.</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="host">
            <img className="host__mark" src="/brand/swe-mark.svg" alt="" width="1000" height="1000" loading="lazy" />
            <p>
              <span className="host__name">{club.name}</span>
              <span className="host__place">{club.university} // {club.campus}</span>
            </p>
          </div>
          <div className="footer-links">
            <a href={club.links.discord}>Discord <Arrow /></a>
            <a href={club.links.connect}>UNG Connect <Arrow /></a>
            <a href={club.links.linkedin}>LinkedIn <Arrow /></a>
            <a href={club.links.github}>GitHub <Arrow /></a>
            <a href={club.links.hacklonega}>Hacklonega, our hackathon <Arrow /></a>
            <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
          </div>
          <div className="footer-meta">
            <p>Formerly the {list([...club.formerNames])}.<br />A student organization at the {club.university}. Run by students; not an official university site.</p>
            <p>This site has no accounts, forms or analytics. The hosting provider may process routine request data.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
