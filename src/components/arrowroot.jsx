'use client'

import { useEffect, useRef } from 'react'
import { Playfair_Display, Outfit } from 'next/font/google'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const CREAM = '#F7E8C8'
const INK = '#004C33'
const DISPLAY = { fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 600 }

export default function Arrowroot() {
  const sectionRef = useRef(null)

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

    reveal('[data-arrow-title]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0 })
    reveal('[data-arrow-closing]', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, delay: 0.2 })
    reveal('[data-arrow-art]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, delay: 0.18 })

    return () => gsap.killTweensOf(section.querySelectorAll('[data-arrow-title], [data-arrow-closing], [data-arrow-art]'))
  }, [])

  return (
    <section
      ref={sectionRef}
      data-arrowroot-story
      aria-labelledby="arrowroot-story-title"
      className={`${playfair.variable} ${outfit.variable} relative isolate w-full overflow-hidden pt-6`}
      style={{ backgroundColor: CREAM, color: INK, fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      <div className="lg:grid lg:grid-cols-1">
        <div className="relative z-10 lg:col-start-1 lg:row-start-1 lg:translate-y-[clamp(0.75rem,2vw,2rem)] lg:pb-[22%]">
          <div className="mx-auto w-full lg:max-w-[1536px] lg:px-8 xl:px-20">
            <div className="mx-auto w-full lg:max-w-[1100px]">
              <div className="mx-auto max-w-[900px] px-6 text-center sm:px-8 lg:px-0">
               
                <h2
                  id="arrowroot-story-title"
                  data-arrow-title
                  className="text-[clamp(2.5rem,6vw,5rem)] leading-[1.06] tracking-tight lg:text-[clamp(2.5rem,4.2vw,4.25rem)]"
                  style={DISPLAY}
                >
                  Goodness, Rooted in Nature.
                </h2>
                <p data-arrow-copy className="mx-auto mt-6 max-w-[720px] text-[clamp(16px,1.3vw,19px)] font-light leading-[1.75] sm:mt-7">
                  Discover a refreshing take on arrowroot, a traditional root ingredient reimagined for everyday enjoyment. PLAIN Arrowroot Juice brings together a simple concept, a distinctive ingredient, and a ready-to-drink format that fits effortlessly into your day.
                </p>
                <p data-arrow-copy className="mx-auto mt-4 max-w-[720px] text-[clamp(16px,1.3vw,19px)] font-light leading-[1.75]">
                  Inspired by nature and guided by simplicity, it reflects our belief that good choices don't need to be complicated. Just open, enjoy, and keep things PLAIN.
                </p>
              </div>
              <p
                data-arrow-closing
                className="relative z-10 mx-auto mt-2 px-6 text-center text-[clamp(18px,1.6vw,23px)] leading-relaxed sm:mt-3 lg:px-0"
                style={{ ...DISPLAY, fontWeight: 500 }}
              >
                From the root to your routine.<br /> Simply PLAIN.
              </p>
            </div>
          </div>
        </div>

        <div data-arrow-art className="relative z-0 mt-2 w-full sm:mt-4 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:self-end">
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
      </div>
    </section>
  )
}
