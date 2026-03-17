import { useEffect, type ReactNode } from "react";
import { useUIStore } from "../stores/uiStore";

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return <>{children}</>;
}
