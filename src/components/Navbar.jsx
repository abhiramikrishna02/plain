"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  useEffect(() => {
    const handleIntroComplete = () => setIsIntroComplete(true);
    window.addEventListener("intro-loader-complete", handleIntroComplete);
    return () => window.removeEventListener("intro-loader-complete", handleIntroComplete);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let previousScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0 || currentScrollY < previousScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > previousScrollY) {
        setIsVisible(false);
        setIsMenuOpen(false);
      }

      previousScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (event) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href?.startsWith("#")) return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();
    setIsMenuOpen(false);

    if (window.location.hash !== href) {
      window.history.pushState(null, "", href);
    }

    requestAnimationFrame(() => {
      const top = window.scrollY + target.getBoundingClientRect().top;
      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  return (
    <header
      aria-hidden={!isIntroComplete || !isVisible}
      className={`fixed inset-x-0 top-0 z-[100] w-full bg-transparent text-white transition-transform duration-300 ${isIntroComplete && isVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"}`}
    >
      <nav className="mx-auto flex h-20 w-full max-w-[1536px] items-center justify-between px-5 sm:px-8 lg:px-20" aria-label="Main navigation">
        <Link href="#home" onClick={handleNavigation} className="shrink-0" aria-label="Plain Culture home">
          <Image
            src="/navlogo.png"
            alt="Plain Culture"
            width={144}
            height={70}
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden items-center gap-5 text-sm font-medium sm:flex sm:gap-8 sm:text-base">
          <Link onClick={handleNavigation} className="[text-shadow:0_1px_4px_rgba(0,0,0,0.95)] transition-colors hover:text-[#B7E51B]" href="#home">
            Home
          </Link>
          <Link onClick={handleNavigation} className="[text-shadow:0_1px_4px_rgba(0,0,0,0.95)] transition-colors hover:text-[#B7E51B]" href="#products">
            Products
          </Link>
          <Link onClick={handleNavigation} className="[text-shadow:0_1px_4px_rgba(0,0,0,0.95)] transition-colors hover:text-[#B7E51B]" href="#about">
            About
          </Link>
          <Link onClick={handleNavigation} className="[text-shadow:0_1px_4px_rgba(0,0,0,0.95)] transition-colors hover:text-[#B7E51B]" href="#contact">
            Contact
          </Link>
          <Link
            className="rounded-full bg-[#B7E51B] px-4 py-2.5 font-semibold text-[#1A1A1A] transition-transform hover:scale-105 sm:px-5"
            href="#products"
            onClick={handleNavigation}
          >
            Shop
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 text-white [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.9))] sm:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <span className="relative flex h-4 w-5 flex-col justify-between" aria-hidden="true">
            <span className={`h-0.5 w-full bg-current transition-transform ${isMenuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`h-0.5 w-full bg-current transition-opacity ${isMenuOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-full bg-current transition-transform ${isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </span>
        </button>
      </nav>

      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-[#F7E8C8]/15 bg-[#004C33] px-5 py-5 text-[#F7E8C8] sm:hidden">
          <div className="mx-auto flex max-w-[1536px] flex-col gap-1 text-base font-medium">
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#home" onClick={handleNavigation}>
              Home
            </Link>
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#products" onClick={handleNavigation}>
              Products
            </Link>
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#about" onClick={handleNavigation}>
              About
            </Link>
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#contact" onClick={handleNavigation}>
              Contact
            </Link>
            <Link className="mt-2 w-fit rounded-full bg-[#B7E51B] px-5 py-2.5 font-semibold text-[#1A1A1A]" href="#products" onClick={handleNavigation}>
              Shop
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
