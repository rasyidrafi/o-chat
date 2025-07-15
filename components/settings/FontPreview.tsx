import React from 'react';

interface FontPreviewProps {
    mainFont: string;
}

const FontPreview: React.FC<FontPreviewProps> = ({ mainFont }) => {
    return (
        <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Main Font Preview</h3>
            <p style={{ fontFamily: mainFont }} className="text-base text-zinc-900 dark:text-zinc-100">
                The quick brown fox jumps over the lazy dog. This is how your main text will appear in the application.
            </p>
        </div>
    );
};

export default FontPreview;