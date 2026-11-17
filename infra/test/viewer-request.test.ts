import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// A CloudFront Function is a plain script that defines a global `handler`, so load it that way.
const source = readFileSync(new URL('../functions/viewer-request.js', import.meta.url), 'utf8');
const handler = new Function(`${source}; return handler;`)() as (event: unknown) => Record<string, any>;

const request = (host: string, uri: string, querystring: Record<string, unknown> = {}) =>
  ({ request: { method: 'GET', uri, querystring, headers: { host: { value: host } } } });

test('the home page and assets pass through untouched', () => {
  for (const uri of ['/', '/assets/index-abc.js', '/photos/hacklonega/img-2142.webp', '/sitemap.xml']) {
    const result = handler(request('codehawks.org', uri));
    assert.equal(result.statusCode, undefined);
    assert.equal(result.uri, uri);
  }
});

test('www redirects to the apex and keeps the path and query', () => {
  const result = handler(request('WWW.codehawks.org', '/photos/x.webp', { v: { value: '2' }, tag: { value: 'a', multiValue: [{ value: 'a' }, { value: 'b' }] } }));
  assert.equal(result.statusCode, 301);
  assert.equal(result.headers.location.value, 'https://codehawks.org/photos/x.webp?v=2&tag=a&tag=b');
});

test('pages of the old member platform redirect to the home page', () => {
  for (const uri of ['/projects', '/team', '/members/', '/manage/events', '/privacy', '/terms', '/home', '/profile']) {
    const result = handler(request('codehawks.org', uri));
    assert.equal(result.statusCode, 301, uri);
    assert.equal(result.headers.location.value, '/', uri);
  }
  // From www it is one hop, not two.
  assert.equal(handler(request('www.codehawks.org', '/projects')).headers.location.value, 'https://codehawks.org/');
});

test('unknown paths are left to become real 404s', () => {
  for (const uri of ['/projects/42', '/does-not-exist', '/Projects', '/teams']) {
    assert.equal(handler(request('codehawks.org', uri)).statusCode, undefined, uri);
  }
});

test('the cloudfront.net address works before the domain is attached', () => {
  assert.equal(handler(request('d111111abcdef8.cloudfront.net', '/')).statusCode, undefined);
  assert.equal(handler(request('d111111abcdef8.cloudfront.net', '/team')).headers.location.value, '/');
});
