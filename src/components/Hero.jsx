'use client'

/**
 * components/Hero.jsx — Plain Culture hero
 * Requirements: npm install gsap
 * Assets: /public/{arrowroot,carrot,dates,guava}.png (main bottles) and /public/{arrowroot0,carrot0,dates0,guava0}.png (rail thumbnails)
 */

import { useEffect, useRef, useState } from 'react'
import { Playfair_Display, Outfit } from 'next/font/google'
import Image from 'next/image'
import gsap from 'gsap'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

/* ───────────────────────────────  DATA  ─────────────────────────────── */

const BOTTLES = [
  {
    src: '/arrowroot.png',
    thumb: '/arrowroot0.png?v=2',
    name: 'Arrowroot',
    kind: 'leaf',
    color: '#F1E3B0', // Soft lime
    headingLines: ['Earthy &', 'Soothing.'],
    description: 'A gentle, restorative blend of nature’s best ingredients. Light, refreshing, and crafted specifically for your daily reset. Enjoy the naturally smooth texture that cools the body and aids digestion from within.',
  },
  {
    src: '/carrot.png',
    thumb: '/carrot0.png?v=2',
    name: 'Carrot',
    kind: 'carrot',
    color: '#F2AE3D', // Bright orange
    headingLines: ['Rooted in', 'Goodness.'],
    description: 'Vibrant, sweet, and packed with essential beta-carotene for that natural, healthy glow. The classic earthiness of farm-fresh carrots turned into a remarkably smooth, creamy sip. The perfect morning energizer.',
  },
  {
    src: '/dates.png',
    thumb: '/dates0.png?v=2',
    name: 'Dates',
    kind: 'date',
    color: '#D9A566', // Caramel brown
    headingLines: ['Naturally', 'Sweet.'],
    description: 'Experience rich, caramel-like sweetness straight from the desert palm. With absolutely no added sugars, this is pure, unadulterated indulgence packed with iron and natural energy to keep you moving all day long.',
  },
  {
    src: '/guava.png',
    thumb: '/guava0.png?v=2',
    name: 'Guava',
    kind: 'guava',
    color: '#BEF264', // Guava green
    headingLines: ['Tropical', 'Bliss.'],
    description: 'A glorious burst of tropical sunshine in every single drop. Wonderfully sweet, subtly tangy, and endlessly refreshing for any time of day. Crafted to bring you the true, vibrant essence of fresh pink guavas.',
  },
]

/* ─────────────────────────────  TIMING  ───────────────────────────── */

const HOLD = 2 // seconds each flavour rests
const T = 0.6 // base transition duration (lower = faster)
const SCALE = 1 // resting bottle scale
const LOCK = T * 0.9 // clicks are ignored until the entrance has mostly settled
const SHOW_REFLECTION = true // set false if your PNGs already include a baked-in floor shadow

/* Film grain (inline SVG noise) */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

/* ─────────────────────────────  ICONS  ────────────────────────────── */

/** Monoline ingredient icons (SVG path data) — inherit colour via currentColor. */
const ICONS = {
  leaf: ['M5 19C5 10.5 10.5 4.5 19 4.5 19 13 13.5 19 5 19z', 'M5 19L13.5 10.5'],
  carrot: [
    'M11.8 7.2C13.4 5.9 16.6 7.7 16 11.5L4.6 19.4z',
    'M10.1 12.4l1.5 1.4',
    'M7.6 14.7l1.4 1.3',
    'M15 7.4c.2-1.9 1.3-3.3 3.2-4',
    'M15.6 8.4c1.7-.9 3.5-.9 5.2 0',
  ],
  date: [
    'M7.585 10.653A5 7.6 28 1 0 16.415 15.347A5 7.6 28 1 0 7.585 10.653z', // ellipse rotated 28°
    'M9.6 12c.9.8 1.2 2.4.6 4.1',
    'M15.6 6.4c.3-1.4 1.1-2.4 2.5-3',
  ],
  guava: [
    'M12 20.5c-3.9 0-6.5-2.8-6.5-6.7 0-3.3 2.3-6.3 6.5-6.3s6.5 3 6.5 6.3c0 3.9-2.6 6.7-6.5 6.7z',
    'M12 7.5C12 5.2 13.4 3.6 16 3.2c.2 2.5-1.2 4.1-4 4.3z',
    'M9.6 14.2h.01M13 12.6h.01M14 16.4h.01M10.8 17.4h.01',
  ],
}

