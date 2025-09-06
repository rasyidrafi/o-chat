import React, { useState, useEffect } from "react";
import SettingsTextarea from "../SettingsTextarea";
import TabButtonGroup from "../../ui/TabButtonGroup";
import CustomDropdown from "../../ui/CustomDropdown";
import FontPreview from "../FontPreview";
import Button from "../../ui/Button";
import { AppSettings } from "../../../hooks/useSettings";
import { AVAILABLE_THEMES, BORDER_RADIUS_OPTIONS, getThemeById } from "../../../constants/themes";
import HorizontalRule from "@/components/ui/HorizontalRule";

interface CustomizationTabProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const CustomizationTab: React.FC<CustomizationTabProps> = ({
  settings,
  updateSettings,
}) => {
  const [customInstruction, setCustomInstruction] = useState(
    settings.customInstruction
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setCustomInstruction(settings.customInstruction);
  }, [settings.customInstruction]);

  const handleSaveCustomInstruction = () => {
    updateSettings({ customInstruction });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const mainFontOptions = [
    "Outfit",
    "Montserrat",
    "Lato",
    "Open Sans",
    "Roboto",
    "Source Sans Pro",
  ];

  // Get current theme for preview
  const currentTheme = getThemeById(settings.themePalette);

  return (
    <div>
      {/* Customization Section */}
      <div>
        <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
          Customize O-Chat
        </h2>
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
            {isSaved ? "Saved!" : "Save Preferences"}
          </Button>
        </div>
      </div>

      {/* @ts-ignore */}
      <HorizontalRule className="my-8" />

      {/* Theme Customization Section */}
      <div>
        <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
          Theme & Appearance
        </h2>
        <div className="space-y-6 mt-6">
          {/* Theme Palette Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium text-zinc-900 dark:text-white">
                  Color Palette
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Choose from predefined color themes to customize your experience.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <CustomDropdown
                label=""
                description=""
                options={AVAILABLE_THEMES.map((theme) => `${theme.name}`)}
                selected={currentTheme.name}
                onSelect={(themeName) => {
                  const selectedTheme = AVAILABLE_THEMES.find(t => t.name === themeName);
                  if (selectedTheme) {
                    updateSettings({ themePalette: selectedTheme.id });
                  }
                }}
                animationsDisabled={settings.animationsDisabled}
              />
              {/* Theme Preview */}
              <div className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-800">
                <div className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  {currentTheme.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  {currentTheme.description}
                </div>
                <div className="flex gap-1">
                  {/* Primary color preview */}
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: currentTheme.colors.primary[400] }}
                      title="Primary 400"
                    />
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: currentTheme.colors.primary[600] }}
                      title="Primary 600"
                    />
                  </div>
                  {/* Secondary color preview */}
                  <div className="flex gap-1 ml-2">
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: currentTheme.colors.secondary[400] }}
                      title="Secondary 400"
                    />
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: currentTheme.colors.secondary[600] }}
                      title="Secondary 600"
                    />
                  </div>
                  {/* Accent color preview */}
                  <div className="flex gap-1 ml-2">
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: currentTheme.colors.accent[400] }}
                      title="Accent 400"
                    />
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: currentTheme.colors.accent[600] }}
                      title="Accent 600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Border Radius Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium text-zinc-900 dark:text-white">
                  Border Radius
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Adjust the roundness of buttons, cards, and other elements.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <CustomDropdown
                label=""
                description=""
                options={BORDER_RADIUS_OPTIONS.map((option) => option.label)}
                selected={BORDER_RADIUS_OPTIONS.find(option => option.value === settings.borderRadius)?.label || "Large"}
                onSelect={(label) => {
                  const selectedOption = BORDER_RADIUS_OPTIONS.find(option => option.label === label);
                  if (selectedOption) {
                    updateSettings({ borderRadius: selectedOption.value });
                  }
                }}
                animationsDisabled={settings.animationsDisabled}
              />
              {/* Border radius preview */}
              <div className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-800">
                <div className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Preview
                </div>
                <div className="flex gap-2">
                  <div 
                    className={`w-8 h-8 bg-primary-500 ${
                      settings.borderRadius === "none" ? "rounded-none" :
                      settings.borderRadius === "sm" ? "rounded-sm" :
                      settings.borderRadius === "md" ? "rounded-md" :
                      settings.borderRadius === "lg" ? "rounded-lg" :
                      settings.borderRadius === "xl" ? "rounded-xl" :
                      settings.borderRadius === "2xl" ? "rounded-2xl" :
                      settings.borderRadius === "3xl" ? "rounded-3xl" :
                      settings.borderRadius === "full" ? "rounded-full" : "rounded-lg"
                    }`}
                  />
                  <div 
                    className={`w-16 h-8 bg-secondary-500 ${
                      settings.borderRadius === "none" ? "rounded-none" :
                      settings.borderRadius === "sm" ? "rounded-sm" :
                      settings.borderRadius === "md" ? "rounded-md" :
                      settings.borderRadius === "lg" ? "rounded-lg" :
                      settings.borderRadius === "xl" ? "rounded-xl" :
                      settings.borderRadius === "2xl" ? "rounded-2xl" :
                      settings.borderRadius === "3xl" ? "rounded-3xl" :
                      settings.borderRadius === "full" ? "rounded-full" : "rounded-lg"
                    }`}
                  />
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  {BORDER_RADIUS_OPTIONS.find(option => option.value === settings.borderRadius)?.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* @ts-ignore */}
      <HorizontalRule className="my-8" />

      {/* Visual Options Section */}
      <div>
        <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">
          Visual Options
        </h2>
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium text-zinc-900 dark:text-white">
                  Disable Animation
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Disables all animations throughout the app for a simpler
                  experience.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <TabButtonGroup
                options={[
                  { value: false, label: "Enabled" },
                  { value: true, label: "Disabled" },
                ]}
                value={settings.animationsDisabled}
                onChange={(animationsDisabled: boolean) =>
                  updateSettings({ animationsDisabled })
                }
                animationsDisabled={settings.animationsDisabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium text-zinc-900 dark:text-white">
                  Font Size
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Adjust the overall text size throughout the app.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <TabButtonGroup
                options={[
                  { value: 1, label: "Default" },
                  { value: 1.15, label: "Big" },
                  { value: 1.3, label: "Large" },
                ]}
                value={settings.fontSize}
                onChange={(fontSize: number) => updateSettings({ fontSize })}
                animationsDisabled={settings.animationsDisabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            <div className="space-y-6">
              <CustomDropdown
                label="Main Text Font"
                description="Used in general text throughout the app."
                options={mainFontOptions.map((f) =>
                  f === "Outfit" ? `${f} (default)` : f
                )}
                selected={
                  settings.mainFont === "Outfit"
                    ? `${settings.mainFont} (default)`
                    : settings.mainFont
                }
                onSelect={(option) =>
                  updateSettings({ mainFont: option.replace(" (default)", "") })
                }
                animationsDisabled={settings.animationsDisabled}
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-zinc-900 dark:text-white">
                Fonts Preview
              </h4>
              <FontPreview mainFont={settings.mainFont} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationTab;
