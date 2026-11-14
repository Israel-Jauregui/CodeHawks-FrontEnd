import { useEffect, useRef, useState } from 'react';
import type { Photo } from '../constants/photos.generated';
import RetroWindow from './RetroWindow';

// The photo viewer from the Hacklonega countdown screens. Each photo loads in blocky passes like an old
// dial-up JPEG, holds, then the next one loads in its place.
const PHOTO_MS = 7000;
// [block size in CSS px (0 = full), start ms, duration ms]
const LOAD = [[22, 0, 1100], [7, 1100, 800], [0, 1900, 700]] as const;
const LOADED = 2600;

const pixelate = (image: HTMLImageElement, width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, width, height);
  }
  return canvas;
};

const source = (photo: Photo) => `/photos/${photo.event}/${photo.slug}.webp`;

// `names` maps an event slug to the name shown in the status bar.
export default function PhotoViewer({ photos, names, start = 0 }: { photos: Photo[]; names: Record<string, string>; start?: number }) {
  const [index, setIndex] = useState(start);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const images = useRef(new Map<string, HTMLImageElement>());
  const photo = photos[index];
  const caption = (shot: Photo) => names[shot.event] ?? shot.event;
  const go = (step: number) => setIndex(i => (i + step + photos.length) % photos.length);

  // Only load and animate while the viewer is on screen. Reduced motion starts paused.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const [element, area, view, label] = [root.current, screen.current, canvas.current, status.current];
    const ctx = view?.getContext('2d');
    if (!visible || !element || !area || !view || !label || !ctx) return;
    element.dataset.live = '';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const load = (shot: Photo) => {
      let image = images.current.get(shot.slug);
      if (!image) {
        image = new Image();
        image.decoding = 'async';
        image.src = source(shot);
        images.current.set(shot.slug, image);
      }
      return image;
    };
    const image = load(photo);
    let frame = 0, loadAt = -1, passes: (HTMLImageElement | HTMLCanvasElement)[] | null = null;

    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      view.width = Math.round(area.clientWidth * dpr);
      view.height = Math.round(area.clientHeight * dpr);
      passes = null;
    };

    const render = (t: number) => {
      const W = view.width, H = view.height, dpr = W / Math.max(area.clientWidth, 1);
      const scale = Math.min(W / image.naturalWidth, H / image.naturalHeight);
      const dw = Math.round(image.naturalWidth * scale), dh = Math.round(image.naturalHeight * scale);
      const dx = Math.round((W - dw) / 2), dy = Math.round((H - dh) / 2);
      passes ??= LOAD.map(([size]) => size ? pixelate(image, Math.ceil(dw / (size * dpr)), Math.ceil(dh / (size * dpr))) : image);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingQuality = 'high';
      LOAD.forEach(([size, start, duration], pass) => {
        const k = Math.min(1, Math.max(0, (t - start) / duration));
        if (!k || !passes) return;
        const src = passes[pass];
        const sw = src instanceof HTMLImageElement ? src.naturalWidth : src.width;
        const sh = src instanceof HTMLImageElement ? src.naturalHeight : src.height;
        // Reveal top to bottom a whole block row at a time.
        const part = size ? Math.ceil(k * sh) / sh : Math.ceil(k * 40) / 40;
        ctx.imageSmoothingEnabled = !size;
        ctx.drawImage(src, 0, 0, sw, sh * part, dx, dy, dw, dh * part);
      });
      label.textContent = t >= LOADED ? caption(photo) : `Loading ${Math.floor(t / LOADED * 100)}%`;
    };

    const tick = (now: number) => {
      if (!image.complete) {
        frame = requestAnimationFrame(tick);
        return;
      }
      if (!image.naturalWidth) {
        label.textContent = 'Could not load';
        return;
      }
      if (loadAt < 0) loadAt = now;
      const t = reduce ? LOADED : now - loadAt;
      render(t);
      if (t < LOADED) frame = requestAnimationFrame(tick);
      else load(photos[(index + 1) % photos.length]);
    };

    fit();
    ctx.clearRect(0, 0, view.width, view.height);
    label.textContent = 'Loading 0%';
    frame = requestAnimationFrame(tick);
    const resize = new ResizeObserver(() => {
      if (view.width === Math.round(area.clientWidth * Math.min(devicePixelRatio || 1, 2))) return;
      fit();
      if (image.naturalWidth && loadAt >= 0) render(reduce ? LOADED : performance.now() - loadAt);
    });
    resize.observe(area);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [visible, index, photo, photos]);

  useEffect(() => {
    if (!playing || !visible) return;
    const timer = setTimeout(() => go(1), PHOTO_MS);
    return () => clearTimeout(timer);
  }, [playing, visible, index]);

  return (
    <div className="viewer" ref={root}>
      <RetroWindow
        className="win--viewer"
        title={<><span className="win__dir">C:\CODEHAWKS\PHOTOS\</span>{photo.event.toUpperCase()}\{photo.slug.toUpperCase()}.JPG</>}
        menu={
          <>
            <span aria-hidden="true">File</span>
            <span aria-hidden="true">View</span>
            <span className="win__menu-gap" />
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo">&#9664; Prev</button>
            <button type="button" onClick={() => setPlaying(on => !on)}>{playing ? 'Pause' : 'Play'}</button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo">Next &#9654;</button>
          </>
        }
        status={[<span ref={status}>{caption(photos[start])}</span>, `Photo ${index + 1} of ${photos.length}`]}
      >
        <div className="viewer__screen" ref={screen} role="img" aria-label={`Photo ${index + 1} of ${photos.length}: ${photo.alt}`}>
          <img className="viewer__fallback" src={source(photos[start])} alt={photos[start].alt} width={photos[start].width} height={photos[start].height} loading="lazy" decoding="async" />
          <canvas ref={canvas} aria-hidden="true" />
        </div>
      </RetroWindow>
    </div>
  );
}