function FlavorIcon({ kind, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {ICONS[kind].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/* ─────────────────────────────  HERO  ─────────────────────────────── */

export default function Hero() {
  const root = useRef(null)
  const goRef = useRef(() => {})
  const cur = useRef(0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const $ = gsap.utils.selector(root)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ac = new AbortController()
    const loops = []
    let step
    cur.current = 0 // stay in sync after a remount / fast refresh

    /* ---- collect elements (one bundle per flavour) ---- */
    const layerEls = $('[data-layer]')
    const glintEls = $('[data-glint]')
    const washEls = $('[data-wash]')
    const barEls = $('[data-bar]')

    const P = BOTTLES.map((b, i) => ({
      layer: layerEls[i],
      glint: glintEls[i],
      wash: washEls[i],
      bar: barEls[i],
      copy: $(`[data-copy="${i}"]`)[0],
      lines: $(`[data-copy="${i}"] [data-hl]`),
      body: $(`[data-copy="${i}"] [data-hb]`),
    }))

    const ui = $('[data-ui]')
    const rails = $('[data-rail]')
    const shadow = $('[data-shadow]')[0]
    const orbit = $('[data-orbit]')[0]
    const tilt = $('[data-tilt]')[0]
    const floats = $('[data-float]')

    /* ---- initial state (also makes React strict-mode double-mount safe) ---- */
    gsap.set(layerEls, { scale: SCALE, transformPerspective: 1400, opacity: 0 })
    gsap.set(washEls, { opacity: 0, scale: reduce ? 1 : 0.4 })
    gsap.set(barEls, { scaleX: 0, transformOrigin: '0% 50%' })
    gsap.set(P.flatMap((p) => p.lines), { yPercent: reduce ? 0 : 118, transformOrigin: '0% 100%' })
    gsap.set(P.flatMap((p) => p.body), { opacity: reduce ? 1 : 0 })
    gsap.set(P.map((p) => p.copy), { autoAlpha: 0 }) // text is only ever visible for the active flavour
    gsap.set(ui, { opacity: 0, y: reduce ? 0 : 24 })
    gsap.set(rails, { opacity: 0, x: reduce ? 0 : 24 })
    gsap.set(shadow, { opacity: 0, scaleX: 0.6 })

    // Hard reset for any flavour that must not be visible (cleans up interrupted transitions)
    const hide = (p) => {
      gsap.set([p.layer, p.wash], { opacity: 0 })
      gsap.set(p.copy, { autoAlpha: 0 })
    }

    /* ---- choreography ---- */

    // Outgoing flavour. k = travel direction (+1 forward, -1 back).
    const conceal = (tl, p, k) =>
      tl
        .to(p.layer, { yPercent: -24 * k, rotateY: 28 * k, rotateZ: -6 * k, scale: SCALE * 0.86, opacity: 0, filter: 'blur(12px)', duration: T * 0.5, ease: 'power3.in' }, 0)
        .to(p.wash, { scale: 1.3, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
        .to(p.lines, { yPercent: -118, rotate: -2, duration: 0.38, ease: 'power3.in', stagger: 0.04 }, 0)
        .to(p.body, { y: -12, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0)
        .set(p.copy, { autoAlpha: 0 }, 0.5) // fully hidden once its exit has finished

    // Incoming flavour — the signature moment.
    const reveal = (tl, p, at, k) =>
      tl
        .set(p.copy, { autoAlpha: 1 }, at)
        // rise from below with a springy settle
        .fromTo(p.layer, { yPercent: 34 * k }, { yPercent: 0, duration: T * 1.15, ease: 'back.out(1.6)' }, at)
        // Y-swing + focus pull + scale-up
        .fromTo(
          p.layer,
          { rotateY: -38 * k, rotateZ: 9 * k, scale: SCALE * 0.7, opacity: 0, filter: 'blur(16px)' },
          { rotateY: 0, rotateZ: 0, scale: SCALE, opacity: 1, filter: 'blur(0px)', duration: T * 0.95, ease: 'expo.out', clearProps: 'filter' },
          at
        )
        // colour bloom behind the bottle
        .fromTo(p.wash, { scale: 0.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.95, ease: 'expo.out' }, at)
        // headline lines slide up out of their masks
        .fromTo(p.lines, { yPercent: 118, rotate: 3.5 }, { yPercent: 0, rotate: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, at + 0.06)
        .fromTo(
          p.body,
          { y: 20, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out', clearProps: 'filter' },
          at + 0.18
        )
        // glass glint sweeps across the bottle once it has landed
        .fromTo(
          p.glint,
          { backgroundPosition: '160% 0' },
          { backgroundPosition: '-60% 0', duration: 0.9, ease: 'power2.inOut', immediateRender: false },
          at + T * 0.45
        )

    const play = (next, { intro = false, dir = 1 } = {}) => {
      const prev = cur.current
      cur.current = next
      step?.kill()
      P.forEach((p, i) => i !== prev && i !== next && hide(p)) // nothing but outgoing + incoming may be visible

      const n = P[next]
      const o = P[prev]
      const at = T * 0.25 // hand-off moment between outgoing and incoming
      const tl = (step = gsap.timeline({ onComplete: () => play((next + 1) % BOTTLES.length) }))
      tl.call(setActive, [next], intro || reduce ? 0 : at)

      if (intro) {
        if (reduce) {
          gsap.set([...ui, ...rails, shadow, n.layer, n.wash], { opacity: 1, scale: 1 })
          gsap.set(n.copy, { autoAlpha: 1 })
        } else {
          tl.to(shadow, { opacity: 1, scaleX: 1, duration: 0.9, ease: 'power2.out' }, 0.2)
            .to(ui, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 }, 0.35)
            .to(rails, { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', stagger: 0.05 }, 0.5)
          reveal(tl, n, 0.03, 1)
        }
      } else if (reduce) {
        tl.to([o.layer, o.wash, o.copy], { autoAlpha: 0, duration: 0.3 }, 0).to([n.layer, n.wash, n.copy], { autoAlpha: 1, duration: 0.3 }, 0)
      } else {
        conceal(tl, o, dir)
        reveal(tl, n, at, dir)
        tl.set(barEls, { scaleX: 0 }, 0)
          // floor shadow shrinks while the bottle is airborne, then blooms as it lands
          .to(shadow, { scaleX: 0.55, opacity: 0.35, duration: at, ease: 'sine.inOut' }, 0)
          .to(shadow, { scaleX: 1, opacity: 1, duration: T * 0.9, ease: 'expo.out' }, at + 0.05)
      }

      // rest, with the rail progress bar filling over the hold
      tl.to({}, { duration: HOLD })
      if (!reduce) tl.fromTo(n.bar, { scaleX: 0 }, { scaleX: 1, duration: HOLD, ease: 'none', immediateRender: false }, '<')
    }

    goRef.current = (i) => {
      if (i === cur.current || (step && step.time() < LOCK)) return
      play(i, { dir: i > cur.current ? 1 : -1 })
    }

    play(0, { intro: true })

    /* ---- ambient motion ---- */
    if (!reduce) {
      loops.push(
        gsap.to(floats, { y: -12, rotateZ: 0.8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      )

      // mouse parallax: bottle tilts, background wash drifts for depth
      gsap.set(tilt, { transformPerspective: 1400, rotationX: 0, rotationY: 0 })
      const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3.out' })
      const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3.out' })
      const ox = gsap.quickTo(orbit, 'x', { duration: 1.2, ease: 'power3.out' })
      const oy = gsap.quickTo(orbit, 'y', { duration: 1.2, ease: 'power3.out' })

      root.current.addEventListener(
        'pointermove',
        (e) => {
          if (e.pointerType !== 'mouse') return
          const r = root.current.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          ry(nx * 12)
          rx(-ny * 7)
          ox(-nx * 22)
          oy(-ny * 14)
        },
        { signal: ac.signal }
      )
      root.current.addEventListener(
        'pointerleave',
        () => {
          rx(0)
          ry(0)
          ox(0)
          oy(0)
        },
        { signal: ac.signal }
      )
    }

    return () => {
      step?.kill()
      loops.forEach((l) => l.kill())
      ac.abort()
    }
  }, [])

  const accent = BOTTLES[active].color

  return (
    <section
      ref={root}
      id="home"
      className={`${playfair.variable} ${outfit.variable} relative isolate w-full max-w-full overflow-hidden`}
      style={{
        '--plain-bg': '#004C33', // Deep forest green
        '--plain-ink': '#F7E8C8', // Cream
        '--plain-muted': 'rgba(247,232,200,0.86)',
        '--plain-dark': '#14201A',
        backgroundColor: 'var(--plain-bg)',
        backgroundImage: [
          'radial-gradient(60% 55% at 76% 42%, rgba(247,232,200,0.10), transparent 70%)',
          'radial-gradient(45% 40% at 6% 6%, rgba(190,242,100,0.07), transparent 70%)',
          'linear-gradient(165deg, #06573B 0%, #004C33 42%, #002F20 100%)',
        ].join(', '),
        color: 'var(--plain-ink)',
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      <h1 className="sr-only">Plain Culture</h1>

      {/* ── atmosphere ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 18vw 2vw rgba(8,18,13,0.55)' }} />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1536px] grid-cols-1 items-center gap-10 px-6 pb-20 pt-28 lg:grid-cols-2 lg:gap-6 lg:px-20 lg:pt-24">
        {/* ═════════════ Left: copy ═════════════ */}
        <div className="order-2 max-w-[640px] lg:order-1">
          <p data-ui className="flex items-center gap-3 text-[15px] font-medium tracking-wide sm:text-[16px]" style={{ color: 'var(--plain-muted)' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 transition-colors duration-700" style={{ background: accent }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-700" style={{ background: accent }} />
            </span>
            Introducing Plain Culture
          </p>

          {/* All headlines stack in one grid cell (layout never jumps). They start `invisible`; GSAP shows only the active one. */}
          <div className="mt-8 grid">
            {BOTTLES.map((b, i) => (
              <div key={b.name} data-copy={i} aria-hidden={i !== active} className="invisible col-start-1 row-start-1">
                <h2
                  className="text-[clamp(3.5rem,8.6vw,6.75rem)] leading-[1.02] tracking-[-0.02em]"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600, color: b.color, textShadow: '0 4px 28px rgba(0,0,0,0.18)' }}
                >
                  {b.headingLines.map((line) => (
                    <span key={line} className="block overflow-hidden pb-[0.14em] pr-[0.08em] -mb-[0.14em]">
                      <span data-hl className="block will-change-transform">
                        {line}
                      </span>
                    </span>
                  ))}
                </h2>
                <p data-hb className="mt-7 max-w-[48ch] text-[17px] font-light leading-[1.75] sm:text-[19px]" style={{ color: 'var(--plain-muted)' }}>
                  {b.description}
                </p>
              </div>
            ))}
          </div>

          <div data-ui className="mt-10">
            <a
              href="/products"
              className="group relative inline-flex items-center gap-5 overflow-hidden rounded-full py-2 pl-8 pr-2 text-[17px] font-semibold transition-[background-color,box-shadow] duration-700 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:text-[18px]"
              style={{
                background: accent,
                color: 'var(--plain-dark)',
                boxShadow: `0 18px 40px -18px ${accent}AA`,
                '--tw-ring-color': accent,
                '--tw-ring-offset-color': 'var(--plain-bg)',
              }}
            >
              <span className="relative z-10">Explore the range</span>
              <span
                className="relative z-10 grid h-12 w-12 place-items-center rounded-full transition-transform duration-500 ease-out group-hover:-rotate-45"
                style={{ background: 'var(--plain-dark)', color: accent }}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {/* light sweep on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/40 blur-md transition-transform duration-[900ms] ease-out group-hover:translate-x-[520%]"
              />
            </a>
          </div>
        </div>

        {/* ═════════════ Right: product stage ═════════════ */}
        <div className="order-1 flex justify-center lg:order-2">
          <div data-stage className="relative h-[74vh] w-full max-w-[520px] sm:h-[80vh] sm:max-w-[600px] lg:h-[92vh] lg:max-w-[760px]">
            {/* colour bloom behind the bottle */}
            <div
              data-orbit
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[1%] grid h-[80%] grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center"
            >
              {BOTTLES.map((b) => (
                <div
                  key={b.name}
                  data-wash
                  className="col-start-1 row-start-1 aspect-square w-[96%] rounded-full opacity-0"
                  style={{ background: `radial-gradient(circle, ${b.color}59 0%, ${b.color}1F 38%, transparent 68%)` }}
                />
              ))}
            </div>

            {/* lit floor + contact shadow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-[8%] top-[76%] h-[10%]"
              style={{ background: 'radial-gradient(ellipse at center, rgba(247,232,200,0.16), transparent 68%)' }}
            />
            <div
              data-shadow
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[79.2%] mx-auto h-[3.6%] w-[40%] rounded-full opacity-0"
              style={{ background: 'radial-gradient(closest-side, rgba(6,12,9,0.7), transparent)' }}
            />

            {/* bottles */}
            <div data-tilt className="absolute inset-0">
              {BOTTLES.map((b, i) => (
                <div key={b.name} data-layer aria-hidden={i !== active} className="absolute inset-0 opacity-0 will-change-transform">
                  <div data-float className="absolute inset-x-0 top-[1%] h-[80%]">
                    <Image
                      src={b.src}
                      alt={`Plain Culture ${b.name} bottle`}
                      fill
                      sizes="(min-width: 1024px) 50vw, 92vw"
                      priority={i === 0}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      className="select-none object-contain drop-shadow-2xl"
                      draggable={false}
                    />
                    {/* glint — a moving highlight masked to the bottle's own silhouette */}
                    <div
                      data-glint
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        WebkitMaskImage: `url("${b.src}")`,
                        maskImage: `url("${b.src}")`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        backgroundImage: 'linear-gradient(112deg, transparent 38%, rgba(255,255,255,0.5) 50%, transparent 62%)',
                        backgroundSize: '260% 100%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: '160% 0',
                        mixBlendMode: 'screen',
                      }}
                    />
                  </div>

                  {SHOW_REFLECTION && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0"
                      style={{
                        top: '81%',
                        height: '80%',
                        transform: 'scaleY(-1)',
                        opacity: 0.2,
                        filter: 'blur(1.5px)',
                        WebkitMaskImage: 'linear-gradient(to top, #000 0%, transparent 24%)',
                        maskImage: 'linear-gradient(to top, #000 0%, transparent 24%)',
                      }}
                    >
                      <Image src={b.src} alt="" fill sizes="(min-width: 1024px) 50vw, 92vw" className="select-none object-contain" draggable={false} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* bottle rail (thumbnails use the *0.png images) */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-3 sm:gap-4 lg:bottom-auto lg:left-auto lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:flex-col lg:gap-3">
              {BOTTLES.map((b, i) => {
                const on = i === active
                return (
                  <div key={b.name} data-rail>
                    <button
                      type="button"
                      aria-label={`Show ${b.name}`}
                      aria-pressed={on}
                      onClick={() => goRef.current(i)}
                      className={`group relative block h-[64px] w-[46px] rounded-[18px] border backdrop-blur-md transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-[72px] sm:w-[52px] lg:h-[88px] lg:w-[60px] ${
                        on ? 'scale-110' : 'scale-90 opacity-70 hover:scale-100 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: on ? b.color : 'rgba(247,232,200,0.14)',
                        background: `linear-gradient(165deg, ${b.color}${on ? '40' : '1A'}, rgba(255,255,255,0.03))`,
                        boxShadow: on ? `0 16px 34px -12px ${b.color}AA` : 'none',
                        '--tw-ring-color': b.color,
                        '--tw-ring-offset-color': 'var(--plain-bg)',
                      }}
                    >
                      <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
                        <Image
                          src={b.thumb}
                          alt=""
                          fill
                          sizes="72px"
                          className={`select-none object-contain p-1 pb-3 drop-shadow-lg transition-[filter] duration-500 ${on ? '' : 'saturate-[.6]'}`}
                          draggable={false}
                        />
                      </span>

                      {/* autoplay progress */}
                      <span
                        aria-hidden
                        className={`absolute inset-x-2.5 bottom-1.5 h-[2px] overflow-hidden rounded-full transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: 'rgba(247,232,200,0.2)' }}
                      >
                        <span data-bar className="absolute inset-0 rounded-full" style={{ background: b.color }} />
                      </span>

                      {/* hover name tag (desktop) */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-[calc(100%+14px)] top-1/2 hidden -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 lg:flex"
                        style={{ borderColor: 'rgba(247,232,200,0.18)', background: 'rgba(8,20,14,0.6)', color: b.color }}
                      >
                        <FlavorIcon kind={b.kind} className="h-4 w-4" />
                        {b.name}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}