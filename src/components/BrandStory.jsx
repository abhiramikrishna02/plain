'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Playfair_Display, Outfit } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

const GREEN = '#00563F'
const INK = '#1a1a1a'

/* ---------- bottle line-up (rank 3 · 2 · 1 · 2 · 3) ---------- */
// DOM order = left → right. side: -1 left, 0 centre, 1 right
const BOTTLES = [
  { src: '/4.png', alt: 'PLAIN bottle', rank: 3, side: -1 },
  { src: '/2.png', alt: 'PLAIN bottle', rank: 2, side: -1 },
  { src: '/1.png', alt: 'PLAIN bottle', rank: 1, side: 0 },
  { src: '/3.png', alt: 'PLAIN bottle', rank: 2, side: 1 },
  { src: '/4.png', alt: 'PLAIN arrowroot bottle', rank: 3, side: 1 },
]

// h = bottle height relative to the centre bottle, z = stacking order
const RANK = {
  1: { h: 1, z: 30 },
  2: { h: 0.95, z: 20 },
  3: { h: 0.9, z: 10 },
}

const BOTTLE_H = 'clamp(200px, 46vw, 600px)' // centre bottle height — raise the numbers for bigger bottles
const OVERLAP = 0.06 // how much neighbouring bottles tuck behind each other (× centre height). Higher = tighter

/* Shadows — all sizes scale with the bottle height.
   Make them stronger/softer by changing the rgba opacity values (0.25 / 0.22 / 0.38). */
const BOTTLE_SHADOW = [
  'drop-shadow(0 calc(var(--bottle-h) * 0.012) calc(var(--bottle-h) * 0.012) rgba(0,0,0,0.25))', // tight, close shadow
  'drop-shadow(0 calc(var(--bottle-h) * 0.03) calc(var(--bottle-h) * 0.05) rgba(0,0,0,0.22))', // wide, soft shadow
].join(' ')
const GROUND_SHADOW = 'radial-gradient(ellipse at center, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.16) 45%, rgba(0,0,0,0) 72%)'

/* Light sweep that glides across all bottles together
   — glow strength is the 0.35 below (was 0.75). Lower = subtler, higher = brighter. */
const SHEEN =
  'linear-gradient(110deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 62%)'
const SWEEP_AT = 2 // when the shared shine plays (seconds on the timeline) — after every bottle is in place

/* Finds the real (non-transparent) edges of a PNG so every bottle can be
   trimmed virtually — fixes uneven gaps and bottoms not sitting on one line. */
const measure = (src) =>
  new Promise((resolve) => {
    const fallback = (ratio) => resolve({ x: 0, y: 0, w: 1, h: 1, ratio })
    const img = new window.Image()
    img.onload = () => {
      try {
        const nw = img.naturalWidth
        const nh = img.naturalHeight
        const s = Math.min(1, 400 / Math.max(nw, nh))
        const w = Math.max(1, Math.round(nw * s))
        const h = Math.max(1, Math.round(nh * s))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const g = canvas.getContext('2d', { willReadFrequently: true })
        g.drawImage(img, 0, 0, w, h)
        const d = g.getImageData(0, 0, w, h).data
        let minX = w, minY = h, maxX = -1, maxY = -1
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (d[(y * w + x) * 4 + 3] > 24) {
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
            }
          }
        }
        if (maxX < 0) return fallback(nw / nh)
        const bx = minX / w
        const by = minY / h
        const bw = (maxX + 1 - minX) / w
        const bh = (maxY + 1 - minY) / h
        resolve({ x: bx, y: by, w: bw, h: bh, ratio: (bw * nw) / (bh * nh) })
      } catch {
        fallback(img.naturalWidth / img.naturalHeight || 0.4)
      }
    }
    img.onerror = () => fallback(0.4)
    img.src = src
  })

