'use client'

/**
 * components/Products.jsx — Plain Culture product catalog
 *
 * Desktop (lg+): pinned carousel. Scroll = control. The cards (bottle inside the box + title + one line)
 *                slide sideways until the last one, then "See all" closes the row.
 *                Hover a card → splash image blooms behind the bottle.
 * Mobile (<lg) : pinned screen. Scroll = control. The bottle for the active product sits solid and
 *                static inside its box the whole time — no fall, no fade, no scale, no motion at all.
 *                Scrolling past a slide's boundary swaps straight to the next bottle in one instant
 *                cut, background stays fixed. Touch & hold the bottle → splash image blooms behind it,
 *                release to close. Last slide (after the last bottle) = "See all".
 *
 * Requirements: npm install gsap   (ScrollTrigger ships inside gsap)
 */

import { useEffect, useRef, useState } from 'react'
import { Playfair_Display, Outfit } from 'next/font/google'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

const CREAM = '#F7E8C8'
const LIME = '#B7E51B'
const INK = '#004C33' // hero's deep forest green, used for text / button
const EDGE = 'rgba(0,76,51,0.16)'

// splash = image that shows behind the bottle on hover (desktop) / touch-hold (mobile)
const PRODUCTS = [
  { src: '/arrowroot.png', name: 'Arrowroot', text: 'Cool, smooth and gentle.', splash: '/arrowrootbg.png' },
  { src: '/carrot.png', name: 'Carrot', text: 'Sweet, creamy and bright.', splash: '/carrotbg.png' },
  { src: '/dates.png', name: 'Dates', text: 'Naturally sweet, no added sugar.', splash: '/datesbg.png' },
  { src: '/guava.png', name: 'Guava', text: 'Tangy, tropical and fresh.', splash: '/guavabg.png' },
  { src: '/ragi&dates.png', name: 'Ragi & Dates', text: 'Iron-rich ragi with sweet dates.', splash: '/ragibg.png' },
]

const STEP_VH = 0.55 // mobile: scroll distance per slide (× viewport height) — raise for slower, lower for faster
const HOLD = 0.6 // mobile: extra scroll the final "See all" slide stays pinned
const D_PACE = 1.0 // desktop: scroll distance per pixel of sideways travel — raise for slower, lower for faster
const CARD_W = 'min(26vw, 34vh)' // desktop card width — tied to height so the pinned screen never overflows
const DISPLAY = { fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600 }
const pad = (n) => String(n).padStart(2, '0')

