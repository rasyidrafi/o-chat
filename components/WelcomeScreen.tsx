import React, { useState } from 'react';
import { Sparkles, Newspaper, Code, GraduationCap } from './Icons';
import { User as FirebaseUser } from 'firebase/auth';

// Define the type for the categories to ensure type safety
type Category = 'Create' | 'Explore' | 'Code' | 'Learn';

interface SuggestionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({ icon, label, onClick, isActive }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2.5 py-2 px-4 rounded-lg transition-colors ${
      isActive 
        ? 'bg-zinc-200 dark:bg-zinc-800' // Active state style
        : 'bg-zinc-100 dark:bg-[#2a2a2a] hover:bg-zinc-200 dark:hover:bg-zinc-700'
    }`}
  >
    {icon}
    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{label}</span>
  </button>
);

const PromptSuggestion: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
}> = ({ children, onClick }) => (
    <button 
      onClick={onClick}
      className="w-full text-left py-3 px-4 bg-zinc-100 dark:bg-[#2a2a2a] rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
    >
        <p className="text-sm text-zinc-900 dark:text-zinc-200">{children}</p>
    </button>
);

interface WelcomeScreenProps {
  user: FirebaseUser | null;
  onPromptSelect?: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onPromptSelect }) => {
  // State to track the currently selected category
  const [selectedCategory, setSelectedCategory] = useState<Category>('Create');

  const suggestionButtons: { icon: React.ReactNode; label: Category }[] = [
    { icon: <Sparkles className="w-5 h-5" />, label: 'Create' },
    { icon: <Newspaper className="w-5 h-5" />, label: 'Explore' },
    { icon: <Code className="w-5 h-5" />, label: 'Code' },
    { icon: <GraduationCap className="w-5 h-5" />, label: 'Learn' },
  ];

  // A dictionary of prompts for each category
  const promptsByCategory: Record<Category, string[]> = {
    Create: [
      "Write me a sci-fi story in 2 paragraphs",
      "Suggest a name for my new indie rock band",
      "Draft a thank you note to a colleague",
      "Compose a poem about the ocean",
    ],
    Explore: [
        "How does AI work?",
        "Are black holes real?",
        "How many Rs are in the word \"strawberry\"?",
        "What is the meaning of life?",
    ],
    Code: [
      "Write a python function to reverse a string",
      "Explain what 'git rebase' does",
      "How to center a div in CSS?",
      "Generate a boilerplate for a React component",
    ],
    Learn: [
      "What were the main causes of World War I?",
      "Explain the theory of relativity in simple terms",
      "Who was Cleopatra?",
      "How does the stock market work?",
    ]
  };

  const displayName = user?.displayName?.split(' ')[0] || '';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-6">How can I help you{displayName ? `, ${displayName}` : ''}?</h1>
      
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {suggestionButtons.map((btn) => (
          <SuggestionButton 
            key={btn.label} 
            icon={btn.icon} 
            label={btn.label}
            onClick={() => setSelectedCategory(btn.label)}
            isActive={selectedCategory === btn.label}
          />
        ))}
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
        {promptsByCategory[selectedCategory].map((prompt) => (
          <PromptSuggestion 
            key={prompt} 
            onClick={() => onPromptSelect?.(prompt)}
          >
            {prompt}
          </PromptSuggestion>
        ))}
      </div>

        {/* Bottom padding to account for the overlay chat input */}
        <div className="h-16 md:h-20"></div>
    </div>
  );
};

export default WelcomeScreen;
