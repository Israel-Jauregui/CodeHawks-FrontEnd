import { useEffect, useMemo, useState } from 'react';
import { getPublicDirectoryMembers } from '../services/publicDirectory';
import type { PublicDirectoryMember } from '../types/clubData';
import ResourceImage from './ResourceImage';
import './MembersDirectory.css';

function allowedProfileUrl(value: string | undefined, provider: 'github' | 'linkedin'): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    const hostname = url.hostname.toLowerCase();
    const allowed = provider === 'github'
      ? hostname === 'github.com' || hostname === 'www.github.com'
      : hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
    return allowed ? value : undefined;
  } catch {
    return undefined;
  }
}

export default function MembersDirectory() {
  const [members, setMembers] = useState<PublicDirectoryMember[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    void getPublicDirectoryMembers()
      .then((directoryMembers) => {
        if (isCurrent) setMembers(directoryMembers);
      })
      .catch((unknownError: unknown) => {
        if (!isCurrent) return;
        setError(unknownError instanceof Error ? unknownError.message : 'Unable to load the member directory.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return members;
    return members.filter((member) => [
      member.displayName,
      member.handle,
      member.major,
      member.bio,
      ...(member.techStack ?? []),
    ].some((value) => value?.toLowerCase().includes(normalizedQuery)));
  }, [members, query]);

  const resultSummary = isLoading
    ? 'Loading public members.'
    : `${visibleMembers.length} public ${visibleMembers.length === 1 ? 'member' : 'members'} shown.`;

  return (
    <section className="members-directory" aria-labelledby="members-directory-heading">
      <div className="members-directory__intro">
        <h2 id="members-directory-heading">Public Members</h2>
        <p>
          This directory includes only members who explicitly turned on public profile visibility. Members can
          turn visibility off at any time from Profile settings.
        </p>
      </div>

      <div className="members-directory__search" role="search">
        <label htmlFor="public-member-search">Search public members</label>
        <input
          id="public-member-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, handle, major, or technology"
          aria-describedby="member-search-status"
        />
      </div>
      <p id="member-search-status" className="members-directory__status" role="status" aria-live="polite">
        {resultSummary}
      </p>

      {error && <div className="members-directory__feedback members-directory__feedback--error" role="alert">{error}</div>}
      {!isLoading && !error && visibleMembers.length === 0 && (
        <div className="members-directory__feedback">No opted-in public profiles match this search.</div>
      )}

      {!isLoading && !error && visibleMembers.length > 0 && (
        <ul className="members-directory__grid" aria-label="Opted-in public member profiles">
          {visibleMembers.map((member) => {
            const githubUrl = allowedProfileUrl(member.githubUrl, 'github');
            const linkedinUrl = allowedProfileUrl(member.linkedinUrl, 'linkedin');
            return <li key={member.handle} className="members-directory__card window">
              <div className="title-bar">
                <div className="title-bar-text">@{member.handle}</div>
              </div>
              <div className="window-body">
                <ResourceImage
                  imageUrl={member.avatarUrl}
                  alt={member.avatarUrl ? `${member.displayName}'s profile picture` : `${member.displayName}'s profile placeholder`}
                  className="members-directory__avatar"
                />
                <div className="members-directory__details">
                  <h3>{member.displayName}</h3>
                  {member.major && <p><strong>Major:</strong> {member.major}</p>}
                  {(member.minors?.length ?? 0) > 0 && <p><strong>Academic minors:</strong> {member.minors?.join(', ')}</p>}
                  {member.bio && <p>{member.bio}</p>}
                  {(member.techStack?.length ?? 0) > 0 && (
                    <ul className="members-directory__skills" aria-label={`${member.displayName}'s technologies`}>
                      {member.techStack?.map((technology) => <li key={technology}>{technology}</li>)}
                    </ul>
                  )}
                  {(githubUrl || linkedinUrl) && (
                    <div className="members-directory__links">
                      {githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
                      {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
                    </div>
                  )}
                </div>
              </div>
            </li>;
          })}
        </ul>
      )}
    </section>
  );
}
