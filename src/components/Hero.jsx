'use client'

/**
 * components/Hero.jsx — Plain Culture hero
 *
 * Sequence:
 *   Hero.mp4 (plays once, playback-synced dissolve into the first static
 *   composition — unchanged from before) → hold ~2s → cinematic transition
 *   into flavour 2 → hold ~2s → transition into flavour 3 → final hold.
 *
 * The three flavours reuse just two DOM layer-*sets* (bg A/B, items A/B,
 * bottle A/B) in a ping-pong: whichever set is "front" holds the current
 * flavour; the "back" set is preloaded with the next flavour ahead of time
 * and crossfades in, then the roles swap. Nothing new is mounted per
 * transition.
 *
 * Depth order (back to front): video → background → items (ingredients) →
 * bottle → readability overlay → text/UI. Background is visible first; the
 * bottle slides straight down from above the frame into its resting spot;
 * the items composition sits in the layer behind the bottle and in front of
 * the background, sliding in with the same downward motion at a smaller
 * scale. Every layer's motion is a plain vertical slide + fade — no
 * rotation, no scale-pulse — so the whole scene reads as one consistent
 * "sliding into place" gesture rather than separate effects per layer.
 *
 * Assets required in /public:
 *   Hero.mp4
 *   bg.png,  items.png,  bottle.png    (flavour 1)
 *   bg1.png, items1.png, bottle1.png   (flavour 2)
 *   bg2.png, items2.png, bottle2.png   (flavour 3)
 *
 *   NOTE: the original asset brief flagged the flavour-3 items file under an
 *   odd literal name ("items.2png"). If that's what actually exists in
 *   /public, change PRODUCTS[2].items below to match exactly — nothing else
 *   in this file needs to change.
 *
 * Dependency: gsap
 *
 * Note: this component intentionally renders no <nav> — the site's global
 * navbar (mounted in the root layout, above Hero) already covers that.
 *
 * TUNING: PRODUCTS[0].position / itemsPosition are measured against your
 * actual Hero.mp4 / bg.png / items.png / bottle.png already. PRODUCTS[1] and
 * PRODUCTS[2] currently copy those same numbers as a starting guess —
 * bottle1/2.png and items1/2.png almost certainly have different
 * dimensions/framing, so those two need the same hand-tuning pass against
 * their own backgrounds.
 */

import { useEffect, useRef, useState } from 'react'
import { Playfair_Display, Outfit } from 'next/font/google'
import gsap from 'gsap'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

// How long (seconds) before the video's real, dynamically-read end the
// dissolve into the first flavour runs. Never hardcode the clip's duration.
const SETTLE_WINDOW = 0.5

// How long each flavour holds once fully settled, and how long each
// flavour-to-flavour transition takes.
const HOLD_MS = 2000
const TRANSITION_S = 0.75

// Slide distances (px) for the entrance/exit of each layer. Bottle and items
// both travel downward — arriving from above, leaving by continuing further
// down — so the motion reads as one continuous flow rather than layers
// bouncing in from different directions. Background only drifts a few
// pixels since it's full-bleed and shouldn't reveal any edge.
const BOTTLE_ENTER_Y = -90
const BOTTLE_EXIT_Y = 70
const ITEMS_ENTER_Y = -40
const ITEMS_EXIT_Y = 32
const BG_DRIFT_Y = 8

// Each flavour's background + items + bottle trio, plus each layer's own
// placement. `rotate` is the bottle's resting (static) Z-rotation — usually
// 0 — not something that gets animated. `itemsPosition.height` is
// intentionally modest, sized like the bottle rather than full-viewport, so
// the ingredient composition reads as a halo supporting the product. An
// optional `mobile` object on either position can override top/height/rotate
// under 768px — applied at transition time, not on resize.
const PRODUCTS = [
  {
    id: 'orange',
    background: '/bg.png',
    items: '/items.png',
    bottle: '/bottle.png',
    alt: 'Plain Culture — Orange',
    // Matches the last frame of Hero.mp4: the can reads at roughly half the
    // viewport's height, starting a little below the top of the frame.
    position: { top: '17%', height: 'clamp(400px, 51vh, 740px)', rotate: 0 },
    // The fruit/leaf composition in that same still bleeds past both the
    // top and bottom edges of the frame rather than sitting fully inside
    // it — hence height slightly over 100vh and a negative top.
    itemsPosition: { top: '-4%', height: 'clamp(680px, 104vh, 1080px)' },
  },
  {
    id: 'guava',
    background: '/bg1.png',
    items: '/items1.png',
    bottle: '/bottle1.png',
    alt: 'Plain Culture — Guava',
    position: { top: '17%', height: 'clamp(400px, 51vh, 740px)', rotate: 0 },
    itemsPosition: { top: '-4%', height: 'clamp(680px, 104vh, 1080px)' },
  },
  {
    id: 'grape',
    background: '/bg2.png',
    items: '/items2.png',
    bottle: '/bottle2.png',
    alt: 'Plain Culture — Grape',
    position: { top: '17%', height: 'clamp(400px, 51vh, 740px)', rotate: 0 },
    itemsPosition: { top: '-4%', height: 'clamp(680px, 104vh, 1080px)' },
  },
]

