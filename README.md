# O-Chat - AI Chat Platform

A modern, full-featured AI chat platform built with React, TypeScript, and Firebase. Experience seamless conversations with multiple AI providers, advanced features like image generation, vision capabilities, and real-time collaboration.  

### Dashboard
<img width="1920" height="1080" alt="Screenshot 2025-09-10 091737" src="https://github.com/user-attachments/assets/25799e11-0d59-48f2-87be-559760ac0b32" />    

### Chat
<img width="1920" height="1080" alt="Screenshot 2025-09-10 093654" src="https://github.com/user-attachments/assets/32563b9f-3eb5-425d-a17f-239b66e70e55" />  

### Settings
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/87f3a89e-89af-4598-9925-07316b3dfbd3" />  

### Api Keys Tab

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/2e16e878-cbe3-49e0-8b82-6d664d811b04" />  





🌐 **Live Demo:** [https://chat.r45.dev](https://chat.r45.dev)

> 💡 **Fully Local Usage Supported**: This project can be used completely offline with custom providers - no Firebase required! All conversations are saved to local storage when used without authentication.

## ✨ Features

### 🤖 AI Models & Providers
- **Multi-Provider Support**: OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, and 15+ AI providers
- **Custom API Integration**: Add your own OpenAI-compatible API endpoints
- **Intelligent Model Selection**: Automatic capability detection and smart model switching

### 🎨 Advanced AI Capabilities
- **Text Generation**: High-quality conversations with state-of-the-art language models
- **Image Generation**: Create images with models like DALL-E, Flux, and Stable Diffusion
- **Image Editing**: Edit and modify existing images using AI
- **Vision Support**: Upload and analyze images in conversations
- **Tool Calling**: Advanced function calling capabilities
- **Reasoning Models**: Support for chain-of-thought reasoning
- **Audio Generation**: Generate audio content (supported models)

### 💬 Chat Experience
- **Real-time Streaming**: Live response streaming for immediate feedback
- **Message Management**: Edit, delete, and regenerate messages
- **Conversation History**: Persistent chat storage with cloud sync
- **Search Functionality**: Find specific conversations and messages
- **Markdown Support**: Rich text formatting with syntax highlighting
- **Code Highlighting**: Beautiful code blocks with Shiki syntax highlighting
- **Math Rendering**: LaTeX math expressions with KaTeX
- **Mermaid Diagrams**: Interactive diagram rendering

### 🔐 Authentication & Storage
- **Firebase Authentication**: Google sign-in and email/password auth
- **Anonymous Usage**: Use without registration (local storage)
- **Fully Local Mode**: Complete offline usage with custom providers
- **Local Storage**: All conversations saved locally when not authenticated
- **Cloud Sync**: Automatic conversation sync across devices (when authenticated)
- **Data Migration**: Seamless transition from local to cloud storage
- **Privacy Focused**: Your data, your control

### 🎨 User Experience
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Dark/Light Theme**: Customizable appearance
- **Font Customization**: Adjustable font sizes and families
- **Accessibility**: WCAG compliant design
- **Animation Controls**: Disable animations for better performance
- **Keyboard Shortcuts**: Efficient navigation and actions

### 🔧 Technical Features
- **Image Upload**: Drag & drop or click to upload images
- **File Management**: Firebase Storage integration
- **Error Handling**: Robust error recovery and timeout management
- **Offline Support**: Local storage fallback
- **Performance Optimized**: Lazy loading and efficient rendering
- **TypeScript**: Full type safety throughout the application

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **pnpm** (recommended) or npm
- **Firebase Project** (optional - only needed for cloud features and authentication)

> 🚀 **Quick Local Setup**: Want to use it completely locally? Skip Firebase setup and just add your custom AI provider API keys in Settings → API Keys after starting the app!

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rasyidrafi/o-chat.git
   cd o-chat
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure Firebase** *(Optional - skip for local-only usage)*
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Google and Email/Password)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config

4. **Set up environment variables** *(Optional - only for Firebase features)*
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase configuration in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_FUNC_BASE_API=your_api_endpoint
   ```

   **For Firebase Hosting deployment**, also update `.firebaserc`:
   ```json
   {
     "projects": {
       "default": "your_firebase_project_id"
     }
   }
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm deploy` - Build and deploy to Firebase Hosting

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4.x
- **State Management**: React Context + Hooks
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Deployment**: Firebase Hosting
- **AI Integration**: OpenAI SDK + Custom API clients

### Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── settings/       # Settings and configuration
│   └── ui/             # Reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── utils/              # Utility functions
```

### Key Services
- **ChatService**: Handles AI model interactions and streaming
- **ChatStorageService**: Manages conversation persistence and sync
- **ImageGenerationService**: Handles image creation and editing
- **ModelService**: Manages AI model discovery and capabilities
- **AuthContext**: Handles user authentication state

## 🔧 Configuration

### Local-Only Usage (No Firebase Required)
1. Start the application with `pnpm dev`
2. Navigate to Settings → API Keys
3. Add your OpenAI-compatible API endpoints:
   - **OpenAI**: `https://api.openai.com/v1`
   - **Anthropic**: `https://api.anthropic.com`
   - **Local LLM**: `http://localhost:11434/v1` (Ollama)
   - **Any OpenAI-compatible API**
4. Add your API keys for each provider
5. Start chatting! All conversations are saved locally

### Adding Custom AI Providers
1. Navigate to Settings → API Keys
2. Add your OpenAI-compatible API endpoint
3. Configure the base URL and API key
4. Select models from the provider

### Customization Options
- **Themes**: Dark/Light mode with system preference detection
- **Fonts**: Multiple font families and size options
- **Animations**: Toggle animations for better performance
- **Models**: Enable/disable specific AI models
- **Image Settings**: Configure image generation parameters

## 🚢 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Update your project ID in `.firebaserc`:
   ```json
   {
     "projects": {
       "default": "your_firebase_project_id"
     }
   }
   ```
4. Build and deploy: `pnpm deploy`

### Other Platforms
The app can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **inspired from t3 Chat, intern3 chat**
- **Firebase** - For the incredible backend infrastructure
- **OpenAI** - For the powerful AI models and APIs
- **All AI Providers** - For making advanced AI accessible

## 📞 Support

- 🌐 **Live Demo**: [https://chat.r45.dev](https://chat.r45.dev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/rasyidrafi/o-chat/issues)

---

Built with ❤️ using modern web technologies
