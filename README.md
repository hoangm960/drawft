# Drawft

This is an infinite canvas that let you draft your ideas with drawing (hence the name drawft)

## Features

- **Infinite Canvas** - Pan and zoom freely (scroll to zoom, drag with Pan tool or middle mouse)
- **Drawing Tools** - Rectangle, Diamond, Ellipse, Arrow, Line
- **Selection** - Click to select, Shift+click for multi-select, box selection
- **Shape Manipulation** - Move shapes by dragging, delete selected shapes (Delete/Backspace key)
- **Hand-drawn Style** - Rough.js for sketchy, hand-drawn aesthetic
- **Performance** - Spatial indexing with rbush for efficient shape queries

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management)
- Rough.js (rendering)
- Tailwind CSS 4
- rbush (spatial indexing)

## Getting Started

```bash
bun install
bun run dev
```

## Available Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `bun run dev`        | Start development server |
| `bun run build`      | Build for production     |
| `bun run lint`       | Lint code                |
| `bun run type-check` | Type check               |
| `bun run format`     | Format code              |
| `bun run preview`    | Preview production build |
