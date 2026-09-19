'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Playfair_Display, Outfit } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

const VIDEOS = [
  {
    id: 1,
    title: 'Post-Workout Fuel',
    tag: 'Carrot Shake',
    views: '12.4K',
    src: '/sample.mp4',
    color: '#FDBA74',
  },
  {
    id: 2,
    title: 'Daily Refreshment',
    tag: 'Guava Bliss',
    views: '18.9K',
    src: '/sample.mp4',
    color: '#BEF264',
  },
  {
    id: 3,
    title: 'Natural Sweetness',
    tag: 'Dates Shake',
    views: '24.1K',
    src: '/sample.mp4',
    color: '#D4A373',
  },
  {
    id: 4,
    title: 'Cool & Restorative',
    tag: 'Arrowroot Shake',
    views: '9.8K',
    src: '/sample.mp4',
    color: '#D9F99D',
  },
  {
    id: 5,
    title: 'Superfood Boost',
    tag: 'Ragi & Dates',
    views: '15.2K',
    src: '/sample.mp4',
    color: '#E6CCB2',
  },
]

/* ---------------------------------------------------------------------------
   Full video viewer (opens when a card is clicked)
   Rendered in a portal so it always sits above the navbar / any transformed
   ancestors. Closes on: X button, backdrop click, Esc.
--------------------------------------------------------------------------- */
function VideoModal({ item, onClose }) {
  const videoRef = useRef(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true))

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    // Lock page scroll while open (without a layout jump)
    const { overflow, paddingRight } = document.body.style
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    // Play with sound (the user just clicked); fall back to muted if the browser blocks it
    const video = videoRef.current
    if (video) {
      video.play().catch(() => {
        video.muted = true
        video.play().catch(() => {})
      })
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      className={`${playfair.variable} ${outfit.variable} fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-90 sm:right-6 sm:top-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Player + caption (clicks here should not close the viewer) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex flex-col gap-3 transition-transform duration-300 ${show ? 'scale-100' : 'scale-95'}`}
        style={{ width: 'min(92vw, calc(80vh * 9 / 16))' }}
      >
        <div className="relative w-full overflow-hidden rounded-3xl bg-black shadow-2xl" style={{ aspectRatio: '9 / 16' }}>
          <video
            ref={videoRef}
            src={item.src}
            controls
            loop
            playsInline
            className="h-full w-full bg-black object-contain"
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <span
            className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]"
            style={{ backgroundColor: item.color }}
          >
            {item.tag}
          </span>
          <h3 className="min-w-0 truncate text-base font-bold text-white">{item.title}</h3>
        </div>
      </div>
    </div>,
    document.body
  )
}

function VideoCard({ item, onOpen }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [liked, setLiked] = useState(false)

  // Click / Enter opens the full video viewer
  const openVideo = () => {
    if (videoRef.current) videoRef.current.pause()
    setIsPlaying(false)
    onOpen(item)
  }

  const toggleMute = (e) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open video: ${item.title}`}
      onClick={openVideo}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          openVideo()
        }
      }}
      // Hover preview is for mouse only (touch taps go straight to the viewer)
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return
        if (videoRef.current && !isPlaying) {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'mouse') return
        if (videoRef.current && isPlaying) {
          videoRef.current.pause()
          setIsPlaying(false)
        }
      }}
      className="group relative flex-shrink-0 snap-start w-[72vw] max-w-[280px] lg:w-auto lg:max-w-none lg:min-w-0 lg:flex-1 aspect-[9/16] rounded-3xl overflow-hidden cursor-pointer select-none bg-black/80 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={item.src}
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 opacity-80 group-hover:opacity-70 transition-opacity duration-300" />

      {/* Top Controls & Flavor Badge */}
      <div className="absolute top-4 left-4 right-4 lg:top-3 lg:left-3 lg:right-3 xl:top-4 xl:left-4 xl:right-4 z-10 flex items-center justify-between gap-2">
        <span
          className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] lg:px-2.5 lg:text-[10px] xl:px-3 xl:text-[11px] font-semibold text-[#1A1A1A] tracking-wider uppercase backdrop-blur-md"
          style={{ backgroundColor: item.color }}
        >
          {item.tag}
        </span>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={toggleMute}
          type="button"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform active:scale-90 hover:bg-black/60"
        >
          {isMuted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </button>
      </div>

      {/* Play Icon Indicator when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-white transition-transform group-hover:scale-110">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 inset-x-0 p-5 lg:p-4 xl:p-5 z-10 flex flex-col gap-2">
        <h3 className="text-white text-lg lg:text-base xl:text-lg font-bold leading-snug drop-shadow-md">
          {item.title}
        </h3>

        {/* Footer Metrics & Actions */}
        <div className="flex items-center justify-between text-white/90 text-xs font-medium pt-1">
          {/* Views count */}
          <span className="flex items-center gap-1.5 whitespace-nowrap bg-black/40 px-2.5 lg:px-2 xl:px-2.5 py-1 rounded-full backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {item.views} Views
          </span>

          {/* Social engagement icons */}
          <div className="flex shrink-0 items-center gap-3 lg:gap-2 xl:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLiked(!liked)
              }}
              type="button"
              className="transition-transform active:scale-125"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={liked ? '#B7E51B' : 'none'}
                stroke={liked ? '#B7E51B' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            <button
              onClick={(e) => e.stopPropagation()}
              type="button"
              className="transition-transform active:scale-110"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Videos() {
  const [activeVideo, setActiveVideo] = useState(null)
  const closeVideo = useCallback(() => setActiveVideo(null), [])

  return (
    <section
      className={`${playfair.variable} ${outfit.variable} w-full py-28 overflow-hidden`}
      style={{
        backgroundColor: '#004C33', // Deep Forest Green
        color: '#F7E8C8', // Cream
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
      }}
    >
      <div className="mx-auto max-w-[1600px] px-6 lg:px-8">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: '#B7E51B' }}>
            Real Stories & Real Sips
          </p>
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight uppercase"
            style={{ fontFamily: 'var(--font-display), serif', color: '#F7E8C8' }}
          >
            Watch Plain Culture Take Over
          </h2>
        </div>

        {/* Desktop (lg+): all 5 videos share the full row width.
            Below lg: swipeable horizontal carousel that bleeds to the screen edges. */}
        <div className="relative w-full">
          <div className="flex gap-4 xl:gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-6 lg:scroll-px-0 scroll-smooth pb-8 pt-4 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
            {VIDEOS.map((item) => (
              <VideoCard key={item.id} item={item} onOpen={setActiveVideo} />
            ))}
          </div>
        </div>
      </div>

      {activeVideo && <VideoModal key={activeVideo.id} item={activeVideo} onClose={closeVideo} />}
    </section>
  )
}