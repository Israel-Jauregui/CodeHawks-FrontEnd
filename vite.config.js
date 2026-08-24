import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const routeShells = [
  { path: 'home', title: 'CodeHawks at UNG', description: 'CodeHawks is a University of North Georgia student organization where students learn, build software, and connect with other developers.', canonical: '/' },
  { path: 'projects', title: 'Projects | CodeHawks', description: 'Browse public CodeHawks software projects.', canonical: '/projects' },
  { path: 'team', title: 'Teams | CodeHawks', description: 'Browse public CodeHawks project, study, and competition teams.', canonical: '/team' },
  { path: 'members', title: 'Members | CodeHawks', description: 'Browse CodeHawks members who explicitly opted into the public member directory.', canonical: '/members' },
  { path: 'privacy', title: 'Privacy Policy | CodeHawks', description: 'How CodeHawks collects, uses, shares, retains, and lets members control personal information.', canonical: '/privacy' },
  { path: 'terms', title: 'Terms of Use | CodeHawks', description: 'Rules for using the CodeHawks website and member services.', canonical: '/terms' },
  { path: 'subprocessors', title: 'Vendors and Service Providers | CodeHawks', description: 'Current third-party vendors that help CodeHawks authenticate users, host the service, and deliver email.', canonical: '/subprocessors' },
  { path: 'accessibility', title: 'Accessibility Statement | CodeHawks', description: 'CodeHawks accessibility goals, current support, and how to request help or report a barrier.', canonical: '/accessibility' },
  { path: 'profile', title: 'Profile | CodeHawks', description: 'Manage your private CodeHawks member profile and privacy choices.', canonical: '/profile', noIndex: true },
  { path: 'notifications', title: 'Notifications | CodeHawks', description: 'Review your private CodeHawks member notifications.', canonical: '/notifications', noIndex: true },
  { path: 'manage/events', title: 'Event Manager | CodeHawks', description: 'Manage CodeHawks club events.', canonical: '/manage/events', noIndex: true },
]

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function replaceMeta(html, attribute, name, content) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(<meta\\s+[^>]*${attribute}="${escapedName}"[^>]*content=")[^"]*("[^>]*>)`, 'i')
  return html.replace(pattern, `$1${escapeHtml(content)}$2`)
}

function createRouteShell(source, route) {
  const canonical = new URL(route.canonical, 'https://codehawks.org').toString()
  let html = source
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${canonical}" />`)
  html = replaceMeta(html, 'name', 'description', route.description)
  html = replaceMeta(html, 'name', 'robots', route.noIndex ? 'noindex, nofollow' : 'index, follow')
  html = replaceMeta(html, 'property', 'og:title', route.title)
  html = replaceMeta(html, 'property', 'og:description', route.description)
  html = replaceMeta(html, 'property', 'og:url', canonical)
  html = replaceMeta(html, 'name', 'twitter:title', route.title)
  html = replaceMeta(html, 'name', 'twitter:description', route.description)
  return html
}

function routeShellPlugin() {
  return {
    name: 'codehawks-route-shells',
    apply: 'build',
    async closeBundle() {
      const outputDirectory = resolve(import.meta.dirname, 'dist')
      const source = await readFile(resolve(outputDirectory, 'index.html'), 'utf8')
      await Promise.all(routeShells.map(async (route) => {
        const routeDirectory = resolve(outputDirectory, route.path)
        await mkdir(routeDirectory, { recursive: true })
        await writeFile(resolve(routeDirectory, 'index.html'), createRouteShell(source, route), 'utf8')
      }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), routeShellPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        redirect: resolve(import.meta.dirname, 'redirect.html'),
      },
    },
  },
})
