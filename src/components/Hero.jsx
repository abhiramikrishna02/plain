'use client'

/**
 * components/Hero.jsx — Plain Culture hero
 *
 * Behaviour: Hero.mp4 plays once. Over its last ~0.6s, Hero.png is dissolved
 * in on top of it in lockstep with the video's own currentTime (via
 * requestAnimationFrame, not a fixed timer) — so the blend tracks the actual
 * footage instead of reading as a video ending and a different file popping
 * in. Hero copy and the CTA only animate in once that static image is fully
 * settled.
 *
 * Assets required in /public: Hero.mp4, Hero.png
 * Dependency: gsap (already used by the previous Hero implementation)
 *
 * Note: this component intentionally renders no <nav> — the site's global
 * navbar (mounted in the root layout, above Hero) already covers that.
 */

import { useEffect, useRef, useState } from 'react'
import { Playfair_Display, Outfit } from 'next/font/google'
import gsap from 'gsap'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

// How long (seconds) before the video's real, dynamically-read end the
// dissolve into Hero.png runs. Never hardcode the clip's total duration.
const SETTLE_WINDOW = 0.6

export default function Hero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const imageRef = useRef(null)
  const copyRef = useRef(null)

  const transitioned = useRef(false)
  const imageFailed = useRef(false)

  // Only one React state drives this component — no per-frame re-renders.
  // The dissolve itself is done with direct style writes inside a rAF loop.
  const [uiReady, setUiReady] = useState(false)

  /* ─── video → playback-synced dissolve → static image ─── */
  useEffect(() => {
    const video = videoRef.current
    const image = imageRef.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const finish = () => {
      if (transitioned.current) return
      transitioned.current = true
      if (video) video.pause()
      if (image && !imageFailed.current) image.style.opacity = '1'
      setUiReady(true)
    }

    if (reduce) {
      // Skip the cinematic playback entirely for reduced-motion users.
      finish()
      return
    }

    if (!video) return

    let raf
    const tick = () => {
      if (transitioned.current) return
      const duration = video.duration
      if (duration && !Number.isNaN(duration)) {
        const remaining = duration - video.currentTime
        if (remaining <= SETTLE_WINDOW && image && !imageFailed.current) {
          image.style.opacity = String(gsap.utils.clamp(0, 1, 1 - remaining / SETTLE_WINDOW))
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
    video.addEventListener('error', finish) // Hero.mp4 fails to load → show Hero.png immediately

    // Attempt autoplay; if the browser blocks it, fall straight to the static hero.
    const playPromise = video.play()
    if (playPromise?.catch) playPromise.catch(finish)

    return () => {
      cancelAnimationFrame(raf)
      video.removeEventListener('ended', finish)
      video.removeEventListener('error', finish)
    }
  }, [])

  /* ─── copy reveal — only once the static hero is in place ─── */
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

  /* ─── optional, very subtle parallax after the freeze (desktop only) ─── */
  useEffect(() => {
    if (!uiReady) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const section = sectionRef.current
    const image = imageRef.current
    if (reduce || !section || !image) return

    const ac = new AbortController()
    const mx = gsap.quickTo(image, 'x', { duration: 0.9, ease: 'power3.out' })
    const my = gsap.quickTo(image, 'y', { duration: 0.9, ease: 'power3.out' })

    section.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return
        const r = section.getBoundingClientRect()
        mx(((e.clientX - r.left) / r.width - 0.5) * 4)
        my(((e.clientY - r.top) / r.height - 0.5) * 3)
      },
      { signal: ac.signal }
    )
    section.addEventListener(
      'pointerleave',
      () => {
        mx(0)
        my(0)
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

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/Hero.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Plain <img> so the download starts immediately, in parallel with the
          video, rather than waiting on next/image's own loading strategy —
          it needs to already be in memory before the dissolve starts. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0 }}
        src="/Hero.png"
        alt="Plain Culture — real fruit, nothing else"
        onError={() => {
          imageFailed.current = true
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(100deg, rgba(0,20,13,0.55) 0%, rgba(0,20,13,0.18) 45%, transparent 65%)' }}
      />

      <div ref={copyRef} className="relative z-10 flex h-full min-h-[100svh] max-w-[640px] flex-col justify-center px-6 lg:px-20">
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