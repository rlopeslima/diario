# AI Development Rules for Diário IA

This document outlines the technical stack and development guidelines for the Diário IA application. Following these rules ensures consistency, maintainability, and adherence to the project's architecture.

## Tech Stack

The application is built with a modern, lightweight tech stack focused on React and Google's AI ecosystem.

*   **Framework:** React with TypeScript for building a type-safe and component-based user interface.
*   **AI/ML:** Google Gemini (`@google/genai`) is the exclusive AI provider for all intelligent features, including natural language processing, receipt scanning (multimodal input), and real-time voice transcription.
*   **Styling:** Tailwind CSS is used for all styling. It provides a utility-first approach, and no separate CSS files should be created.
*   **Build Tool:** Vite serves as the build tool, offering a fast development server and optimized production builds.
*   **State Management:** State is managed locally within components using React Hooks (`useState`, `useEffect`). Global state is centralized in `App.tsx` and passed down via props.
*   **Data Persistence:** User data (journal entries) is persisted in the browser using the `localStorage` API.
*   **Icons:** All icons are custom SVG-based React components located in `src/components/icons.tsx`.
*   **Browser APIs:** The app leverages native browser APIs, including the Web Audio API for microphone input and the Notifications API for user reminders.

## Development Guidelines & Library Usage

To maintain code quality and a consistent architecture, please adhere to the following rules:

### 1. Component Architecture
*   **Create Small Components:** Every distinct piece of the UI should be its own component. Place all new components in the `src/components` directory.
*   **Styling:** Use only Tailwind CSS classes for styling. Do not use inline styles (`style={{...}}`) or create `.css` files.
*   **Views vs. Components:** Page-level components that assemble smaller components should be placed in the `src/views` directory.

### 2. AI Integration
*   **Centralized Service:** All interactions with the Google Gemini API must be encapsulated within the `src/services/geminiService.ts` file.
*   **Separation of Concerns:** UI components should not directly call the Gemini API. They should call functions from `geminiService.ts` to handle AI-related tasks.

### 3. State Management
*   **Use React Hooks:** Continue using React's built-in hooks for state. Do not add external state management libraries like Redux or Zustand.
*   **Prop Drilling:** For this project's scale, passing state and callbacks down from `App.tsx` is the accepted pattern.

### 4. Icons
*   **Use Existing System:** If a new icon is needed, create it as a new SVG-based React component and add it to `src/components/icons.tsx`. Do not install a third-party icon library.

### 5. Types and Utilities
*   **Shared Types:** Define all shared TypeScript interfaces and types in `src/types.ts`.
*   **Helper Functions:** Place pure, reusable helper functions that are not specific to any component (e.g., data formatters) in `src/utils/helpers.ts`.