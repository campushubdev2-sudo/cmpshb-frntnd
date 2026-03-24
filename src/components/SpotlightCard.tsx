import { useRef, type MouseEvent, type ReactNode, type FC } from "react";
import "./SpotlightCard.css";

const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

const DEFAULT_SPOTLIGHT = "rgba(255, 255, 255, 0.25)";

type Theme = (typeof THEMES)[keyof typeof THEMES];

type SpotlightCardProps = {
  children: ReactNode;
  theme?: Theme | boolean;
  className?: string;
  spotlightColor?: string;
};

const SpotlightCard: FC<SpotlightCardProps> = ({
  children,
  theme = THEMES.SYSTEM,
  className = "",
  spotlightColor = DEFAULT_SPOTLIGHT,
}) => {
  const divRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const container = divRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    container.style.setProperty("--mouse-x", `${x}px`);
    container.style.setProperty("--mouse-y", `${y}px`);
    container.style.setProperty("--spotlight-color", spotlightColor);
  };

  const themeClass = theme !== THEMES.SYSTEM ? `theme-${theme}` : "";
  const combinedClasses = `card-spotlight ${themeClass} ${className}`.trim();

  return (
    <div ref={divRef} onMouseMove={handleMouseMove} className={combinedClasses}>
      {children}
    </div>
  );
};

export default SpotlightCard;
