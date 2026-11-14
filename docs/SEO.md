# Getting found

What the site already does to rank for the club's name, and the short list of things only a person with the right login can do.

## Built into the site

- **A title and description that say the name people search for.** "Software Engineering Club @ UNG | University of North Georgia", with Dahlonega, hackathons and programming contests in the description.
- **Everything is in the HTML.** The page is prerendered, so search engines and link previews read all of it without running JavaScript.
- **Structured data.** A schema.org `Organization` block names the club, its alternate and former names, the university, and its Discord, UNG Connect, LinkedIn, GitHub and hacklonega.dev pages. This is what lets a search engine connect those pages to one club.
- **The old names still lead here.** "App Development Club" and "CodingWarriors" appear once in the footer and in the structured data, so searches for them find the new club.
- **Old links still work.** `/projects`, `/team`, `/members` and the other pages of the old platform redirect to the home page with a 301, which passes their search standing along.
- **Photos carry descriptions.** Every photo has alt text saying what it shows and where, which is how image search finds them.
- **It is fast.** No web fonts, no third-party scripts, sized and lazy-loaded WebP images, long cache lifetimes.
- **A sitemap and robots.txt**, with the sitemap's date updated on every build.
- **codehawks.org and hacklonega.dev link to each other.**

## Do once, after launch

- [ ] **Google Search Console** (the domain is already verified): Sitemaps → submit `https://codehawks.org/sitemap.xml`. Then URL Inspection → `https://codehawks.org/` → Request indexing.
- [ ] **Bing Webmaster Tools**: sign in and import the site from Search Console. Bing also feeds DuckDuckGo and ChatGPT search.
- [ ] **UNG Connect**: the listing's website field currently holds the Discord invite. Change it to `https://codehawks.org/` and put the Discord link in the description. A link from a `ung.edu` address is the most valuable one the club can get.
- [ ] **LinkedIn page**: set the website to `https://codehawks.org/`.
- [ ] **Discord**: put the site in the server's welcome or about channel.
- [ ] **Check the preview**: paste the URL into a Discord message and into LinkedIn's Post Inspector and confirm the blue and gold image appears.

## Keep doing

- **Add photos and results after every event.** A page that changes gets crawled more often, and each new photo is another way in from image search. Fill in `when` and `result` in `src/constants/events.ts`.
- **Ask for links.** Every hackathon the club attends has a site, a Devpost or an MLH page; put `https://codehawks.org/` in team and project profiles. Ask the Computer Science department to list the club on its student organizations page.
- **Use the same name everywhere.** "Software Engineering Club @ UNG" on Discord, LinkedIn, GitHub and UNG Connect. Consistent names are how search engines decide the pages are one organization.
- **Link the site from club repositories.** Each README that mentions the club should link to it.

## What not to do

- Do not add analytics or tracking scripts to measure this. Search Console already reports searches, clicks and position without touching the site.
- Do not create extra thin pages to chase keywords. One page with real content outranks five empty ones.
- Do not change the domain or let it lapse. The domain's age and its existing links are most of what it has.
