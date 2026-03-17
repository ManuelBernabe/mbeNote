import { type ReactNode } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 5000,
          }}
        />
      </ThemeProvider>
    </QueryProvider>
  );
}
