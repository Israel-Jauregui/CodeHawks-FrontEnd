import { MultiLineTypeWriter } from '../../MultiLineTypeWriter';
import xpMonitor from '../../../assets/xp-monitor.svg';
import xpRocket from '../../../assets/xp-rocket.svg';
import xpPeople from '../../../assets/xp-people.svg';
import xpTarget from '../../../assets/xp-target.svg';
import EventsSection from './EventsSection';
import { SITE_IDENTITY } from '../../../constants/site';

const heroArt = [
  ' █████╗ ██████╗  ██████╗',
  '██╔══██╗██╔══██╗██╔════╝',
  '███████║██║  ██║██║     ',
  '██╔══██║██║  ██║██║     ',
  '██║  ██║██████╔╝╚██████╗',
  '╚═╝  ╚═╝╚═════╝  ╚═════╝',
  '',
  SITE_IDENTITY.publicName,
];

export default function HomeModule() {
  return (
    <>
      <section id="home" className="hero-section">
        <div className="window terminal-window">
          <div className="title-bar">
            <div className="title-bar-text">
              {SITE_IDENTITY.publicName}
            </div>
          </div>

          <div className="window-body terminal-body">
            <pre className="terminal-prompt">C:\&gt; _</pre>
            <div className="hero-content">
              <MultiLineTypeWriter
                lines={heroArt}
                speed={40}
                delay={300}
                cursor={true}
                cursorChar="|"
                className="hero-typewriter"
                lineClassName="hero-line"
                loop={false}
              />
              <p className="hero-tagline">Software Engineering @ UNG</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <fieldset>
          <legend>Welcome to {SITE_IDENTITY.publicName}</legend>
          <p className="lead">
            Welcome to {SITE_IDENTITY.publicName}, the student organization currently registered at {SITE_IDENTITY.universityName} as the {SITE_IDENTITY.registeredOrganizationName}. We meet to learn, build projects, and connect with others who love technology. Everyone with an eligible @ung.edu account is welcome; no experience is needed.
          </p>
        </fieldset>
      </section>

      <section className="features-section">
        <h2 className="section-heading">What We Do</h2>
        <div className="features-grid">
          <div className="window feature-window">
            <div className="title-bar">
              <div className="title-bar-text">Learn &amp; Grow</div>
            </div>
            <div className="window-body feature-window-body">
              <div className="feature-icon">
                <img src={xpMonitor} alt="Windows XP Monitor" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
              </div>
              <p>
                Expand your skills with hands-on coding sessions, workshops, and peer learning. We cover everything from the basics to advanced topics, so you can grow at your own pace and ask questions any time.
              </p>
            </div>
          </div>

          <div className="window feature-window">
            <div className="title-bar">
              <div className="title-bar-text">Build Projects</div>
            </div>
            <div className="window-body feature-window-body">
              <div className="feature-icon">
                <img src={xpRocket} alt="Windows XP Rocket" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
              </div>
              <p>
                Work together on real projects that make a difference. Whether you want to build apps, games, or websites, you will find teammates and mentors ready to help you turn your ideas into reality.
              </p>
            </div>
          </div>

          <div className="window feature-window">
            <div className="title-bar">
              <div className="title-bar-text">Network</div>
            </div>
            <div className="window-body feature-window-body">
              <div className="feature-icon">
                <img src={xpPeople} alt="Windows XP People" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
              </div>
              <p>
                Meet new friends and connect with students who share your interests. Our club is a great place to network, share experiences, and support each other as we learn and grow together.
              </p>
            </div>
          </div>

          <div className="window feature-window">
            <div className="title-bar">
              <div className="title-bar-text">Compete</div>
            </div>
            <div className="window-body feature-window-body">
              <div className="feature-icon">
                <img src={xpTarget} alt="Windows XP Target" style={{ width: 28, height: 28, verticalAlign: 'middle' }} />
              </div>
              <p>
                Challenge yourself in coding competitions and hackathons. Test your skills, learn from others, and celebrate your achievements in a fun and encouraging environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <EventsSection />

      <section id="contact" className="cta-section">
        <fieldset>
          <legend>Join Us Today</legend>
          <p>
            Join us on UNG Connect to stay up to date with our meetings, events, and announcements. It&apos;s the best way to get involved and never miss out!
          </p>
          <a
            className="cta-button"
            href="https://connect.ung.edu/organization/app-development-club-of-ung--dah-"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Started
          </a>
        </fieldset>
      </section>
    </>
  );
}
