// CloudFront Function (cloudfront-js-2.0), run on every request before the cache.
//
// 1. www.codehawks.org goes to codehawks.org, the one canonical host.
// 2. Pages of the old member platform go to the home page with a 301, so old links and
//    search results keep working instead of landing on a 404.
// Everything else passes through untouched. Unknown paths are real 404s.
var CANONICAL_HOST = 'codehawks.org';
var LEGACY_PATHS = [
  '/home',
  '/projects',
  '/team',
  '/members',
  '/profile',
  '/notifications',
  '/manage/events',
  '/privacy',
  '/terms',
  '/subprocessors',
  '/accessibility',
  '/redirect.html',
];

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: location },
      'cache-control': { value: 'public, max-age=3600' },
    },
  };
}

function queryString(querystring) {
  var parts = [];
  for (var key in querystring) {
    var entry = querystring[key];
    var values = entry.multiValue ? entry.multiValue : [entry];
    for (var i = 0; i < values.length; i++) {
      parts.push(key + (values[i].value ? '=' + values[i].value : ''));
    }
  }
  return parts.length ? '?' + parts.join('&') : '';
}

// eslint-disable-next-line no-unused-vars
function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';
  var path = request.uri.length > 1 && request.uri.charAt(request.uri.length - 1) === '/' ? request.uri.slice(0, -1) : request.uri;
  var legacy = LEGACY_PATHS.indexOf(path) !== -1;

  if (host === 'www.' + CANONICAL_HOST) {
    return redirect('https://' + CANONICAL_HOST + (legacy ? '/' : request.uri + queryString(request.querystring)));
  }
  // A relative Location also works on the distribution's own cloudfront.net address.
  if (legacy) return redirect('/');
  return request;
}
