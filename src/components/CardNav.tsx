import React, {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentClass,
  type ElementType,
} from "react";
import { gsap } from "gsap";
import { GoArrowUpRight } from "react-icons/go";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { scrollTo } from "./hero";
import { useClickOutside } from "../hooks/useOutside";
import { useNavigate } from "react-router";

const MOBILE_BREAKPOINT = 768;
const DEFAULT_COLLAPSED_HEIGHT = 60;
const DEFAULT_EXPANDED_HEIGHT = 260;
const MAX_ITEMS_DISPLAYED = 3;

interface NavLink {
  label: string;
  href: string;
  ariaLabel?: string;
}

interface NavItem {
  label: string;
  bgColor: string;
  textColor: string;
  links: NavLink[];
}

interface CardNavProps {
  logo: ComponentClass<any> | ElementType | string;
  logoAlt?: string;
  items: NavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

const getTargetHeight = (navElement: HTMLElement | null): number => {
  if (!navElement) return DEFAULT_EXPANDED_HEIGHT;

  const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  if (!isMobile) return DEFAULT_EXPANDED_HEIGHT;

  // Selection updated to match Tailwind-friendly data attributes or standard classes
  const content = navElement.querySelector<HTMLElement>("[data-nav-content]");
  if (!content) return DEFAULT_EXPANDED_HEIGHT;

  const originalStyles = {
    visibility: content.style.visibility,
    pointerEvents: content.style.pointerEvents,
    position: content.style.position,
    height: content.style.height,
  };

  Object.assign(content.style, {
    visibility: "visible",
    pointerEvents: "auto",
    position: "static",
    height: "auto",
  });

  const contentHeight = content.scrollHeight;
  const padding = 16;

  Object.assign(content.style, originalStyles);

  return DEFAULT_COLLAPSED_HEIGHT + contentHeight + padding;
};

const CardNav: React.FC<CardNavProps> = ({
  logo: LogoSource,
  logoAlt = "Logo",
  items = [],
  className = "",
  ease = "back.out(1.7)",
  baseColor = "#fff",
  menuColor = "#000",
  buttonBgColor = "#111",
  buttonTextColor = "#fff",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement | null>(null);

  useClickOutside(ref, () => {
    if (isExpanded) toggleMenu();
  });

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: DEFAULT_COLLAPSED_HEIGHT, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: () => getTargetHeight(navRef.current),
      duration: 0.4,
      ease,
    });

    tl.to(
      cardsRef.current,
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease,
        stagger: 0.08,
      },
      "-=0.1",
    );

    return tl;
  };

  useLayoutEffect(() => {
    timelineRef.current = createTimeline();
    return () => {
      timelineRef.current?.kill();
    };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!timelineRef.current) return;
      if (isExpanded) {
        gsap.set(navRef.current, { height: getTargetHeight(navRef.current) });
      }
      timelineRef.current.kill();
      timelineRef.current = createTimeline();
      if (isExpanded) timelineRef.current?.progress(1);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded]);

  function toggleMenu() {
    const tl = timelineRef.current;
    if (!tl) return;

    if (!isExpanded) {
      setIsExpanded(true);
      tl.play(0);
    } else {
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  }

  const renderLogo = () => {
    if (typeof LogoSource === "string") {
      return <img src={LogoSource} alt={logoAlt} className="h-7 w-auto" />;
    }
    const LogoComponent = LogoSource as ElementType;
    return <LogoComponent size={24} aria-label={logoAlt} />;
  };

  return (
    <div
      className={`absolute top-[1.2em] left-1/2 z-99 box-border w-[90%] max-w-200 -translate-x-1/2 border md:top-[2em] dark:border-none ${className}`}
      ref={ref}
    >
      <nav
        ref={navRef}
        className="relative block h-15 overflow-hidden rounded-xl border border-white/10 p-0 shadow-md will-change-[height]"
        style={{ backgroundColor: baseColor }}
      >
        {/* Top Bar */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 z-2 flex h-15 items-center justify-between px-4 md:pr-[0.45rem] md:pl-[1.1rem]",
          )}
        >
          {/* 1. Hamburger Menu (Left) */}
          <div
            className="group flex h-full cursor-pointer flex-col items-center justify-center gap-1.5"
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor }}
          >
            <div
              className={`h-[0.5px] w-7.5 origin-center bg-current transition-all duration-250 ease-out group-hover:opacity-75 ${isExpanded ? "translate-y-1 rotate-45" : ""}`}
            />
            <div
              className={`h-[0.5px] w-7.5 origin-center bg-current transition-all duration-250 ease-out group-hover:opacity-75 ${isExpanded ? "-translate-y-1 -rotate-45" : ""}`}
            />
          </div>

          {/* 2. Logo (Center via absolute positioning for perfect alignment) */}
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center">
            {renderLogo()}
            <span className="font-semibold">CampusHub</span>
          </div>

          {/* 3. CTA Button (Right) */}
          <div className="flex h-10 items-center rounded-[calc(0.75rem-0.35rem)] px-4 font-medium transition-colors duration-300 hover:brightness-125 md:flex">
            <Button
              type="button"
              className="mr-2 cursor-pointer"
              variant="outline"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4 rounded-full" />
              ) : (
                <Sun className="h-4 w-4 rounded-full" />
              )}
            </Button>
            <button
              type="button"
              className="cursor-pointer rounded p-2 text-sm md:text-base"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
              onClick={() => navigate("/register")}
            >
              <span className="md:hidden">Sign Up</span>
              <span className="hidden md:inline">Create Student Account</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          data-nav-content
          className={`absolute inset-x-0 top-15 bottom-0 z-1 flex flex-col items-stretch gap-2 p-2 md:flex-row md:items-end md:gap-3 ${isExpanded ? "pointer-events-auto visible" : "pointer-events-none invisible"}`}
        >
          {items.slice(0, MAX_ITEMS_DISPLAYED).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              ref={(el) => {
                if (el) cardsRef.current[idx] = el;
              }}
              className="flex min-h-15 min-w-0 flex-1 flex-col gap-2 rounded-[calc(0.75rem-0.2rem)] p-3 select-none md:h-full md:px-4 md:py-3"
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="text-[18px] font-normal tracking-tight md:text-[22px]">
                {item.label}
              </div>
              <div className="gap-[0.5 mt-auto flex flex-col">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="inline-flex items-center gap-1.5 text-[15px] no-underline transition-opacity duration-300 hover:opacity-75 md:text-[16px]"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                    onClick={(event) => {
                      event.preventDefault();

                      const { href } = lnk;

                      if (href.startsWith("#")) {
                        scrollTo(href.slice(1));
                      } else {
                        navigate(href);
                      }

                      toggleMenu();
                    }}
                  >
                    <GoArrowUpRight aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
