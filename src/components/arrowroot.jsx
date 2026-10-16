'use client'

import { useEffect, useRef, useState } from 'react'
import { Playfair_Display, Outfit, Caveat } from 'next/font/google'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap' })
const CREAM = '#F7E8C8'
const INK = '#004C33'
const BLUE = '#1E6FE0'
const DISPLAY = { fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600 }

/* ---------- badges (pills + hover card content) ---------- */
const BADGES = [
  {
    key: 'arrowroot',
    label: ['Arrowroot'],
    title: 'What is arrowroot?',
    text: 'Arrowroot is a traditional root ingredient widely used in food and beverages, known for its naturally refreshing taste.',
  },
  {
    key: 'sugar',
    label: ['No Added', 'Sugar'],
    title: 'No added sugar',
    text: 'PLAIN Arrowroot Juice is made with no added sugar, so the taste stays simple and true to the ingredient.',
  },
  {
    key: 'rtd',
    label: ['Ready', 'to Drink'],
    title: 'Ready to drink',
    text: 'A ready-to-drink dairy beverage. Just open, enjoy, and keep things PLAIN, wherever your day takes you.',
  },
  {
    key: 'clean',
    label: ['Clean', 'Label'],
    title: '100% clean label',
    text: 'A short, honest ingredient story. What you read on the label is what goes into the bottle.',
  },
]

/* ---------- handwritten callouts around the bottle (all values are % of the section) ---------- */
const ARROW_L = { d: 'M92 6 C 80 40, 50 60, 12 62', head: 'M28 50 L10 62 L30 72' } // curves down-left
const ARROW_R = { d: 'M8 4 C 12 45, 45 68, 88 62', head: 'M76 48 L90 62 L70 70' } // curves down-right
const NOTES = [
  { text: ['Naturally', 'Refreshing'], x: 50, y: 6, rot: -8, ax: 57.5, ay: 17.5, aw: 8, ...ARROW_R },
  { text: ['A Simple', 'Everyday Drink'], x: 80, y: 5, rot: -10, ax: 80.5, ay: 18.5, aw: 6, ...ARROW_L },
  { text: ['Made with', 'Arrowroot'], x: 87, y: 24, rot: -8, ax: 79.5, ay: 34, aw: 7, ...ARROW_L },
]

/* ---------- small inline icons ---------- */
const ICONS = {
  arrowroot: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7" />
    </>
  ),
  sugar: (
    <>
      <path d="M12 3l7.5 4.2v8.6L12 20 4.5 15.8V7.2z" />
      <path d="M12 11.4l7.5-4.2M12 11.4L4.5 7.2M12 11.4V20" />
    </>
  ),
  rtd: (
    <>
      <path d="M10 2.5h4V5l1.8 2.6V19a2.5 2.5 0 01-2.5 2.5h-2.6A2.5 2.5 0 018.2 19V7.6L10 5z" />
      <path d="M8.2 12h7.6" />
    </>
  ),
  clean: (
    <>
      <path d="M5 19C5 10 10 5 20 4c0 10-5 15-13 15" />
      <path d="M5 19c3-5 6-8 10-10" />
    </>
  ),
}

const Icon = ({ name, className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
)

const Leaf = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 21C6.5 21 3 17 3 10c6 0 9 4 9 11z" />
    <path d="M12.5 17C12.5 9 16 5 22 4c0 7-3.5 11.5-9.5 13z" />
  </svg>
)

