import { MultiLineTypeWriter } from '../../MultiLineTypeWriter';
import xpMonitor from '../../../assets/xp-monitor.svg';
import xpRocket from '../../../assets/xp-rocket.svg';
import xpPeople from '../../../assets/xp-people.svg';
import xpTarget from '../../../assets/xp-target.svg';

const heroArt = [
  ' █████╗ ██████╗  ██████╗',
  '██╔══██╗██╔══██╗██╔════╝',
  '███████║██║  ██║██║     ',
  '██╔══██║██║  ██║██║     ',
  '██║  ██║██████╔╝╚██████╗',
  '╚═╝  ╚═╝╚═════╝  ╚═════╝',
  '',
  'Application Development Club',
];

export default function HomeModule() {
  return (
    <>
      <section id="home" className="hero-section">
        <div className="window terminal-window">
          <div className="title-bar">
            <div className="title-bar-text">
              Application Development Club
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
          <legend>Welcome to ADC</legend>
          <p className="lead">
            Welcome to the Application Development Club at the University of North Georgia! We meet every Wednesday and Friday to learn, build projects, and connect with others who love technology. Everyone is welcome, no experience needed. Join us and let&apos;s grow together!
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

      <section id="events" className="events-section">
        <h2 className="section-heading">
          <span className="xp-calendar-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="26" height="22" rx="5" fill="#fff" stroke="#316ac5" strokeWidth="2"/>
              <rect x="3" y="6" width="26" height="6" rx="2" fill="#316ac5"/>
              <rect x="7" y="10" width="18" height="2" rx="1" fill="#7ec8ff"/>
              <rect x="8" y="15" width="4" height="4" rx="1.2" fill="#eaf3ff" stroke="#316ac5" strokeWidth="1"/>
              <rect x="14" y="15" width="4" height="4" rx="1.2" fill="#eaf3ff" stroke="#316ac5" strokeWidth="1"/>
              <rect x="20" y="15" width="4" height="4" rx="1.2" fill="#eaf3ff" stroke="#316ac5" strokeWidth="1"/>
            </svg>
          </span>
          <span className="events-splash-animate">Upcoming Events</span>
        </h2>
        <div className="events-list">
          <fieldset className="event-card">
            <legend>APR 22</legend>
            <div className="event-details">
              <h3>App Development Club Weekly Meeting</h3>
              <p>
                Join us for our regular club meeting! We&apos;ll discuss ongoing projects, upcoming opportunities, and help each other with app ideas and coding challenges. All skill levels welcome.
              </p>
              <span className="event-time">1:00 PM - 2:00 PM</span>
            </div>
          </fieldset>

          <fieldset className="event-card">
            <legend>APR 24</legend>
            <div className="event-details">
              <h3>Code and Coffee</h3>
              <p>
                Bring your laptop and your favorite mug! This is a relaxed, social coding session - work on personal projects, get help from peers, or just hang out and chat about tech over coffee.
              </p>
              <span className="event-time">12:00 PM - 1:00 PM</span>
            </div>
          </fieldset>

          <fieldset className="event-card">
            <legend>APR 29</legend>
            <div className="event-details">
              <h3>Website Launch Party</h3>
              <p>
                Celebrate the official launch of our new club website! We&apos;ll demo features, thank contributors, and enjoy snacks and retro themed fun. Everyone is invited, don&apos;t miss it!
              </p>
              <span className="event-time">1:00 PM - 2:00 PM</span>
            </div>
          </fieldset>
        </div>
      </section>

      <section id="contact" className="cta-section">
        <fieldset>
          <legend>Join Us Today</legend>
          <p>
            Join us on UNG Connect to stay up to date with our meetings, events, and announcements. It&apos;s the best way to get involved and never miss out!
          </p>
          <button className="cta-button" onClick={() => window.open('https://connect.ung.edu/organization/app-development-club-of-ung--dah-', '_blank', 'noopener,noreferrer')}>Get Started</button>
        </fieldset>
      </section>
    </>
  );
}
