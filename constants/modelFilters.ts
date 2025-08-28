import { FilterCategory } from "../components/ui/AdvancedFilter";
import { Zap, Brain, Eye, Palette, Edit, Video, Volume2 } from "../components/Icons";

// Model feature categories for filtering
export const MODEL_FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "core-capabilities",
    label: "Core Capabilities",
    icon: Zap,
    options: [
      {
        id: "text-generation",
        label: "Text Generation",
        icon: Zap,
        category: "core-capabilities"
      },
      {
        id: "tool-calling",
        label: "Tool Calling",
        icon: Zap,
        category: "core-capabilities"
      },
      {
        id: "reasoning",
        label: "Reasoning",
        icon: Brain,
        category: "core-capabilities"
      }
    ]
  },
  {
    id: "media-capabilities",
    label: "Media Capabilities",
    icon: Eye,
    options: [
      {
        id: "vision",
        label: "Vision",
        icon: Eye,
        category: "media-capabilities"
      },
      {
        id: "image-generation",
        label: "Image Generation",
        icon: Palette,
        category: "media-capabilities"
      },
      {
        id: "image-editing",
        label: "Image Editing",
        icon: Edit,
        category: "media-capabilities"
      },
      {
        id: "video-generation",
        label: "Video Generation",
        icon: Video,
        category: "media-capabilities"
      },
      {
        id: "audio-generation",
        label: "Audio Generation",
        icon: Volume2,
        category: "media-capabilities"
      }
    ]
  }
];

// Legacy feature options for backward compatibility
export const FEATURE_OPTIONS = [
  "Text Generation",
  "Tool Calling",
  "Reasoning", 
  "Vision",
  "Image Generation",
  "Image Editing",
  "Video Generation",
  "Audio Generation"
];

// Mapping between old and new filter IDs
export const FILTER_ID_MAPPING: Record<string, string> = {
  "Text Generation": "text-generation",
  "Tool Calling": "tool-calling",
  "Reasoning": "reasoning",
  "Vision": "vision",
  "Image Generation": "image-generation",
  "Image Editing": "image-editing",
  "Video Generation": "video-generation",
  "Audio Generation": "audio-generation"
};

// Reverse mapping for compatibility
export const REVERSE_FILTER_ID_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(FILTER_ID_MAPPING).map(([key, value]) => [value, key])
);
