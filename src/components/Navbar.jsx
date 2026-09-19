"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide if scrolling down and past the initial 80px (navbar height)
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      }
      // Show if scrolling up
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-transparent text-[#F7E8C8] transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <nav className="mx-auto flex h-20 w-full max-w-[1536px] items-center justify-between px-5 sm:px-8 lg:px-20" aria-label="Main navigation">
        <Link href="#home" className="shrink-0" aria-label="Plain Culture home">
          <Image
            src="/logo.png"
            alt="Plain Culture"
            width={144}
            height={70}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden items-center gap-5 text-sm font-medium sm:flex sm:gap-8 sm:text-base">
          <Link className="transition-colors hover:text-[#B7E51B]" href="#home">
            Home
          </Link>
          <Link className="transition-colors hover:text-[#B7E51B]" href="#products">
            Products
          </Link>
          <Link className="transition-colors hover:text-[#B7E51B]" href="#about">
            About
          </Link>
          <Link className="transition-colors hover:text-[#B7E51B]" href="#contact">
            Contact
          </Link>
          <Link
            className="rounded-full bg-[#B7E51B] px-4 py-2.5 font-semibold text-[#1A1A1A] transition-transform hover:scale-105 sm:px-5"
            href="#products"
          >
            Shop
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F7E8C8]/40 text-[#F7E8C8] sm:hidden"
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
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#home" onClick={closeMenu}>
              Home
            </Link>
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#products" onClick={closeMenu}>
              Products
            </Link>
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#about" onClick={closeMenu}>
              About
            </Link>
            <Link className="py-3 transition-colors hover:text-[#B7E51B]" href="#contact" onClick={closeMenu}>
              Contact
            </Link>
            <Link className="mt-2 w-fit rounded-full bg-[#B7E51B] px-5 py-2.5 font-semibold text-[#1A1A1A]" href="#products" onClick={closeMenu}>
              Shop
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}