export default function Arrowroot() {
  const sectionRef = useRef(null)
  const rowRef = useRef(null)
  const popRef = useRef(null)
  const btnRefs = useRef({})
  const closeTimer = useRef(null)
  const lastPanel = useRef(BADGES[0])

  const [active, setActive] = useState('arrowroot') // set to null to start with the card closed
  const [pos, setPos] = useState({ left: 0, caret: null })

  /* ---- hover card: open / close ---- */
  const openBadge = (key) => {
    clearTimeout(closeTimer.current)
    setActive(key)
  }
  const cancelClose = () => clearTimeout(closeTimer.current)
  const scheduleClose = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setActive(null), 250)
  }

  /* ---- keep the card + its little caret lined up under the active pill ---- */
  useEffect(() => {
    const measure = () => {
      const row = rowRef.current
      const btn = active && btnRefs.current[active]
      const pop = popRef.current
      if (!row || !btn || !pop) return
      const cx = btn.offsetLeft + btn.offsetWidth / 2
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      const maxLeft = Math.max(0, row.offsetWidth - pop.offsetWidth)
      const left = isDesktop ? Math.min(Math.max(cx - 150, 0), maxLeft) : 0
      setPos({ left, caret: cx - left - 8 })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  /* ---- tap / click outside closes the card (touch devices) ---- */
  useEffect(() => {
    const onDown = (e) => {
      if (rowRef.current && !rowRef.current.contains(e.target)) setActive(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      clearTimeout(closeTimer.current)
    }
  }, [])

  /* ---- scroll reveal ---- */
  useEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const reveal = (target, from, to) =>
      gsap.fromTo(section.querySelectorAll(target), from, {
        ...to,
        ease: 'power2.out',
        duration: 0.8,
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: section, start: 'top 75%', once: true },
      })

    reveal('[data-arrow-text]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.1 })
    reveal('[data-arrow-art]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1 })
    reveal('[data-arrow-notes]', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, delay: 0.5 })

    return () => gsap.killTweensOf(section.querySelectorAll('[data-arrow-text], [data-arrow-art], [data-arrow-notes]'))
  }, [])

  const current = BADGES.find((b) => b.key === active)
  if (current) lastPanel.current = current
  const panel = current || lastPanel.current

  return (
    <section
      ref={sectionRef}
      data-arrowroot-story
      aria-labelledby="arrowroot-story-title"
      className={`${playfair.variable} ${outfit.variable} ${caveat.variable} relative isolate flex w-full flex-col overflow-hidden lg:block lg:aspect-[1672/941]`}
      style={{ backgroundColor: CREAM, color: INK, fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      {/* ---------- left: copy + badges ---------- */}
      <div className="relative z-10 px-6 pt-10 sm:px-10 lg:absolute lg:left-[7%] lg:top-[12.5%] lg:w-[48%] lg:p-0">
        <p
          data-arrow-text
          className="text-[12px] font-medium uppercase tracking-[0.2em] sm:text-[13px] lg:text-[clamp(12px,1.05vw,18px)]"
          style={{ color: BLUE }}
        >
          Get to know
        </p>

        <h2
          id="arrowroot-story-title"
          data-arrow-text
          className="mt-2 text-[clamp(2.25rem,9vw,3.25rem)] leading-[1.06] tracking-tight lg:mt-[0.7vw] lg:text-[clamp(2rem,4.1vw,4.6rem)]"
          style={{ ...DISPLAY, fontWeight: 700 }}
        >
          Plain Arrowroot{' '}
          <span className="whitespace-nowrap">
            Juice
            <Leaf className="ml-[0.12em] inline-block h-[0.42em] w-[0.42em] -translate-y-[0.7em]" />
          </span>
        </h2>

        <p
          data-arrow-text
          className="mt-4 max-w-[26rem] text-[clamp(1.25rem,5vw,1.6rem)] font-medium leading-[1.22] lg:mt-[1vw] lg:max-w-[19em] lg:text-[clamp(1.2rem,2.2vw,2.6rem)]"
          style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
        >
          A traditional root ingredient, made for your everyday routine.
        </p>

        <p
          data-arrow-text
          className="mt-4 max-w-[34rem] text-[15px] font-normal leading-[1.65] sm:text-[16px] lg:mt-[1.2vw] lg:max-w-[38vw] lg:text-[clamp(13px,1.3vw,22px)] lg:leading-[1.6]"
        >
          Made with arrowroot, a refreshing and familiar ingredient, PLAIN Arrowroot Juice offers a simple, ready-to-drink
          option that fits effortlessly into your day.
        </p>

        {/* badges + hover card */}
        <div
          ref={rowRef}
          data-arrow-text
          className="relative mt-6 lg:mt-[1.8vw]"
          onPointerEnter={cancelClose}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') scheduleClose()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setActive(null)
          }}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-[46vw] lg:gap-[0.8vw]">
            {BADGES.map((b) => {
              const on = active === b.key
              return (
                <button
                  key={b.key}
                  ref={(el) => {
                    btnRefs.current[b.key] = el
                  }}
                  type="button"
                  aria-expanded={on}
                  aria-controls="arrowroot-badge-panel"
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') openBadge(b.key)
                  }}
                  onClick={() => openBadge(b.key)}
                  onFocus={() => openBadge(b.key)}
                  className={`flex items-center gap-2 rounded-full border px-2.5 py-2 text-left text-[13px] font-medium leading-[1.2] outline-none transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#1E6FE0] focus-visible:ring-offset-2 lg:gap-[0.6vw] lg:px-[0.7vw] lg:py-[0.55vw] lg:text-[clamp(11px,1.05vw,18px)] ${
                    on
                      ? 'border-transparent bg-gradient-to-b from-[#3C86F0] to-[#1E6FE0] text-white shadow-[0_12px_26px_-10px_rgba(30,111,224,0.75)]'
                      : 'border-[#BFD6F5] bg-white/75 text-[#004C33] hover:bg-white'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors duration-300 lg:h-[3.2vw] lg:w-[3.2vw] ${
                      on ? 'bg-white text-[#1E6FE0]' : 'bg-[#E3EEFC] text-[#004C33]'
                    }`}
                  >
                    <Icon name={b.key} className="h-[56%] w-[56%]" />
                  </span>
                  <span className="min-w-0">
                    {b.label.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-auto h-[1em] w-[1em] shrink-0 opacity-80"
                    aria-hidden="true"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              )
            })}
          </div>

          <div
            ref={popRef}
            id="arrowroot-badge-panel"
            role="region"
            aria-label={panel.title}
            aria-hidden={!active}
            className={`relative mt-4 w-full rounded-2xl bg-white p-5 shadow-[0_18px_50px_-18px_rgba(0,76,51,0.35)] transition-[opacity,transform,left] duration-300 lg:absolute lg:top-full lg:mt-[1.2vw] lg:w-[37vw] lg:left-[var(--pl,0px)] lg:p-[1.6vw] ${
              active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0 max-lg:hidden'
            }`}
            style={{ '--pl': `${pos.left}px` }}
          >
            {pos.caret !== null && (
              <span
                aria-hidden="true"
                className="absolute -top-2 h-4 w-4 rotate-45 rounded-sm bg-white transition-[left] duration-300"
                style={{ left: pos.caret }}
              />
            )}

            <button
              type="button"
              aria-label="Close"
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[#004C33] transition-colors hover:bg-black/5 lg:right-[0.9vw] lg:top-[0.9vw]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div className="flex items-center gap-4 lg:gap-[1.2vw]">
              <div className="min-w-0 flex-1 pr-4 lg:pr-[1.4vw]">
                <h3
                  className="text-[1.15rem] leading-tight lg:text-[clamp(1.05rem,1.55vw,1.9rem)]"
                  style={{ ...DISPLAY, fontWeight: 700 }}
                >
                  {panel.title}
                </h3>
                <p className="mt-2 text-sm leading-[1.55] text-[#2C4A40] lg:mt-[0.6vw] lg:text-[clamp(12px,1.05vw,17px)]">
                  {panel.text}
                </p>
              </div>

              {panel.key === 'arrowroot' ? (
                <div
                  role="img"
                  aria-label="Arrowroot roots with fresh leaves"
                  className="aspect-[1.714] w-[38%] shrink-0"
                  style={{
                    backgroundImage: 'url(/arrowbg.png)',
                    backgroundSize: '348.3% auto',
                    backgroundPosition: '52% 89.3%',
                    backgroundRepeat: 'no-repeat',
                    WebkitMaskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 55%, transparent 100%)',
                    maskImage: 'radial-gradient(ellipse 72% 72% at 50% 50%, #000 55%, transparent 100%)',
                  }}
                />
              ) : (
                <div className="grid aspect-square w-[26%] shrink-0 place-items-center rounded-full bg-[#E3EEFC] text-[#1E6FE0]">
                  <Icon name={panel.key} className="h-1/2 w-1/2" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- background image (bottle sits on the right) ---------- */}
      <div
        data-arrow-art
        className="relative z-0 mt-6 aspect-[4/3] w-full sm:aspect-[16/9] lg:absolute lg:inset-0 lg:mt-0 lg:aspect-auto"
      >
        <Image
          src="/arrowbg.png"
          alt="PLAIN Arrowroot Juice bottle with arrowroot roots and fresh leaves"
          fill
          sizes="100vw"
          loading="eager"
          className="object-cover object-right"
          draggable={false}
        />
        {/* soft fade into the section colour on mobile where the image sits under the copy */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#F7E8C8] to-transparent lg:hidden"
        />

        {/* handwritten callouts (desktop only) */}
        <div data-arrow-notes aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block" style={{ color: BLUE }}>
          {NOTES.map((n) => (
            <div key={n.text.join(' ')}>
              <p
                className="absolute whitespace-nowrap leading-[1.05]"
                style={{
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  transform: `rotate(${n.rot}deg)`,
                  fontFamily: 'var(--font-hand), cursive',
                  fontSize: 'clamp(1rem, 2.15vw, 2.5rem)',
                  fontWeight: 500,
                }}
              >
                {n.text.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <svg
                viewBox="0 0 100 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute h-auto"
                style={{ left: `${n.ax}%`, top: `${n.ay}%`, width: `${n.aw}%` }}
              >
                <path d={n.d} />
                <path d={n.head} />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}