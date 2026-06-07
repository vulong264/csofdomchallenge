"use client";

/**
 * Reflects the learner's equipped loot theme + reduced-motion choice onto the
 * <html> element, where the CSS variable overrides in globals.css pick them up.
 * Renders nothing. The default "doom" theme is the :root palette, so we clear
 * the attribute rather than setting data-theme="doom".
 */
import { useEffect } from "react";
import { DEFAULT_THEME_ID } from "@/lib/cosmetics/themes";
import { useProgress } from "@/lib/progress/context";

export function ThemeApplier() {
  const { progress, ready } = useProgress();
  const theme = progress.cosmetics.theme;
  const reduced = progress.settings.reducedMotion;

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    if (theme && theme !== DEFAULT_THEME_ID) root.dataset.theme = theme;
    else delete root.dataset.theme;
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    if (reduced) root.dataset.reducedMotion = "true";
    else delete root.dataset.reducedMotion;
  }, [reduced, ready]);

  return null;
}
