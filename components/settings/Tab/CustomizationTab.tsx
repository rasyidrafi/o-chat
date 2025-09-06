import React, { useState, useEffect } from "react";
import SettingsTextarea from "../SettingsTextarea";
import TabButtonGroup from "../../ui/TabButtonGroup";
import CustomDropdown from "../../ui/CustomDropdown";
import FontPreview from "../FontPreview";
import Button from "../../ui/Button";
import { AppSettings } from "../../../hooks/useSettings";
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
                  { value: 1.07, label: "Big" },
                  { value: 1.14, label: "Large" },
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
