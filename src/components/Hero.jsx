'use client'

/* eslint-disable @next/next/no-img-element */
/**
 * components/Hero.jsx — Plain Culture hero
 *
 * hero1.mp4 plays once and dissolves into the product slides → hold → slide transitions → loop.
 * Two layer sets (bg / items / bottle, A and B) ping-pong: the front set shows the current flavour, the back set preloads the
 * next one and crossfades in, then the roles swap. Depth: video → bg → items → bottle → readability overlay → carousel → text.
 * All motion is a plain vertical slide + fade. The right-side carousel icons follow the active slide (icon N = PRODUCTS[N]) and are clickable to jump to a slide.
 *
 * /public assets: hero1.mp4, cdbg.png, cd.png / 4.png, mb.png / 2.png, d.png / 1.png
 * NOTE: if the flavour-3 items file is literally named "items.2png", change PRODUCTS[2].items to match.
 * TUNING: POSITION / ITEMS_POSITION are measured against flavour 1; flavours 2 and 3 reuse them as a starting guess — give a
 * product its own literal `position` / `itemsPosition` (optional `mobile` override under 768px) once tuned.
 * Dependency: gsap. No <nav> here — the global navbar lives in the root layout.
 */

import { useEffect, useRef, useState } from 'react'
import { Playfair_Display, Outfit } from 'next/font/google'
import gsap from 'gsap'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

// Seconds before the video's real (dynamically-read) end that the dissolve into flavour 1 runs.
const SETTLE_WINDOW = 0.5
// How long each flavour holds once settled, and how long each flavour-to-flavour transition takes.
const HOLD_MS = 2000
const TRANSITION_S = 0.75
// Vertical slide distances (px): layers arrive from above and leave downward; the full-bleed bg only drifts slightly.
const BOTTLE_ENTER_Y = -90
const BOTTLE_EXIT_Y = 70
const ITEMS_ENTER_Y = -40
const ITEMS_EXIT_Y = 32
const BG_DRIFT_Y = 8

const LIME = '#BEF264'
const INK = '#14201A'
const CREAM = 'rgba(247,232,200,0.86)'
const RISE = { transform: 'translateY(18px)' }

// Product bottles stay centred; ingredient compositions use the wider overlay sizing.
const POSITION = { top: '0%', height: 'clamp(500px, 90vh, 1120px)', rotate: 0 }
const ITEMS_POSITION = { top: '-4%', height: 'clamp(680px, 104vh, 1080px)' }

const PRODUCTS = [
  { id: 'dates', background: '/cdbg.png', items: '/cd.png', bottle: '/4.png', alt: 'Plain Culture — Dates', position: POSITION, itemsPosition: ITEMS_POSITION },
  { id: 'millet', background: '/cdbg.png', items: '/mb.png', bottle: '/2.png', alt: 'Plain Culture — Millet', position: POSITION, itemsPosition: ITEMS_POSITION },
  { id: 'fruit', background: '/cdbg.png', items: '/d.png', bottle: '/1.png', alt: 'Plain Culture — Fruit', position: POSITION, itemsPosition: ITEMS_POSITION },
]

// Right-side carousel icons, top to bottom. Icon N is highlighted while PRODUCTS[N] is showing.
const CAROUSEL_ICONS = [
  { id: 'arrowroot', src: '/arrowroot0.png' },
  { id: 'carrot', src: '/carrot0.png' },
  { id: 'dates', src: '/dates0.png' },
  { id: 'guava', src: '/guava0.png' },
]

const place = (p) => ({ left: '50%', width: 'auto', top: p.top, height: p.height })
// DOM layers, each rendered twice (set A with the first flavour's asset, set B empty until its first transition).
const LAYERS = [
  { k: 'bg', cls: 'absolute inset-0 h-full w-full object-cover', style: { zIndex: 1 }, src: PRODUCTS[0].background, alt: '' },
  { k: 'items', cls: 'absolute', style: { zIndex: 2, ...place(PRODUCTS[0].itemsPosition) }, src: PRODUCTS[0].items, alt: '' },
  { k: 'bottle', cls: 'absolute', style: { zIndex: 3, ...place(PRODUCTS[0].position) }, src: PRODUCTS[0].bottle, alt: PRODUCTS[0].alt },
]

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Applies the optional `mobile` override (under 768px) to a position object.
const resolve = (pos) => ({ ...pos, ...(typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches && pos.mobile ? pos.mobile : null) })

