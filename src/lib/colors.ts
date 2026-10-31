import type { ColorKey } from "./types";

/** Paleta de categorías. `bg` y `fg` cumplen contraste AA sobre fondo claro y oscuro. */
export const CATEGORY_COLORS: Record<ColorKey, { solid: string; soft: string; softDark: string; ink: string; inkDark: string }> = {
  cobalt: { solid: "#2F5BEA", soft: "#E6ECFD", softDark: "#1C2A57", ink: "#1D3FB0", inkDark: "#B9C8FA" },
  teal:   { solid: "#0E9384", soft: "#DDF4F0", softDark: "#123A36", ink: "#0B6B60", inkDark: "#9EE3D8" },
  amber:  { solid: "#C98A00", soft: "#FBF0D6", softDark: "#3D3013", ink: "#8A5D00", inkDark: "#F2D58E" },
  rose:   { solid: "#D6457A", soft: "#FBE4EC", softDark: "#46202E", ink: "#A42A57", inkDark: "#F5B3CA" },
  violet: { solid: "#7357F6", soft: "#ECE8FE", softDark: "#2B2457", ink: "#5236D6", inkDark: "#CBBFFD" },
  slate:  { solid: "#5B6B7F", soft: "#E8ECF1", softDark: "#262F3B", ink: "#3E4A59", inkDark: "#C6D0DC" },
};

export const COLOR_KEYS = Object.keys(CATEGORY_COLORS) as ColorKey[];