const BrandStory = () => {
  const stageRef = useRef(null)
  const [crops, setCrops] = useState(null)

  // 1) measure every bottle PNG once
  useEffect(() => {
    let off = false
    Promise.all(BOTTLES.map((b) => measure(b.src))).then((r) => {
      if (!off) setCrops(r)
    })
    return () => {
      off = true
    }
  }, [])

  // 2) build the reveal animation once the bottles are rendered
  useEffect(() => {
    if (!crops) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const all = gsap.utils.toArray('[data-bottle]')

      // Reduced motion: just show the final line-up
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(all, { opacity: 1 })
        return
      }

      const rank = (r) => all.filter((el) => Number(el.dataset.rank) === r)
      const centre = rank(1)[0]
      const body = centre.querySelector('[data-body]')
      const floor = centre.querySelector('[data-floor]')
      const midX = (el) => el.offsetLeft + el.offsetWidth / 2
      // distance from a bottle's final spot back to the centre bottle (where it hides)
      const fromCentre = (i, el) => midX(centre) - midX(el)
      // the light-sweep layers of every bottle
      const allSheens = all.map((el) => el.querySelector('[data-sheen]'))

      gsap.set(all, { transformOrigin: '50% 100%' })
      gsap.set(body, { transformOrigin: '50% 100%' })
      gsap.set(centre, { opacity: 1 }) // wrapper visible — its body + floor shadow animate in below

      const tl = gsap.timeline({ paused: true })

      /* 1) centre bottle — premium entrance
            · rises from the floor, tilted slightly, and settles upright (long expo ease)
            · unveiled by a mask wiping upward from the base, melting from blur to sharp
            · floor shadow spreads out as it lands */
      tl.fromTo(
        body,
        { y: 140, scale: 0.9, rotation: -5 },
        { y: 0, scale: 1, rotation: 0, duration: 1.35, ease: 'expo.out' },
        0
      )
      tl.fromTo(
        body,
        { opacity: 0, filter: 'blur(10px)', clipPath: 'inset(100% -40% -25% -40%)' },
        {
          opacity: 1,
          filter: 'blur(0px)',
          clipPath: 'inset(-25% -40% -25% -40%)',
          duration: 1,
          ease: 'power3.out',
          clearProps: 'filter,clipPath',
        },
        0
      )
      tl.fromTo(
        floor,
        { opacity: 0, scaleX: 0.25 },
        { opacity: 1, scaleX: 1, duration: 1.2, ease: 'power3.out' },
        0.35
      )

      // 2) inner pair: they wait hidden behind the centre bottle, then slide out sideways
      tl.set(rank(2), { opacity: 1 }, 1)
      tl.fromTo(rank(2), { x: fromCentre }, { x: 0, duration: 0.85, ease: 'power3.out' }, '<')

      // 3) outer pair: also start behind the centre, and slide out from behind the inner pair
      tl.set(rank(3), { opacity: 1 }, '<0.25')
      tl.fromTo(rank(3), { x: fromCentre }, { x: 0, duration: 0.9, ease: 'power3.out' }, '<')

      /* 4) one shared light sweep — all five bottles shine at exactly the same time,
            once the whole line-up is in place */
      tl.fromTo(
        allSheens,
        { backgroundPosition: '100% 0%' },
        { backgroundPosition: '0% 0%', duration: 1.25, ease: 'power2.inOut' },
        SWEEP_AT
      )

      // plays automatically once, when the bottles scroll into view
      ScrollTrigger.create({
        trigger: stageRef.current,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          tl.invalidate() // re-measure in case the screen was resized
          tl.play(0)
        },
      })
    }, stageRef)

    return () => ctx.revert()
  }, [crops])

  return (
    <section
      id="brand-story"
      aria-labelledby="brand-story-heading"
      className={`${playfair.variable} ${outfit.variable} relative isolate flex w-full max-w-full items-center justify-center overflow-hidden px-6 py-24 sm:py-32`}
      style={{ minHeight: '100svh', backgroundColor: '#F7E8C8', fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      {/* z-index 0: particles layer — drop the fruit PNGs in here later (absolutely positioned, behind the text) */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 0 }} />

      {/* z-index 10: centred content */}
      <div className="relative mx-auto flex max-w-[880px] flex-col items-center text-center" style={{ zIndex: 10 }}>
        <p className="text-[14px] font-semibold uppercase tracking-[0.22em] sm:text-[15px]" style={{ color: GREEN }}>
          Brand Story
        </p>

        <h2
          id="brand-story-heading"
          className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[1.08] tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 700, color: GREEN }}
        >
          Goodness Doesn’t Need to Be Complicated.
        </h2>

        <div className="mt-8 max-w-[62ch] space-y-5 text-[clamp(1.0625rem,1.5vw,1.3125rem)] font-normal leading-[1.7]" style={{ color: INK }}>
          <p>
            At PLAIN, we believe the best things are often the simplest. Familiar ingredients, comforting flavours, and a little more thought in every
            bottle.
          </p>
          <p>
            From naturally inspired fruit flavours to creamy milkshakes, we bring together taste and simplicity to make everyday moments feel a little
            better. No unnecessary fuss. Just drinks made with a clear purpose: to keep good flavour at the heart of everything we do.
          </p>
        </div>

        <p className="mt-10 text-[clamp(1.25rem,2vw,1.75rem)] tracking-[-0.01em]" style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600, color: GREEN }}>
           Simply good. Nothing extra.
        </p>

        {/* Bottle line-up: 3 · 2 · 1 · 2 · 3 — all standing on one baseline, no gaps */}
        <div
          ref={stageRef}
          aria-hidden
          className="relative mt-14 flex flex-none items-end justify-center sm:mt-20"
          style={{ '--bottle-h': BOTTLE_H, height: 'var(--bottle-h)', width: 'max-content' }}
        >
          {crops &&
            BOTTLES.map((b, i) => {
              const c = crops[i]
              // the PNG, positioned so its real (non-transparent) edges fill the bottle box
              const imgBox = {
                position: 'absolute',
                maxWidth: 'none',
                width: `${100 / c.w}%`,
                height: `${100 / c.h}%`,
                left: `${-(c.x / c.w) * 100}%`,
                top: `${-(c.y / c.h) * 100}%`,
              }
              return (
                <div
                  key={`${b.src}-${b.side}`}
                  data-bottle
                  data-rank={b.rank}
                  data-side={b.side}
                  className="pointer-events-none relative flex-none will-change-transform"
                  style={{
                    height: `calc(var(--bottle-h) * ${RANK[b.rank].h})`,
                    aspectRatio: c.ratio,
                    marginLeft: i === 0 ? 0 : `calc(var(--bottle-h) * -${OVERLAP})`,
                    zIndex: RANK[b.rank].z,
                    opacity: 0,
                  }}
                >
                  {/* ground shadow: soft ellipse on the baseline, behind its own bottle */}
                  <span
                    data-floor
                    aria-hidden
                    className="absolute"
                    style={{
                      zIndex: -1,
                      left: '2.5%',
                      width: '95%',
                      bottom: 'calc(var(--bottle-h) * -0.0385)',
                      height: 'calc(var(--bottle-h) * 0.07)',
                      background: GROUND_SHADOW,
                    }}
                  />

                  {/* bottle body — the centre bottle's entrance animates this layer */}
                  <div data-body className="absolute inset-0 will-change-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.src}
                      alt={b.alt}
                      draggable={false}
                      style={{ ...imgBox, filter: BOTTLE_SHADOW }}
                    />

                    {/* light sweep, masked to this bottle's exact shape */}
                    <span
                      data-sheen
                      aria-hidden
                      style={{
                        ...imgBox,
                        pointerEvents: 'none',
                        background: SHEEN,
                        backgroundSize: '300% 100%',
                        backgroundPosition: '100% 0%',
                        backgroundRepeat: 'no-repeat',
                        WebkitMaskImage: `url(${b.src})`,
                        maskImage: `url(${b.src})`,
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                      }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </section>
  )
}

export default BrandStory