// Highlights one carousel pill, dims the rest, and fills the active pill's progress line over `fillSeconds`.
function activateIcon(pills, bars, index, reduce, fillSeconds) {
  pills.forEach((pill, i) => {
    const active = i === index
    pill.setAttribute('aria-current', String(active))
    gsap.to(pill, {
      scale: active ? 1.14 : 1,
      opacity: active ? 1 : 0.9,
      borderColor: active ? 'rgba(190,242,100,1)' : 'rgba(247,232,200,0.4)',
      backgroundColor: active ? 'rgba(22,42,16,0.72)' : 'rgba(10,26,18,0.5)',
      boxShadow: active
        ? '0 0 34px rgba(190,242,100,0.5), inset 0 1px 0 rgba(255,255,255,0.4)'
        : '0 10px 26px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
      duration: reduce ? 0 : 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
    const bar = bars[i]
    gsap.killTweensOf(bar)
    if (!active) return void gsap.to(bar, { opacity: 0, duration: reduce ? 0 : 0.3 })
    gsap.set(bar, { scaleX: reduce ? 1 : 0, opacity: 1 })
    if (!reduce) gsap.to(bar, { scaleX: 1, duration: fillSeconds, ease: 'none' })
  })
}

export default function Hero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const copyRef = useRef(null)
  const carouselRef = useRef(null)
  const pillRefs = useRef([])
  const barRefs = useRef([])
  const layers = useRef({ bg: [], items: [], bottle: [] }) // index 0 = set A, 1 = set B
  const failedA = useRef({}) // set-A asset load failures, keyed by layer
  const assetStatus = useRef({}) // src → 'ok' | 'error', filled by the preloader
  const videoTransitioned = useRef(false)
  const frontIsA = useRef(true) // which layer set is front
  const productIndex = useRef(0) // which flavour the front set holds
  const parallaxPaused = useRef(false)
  const goTo = useRef(null) // set by the transition effect: jumps to a specific slide (carousel clicks)

  // The only React state — no per-frame or per-transition re-renders; everything else is refs + GSAP.
  const [uiReady, setUiReady] = useState(false)

  const setRef = (arr, i) => (el) => {
    arr[i] = el
  }

  /* ─── video → playback-synced dissolve → first static flavour (set A) ─── */
  useEffect(() => {
    const video = videoRef.current
    const { bg, items, bottle } = layers.current
    const failed = failedA.current
    const reduce = reducedMotion()

    // bg is full-bleed (opacity only); items and bottle are centred with xPercent and slide in vertically.
    gsap.set(items[0], { xPercent: -50, y: ITEMS_ENTER_Y, opacity: 0 })
    gsap.set(bottle[0], { xPercent: -50, rotation: PRODUCTS[0].position.rotate || 0, y: BOTTLE_ENTER_Y, opacity: 0 })
    gsap.set([items[1], bottle[1]], { xPercent: -50 })

    const finish = () => {
      if (videoTransitioned.current) return
      videoTransitioned.current = true
      if (video) {
        video.pause()
        video.style.opacity = '0'
      }
      if (!failed.bg) bg[0].style.opacity = '1'
      if (!failed.items) gsap.set(items[0], { opacity: 1, y: 0 })
      if (!failed.bottle) gsap.set(bottle[0], { opacity: 1, y: 0 })
      setUiReady(true)
    }

    if (reduce) return finish()
    if (!video) return

    let raf
    const tick = () => {
      if (videoTransitioned.current) return
      const duration = video.duration
      if (duration && !Number.isNaN(duration)) {
        const remaining = duration - video.currentTime
        if (remaining <= SETTLE_WINDOW) {
          const progress = gsap.utils.clamp(0, 1, 1 - remaining / SETTLE_WINDOW)
          if (!failed.bg) bg[0].style.opacity = String(progress)
          // Items and bottle slide down into place in step with the bg fade.
          if (!failed.items) gsap.set(items[0], { opacity: progress, y: ITEMS_ENTER_Y * (1 - progress) })
          if (!failed.bottle) gsap.set(bottle[0], { opacity: progress, y: BOTTLE_ENTER_Y * (1 - progress) })
        }
        if (remaining <= 0.03) return finish()
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

  /* ─── preload flavours 2 and 3 (flavour 1 already loads via set A) ─── */
  useEffect(() => {
    PRODUCTS.slice(1).forEach((p) =>
      [p.background, p.items, p.bottle].forEach((src) => {
        const img = new window.Image()
        img.onload = () => {
          assetStatus.current[src] = 'ok'
        }
        img.onerror = () => {
          assetStatus.current[src] = 'error'
        }
        img.src = src
      })
    )
  }, [])

  /* ─── copy reveal — once only, stays stable across flavour changes ─── */
  useEffect(() => {
    if (!uiReady) return
    const $ = gsap.utils.selector(copyRef)
    const [eyebrow, headline, desc, cta] = ['eyebrow', 'headline', 'desc', 'cta'].map((k) => $(`[data-${k}]`))

    if (reducedMotion()) {
      gsap.to([...eyebrow, ...headline, ...desc, ...cta], { opacity: 1, duration: 0.4 })
      return
    }

    gsap
      .timeline({ delay: 0.15, defaults: { opacity: 1, y: 0, ease: 'power3.out' } })
      .to(eyebrow, { duration: 0.5 })
      .to(headline, { duration: 0.65 }, '-=0.32')
      .to(desc, { duration: 0.55 }, '-=0.4')
      .to(cta, { duration: 0.5 }, '-=0.32')
  }, [uiReady])

  /* ─── carousel icons — fade in once after the video settles, first icon active ─── */
  useEffect(() => {
    if (!uiReady) return
    const reduce = reducedMotion()
    const wrap = carouselRef.current
    const pills = pillRefs.current
    const bars = barRefs.current

    if (reduce) gsap.set(wrap, { opacity: 1 })
    else gsap.fromTo(wrap, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.7, delay: 0.4, ease: 'power3.out' })
    activateIcon(pills, bars, 0, reduce, HOLD_MS / 1000) // first slide holds HOLD_MS before the first transition

    return () => {
      gsap.killTweensOf([wrap, ...pills, ...bars])
    }
  }, [uiReady])

  /* ─── flavour transition sequence, after the video-freeze settles ─── */
  useEffect(() => {
    if (!uiReady) return
    const reduce = reducedMotion()
    const { bg, items, bottle } = layers.current
    let cancelled = false
    let busy = false // a transition is running
    let pending = null // slide requested by a click while busy
    let holdTimer
    const bgFailed = (i) => assetStatus.current[PRODUCTS[i].background] === 'error'

    const load = (el, src) => {
      el.onerror = () => {
        assetStatus.current[src] = 'error'
      }
      el.src = src
    }
    // Loads and positions a back-set layer at its entry pose (or hides it if its asset failed).
    const prep = (el, src, ok, pos, from) => {
      if (!ok) return void gsap.set(el, { opacity: 0 })
      load(el, src)
      el.style.top = pos.top
      el.style.height = pos.height
      gsap.set(el, { ...from, opacity: 0 })
    }

    // Transitions to `forced` (a clicked slide), or to the next slide when called without an argument.
    const advance = (forced) => {
      if (cancelled) return
      let targetIndex = forced ?? (productIndex.current + 1) % PRODUCTS.length
      let checked = 0
      // Background is required; if it failed to load, skip that flavour entirely (automatic advance only).
      while (forced == null && checked < PRODUCTS.length && bgFailed(targetIndex)) {
        targetIndex = (targetIndex + 1) % PRODUCTS.length
        checked += 1
      }
      if (checked >= PRODUCTS.length) return // every background failed — keep the current scene

      const product = PRODUCTS[targetIndex]
      const itemsOk = assetStatus.current[product.items] !== 'error'
      const bottleOk = assetStatus.current[product.bottle] !== 'error'
      const [f, b] = frontIsA.current ? [0, 1] : [1, 0] // front / back set indices

      // Carousel: move the highlight to this slide's icon as the transition begins.
      activateIcon(pillRefs.current, barRefs.current, targetIndex % CAROUSEL_ICONS.length, reduce, TRANSITION_S + HOLD_MS / 1000)

      load(bg[b], product.background)
      prep(items[b], product.items, itemsOk, resolve(product.itemsPosition), { y: ITEMS_ENTER_Y })
      prep(bottle[b], product.bottle, bottleOk, resolve(product.position), { rotation: product.position.rotate || 0, y: BOTTLE_ENTER_Y })

      busy = true
      parallaxPaused.current = true
      const tl = gsap.timeline({
        onComplete: () => {
          productIndex.current = targetIndex
          frontIsA.current = !frontIsA.current
          parallaxPaused.current = false
          busy = false
          const next = pending
          pending = null
          if (next != null && next !== targetIndex && !bgFailed(next)) advance(next)
          else holdTimer = setTimeout(() => advance(), HOLD_MS)
        },
      })

      if (reduce) {
        const fade = (el, opacity) => tl.to(el, { opacity, duration: 0.4 }, 0)
        fade(bg[f], 0)
        fade(bg[b], 1)
        fade(items[f], 0)
        if (itemsOk) fade(items[b], 1)
        fade(bottle[f], 0)
        if (bottleOk) fade(bottle[b], 1)
      } else {
        const D = TRANSITION_S
        // Background: crossfade with a faint vertical drift.
        tl.to(bg[f], { opacity: 0, y: -BG_DRIFT_Y, duration: D, ease: 'power2.inOut' }, 0)
        tl.fromTo(bg[b], { opacity: 0, y: BG_DRIFT_Y }, { opacity: 1, y: 0, duration: D, ease: 'power2.inOut' }, 0)
        // Items: slide out just after the bottle starts leaving; the next items slide in ahead of their bottle.
        tl.to(items[f], { opacity: 0, y: ITEMS_EXIT_Y, duration: D * 0.5, ease: 'power2.in' }, D * 0.06)
        if (itemsOk) tl.fromTo(items[b], { opacity: 0, y: ITEMS_ENTER_Y }, { opacity: 1, y: 0, duration: D * 0.55, ease: 'power2.out' }, D * 0.12)
        // Bottle: the outgoing one continues downward and fades; the incoming one arrives from the top.
        tl.to(bottle[f], { opacity: 0, y: BOTTLE_EXIT_Y, duration: D * 0.55, ease: 'power2.in' }, 0)
        if (bottleOk) tl.fromTo(bottle[b], { opacity: 0, y: BOTTLE_ENTER_Y }, { opacity: 1, y: 0, duration: D * 0.6, ease: 'power2.out' }, D * 0.18)
      }
    }

    holdTimer = setTimeout(() => advance(), HOLD_MS)

    // Carousel click: jump to slide i, then autoplay carries on from there. A click mid-transition is queued.
    goTo.current = (i) => {
      if (i >= PRODUCTS.length || bgFailed(i)) return
      if (busy) {
        pending = i
        return
      }
      if (i === productIndex.current) return
      clearTimeout(holdTimer)
      advance(i)
    }

    return () => {
      cancelled = true
      clearTimeout(holdTimer)
      goTo.current = null
    }
  }, [uiReady])

  /* ─── subtle parallax on whichever layers are currently front (desktop mouse only) ─── */
  useEffect(() => {
    const section = sectionRef.current
    if (!uiReady || reducedMotion() || !section) return

    const { items, bottle } = layers.current
    const ac = new AbortController()
    const quick = (el) => ({
      mx: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
      my: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
    })
    const bottleQ = bottle.map(quick)
    const itemsQ = items.map(quick)

    section.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse' || parallaxPaused.current) return
        const r = section.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        // Bottle moves most (~±3px), items a little less (~±2px) — items trail the bottle's depth.
        const i = frontIsA.current ? 0 : 1
        bottleQ[i].mx(nx * 6)
        bottleQ[i].my(ny * 4)
        itemsQ[i].mx(nx * 4)
        itemsQ[i].my(ny * 2.5)
      },
      { signal: ac.signal }
    )
    section.addEventListener(
      'pointerleave',
      () =>
        [...bottleQ, ...itemsQ].forEach((q) => {
          q.mx(0)
          q.my(0)
        }),
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

      {/* z-index 1–3: background, items (ingredient halo) and bottle layers, sets A and B */}
      {LAYERS.flatMap(({ k, cls, style, src, alt }) =>
        [0, 1].map((i) => (
          <img
            key={k + i}
            ref={setRef(layers.current[k], i)}
            className={cls}
            style={{ ...style, opacity: 0 }}
            src={i === 0 ? src : undefined}
            alt={i === 0 ? alt : ''}
            onError={
              i === 0
                ? () => {
                    failedA.current[k] = true
                  }
                : undefined
            }
          />
        ))
      )}

      {/* z-index 4: readability overlay — subtle, left side only, hero stays bright */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 4, background: 'linear-gradient(100deg, rgba(0,20,13,0.45) 0%, rgba(0,20,13,0.12) 42%, transparent 62%)' }}
      />

      {/* z-index 9: carousel icons — right side, vertically centred, md+ only; follows the active slide, click an icon to jump to it */}
      <div
        ref={carouselRef}
        className="pointer-events-none absolute inset-y-0 hidden items-center md:flex"
        style={{ zIndex: 9, right: 'clamp(16px, 7vw, 120px)', opacity: 0 }}
      >
        <div className="flex flex-col items-center" style={{ gap: 'clamp(14px, 1.6vw, 22px)' }}>
          {CAROUSEL_ICONS.map((icon, i) => (
            <button
              key={icon.id}
              type="button"
              ref={setRef(pillRefs.current, i)}
              onClick={() => goTo.current?.(i)}
              disabled={i >= PRODUCTS.length}
              aria-label={`Show ${icon.id}`}
              className="pointer-events-auto relative grid cursor-pointer place-items-center overflow-hidden p-0 transition-[filter] duration-300 hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BEF264] disabled:cursor-default"
              style={{
                width: 'clamp(56px, 4.6vw, 76px)',
                aspectRatio: '1 / 1.45',
                borderRadius: 28,
                backgroundColor: 'rgba(10,26,18,0.5)',
                border: '1px solid rgba(247,232,200,0.4)',
                backdropFilter: 'blur(14px) saturate(140%)',
                WebkitBackdropFilter: 'blur(14px) saturate(140%)',
                boxShadow: '0 10px 26px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.22)',
                opacity: 0.9,
              }}
            >
              <img src={icon.src} alt="" className="h-[78%] w-[78%] object-contain" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} draggable={false} />
              <span
                ref={setRef(barRefs.current, i)}
                className="absolute"
                style={{ left: 14, right: 14, bottom: 8, height: 3, borderRadius: 3, background: LIME, boxShadow: '0 0 8px rgba(190,242,100,0.9)', transformOrigin: 'left center', transform: 'scaleX(0)', opacity: 0 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* z-index 10: hero content — stable across flavour changes */}
      <div ref={copyRef} className="relative flex h-full min-h-[100svh] max-w-[640px] flex-col justify-center px-6 lg:px-20" style={{ zIndex: 10 }}>
        <p data-eyebrow className="flex items-center gap-3 text-[15px] font-medium tracking-wide opacity-0 sm:text-[16px]" style={{ color: CREAM, ...RISE }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: LIME }} />
          Introducing Plain Culture
        </p>

        <h2
          data-headline
          className="mt-6 text-[clamp(3rem,7.5vw,5.75rem)] leading-[1.04] tracking-[-0.02em] opacity-0"
          style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600, color: '#F7E8C8', ...RISE }}
        >
          Just the Good Stuff.
        </h2>

        <p data-desc className="mt-6 max-w-[46ch] text-[17px] font-light leading-[1.75] opacity-0 sm:text-[19px]" style={{ color: CREAM, ...RISE }}>
          Real fruit, plainly done. No shortcuts, no additives — just the ingredient at its best, bottled.
        </p>

        <div data-cta className="mt-9 opacity-0" style={RISE}>
          <a
            href="#products"
            className="group relative inline-flex items-center gap-5 overflow-hidden rounded-full py-2 pl-8 pr-2 text-[17px] font-semibold transition-shadow duration-700 hover:shadow-2xl"
            style={{ background: LIME, color: INK }}
          >
            <span className="relative z-10">Explore the range</span>
            <span
              className="relative z-10 grid h-12 w-12 place-items-center rounded-full transition-transform duration-500 ease-out group-hover:-rotate-45"
              style={{ background: INK, color: LIME }}
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
