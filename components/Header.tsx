"use client";

import Link from "next/link";
import { useState } from "react";

// Responsive Header component using Tailwind CSS
// Usage:
// 1) Ensure Tailwind CSS is set up in your Next.js project.
// 2) Save this file as components/Header.tsx and import it where needed.
// 3) The component is accessible: the hamburger button has aria attributes,
//    and the mobile menu closes when you click a link.

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Tomorsukh's Portfolio
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link href="/" className="text-sm font-medium hover:underline">
              Нүүр хуудас
            </Link>
            <Link href="/projects" className="text-sm font-medium hover:underline">
              Төслүүд
            </Link>
            <Link href="/about" className="text-sm font-medium hover:underline">
              Миний тухай
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:underline">
              Холбоо барих
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              type="button"
              aria-controls="mobile-menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <span className="sr-only">Нээгдсэн/Хаагдсан цэс</span>
              {/* Icon: hamburger / close */}
              {open ? (
                // Close (X)
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          id="mobile-menu"
          className={`md:hidden ${open ? "block" : "hidden"} mt-2`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setOpen(false)}
            >
              Нүүр хуудас
            </Link>
            <Link
              href="/projects"
              className="block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setOpen(false)}
            >
              Төслүүд
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setOpen(false)}
            >
              Миний тухай
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setOpen(false)}
            >
              Холбоо барих
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