/* Not clickable yet — swap for <Link href="/products"> when the page exists */
function SeeAllButton() {
  return (
    <button
      type="button"
      className="group inline-flex items-center gap-5 rounded-full py-2 pl-8 pr-2 text-[18px] font-semibold transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ background: INK, color: CREAM, '--tw-ring-color': INK, '--tw-ring-offset-color': CREAM }}
    >
      See all
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:translate-x-1"
        style={{ background: LIME, color: INK }}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}

export default function Products() {
  const root = useRef(null)
  const [mActive, setMActive] = useState(0)
  const [holding, setHolding] = useState(false) // mobile: finger is holding on the bottle
  const holdTimer = useRef(null)

  const startHold = () => {
    clearTimeout(holdTimer.current)
    holdTimer.current = setTimeout(() => setHolding(true), 180)
  }
  const endHold = () => {
    clearTimeout(holdTimer.current)
    setHolding(false)
  }

  useEffect(() => {
    const $ = gsap.utils.selector(root)
    const N = PRODUCTS.length
    const mm = gsap.matchMedia()

    // NOTE: gsap only runs this callback if at least ONE condition matches, so mobile needs its own query.
    mm.add(
      {
        desktop: '(min-width: 1024px)',
        mobile: '(max-width: 1023px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { desktop, reduce } = context.conditions

        /* ───────────── DESKTOP: pinned, scroll-scrubbed sideways carousel ───────────── */
        if (desktop) {
          if (reduce) return // reduced motion: the row is natively scrollable instead (see JSX)

          const dPin = $('[data-d-pin]')[0]
          const dInner = $('[data-d-inner]')[0]
          const dTrack = $('[data-d-track]')[0]
          const dBar = $('[data-d-bar]')[0]
          const bottles = $('[data-d-bottle]')

          // how far the track must travel so "See all" lands on the content's right edge
          const measure = () => {
            const cs = getComputedStyle(dInner)
            const visible = dInner.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
            return Math.max(0, dTrack.offsetWidth - visible)
          }

          // bottles drop into their cards as the section arrives
          gsap.set(bottles, { yPercent: -30, rotate: -8, autoAlpha: 0 })
          gsap.to(bottles, {
            yPercent: 0,
            rotate: 0,
            autoAlpha: 1,
            duration: 1.1,
            ease: 'back.out(0.8)',
            stagger: 0.12,
            clearProps: 'transform,opacity,visibility',
            scrollTrigger: { trigger: dPin, start: 'top 75%', once: true },
          })

          gsap.set(dBar, { scaleX: 0 })

          // the section stays pinned until the row has travelled all the way to "See all".
          // dTrack/dBar are driven by gsap's native `scrub` on a real timeline — a tight scrub value
          // (0.3) keeps the row locked to your actual scroll position instead of trailing behind it.
          gsap
            .timeline({
              scrollTrigger: {
                trigger: dPin,
                start: 'top top',
                end: () => `+=${Math.round(measure() * D_PACE)}`,
                pin: true,
                pinSpacing: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                scrub: 0.3,
              },
            })
            .fromTo(dTrack, { x: 0 }, { x: () => -measure(), ease: 'none' }, 0)
            .fromTo(dBar, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0)

          return
        }

        /* ───────────── MOBILE: pinned carousel, instant slide swaps ───────────── */
        const pin = $('[data-m-pin]')[0]
        const layers = $('[data-m-layer]')
        const texts = $('[data-m-text]')
        const cta = $('[data-m-cta]')[0]
        const hud = $('[data-m-hud]')[0]
        const disc = $('[data-m-disc]')[0]
        const TOTAL = N + HOLD
        const ty = reduce ? 0 : 24

        const tl = gsap.timeline({ paused: true })

        // Each slide occupies exactly 1 unit of timeline (label i → i+1). Bottle i stays fully visible,
        // untouched, for that entire unit — no tween runs on it at any point. Right at the next label
        // (the slide boundary) it's swapped for the next bottle with gsap.set(), which is a single,
        // non-interpolated property change: one rendered frame shows product i, the very next shows
        // product i+1. There is no in-between state to ever get caught paused on.
        for (let i = 0; i < N; i++) {
          tl.addLabel(`p${i}`, i)
          if (i < N - 1) {
            tl.set(layers[i], { autoAlpha: 0 }, i + 1)
            tl.set(texts[i], { autoAlpha: 0 }, i + 1)
            tl.set(layers[i + 1], { autoAlpha: 1 }, i + 1)
            tl.set(texts[i + 1], { autoAlpha: 1 }, i + 1)
          }
        }

        // last slide: "See all" (this reveal keeps its own short animation — it's a distinct UI panel,
        // not a bottle transition)
        tl.addLabel(`p${N}`, N)
        tl.set(layers[N - 1], { autoAlpha: 0 }, N)
        tl.set(texts[N - 1], { autoAlpha: 0 }, N)
        tl.fromTo(hud, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'none', immediateRender: false }, N - 0.3)
        tl.fromTo(cta, { autoAlpha: 0, y: -ty }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, N - 0.2)
        if (!reduce) tl.fromTo(disc, { scale: 1 }, { scale: 1.1, duration: 0.6, ease: 'power2.out', immediateRender: false }, N - 0.2)
        tl.to({}, { duration: HOLD }, N)

        ScrollTrigger.create({
          animation: tl,
          trigger: pin,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * STEP_VH * TOTAL)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.3,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: { snapTo: 'labels', duration: { min: 0.12, max: 0.35 }, delay: 0.05, ease: 'power2.inOut' },
          onUpdate: (self) => {
            const idx = Math.min(N - 1, Math.round(self.progress * TOTAL))
            setMActive((prev) => (prev === idx ? prev : idx))
          },
        })
      }
    )

    document.fonts?.ready?.then(() => ScrollTrigger.refresh())

    return () => {
      mm.revert()
      clearTimeout(holdTimer.current)
    }
  }, [])

  return (
    <section
      ref={root}
      id="products"
      aria-label="Plain Culture products"
      className={`${playfair.variable} ${outfit.variable} relative`}
      style={{
        backgroundColor: CREAM,
        color: INK,
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      {/* ═════════════ MOBILE — pinned screen ═════════════ */}
      <div className="lg:hidden">
        <h2 className="sr-only">Our range</h2>

        <div data-m-pin className="relative h-[100svh] w-full overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-[480px] flex-col px-6 pb-8 pt-8">
            {/* progress */}
            <div data-m-hud className="relative z-20">
              <div className="flex items-center justify-between text-[15px] font-semibold">
                <span>Our range</span>
                <span className="tabular-nums">
                  {pad(mActive + 1)} / {pad(PRODUCTS.length)}
                </span>
              </div>
              <div className="mt-3 flex gap-1.5" aria-hidden>
                {PRODUCTS.map((p, i) => (
                  <span
                    key={`${p.name}-${i}`}
                    className="h-[3px] flex-1 rounded-full transition-colors duration-300"
                    style={{ background: i <= mActive ? INK : EDGE }}
                  />
                ))}
              </div>
            </div>

            {/* stage: fixed disc + bottle box (bottle is static inside this box, swaps instantly) */}
            <div
              className="relative mt-3 min-h-0 flex-1 select-none overflow-hidden"
              style={{ WebkitTouchCallout: 'none' }}
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerCancel={endHold}
              onPointerLeave={endHold}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div aria-hidden className="absolute inset-0 flex items-center justify-center">
                <div data-m-disc className="aspect-square w-[min(88%,46svh)] rounded-full" style={{ background: LIME }} />
              </div>

              {PRODUCTS.map((p, i) => (
                <div
                  key={`${p.name}-${i}`}
                  data-m-layer
                  aria-hidden={i !== mActive}
                  className={`absolute inset-0 ${i === 0 ? '' : 'invisible opacity-0'}`}
                >
                  {/* splash — blooms behind the bottle while held */}
                  <Image
                    src={p.splash}
                    alt=""
                    aria-hidden
                    fill
                    sizes="(min-width: 1024px) 0px, 90vw"
                    className={`pointer-events-none z-0 select-none object-contain transition-all duration-500 ease-out motion-reduce:transition-none ${
                      holding && i === mActive ? 'scale-[1.35] rotate-0 opacity-100' : '-rotate-6 scale-75 opacity-0'
                    }`}
                    draggable={false}
                  />
                  <div className="absolute inset-x-[4%] inset-y-[3%] z-10">
                    <Image
                      src={p.src}
                      alt={`Plain Culture ${p.name} bottle`}
                      fill
                      sizes="(min-width: 1024px) 0px, 90vw"
                      className="pointer-events-none select-none object-contain drop-shadow-2xl"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}

              {/* last slide */}
              <div
                data-m-cta
                className="invisible absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center opacity-0"
              >
                <h3 className="text-[clamp(2.4rem,11vw,3.2rem)] leading-[1.05] tracking-tight" style={DISPLAY}>
                  Full range
                </h3>
                <div className="mt-6">
                  <SeeAllButton />
                </div>
              </div>
            </div>

            {/* name + one line */}
            <div className="relative mt-2 h-[16svh] min-h-[110px]">
              {PRODUCTS.map((p, i) => (
                <div
                  key={`${p.name}-${i}`}
                  data-m-text
                  aria-hidden={i !== mActive}
                  className={`absolute inset-0 flex flex-col items-center justify-center text-center ${i === 0 ? '' : 'invisible opacity-0'}`}
                >
                  <h3 className="text-[clamp(2.6rem,12vw,3.4rem)] leading-[1.02] tracking-tight" style={DISPLAY}>
                    {p.name}
                  </h3>
                  <p className="mt-2 text-[16px] font-light opacity-80">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════ DESKTOP — pinned carousel ═════════════ */}
      <div className="hidden lg:block">
        <div data-d-pin className="relative flex h-screen min-h-[640px] w-full flex-col justify-center overflow-hidden py-10">
          {/* title */}
          <div className="mx-auto flex w-full max-w-[1536px] items-end justify-between gap-12 px-8 xl:px-20">
            <h2 className="text-[clamp(2.75rem,5.2vw,4.75rem)] leading-[1.04] tracking-tight" style={DISPLAY}>
              Simple milk shakes,
              <br />
              <span
                aria-hidden
                className="relative mr-[0.22em] inline-block h-[0.72em] w-[1.5em] rounded-full align-[-0.02em]"
                style={{ background: LIME }}
              >
                <Image
                  src={PRODUCTS[1].src}
                  alt=""
                  fill
                  sizes="160px"
                  loading="eager"
                  className="pointer-events-none -rotate-12 scale-[1.6] select-none object-contain drop-shadow-lg"
                  draggable={false}
                />
              </span>
              nothing extra.
            </h2>
            <p className="max-w-[22rem] pb-2 text-[clamp(15px,1.15vw,18px)] font-light leading-[1.6] opacity-80">
              {PRODUCTS.length} flavours made with real ingredients. No added sugar, no preservatives.
            </p>
          </div>

          {/* carousel — viewport clips, track slides */}
          <div className="mt-10 w-full overflow-hidden motion-reduce:overflow-x-auto">
            <div data-d-inner className="mx-auto w-full max-w-[1536px] px-8 xl:px-20">
              <div data-d-track className="flex w-max items-stretch gap-4 will-change-transform xl:gap-6">
                {PRODUCTS.map((p, i) => {
                  const onLime = i % 2 === 0 // alternating lime / cream
                  return (
                    <article
                      key={`${p.name}-${i}`}
                      className="group relative shrink-0 overflow-hidden rounded-[1.75rem] p-4 pb-6 xl:rounded-[2rem] xl:p-6 xl:pb-7"
                      style={{ width: CARD_W, minWidth: 280, background: onLime ? LIME : CREAM, border: `2px solid ${onLime ? LIME : EDGE}` }}
                    >
                      {/* bottle sits fully inside the box */}
                      <div data-d-bottle className="relative aspect-[4/5] w-full">
                        {/* splash — blooms behind the bottle on card hover */}
                        <Image
                          src={p.splash}
                          alt=""
                          aria-hidden
                          fill
                          sizes="(min-width: 1280px) 26vw, 30vw"
                          className="pointer-events-none -rotate-6 scale-75 select-none object-contain opacity-0 transition-all duration-700 ease-out group-hover:rotate-0 group-hover:scale-[1.3] group-hover:opacity-100 motion-reduce:transition-none"
                          draggable={false}
                        />
                        <Image
                          src={p.src}
                          alt={`Plain Culture ${p.name} bottle`}
                          fill
                          sizes="(min-width: 1280px) 20vw, 24vw"
                          className="select-none object-contain p-2 drop-shadow-2xl transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:-rotate-3"
                          draggable={false}
                        />
                      </div>

                      <h3 className="relative z-10 mt-5 text-center text-[clamp(1.5rem,2.2vw,2.25rem)] leading-[1.05] tracking-tight" style={DISPLAY}>
                        {p.name}
                      </h3>
                      <p className="relative z-10 mt-2 text-center text-[clamp(14px,1.1vw,17px)] font-light leading-[1.5] opacity-80">{p.text}</p>
                    </article>
                  )
                })}

                {/* end of the row */}
                <div className="flex shrink-0 flex-col items-center justify-center text-center" style={{ width: CARD_W, minWidth: 280 }}>
                  <h3 className="text-[clamp(2rem,3vw,3rem)] leading-[1.05] tracking-tight" style={DISPLAY}>
                    Full range
                  </h3>
                  <div className="mt-6">
                    <SeeAllButton />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* progress */}
          <div className="mx-auto mt-8 w-full max-w-[1536px] px-8 motion-reduce:hidden xl:px-20" aria-hidden>
            <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ background: EDGE }}>
              <div data-d-bar className="h-full origin-left rounded-full" style={{ background: INK }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}