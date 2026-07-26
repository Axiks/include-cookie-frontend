"use client"

import { IconButton } from "@radix-ui/themes"
import { Half2Icon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"

// Light <-> dark toggle. next-themes persists the choice (localStorage) and applies the
// class on <html>, which Radix Themes follows. Default theme is light (see layout.tsx).
// A single contrast icon is used so there's no SSR/client hydration mismatch.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const size = 14;

  return (
    <IconButton
      variant="ghost"
      color="gray"
      aria-label="Toggle theme"
      title="Change theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Half2Icon width={size} height={size} />
    </IconButton>
  )
}
