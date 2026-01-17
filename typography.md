# Typography System

This document outlines the typography used in the Sparkquest application.

## Font Families

### Primary Sans-Serif
Used for body text and general UI elements.
- **Font Name**: DM Sans
- **Variable**: `--font-dm-sans`
- **Source**: Google Fonts (via `next/font/google`)
- **Fallback**: Inter (`--font-inter`), System UI

### Display
Used for Headings (h1, h2) to give a distinct, premium look.
- **Font Name**: Clash Display
- **Weights**: 
  - 500 (Medium) - Default for h1, h2
  - 600 (SemiBold)
- **Source**: Fontshare CDN (configured in `globals.css`)
- **Variable**: `--font-display`

## Global Styles

- **Body**: Uses `font-sans` (DM Sans/Inter mix).
- **Headings (h1, h2)**: Use `font-display` (Clash Display) with `font-weight: 500`.

## Configuration Details

### Tailwind Configuration
Located in `tailwind.config.js`:
```javascript
fontFamily: {
  sans: ['var(--font-dm-sans)', 'var(--font-inter)', 'sans-serif'],
  display: ['var(--font-display)', 'sans-serif'],
}
```

### CSS Variables
Defined in `globals.css`:
```css
--font-sans: var(--font-dm-sans), var(--font-inter), system-ui, -apple-system, sans-serif;
--font-display: 'Clash Display', var(--font-sans);
```
