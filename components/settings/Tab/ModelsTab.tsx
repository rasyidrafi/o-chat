import React, { useState } from 'react';
import CustomDropdown from '../../ui/CustomDropdown';
import ModelCard from '../ModelCard';
import { AppSettings } from '../../../App';

interface ModelsTabProps {
    settings: AppSettings;
}

const ModelsTab: React.FC<ModelsTabProps> = ({ settings }) => {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    
    // Server models are always enabled - read only
    const [serverModelsEnabled] = useState<string[]>(['Gemini 1.5 Flash', 'Gemini 1.5 Flash 8B']);
    
    // BYOK models have their own state
    const [enabledBYOKModels, setEnabledBYOKModels] = useState<string[]>([]);

    const availableModels = [
        {
            name: 'Gemini 1.5 Flash',
            description: "Google's fast and efficient model optimized for high-frequency tasks with multimodal capabilities.",
            features: ['Tool Calling'],
            category: 'server',
            logo: 'google'
        },
        {
            name: 'Gemini 1.5 Flash 8B',
            description: "A smaller, faster version of Gemini 1.5 Flash with 8 billion parameters for quick responses.",
            features: ['Tool Calling'],
            category: 'server',
            logo: 'google'
        },
        {
            name: 'Grok 4',
            description: "xAI's flagship model that breaks records on lots of benchmarks (allegedly).",
            features: ['Tool Calling', 'Reasoning', 'Vision', 'Search URL'],
            category: 'byok'
        },
        {
            name: 'Kimi K2',
            description: "Kimi K2 is a large-scale Mixture-of-Experts (MoE) language model developed by Moonshot AI, featuring 1 trillion total parameters with 32 billion active per forward pass.",
            features: ['Tool Calling', 'Vision'],
            category: 'byok'
        },
        {
            name: 'Claude 3.5 Sonnet',
            description: "Anthropic's most capable model with excellent reasoning and code generation capabilities.",
            features: ['Tool Calling', 'Vision', 'Reasoning'],
            category: 'byok'
        },
        {
            name: 'GPT-4o',
            description: "OpenAI's flagship multimodal model with strong performance across text, vision, and audio tasks.",
            features: ['Tool Calling', 'Vision', 'Reasoning'],
            category: 'byok'
        }
    ];

    const featureOptions = ['Tool Calling', 'Reasoning', 'Vision'];

    const filteredModels = availableModels.filter(model => {
        // Only filter BYOK models, always show server models
        if (model.category === 'server') return true;
        
        if (selectedFeatures.length === 0) return true;
        return selectedFeatures.every(feature => model.features.includes(feature));
    });

    const serverModels = filteredModels.filter(model => model.category === 'server');
    const byokModels = filteredModels.filter(model => model.category === 'byok');

    const handleModelToggle = (modelName: string, enabled: boolean) => {
        // Only allow toggling for BYOK models
        const model = availableModels.find(m => m.name === modelName);
        if (model?.category !== 'byok') return;

        if (enabled) {
            setEnabledBYOKModels([...enabledBYOKModels, modelName]);
        } else {
            setEnabledBYOKModels(enabledBYOKModels.filter(name => name !== modelName));
        }
    };

    const handleUnselectAll = () => {
        // Only unselect BYOK models
        setEnabledBYOKModels([]);
    };

    const handleFeatureSelect = (feature: string) => {
        setSelectedFeatures([feature]);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">Available Models</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Choose which models appear in your model selector. This won't affect existing conversations.
            </p>

            <div className="space-y-8">
                {/* From Our Server Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">From Our Servers</h3>
                    </div>
                    <div className="space-y-4">
                        {serverModels.map((model) => (
                            <ModelCard
                                key={model.name}
                                name={model.name}
                                description={model.description}
                                features={model.features}
                                isEnabled={serverModelsEnabled.includes(model.name)}
                                onToggle={() => {}} // No-op for server models
                                animationsDisabled={settings.animationsDisabled}
                                logo={model.logo}
                                disabled={true}
                            />
                        ))}
                    </div>
                </div>

                {/* BYOK Models Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">BYOK Models</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-64">
                                <CustomDropdown
                                    label=""
                                    description=""
                                    options={['All Features', ...featureOptions]}
                                    selected={selectedFeatures.length === 0 ? 'All Features' : selectedFeatures[0]}
                                    onSelect={(option) => {
                                        if (option === 'All Features') {
                                            setSelectedFeatures([]);
                                        } else {
                                            handleFeatureSelect(option);
                                        }
                                    }}
                                    animationsDisabled={settings.animationsDisabled}
                                />
                            </div>
                            <button
                                onClick={handleUnselectAll}
                                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                                Unselect All
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {byokModels.map((model) => (
                            <ModelCard
                                key={model.name}
                                name={model.name}
                                description={model.description}
                                features={model.features}
                                isEnabled={enabledBYOKModels.includes(model.name)}
                                onToggle={(enabled) => handleModelToggle(model.name, enabled)}
                                animationsDisabled={settings.animationsDisabled}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelsTab;
