import React, { useState, useEffect } from 'react';
import SettingsTextarea from '../SettingsTextarea';
import SettingsToggle from '../SettingsToggle';
import CustomDropdown from '../../ui/CustomDropdown';
import FontSizeSlider from '../../ui/FontSizeSlider';
import FontPreview from '../FontPreview';
import Button from '../../ui/Button';
import { AppSettings } from '../../../App';
import HorizontalRule from '@/components/ui/HorizontalRule';

interface CustomizationTabProps {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const CustomizationTab: React.FC<CustomizationTabProps> = ({ settings, updateSettings }) => {
    const [customInstruction, setCustomInstruction] = useState(settings.customInstruction);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setCustomInstruction(settings.customInstruction);
    }, [settings.customInstruction]);

    const handleSaveCustomInstruction = () => {
        updateSettings({ customInstruction });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const mainFontOptions = ['Montserrat', 'Lato', 'Open Sans', 'Roboto', 'Source Sans Pro'];

    return (
        <div>
            {/* Customization Section */}
            <div>
                <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">Customize O-Chat</h2>
                <div className="space-y-6 mt-6">
                    <SettingsTextarea 
                        label="Custom Instruction" 
                        value={customInstruction} 
                        onChange={setCustomInstruction} 
                        maxLength={3000} 
                        placeholder="You are a helpful assistant..." 
                    />
                </div>
                <div className="flex justify-start items-center gap-3 mt-4">
                    <Button onClick={handleSaveCustomInstruction}>
                        {isSaved ? 'Saved!' : 'Save Preferences'}
                    </Button>
                </div>
            </div>

            {/* @ts-ignore */}
            <HorizontalRule className="my-8" />
            
            {/* Visual Options Section */}
            <div>
                <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">Visual Options</h2>
                <div className="space-y-6 mt-6">
                    <SettingsToggle 
                        label="Disable Animation"
                        description="Disables all animations throughout the app for a simpler experience."
                        isOn={settings.animationsDisabled}
                        onToggle={() => updateSettings({animationsDisabled: !settings.animationsDisabled})}
                    />
                    <FontSizeSlider
                        label="Font Size"
                        description="Adjust the overall text size throughout the app."
                        value={settings.fontSize}
                        onChange={(fontSize) => updateSettings({ fontSize })}
                        animationsDisabled={settings.animationsDisabled}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
                        <div className="space-y-6">
                            <CustomDropdown 
                                label="Main Text Font"
                                description="Used in general text throughout the app."
                                options={mainFontOptions.map(f => f === 'Montserrat' ? `${f} (default)` : f)}
                                selected={settings.mainFont === 'Montserrat' ? `${settings.mainFont} (default)` : settings.mainFont}
                                onSelect={(option) => updateSettings({mainFont: option.replace(' (default)', '')})}
                                animationsDisabled={settings.animationsDisabled}
                            />
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-zinc-900 dark:text-white">Fonts Preview</h4>
                            <FontPreview
                                mainFont={settings.mainFont}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationTab;
