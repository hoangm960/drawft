# Drawft

This is an infinite canvas that let you draft your ideas with drawing (hence the name drawft)

## Features

- **Infinite Canvas** - Pan and zoom freely (scroll to zoom, drag with Pan tool or middle mouse)
- **Drawing Tools** - Rectangle, Diamond, Ellipse, Arrow, Line
- **Selection** - Click to select, Shift+click for multi-select, box selection
- **Shape Manipulation** - Move shapes by dragging, delete selected shapes (Delete/Backspace key), resize via drag handles (corner handles for shapes, endpoint handles for line/arrow)
- **Performance** - Spatial indexing with rbush for efficient shape queries

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management)
- Tailwind CSS 4
- rbush (spatial indexing)

## Getting Started

```bash
bun install
bun run dev
```

## Available Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `bun run dev`           | Start development server |
| `bun run build`         | Build for production     |
| `bun run preview`       | Preview production build |
| `bun run lint`          | Lint code                |
| `bun run lint:fix`      | Lint and auto-fix        |
| `bun run type-check`    | Type check               |
| `bun run format`        | Format code              |
| `bun run format:check`  | Check formatting         |
| `bun run test`          | Run tests (Jest)         |
| `bun run test:watch`    | Run tests in watch mode  |
| `bun run test:coverage` | Run tests with coverage  |
