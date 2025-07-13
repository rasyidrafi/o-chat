import React, { useState } from 'react';
import { Key } from '../../Icons';
import Button from '../../ui/Button';

const ApiProviderCard: React.FC<{
    title: string;
    models: string[];
    consoleUrl: string;
    placeholder: string;
    consoleName: string;
}> = ({ title, models, consoleUrl, placeholder, consoleName }) => {
    const [apiKey, setApiKey] = useState('');

    return (
        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <Key className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Used for the following models:</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {models.map(model => (
                    <span key={model} className="text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400 py-1 px-3 rounded-full">
                        {model}
                    </span>
                ))}
            </div>
            
            <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />

            <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                <a href={consoleUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-500 hover:underline">
                    Get your API key from {consoleName}
                </a>
                <Button size="sm">Save</Button>
            </div>
        </div>
    );
};


const ApiKeysTab: React.FC = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">API Keys</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                This app offers free chats using Google's Gemini 1.5 Flash. For other models, like those from Anthropic or OpenAI, you will need to provide your own API key below. Your keys are stored securely on your device and are never sent to our servers.
            </p>
            <div className="space-y-6">
                <ApiProviderCard 
                    title="Anthropic API Key"
                    models={['Claude 3.5 Sonnet', 'Claude 3.7 Sonnet', 'Claude 3.7 Sonnet (Reasoning)', 'Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 4 Sonnet (Reasoning)']}
                    consoleUrl="https://console.anthropic.com/"
                    placeholder="sk-ant-..."
                    consoleName="Anthropic's Console"
                />
                <ApiProviderCard 
                    title="OpenAI API Key"
                    models={['GPT-4.5', 'o3', 'o3 Pro']}
                    consoleUrl="https://platform.openai.com/api-keys"
                    placeholder="sk-..."
                    consoleName="OpenAI's Console"
                />
            </div>
        </div>
    );
};

export default ApiKeysTab;