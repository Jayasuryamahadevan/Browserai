# Saturn Browser Architecture

Saturn Browser is an Agentic AI OS Frontend built with modern web technologies and wrapped in Electron for desktop capabilities.

## Tech Stack

- **Core Framework**: [React](https://react.dev/) (v18)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

## Project Structure

### `/src` (Renderer Process)
The user interface and frontend logic.
- **`main.tsx`**: Entry point. Contains `BootLoader` for initialization and error handling.
- **`App.tsx`**: Main layout component coordinating panels and views.
- **`components/`**: Reusable UI components (Panels, Overlays, Widgets).
- **`store/`**: Global state management (Zustand stores).
- **`lib/`**: Utility functions and AI integration logic.
- **`hooks/`**: Custom React hooks.

### `/electron` (Main Process)
Backend logic running in Node.js environment.
- **`main.ts`**: Entry point for Electron. Handles window creation, IPC handlers, and system integration.
- **`preload.ts`**: Context bridge ensuring safe communication between Main and Renderer processes.

## Key Subsystems

### 1. Initialization (`BootLoader`)
Located in `src/main.tsx`. It manages the startup sequence:
1. Loads the `App` module.
2. Loads `ErrorBoundary`.
3. Loads CSS styles.
4. Mounts the React root.
This ensures granular feedback during startup and catches loading errors early.

### 2. AI Integration
The browser features an **AI Side Panel** (`components/AISidePanel`) and **Memory Panel** (`components/MemoryPanel`) that interface with local or remote AI models to provide context-aware assistance.

### 3. IPC Communication
Communication between the React frontend and Electron backend is handled via `window.ipcRenderer` (typed via `preload.ts`). This allows the frontend to request system operations like file access, window management, and native notifications.
