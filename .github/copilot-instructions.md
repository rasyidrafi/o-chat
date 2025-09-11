# GitHub Copilot Instructions for O-Chat

## Project Overview

O-Chat is a modern, full-featured AI chat platform built with React, TypeScript, and Firebase. It provides seamless conversations with multiple AI providers, advanced features like image generation, vision capabilities, and real-time collaboration.

**Key Features:**
- Multi-provider AI chat (OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, and 15+ providers)
- Custom API integration for OpenAI-compatible endpoints
- Image generation, editing, and vision support
- Rich content rendering (Markdown, LaTeX math, Mermaid diagrams, code highlighting)
- Firebase authentication with local storage fallback
- Real-time streaming responses
- Responsive design optimized for desktop and mobile

## Tech Stack & Dependencies

### Core Technologies
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6.x
- **Styling**: Tailwind CSS 4.x with custom CSS
- **State Management**: React Context API + Hooks
- **Routing**: React Router DOM 7.x

### Key Dependencies
- **Authentication & Database**: Firebase 11.x (Auth, Firestore, Storage)
- **AI Integration**: OpenAI SDK 5.x + custom API clients
- **Content Rendering**:
  - `react-markdown` with `remark-gfm` and `remark-math`
  - `rehype-katex` for LaTeX math rendering
  - `mermaid` for diagram rendering
  - `shiki` for code syntax highlighting
- **UI Libraries**: 
  - `framer-motion` for animations
  - `tailwind-merge` for conditional styling
- **Utilities**: `marked`, `hast-util-sanitize`, `katex`

## Project Structure

```
/
├── .github/                    # GitHub configuration
├── components/                 # React components
│   ├── auth/                  # Authentication components
│   ├── settings/              # Settings and configuration UI
│   └── ui/                    # Reusable UI components
├── constants/                 # Application constants and configuration
├── contexts/                  # React Context providers
├── hooks/                     # Custom React hooks
├── public/                    # Static assets
├── services/                  # API services and business logic
├── types/                     # TypeScript type definitions
├── App.tsx                    # Main application component
├── index.tsx                  # Application entry point
├── firebase.ts               # Firebase configuration
├── firestore.rules          # Firestore security rules
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies and scripts
```

## Development Workflow

### Available Scripts
- `npm run dev` - Start development server (Vite with hot reload)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Build and deploy to Firebase Hosting

### Environment Setup
1. Install dependencies: `npm install`
2. Optional Firebase setup (copy `.env.example` to `.env`)
3. Start development: `npm run dev`
4. Access at `http://localhost:5173`

### Build Process
- Uses Vite for fast development and optimized production builds
- TypeScript compilation with strict type checking
- Tailwind CSS compilation
- Asset optimization and code splitting

## Coding Conventions & Patterns

### Component Architecture
- **Functional Components**: Use React functional components with hooks
- **Component Organization**: Group related components in feature folders
- **Props Interface**: Always define TypeScript interfaces for component props
- **File Naming**: Use PascalCase for components, camelCase for utilities

### State Management
- **Context API**: Use React Context for global state (auth, settings, chat)
- **Local State**: Use `useState` and `useReducer` for component-level state
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Async State**: Handle loading, error, and success states consistently

### Styling Approach
- **Tailwind CSS**: Primary styling system with utility classes
- **Custom CSS**: Limited custom CSS in `index.css` for complex layouts
- **Responsive Design**: Mobile-first approach with responsive utilities
- **Dark/Light Theme**: Support both themes with CSS variables

### TypeScript Guidelines
- **Strict Mode**: Full TypeScript strict mode enabled
- **Type Definitions**: Define interfaces in `/types` directory
- **Generic Types**: Use generics for reusable components and hooks
- **Type Guards**: Implement type guards for runtime type checking

## Key Services & Architecture

### Core Services
1. **ChatService**: Handles AI model interactions and streaming responses
2. **ChatStorageService**: Manages conversation persistence and cloud sync
3. **ImageGenerationService**: Handles image creation and editing
4. **ModelService**: Manages AI model discovery and capabilities
5. **AuthContext**: Handles user authentication state

### Data Flow Patterns
- **Unidirectional Data Flow**: Props down, events up
- **Context for Global State**: Auth, settings, and chat state
- **Service Layer**: Separate business logic from UI components
- **Error Boundaries**: Implement error handling at component boundaries

### Firebase Integration
- **Authentication**: Google OAuth and email/password
- **Firestore**: Real-time conversation storage
- **Storage**: File uploads and image management
- **Local Fallback**: Works offline with local storage

## AI Integration Patterns

### Provider Architecture
- **Multi-Provider Support**: Abstract provider interface for different AI services
- **Custom API Endpoints**: Support for OpenAI-compatible APIs
- **Capability Detection**: Automatic feature detection per model
- **Error Handling**: Robust timeout and retry mechanisms

### Chat Implementation
- **Streaming Responses**: Real-time response streaming
- **Message Threading**: Conversation context management
- **Rich Content**: Support for text, images, code, math, and diagrams
- **Tool Calling**: Advanced function calling capabilities

## Common Development Tasks

### Adding New AI Providers
1. Define provider interface in `/types/providers.ts`
2. Implement service in `/services`
3. Add provider configuration in settings
4. Update model capabilities mapping

### Adding New Components
1. Create component file in appropriate `/components` subdirectory
2. Define props interface with TypeScript
3. Use Tailwind CSS for styling
4. Export from parent directory index file if needed

### Handling Authentication
- Check auth state using `useAuth()` hook
- Implement both authenticated and anonymous user flows
- Handle loading states during auth transitions
- Provide fallbacks for unauthenticated users

### Content Rendering
- Use `MemoizedMarkdown` component for rich text
- Support LaTeX math with `$$` or `$` delimiters
- Code blocks with language-specific highlighting
- Mermaid diagrams with ````mermaid` blocks

### Error Handling
- Implement try-catch blocks for async operations
- Provide user-friendly error messages
- Handle network failures gracefully
- Log errors for debugging but don't expose sensitive info

## Performance Considerations

### Optimization Strategies
- **Code Splitting**: Use dynamic imports for large dependencies
- **Memoization**: Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Lazy Loading**: Load components and features on demand
- **Image Optimization**: Optimize images and use appropriate formats

### Bundle Size Management
- Monitor bundle size during builds
- Use tree shaking for unused code elimination
- Consider provider-specific chunks for AI services
- Optimize dependency imports (import specific functions)

## Testing & Quality

### Code Quality
- TypeScript strict mode for type safety
- ESLint configuration for code consistency (if present)
- Component prop validation with TypeScript interfaces
- Error boundary implementation for graceful failures

### Manual Testing
- Test both authenticated and anonymous flows
- Verify responsive design on different screen sizes
- Test AI provider integrations with valid API keys
- Validate rich content rendering (math, code, diagrams)

## Security & Privacy

### Data Protection
- All API keys stored locally or in environment variables
- User conversations encrypted in Firebase or stored locally
- No sensitive data logged or exposed
- Proper sanitization of user-generated content

### Authentication Security
- Firebase Auth handles secure authentication
- No custom authentication implementation
- Proper token handling and refresh
- Secure logout and session management

## Deployment

### Firebase Hosting
- Production builds deployed to Firebase Hosting
- Environment variables configured in Firebase console
- Firestore rules configured for security
- CDN optimization and caching

### Local Development
- Fully functional offline with custom providers
- Local storage persistence without authentication
- Hot reload development server
- Environment variable support for local testing

---

When working on this project, prioritize user experience, maintainable code, and robust error handling. Follow the established patterns and conventions, and ensure all new features work both in authenticated and anonymous modes.