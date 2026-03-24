import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Alert02Icon,
  MultiplicationSignCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";

const ICON_SIZE_CLASS = "size-4";

const TOAST_ICONS = {
  success: (
    <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className={ICON_SIZE_CLASS} />
  ),
  info: <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className={ICON_SIZE_CLASS} />,
  warning: <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className={ICON_SIZE_CLASS} />,
  error: (
    <HugeiconsIcon
      icon={MultiplicationSignCircleIcon}
      strokeWidth={2}
      className={ICON_SIZE_CLASS}
    />
  ),
  loading: (
    <HugeiconsIcon
      icon={Loading03Icon}
      strokeWidth={2}
      className={`${ICON_SIZE_CLASS} animate-spin`}
    />
  ),
} as const;

const TOAST_THEME_VARIABLES: React.CSSProperties & Record<string, string> = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "var(--radius)",
};

const TOAST_CLASS_NAMES = {
  toast: "cn-toast",
} as const;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={TOAST_ICONS}
      style={TOAST_THEME_VARIABLES}
      toastOptions={{
        classNames: TOAST_CLASS_NAMES,
      }}
      {...props}
    />
  );
};

export { Toaster };
