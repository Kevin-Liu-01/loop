"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LoopLogo } from "@/components/loop-logo";

type SiteHeaderProps = {
  sections: Array<{
    href: string;
    label: string;
  }>;
};

export function SiteHeader({ sections }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand-lockup" href="/">
          <LoopLogo className="brand-mark" />
          <span>
            <strong>Loop</strong>
            <small>operator desk</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {sections.map((section) => (
            <Link
              className={
                pathname === section.href || (section.href !== "/" && pathname.startsWith(section.href))
                  ? "site-nav__link site-nav__link--active"
                  : "site-nav__link"
              }
              href={section.href}
              key={section.href}
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <button
            className="palette-launcher"
            onClick={() => window.dispatchEvent(new Event("skillwire:open-palette"))}
            type="button"
          >
            <span>Search</span>
            <strong>Cmd+K</strong>
          </button>
        </div>
      </div>
    </header>
  );
}
