import React from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import AnimatedGridPattern from "./ui/animated-grid-pattern";

const GRID_CONFIG = {
  DURATION: 3,
  MAX_OPACITY: 0.1,
  NUM_SQUARES: 30,
} as const;

const SCROLL_BEHAVIOR: ScrollIntoViewOptions = {
  behavior: "smooth",
};

export const scrollTo = (elementId?: string): void => {
  if (!elementId || elementId === "#") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  document.getElementById(elementId)?.scrollIntoView(SCROLL_BEHAVIOR);
};

export default function Hero() {
  const navigate = useNavigate();

  const handleLearnMore = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    scrollTo("features");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-6">
      <AnimatedGridPattern
        className={cn(
          "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 h-full skew-y-12",
        )}
        duration={GRID_CONFIG.DURATION}
        maxOpacity={GRID_CONFIG.MAX_OPACITY}
        numSquares={GRID_CONFIG.NUM_SQUARES}
      />

      <div className="relative z-10 max-w-5xl text-center">
        <header>
          <h1 className="mt-4 p-2 font-sans text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl md:leading-[1.2] lg:text-7xl">
            Empowering Student Leadership through Seamless Digital Management
          </h1>
          <p className="text-foreground/80 mt-4 text-base md:mt-6 md:text-lg">
            The all-in-one platform for campus organizations to manage members, coordinate events,
            and automate report approvals with transparency and ease.
          </p>
        </header>

        <footer className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4">
          <Button
            className="w-full cursor-pointer rounded-full text-base sm:w-auto"
            size="lg"
            onClick={() => navigate("/register")}
          >
            <span className="flex items-center gap-2">
              Get Started
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Button>
          <Button
            className="w-full rounded-full text-base shadow-none sm:w-auto"
            size="lg"
            variant="outline"
            asChild
          >
            <a href="#features" onClick={handleLearnMore}>
              Learn More
            </a>
          </Button>
        </footer>
      </div>
    </div>
  );
}
