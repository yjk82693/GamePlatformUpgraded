export const tokens = {
  color: {
    bg: '#12131A',
    surface: '#1C1E29',
    surfaceAlt: '#242737',
    border: '#2E3244',
    text: '#EDEDF2',
    textMuted: '#9A9CB0',
    accent: '#6C5CE7',
    accentSoft: '#8C7BFF',
    mint: '#2FE6C4',
    gold: '#F5B93E',
    danger: '#FF6B6B',
  },
  font: {
    display: '"Press Start 2P", monospace',
    body: '"Inter", system-ui, sans-serif',
    mono: '"IBM Plex Mono", monospace',
  },
  radius: { sm: '4px', md: '8px', lg: '14px' },
  shadow: { card: '0 2px 10px rgba(0,0,0,0.45)' },
}

// Deterministic accent color per game, so each "cartridge" reads
// consistently across visits without needing per-game config.
const gameAccents = ['#6C5CE7', '#2FE6C4', '#F5B93E', '#FF6B9D', '#4FC3F7', '#FF8A5C']

export function gameAccent(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return gameAccents[hash % gameAccents.length]
}
