'use client'

/**
 * components/About.jsx — Plain Culture "Why Plain?" section
 *
 * Stacked, in order: title → text + button → banner image → the four label promises
 * → three flavour features (muskmelon & banana, ragi, carrot).
 * Motion: the banner and each flavour photo slowly settle (zoom-out) inside their frame
 * as they scroll in. Skipped for reduced motion.
 *
 * Flavour photos are shown uncropped (no circular mask), floating on a soft colour wash
 * with a drop-shadow that follows their own silhouette, and the copy overlaps into their
 * empty margin on large screens so image and text read as one close-set layered scene.
 *
 * Requirements: npm install gsap
 */

import { useEffect, useRef } from 'react'
import { Playfair_Display, Outfit } from 'next/font/google'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

const CREAM = '#F7E8C8'
const LIME = '#B7E51B'
const INK = '#004C33'
const EDGE = 'rgba(0,76,51,0.16)'

// same promises printed on every bottle label
const PROMISES = ['added sugar', 'preservatives', 'additives', 'artificial colour']

const DISPLAY = { fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600 }

// a soft, off-centre colour wash and a slight tilt per flavour, so the three
// blocks feel hand-placed rather than stamped from the same template
const FLAVOUR_FEATURES = [
  {
    key: 'muskmelon-banana',
    image: '/about3.png',
    alt: 'Plain muskmelon and banana milk shake surrounded by fresh fruit',
    halo: '#F5D9A8',
    tilt: -3,
    heading: 'Muskmelon & banana, made creamy',
    story: [
      'Ripe muskmelon brings a mellow, sunlit sweetness; banana adds a naturally creamy finish to every sip.',
      'Blended with cool milk for a smooth, satisfying shake, with the familiar goodness of fruit in every bottle.',
    ],
  },
  {
    key: 'ragi',
    image: '/about2.png',
    alt: 'Plain ragi milk shake bottle surrounded by ragi grain',
    halo: '#E3B968',
    tilt: 3,
    heading: 'Ragi, kept honest',
    story: [
      'Long before it was called a superfood, ragi was just breakfast, stone-ground and stirred into milk to start the day right.',
      'We kept that habit almost exactly as it was. A warm, nutty grain with a depth that needs nothing else added to taste complete.',
    ],
  },
  {
    key: 'carrot',
    image: '/about1.png',
    alt: 'Plain carrot milk shake bottle surrounded by fresh carrots',
    halo: '#F0AE64',
    tilt: -4,
    heading: 'Carrot, kept wholesome',
    story: [
      'Carrot milk shake sounds unusual until you taste it, earthy sweetness balanced by cold, creamy milk, the way it might have been made on a slow afternoon at home.',
      'We press it fresh and skip the syrups, letting the carrot\u2019s own sweetness do the work.',
    ],
  },
]

function FlavourLink() {
  return (
    <a
      href="#products"
      className="group inline-flex items-center gap-5 rounded-full py-2 pl-8 pr-2 text-[17px] font-semibold transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:text-[18px]"
      style={{ background: INK, color: CREAM, '--tw-ring-color': INK, '--tw-ring-offset-color': CREAM }}
    >
      Find your flavour
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:translate-x-1 sm:h-12 sm:w-12"
        style={{ background: LIME, color: INK }}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  )
}