function resolvePosition(product) {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  return { ...product.position, ...(isMobile && product.position.mobile ? product.position.mobile : null) }
}

function resolveItemsPosition(product) {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  return { ...product.itemsPosition, ...(isMobile && product.itemsPosition.mobile ? product.itemsPosition.mobile : null) }
}

export default function Hero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const bgARef = useRef(null)
  const bgBRef = useRef(null)
  const itemsARef = useRef(null)
  const itemsBRef = useRef(null)
  const bottleARef = useRef(null)
  const bottleBRef = useRef(null)
  const copyRef = useRef(null)

  const videoTransitioned = useRef(false)
  const bgAFailed = useRef(false)
  const itemsAFailed = useRef(false)
  const bottleAFailed = useRef(false)

  // src → 'ok' | 'error', populated by the background preloader below.
  const assetStatus = useRef({})

  // Which layer set is currently front, and which flavour index it holds.
  const frontIsA = useRef(true)
  const productIndex = useRef(0)
  const parallaxPaused = useRef(false)

  // Only one React state drives this component — no per-frame or
  // per-transition re-renders. Everything else is refs + direct GSAP/DOM.
  const [uiReady, setUiReady] = useState(false)

  /* ─── video → playback-synced dissolve → first static flavour (layer set A) ─── */
  useEffect(() => {
    const video = videoRef.current
    const bg = bgARef.current
    const items = itemsARef.current
    const bottle = bottleARef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Background is centered via plain full-bleed positioning (no transform),
    // so it only ever needs opacity. Items and bottle are centered with
    // xPercent and slide in vertically, so their starting y is set here too.
    if (items) gsap.set(items, { xPercent: -50, y: ITEMS_ENTER_Y, opacity: 0 })
    if (itemsBRef.current) gsap.set(itemsBRef.current, { xPercent: -50 })
    if (bottle) gsap.set(bottle, { xPercent: -50, rotation: PRODUCTS[0].position.rotate || 0, y: BOTTLE_ENTER_Y, opacity: 0 })
    if (bottleBRef.current) gsap.set(bottleBRef.current, { xPercent: -50 })

    const finish = () => {
      if (videoTransitioned.current) return
      videoTransitioned.current = true
      if (video) {
        video.pause()
        video.style.opacity = '0'
      }
      if (bg && !bgAFailed.current) bg.style.opacity = '1'
      if (items && !itemsAFailed.current) gsap.set(items, { opacity: 1, y: 0 })
      if (bottle && !bottleAFailed.current) gsap.set(bottle, { opacity: 1, y: 0 })
      setUiReady(true)
    }

    if (reduce) {
      finish()
      return
    }

    if (!video) return

    let raf
    const tick = () => {
      if (videoTransitioned.current) return
      const duration = video.duration
      if (duration && !Number.isNaN(duration)) {
        const remaining = duration - video.currentTime
        if (remaining <= SETTLE_WINDOW) {
          const progress = gsap.utils.clamp(0, 1, 1 - remaining / SETTLE_WINDOW)
          if (bg && !bgAFailed.current) bg.style.opacity = String(progress)
          // Bottle (and items, more subtly) slide down into place in step
          // with the same dissolve progress the background fades in on.
          if (items && !itemsAFailed.current) gsap.set(items, { opacity: progress, y: ITEMS_ENTER_Y * (1 - progress) })
          if (bottle && !bottleAFailed.current) gsap.set(bottle, { opacity: progress, y: BOTTLE_ENTER_Y * (1 - progress) })
        }
        if (remaining <= 0.03) {
          finish()
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    video.addEventListener('ended', finish)
    video.addEventListener('error', finish)

    const playPromise = video.play()
    if (playPromise?.catch) playPromise.catch(finish)

    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('ended', finish)
      video.removeEventListener('error', finish)
    }
  }, [])

  /* ─── preload flavours 2 and 3 in the background (flavour 1 already loads via layer set A above) ─── */
  useEffect(() => {
    PRODUCTS.forEach((p, i) => {
      if (i === 0) return
      ;[p.background, p.items, p.bottle].forEach((src) => {
        const img = new window.Image()
        img.onload = () => {
          assetStatus.current[src] = 'ok'
        }
        img.onerror = () => {
          assetStatus.current[src] = 'error'
        }
        img.src = src
      })
    })
  }, [])

  /* ─── copy reveal — once only, stays stable across flavour changes ─── */
  useEffect(() => {
    if (!uiReady) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const $ = gsap.utils.selector(copyRef)
    const eyebrow = $('[data-eyebrow]')
    const headline = $('[data-headline]')
    const desc = $('[data-desc]')
    const cta = $('[data-cta]')

    if (reduce) {
      gsap.to([...eyebrow, ...headline, ...desc, ...cta], { opacity: 1, duration: 0.4 })
      return
    }

    gsap
      .timeline({ delay: 0.15 })
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
      .to(headline, { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }, '-=0.32')
      .to(desc, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.4')
      .to(cta, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.32')
  }, [uiReady])

  /* ─── flavour transition sequence, after the video-freeze settles ─── */
  useEffect(() => {
    if (!uiReady) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cancelled = false
    const timers = []

    const currentLayers = () => ({
      bgFront: frontIsA.current ? bgARef.current : bgBRef.current,
      bgBack: frontIsA.current ? bgBRef.current : bgARef.current,
      itemsFront: frontIsA.current ? itemsARef.current : itemsBRef.current,
      itemsBack: frontIsA.current ? itemsBRef.current : itemsARef.current,
      bottleFront: frontIsA.current ? bottleARef.current : bottleBRef.current,
      bottleBack: frontIsA.current ? bottleBRef.current : bottleARef.current,
    })

    const applyPosition = (el, pos) => {
      if (!el) return
      el.style.top = pos.top
      el.style.height = pos.height
    }

    const advance = () => {
      if (cancelled) return
      let targetIndex = productIndex.current + 1
      // Background is required; if it failed to load, skip that flavour entirely.
      while (targetIndex < PRODUCTS.length && assetStatus.current[PRODUCTS[targetIndex].background] === 'error') {
        targetIndex += 1
      }
      if (targetIndex >= PRODUCTS.length) return // sequence complete — hold forever

      const product = PRODUCTS[targetIndex]
      const rest = product.position.rotate || 0
      const itemsOk = assetStatus.current[product.items] !== 'error'
      const bottleOk = assetStatus.current[product.bottle] !== 'error'
      const { bgFront, bgBack, itemsFront, itemsBack, bottleFront, bottleBack } = currentLayers()

      if (bgBack) {
        bgBack.onerror = () => {
          assetStatus.current[product.background] = 'error'
        }
        bgBack.src = product.background
      }
      if (itemsBack) {
        if (itemsOk) {
          itemsBack.onerror = () => {
            assetStatus.current[product.items] = 'error'
          }
          itemsBack.src = product.items
          applyPosition(itemsBack, resolveItemsPosition(product))
          gsap.set(itemsBack, { y: ITEMS_ENTER_Y, opacity: 0 })
        } else {
          gsap.set(itemsBack, { opacity: 0 })
        }
      }
      if (bottleBack) {
        if (bottleOk) {
          bottleBack.onerror = () => {
            assetStatus.current[product.bottle] = 'error'
          }
          bottleBack.src = product.bottle
          applyPosition(bottleBack, resolvePosition(product))
          gsap.set(bottleBack, { rotation: rest, y: BOTTLE_ENTER_Y, opacity: 0 })
        } else {
          gsap.set(bottleBack, { opacity: 0 })
        }
      }

      parallaxPaused.current = true
      const tl = gsap.timeline({
        onComplete: () => {
          productIndex.current = targetIndex
          frontIsA.current = !frontIsA.current
          parallaxPaused.current = false
          if (targetIndex < PRODUCTS.length - 1) {
            timers.push(setTimeout(advance, HOLD_MS))
          }
        },
      })

      if (reduce) {
        tl.to(bgFront, { opacity: 0, duration: 0.4 }, 0).to(bgBack, { opacity: 1, duration: 0.4 }, 0)
        if (itemsFront) tl.to(itemsFront, { opacity: 0, duration: 0.4 }, 0)
        if (itemsOk && itemsBack) tl.to(itemsBack, { opacity: 1, duration: 0.4 }, 0)
        if (bottleFront) tl.to(bottleFront, { opacity: 0, duration: 0.4 }, 0)
        if (bottleOk && bottleBack) tl.to(bottleBack, { opacity: 1, duration: 0.4 }, 0)
      } else {
        const D = TRANSITION_S
        // Background: crossfade with a faint vertical drift — same slide
        // language as the rest of the scene, kept small since it's full-bleed.
        tl.to(bgFront, { opacity: 0, y: -BG_DRIFT_Y, duration: D, ease: 'power2.inOut' }, 0)
        tl.fromTo(bgBack, { opacity: 0, y: BG_DRIFT_Y }, { opacity: 1, y: 0, duration: D, ease: 'power2.inOut' }, 0)

        // Items: slides out downward just after the bottle starts leaving;
        // the next flavour's items slide down into place ahead of its bottle.
        if (itemsFront) {
          tl.to(itemsFront, { opacity: 0, y: ITEMS_EXIT_Y, duration: D * 0.5, ease: 'power2.in' }, D * 0.06)
        }
        if (itemsOk && itemsBack) {
          tl.fromTo(itemsBack, { opacity: 0, y: ITEMS_ENTER_Y }, { opacity: 1, y: 0, duration: D * 0.55, ease: 'power2.out' }, D * 0.12)
        }

        // Bottle: the through-line of the whole sequence. The outgoing
        // bottle continues downward and fades; the incoming one arrives
        // from the top — the same direction it slid in on the first reveal.
        if (bottleFront) {
          tl.to(bottleFront, { opacity: 0, y: BOTTLE_EXIT_Y, duration: D * 0.55, ease: 'power2.in' }, 0)
        }
        if (bottleOk && bottleBack) {
          tl.fromTo(bottleBack, { opacity: 0, y: BOTTLE_ENTER_Y }, { opacity: 1, y: 0, duration: D * 0.6, ease: 'power2.out' }, D * 0.18)
        }
      }
    }

    timers.push(setTimeout(advance, HOLD_MS))

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [uiReady])

  /* ─── subtle parallax on whichever layers are currently front (desktop only) ─── */
  useEffect(() => {
    if (!uiReady) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const section = sectionRef.current
    if (reduce || !section) return

    const bottleLayers = [bottleARef.current, bottleBRef.current].filter(Boolean)
    const itemsLayers = [itemsARef.current, itemsBRef.current].filter(Boolean)
    if (!bottleLayers.length) return

    const ac = new AbortController()
    const makeQuickies = (el) => ({
      el,
      mx: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
      my: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
    })
    const bottleQuickies = bottleLayers.map(makeQuickies)
    const itemsQuickies = itemsLayers.map(makeQuickies)

    section.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse' || parallaxPaused.current) return
        const r = section.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        // Bottle moves most (~±3px), items a little less (~±2px) — items
        // are a supporting layer, so they should trail the bottle's depth
        // rather than match it.
        const activeBottle = frontIsA.current ? bottleQuickies[0] : bottleQuickies[1]
        const activeItems = frontIsA.current ? itemsQuickies[0] : itemsQuickies[1]
        activeBottle?.mx(nx * 6)
        activeBottle?.my(ny * 4)
        activeItems?.mx(nx * 4)
        activeItems?.my(ny * 2.5)
      },
      { signal: ac.signal }
    )
    section.addEventListener(
      'pointerleave',
      () => {
        ;[...bottleQuickies, ...itemsQuickies].forEach((q) => {
          q.mx(0)
          q.my(0)
        })
      },
      { signal: ac.signal }
    )

    return () => ac.abort()
  }, [uiReady])

  return (
    <section
      ref={sectionRef}
      id="home"
      className={`${playfair.variable} ${outfit.variable} relative isolate w-full max-w-full overflow-hidden`}
      style={{ minHeight: '100svh', backgroundColor: '#004C33' }}
    >
      <h1 className="sr-only">Plain Culture</h1>

      {/* z-index 0: video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 0 }}
        src="/Hero.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* z-index 1: background layers A/B — reused across all three flavours */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={bgARef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 1, opacity: 0 }}
        src={PRODUCTS[0].background}
        alt=""
        onError={() => {
          bgAFailed.current = true
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={bgBRef} className="absolute inset-0 h-full w-full object-cover" style={{ zIndex: 1, opacity: 0 }} alt="" />

      {/* z-index 2: ingredient layers A/B — height-driven (like the bottle),
          NOT full-bleed, sitting behind the bottle and in front of the
          background, so the halo stays visually secondary to the product */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={itemsARef}
        className="absolute"
        style={{
          zIndex: 2,
          opacity: 0,
          left: '50%',
          width: 'auto',
          top: PRODUCTS[0].itemsPosition.top,
          height: PRODUCTS[0].itemsPosition.height,
        }}
        src={PRODUCTS[0].items}
        alt=""
        onError={() => {
          itemsAFailed.current = true
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={itemsBRef}
        className="absolute"
        style={{
          zIndex: 2,
          opacity: 0,
          left: '50%',
          width: 'auto',
          top: PRODUCTS[0].itemsPosition.top,
          height: PRODUCTS[0].itemsPosition.height,
        }}
        alt=""
      />

      {/* z-index 3: bottle layers A/B */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={bottleARef}
        className="absolute"
        style={{ zIndex: 3, opacity: 0, left: '50%', width: 'auto', top: PRODUCTS[0].position.top, height: PRODUCTS[0].position.height }}
        src={PRODUCTS[0].bottle}
        alt={PRODUCTS[0].alt}
        onError={() => {
          bottleAFailed.current = true
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={bottleBRef}
        className="absolute"
        style={{ zIndex: 3, opacity: 0, left: '50%', width: 'auto', top: PRODUCTS[0].position.top, height: PRODUCTS[0].position.height }}
        alt=""
      />

      {/* z-index 4: readability overlay — subtle, left side only, hero stays bright */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 4, background: 'linear-gradient(100deg, rgba(0,20,13,0.45) 0%, rgba(0,20,13,0.12) 42%, transparent 62%)' }}
      />

      {/* z-index 10: hero content — stable across flavour changes */}
      <div ref={copyRef} className="relative flex h-full min-h-[100svh] max-w-[640px] flex-col justify-center px-6 lg:px-20" style={{ zIndex: 10 }}>
        <p
          data-eyebrow
          className="flex items-center gap-3 text-[15px] font-medium tracking-wide opacity-0 sm:text-[16px]"
          style={{ color: 'rgba(247,232,200,0.86)', transform: 'translateY(18px)' }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#BEF264' }} />
          Introducing Plain Culture
        </p>

        <h2
          data-headline
          className="mt-6 text-[clamp(3rem,7.5vw,5.75rem)] leading-[1.04] tracking-[-0.02em] opacity-0"
          style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600, color: '#F7E8C8', transform: 'translateY(18px)' }}
        >
          Just the Good Stuff.
        </h2>

        <p
          data-desc
          className="mt-6 max-w-[46ch] text-[17px] font-light leading-[1.75] opacity-0 sm:text-[19px]"
          style={{ color: 'rgba(247,232,200,0.86)', transform: 'translateY(18px)' }}
        >
          Real fruit, plainly done. No shortcuts, no additives — just the ingredient at its best, bottled.
        </p>

        <div data-cta className="mt-9 opacity-0" style={{ transform: 'translateY(18px)' }}>
          <a
            href="/products"
            className="group relative inline-flex items-center gap-5 overflow-hidden rounded-full py-2 pl-8 pr-2 text-[17px] font-semibold transition-shadow duration-700 hover:shadow-2xl"
            style={{ background: '#BEF264', color: '#14201A' }}
          >
            <span className="relative z-10">Explore the range</span>
            <span
              className="relative z-10 grid h-12 w-12 place-items-center rounded-full transition-transform duration-500 ease-out group-hover:-rotate-45"
              style={{ background: '#14201A', color: '#BEF264' }}
            >
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}