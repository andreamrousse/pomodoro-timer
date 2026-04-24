#Decisions
## What gets built
- Timer display showing minutes and seconds (MM:SS)
- Start, pause, and reset controls
- Work mode (25 min) and break mode (5 min)
- Auto-switch between modes when the timer reaches zero
- Visual indication of the current mode

## State the app needs to track
- timeRemaining — seconds left on the timer
- isRunning — whether the timer is actively counting down
- currentMode — “work” or “break”

## Interface elements
- A big time display
- Control buttons (start/pause, reset)
- A mode indicator

## Design
- Colors: A background color, a surface/card color, text colors (primary and muted), a color for work mode, a color for break mode, and an accent color. Pick a palette that appeals to you—dark theme, light theme, colorful, muted, whatever you like.
- Spacing: A scale of sizes (small, medium, large, etc.) you’ll reuse for padding, margins, and gaps.
- Typography: A body font, a monospace font (for the timer display), and a scale of font sizes including one large size for the countdown numbers.
- Borders: A few border-radius values for rounded corners.
- Follow usability best practices from Nilsen & Norman

## Avoid
- complex code
- many colours, gradients
- 

## Implementation
- It will use Vite
- It will use Git, Github
- It will use Netlify