// image + copy pairing used for each flavour feature below the label promises.
// The photo carries its own drop-shadow (so it reads as floating, not framed) and
// the copy overlaps into its empty margin on large screens for a close, layered feel.
// `reverse` mirrors the pair to the other side so the three blocks alternate.
function FlavourFeature({ feature, reverse }) {
  return (
    <div
      data-feature
      className={`relative mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 sm:gap-10 lg:flex-row lg:items-center lg:gap-10 xl:gap-12 ${
        reverse ? 'lg:flex-row-reverse' : ''
      }`}
    >
      {/* photo — uncropped, tilted, grounded with a shadow that follows its own shape */}
      <div className="relative w-full max-w-[420px] shrink-0 sm:max-w-[480px] lg:w-[48%] lg:max-w-none">
        <div
          aria-hidden
          className="absolute -inset-[12%] blur-[64px]"
          style={{ background: feature.halo, opacity: 0.42, borderRadius: '58% 42% 63% 37% / 52% 62% 38% 48%' }}
        />
        <div data-feature-frame className="relative aspect-square" style={{ transform: `rotate(${feature.tilt}deg)` }}>
          <Image
            data-feature-img
            src={feature.image}
            alt={feature.alt}
            fill
            sizes="(min-width: 1024px) 560px, 85vw"
            className="select-none object-contain will-change-transform"
            style={{ filter: 'drop-shadow(0 32px 34px rgba(0,76,51,0.28)) drop-shadow(0 10px 12px rgba(0,76,51,0.16))' }}
            draggable={false}
          />
        </div>
      </div>

      {/* copy — sits close beside the photo, with breathing room so nothing crosses over it */}
      <div className="relative z-10 w-full text-center lg:w-[46%] lg:text-left">
        <h3 className="text-[clamp(2.1rem,4.4vw,3.25rem)] leading-[1.05] tracking-tight" style={DISPLAY}>
          {feature.heading}
        </h3>
        {feature.story.map((line, i) => (
          <p
            key={i}
            className={`mx-auto max-w-[32rem] text-[clamp(16px,1.3vw,19px)] font-light leading-[1.7] lg:mx-0 ${i === 0 ? 'mt-5' : 'mt-4'}`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function About() {
  const root = useRef(null)

  useEffect(() => {
    const $ = gsap.utils.selector(root)
    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        $('[data-about-img]'),
        { scale: 1.15 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: $('[data-about-frame]')[0], start: 'top bottom', end: 'bottom 60%', scrub: true },
        }
      )

      // same zoom-settle treatment as the banner, but pushed further so the
      // shrink is clearly visible as each flavour photo scrolls into place
      $('[data-feature-frame]').forEach((frame) => {
        const img = frame.querySelector('[data-feature-img]')
        gsap.fromTo(
          img,
          { scale: 1.2 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom 60%', scrub: true },
          }
        )
      })

      const arrowStory = $('[data-arrowroot-story]')[0]
      if (arrowStory) {
        const reveal = (target, from, to) =>
          gsap.fromTo(target, from, {
            ...to,
            ease: 'power2.out',
            duration: 0.8,
            clearProps: 'transform,opacity,visibility',
            scrollTrigger: { trigger: arrowStory, start: 'top 75%', once: true },
          })

        reveal('[data-arrow-title]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0 })
        reveal('[data-arrow-copy]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, delay: 0.12 })
        reveal('[data-arrow-closing]', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, delay: 0.2 })
        reveal('[data-arrow-art]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, delay: 0.18 })
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <section
      ref={root}
      id="about"
      aria-labelledby="about-title"
      className={`${playfair.variable} ${outfit.variable} relative`}
      style={{
        backgroundColor: CREAM,
        color: INK,
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      <div className="mx-auto w-full max-w-[1536px] px-6 pb-16 pt-20 sm:px-8 lg:pb-24 lg:pt-28 xl:px-20">
        {/* title → text → button */}
        <div className="mx-auto max-w-[920px] text-center">
          <h2 id="about-title" className="text-[clamp(3.25rem,9vw,7.5rem)] leading-[1.02] tracking-tight" style={DISPLAY}>
            Why Plain
            <span
              aria-hidden
              className="ml-[0.12em] inline-flex h-[0.86em] w-[0.86em] items-center justify-center rounded-full align-[-0.04em] text-[0.62em] leading-none"
              style={{ background: LIME }}
            >
              ?
            </span>
            <span className="sr-only">?</span>
          </h2>

          <p className="mx-auto mt-6 max-w-[40rem] text-[clamp(17px,1.5vw,22px)] font-light leading-[1.6] sm:mt-8">
            Plain is milk shake with the extras left out. Real milk blended with arrowroot, carrot, dates, guava and ragi, and no added
            sugar, preservatives or artificial colour. Five flavours, each one simple to read on the label and easy to love.
          </p>

          <div className="mt-8 flex justify-center lg:mt-10">
            <FlavourLink />
          </div>
        </div>

        {/* image */}
        <div
          data-about-frame
          className="relative mt-12 aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] lg:mt-16 lg:aspect-[16/9] xl:rounded-[2rem]"
          style={{ border: `2px solid ${EDGE}` }}
        >
          <div data-about-img className="absolute inset-0 will-change-transform">
            <Image
              src="/banner1.png"
              alt="Plain Culture milk shake bottles"
              fill
              sizes="(min-width: 1536px) 1376px, 100vw"
              className="select-none object-cover object-center"
              draggable={false}
            />
          </div>
        </div>

        {/* label promises */}
        <ul
          className="relative z-10 mx-auto -mt-8 grid w-[calc(100%-2rem)] max-w-[1100px] grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border-2 shadow-[0_24px_60px_-24px_rgba(0,76,51,0.4)] sm:-mt-10 sm:w-[calc(100%-4rem)] lg:grid-cols-4 xl:rounded-[2rem]"
          style={{ background: EDGE, borderColor: EDGE }}
        >
          {PROMISES.map((word) => (
            <li key={word} className="flex items-baseline justify-center gap-3 px-4 py-6 lg:py-9" style={{ background: CREAM }}>
              <span className="text-[clamp(1.9rem,3.4vw,3.25rem)] leading-none tracking-tight" style={DISPLAY}>
                No
              </span>
              <span className="text-[clamp(14px,1.25vw,18px)] font-light leading-tight">{word}</span>
            </li>
          ))}
        </ul>

        {/* flavour features */}
        <div className="mt-28 flex flex-col gap-24 sm:gap-28 lg:mt-32 lg:gap-32">
          {FLAVOUR_FEATURES.map((feature, i) => (
            <FlavourFeature key={feature.key} feature={feature} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>

      <section
        data-arrowroot-story
        aria-labelledby="arrowroot-story-title"
        className="relative isolate w-full overflow-hidden pt-16 sm:pt-20 lg:pt-24"
        style={{ backgroundColor: CREAM, color: INK }}
      >
        <div className="relative z-10 mx-auto max-w-[900px] px-6 text-center sm:px-8">
          <p
            className="mb-5 text-[12px] font-semibold uppercase tracking-[0.22em] sm:text-[13px]"
            style={{ color: INK }}
          >
            PLAIN ARROWROOT JUICE
          </p>
          <h2
            id="arrowroot-story-title"
            data-arrow-title
            className="text-[clamp(2.5rem,6vw,5rem)] leading-[1.06] tracking-tight"
            style={DISPLAY}
          >
            Goodness, Rooted in Nature.
          </h2>
          <p
            data-arrow-copy
            className="mx-auto mt-6 max-w-[720px] text-[clamp(16px,1.3vw,19px)] font-light leading-[1.75] sm:mt-7"
          >
            Discover a refreshing take on arrowroot, a traditional root ingredient reimagined for everyday enjoyment. PLAIN Arrowroot Juice brings together a simple concept, a distinctive ingredient, and a ready-to-drink format that fits effortlessly into your day.
          </p>
          <p
            data-arrow-copy
            className="mx-auto mt-4 max-w-[720px] text-[clamp(16px,1.3vw,19px)] font-light leading-[1.75]"
          >
            Inspired by nature and guided by simplicity, it reflects our belief that good choices don't need to be complicated. Just open, enjoy, and keep things PLAIN.
          </p>
        </div>

        <div className="relative z-10 mx-auto mt-10 max-w-[1080px] px-6 sm:mt-12 sm:px-8">
          <h3 className="text-center text-[12px] font-semibold uppercase tracking-[0.22em] sm:text-[13px]">
            OUR APPROACH
          </h3>
          <ul className="mt-5 grid gap-x-10 sm:mt-7 sm:grid-cols-2 lg:gap-x-16">
            <li className="border-t border-[#004C33]/20 py-4 sm:py-5">
              <h4 className="text-[18px] font-semibold sm:text-[20px]">Rooted in Nature</h4>
              <p className="mt-1 text-[15px] font-light leading-relaxed sm:text-[16px]">Inspired by the humble arrowroot and its traditional use.</p>
            </li>
            <li className="border-t border-[#004C33]/20 py-4 sm:py-5">
              <h4 className="text-[18px] font-semibold sm:text-[20px]">Ready to Enjoy</h4>
              <p className="mt-1 text-[15px] font-light leading-relaxed sm:text-[16px]">A convenient, ready-to-drink beverage for everyday moments.</p>
            </li>
            <li className="border-t border-[#004C33]/20 py-4 sm:py-5">
              <h4 className="text-[18px] font-semibold sm:text-[20px]">No Added Sugar</h4>
              <p className="mt-1 text-[15px] font-light leading-relaxed sm:text-[16px]">Made without added sugar, as stated on the product label.</p>
            </li>
            <li className="border-t border-[#004C33]/20 py-4 sm:py-5">
              <h4 className="text-[18px] font-semibold sm:text-[20px]">100% Clean Label</h4>
              <p className="mt-1 text-[15px] font-light leading-relaxed sm:text-[16px]">A clear, straightforward product identity.</p>
            </li>
          </ul>
        </div>

        <p
          data-arrow-closing
          className="relative z-10 mx-auto mt-2 px-6 text-center text-[clamp(18px,1.6vw,23px)] leading-relaxed sm:mt-3"
          style={{ ...DISPLAY, fontWeight: 500 }}
        >
          From the root to your routine. Simply PLAIN.
        </p>

        <div data-arrow-art className="relative mt-2 w-full sm:mt-4 lg:mt-6">
          <Image
            src="/arrowfloor.png"
            alt="PLAIN Arrowroot Juice with arrowroot roots, fresh leaves, and a glass of juice"
            width={2171}
            height={724}
            sizes="100vw"
            loading="eager"
            className="hidden h-auto w-full object-contain md:block"
            draggable={false}
          />
          <Image
            src="/arrowrootfloormob.png"
            alt="PLAIN Arrowroot Juice with arrowroot roots, fresh leaves, and a glass of juice"
            width={941}
            height={1672}
            sizes="100vw"
            loading="eager"
            className="block h-auto w-full object-contain md:hidden"
            draggable={false}
          />
        </div>
      </section>
    </section>
  )
}
