import React from 'react';

interface FontPreviewProps {
    mainFont: string;
    codeFont: string;
}

const FontPreview: React.FC<FontPreviewProps> = ({ mainFont, codeFont }) => {
    const codeFontFamily = codeFont.split(' (')[0];

    return (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Font Preview</h3>
                <p style={{ fontFamily: mainFont }} className="text-base text-gray-900 dark:text-gray-100">
                    The quick brown fox jumps over the lazy dog. This is how your main text will appear in the application.
                </p>
            </div>
            
            <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code Font Preview</h3>
                <pre 
                    style={{ fontFamily: codeFontFamily }} 
                    className="text-sm bg-gray-100 dark:bg-gray-900 p-3 rounded border text-gray-900 dark:text-gray-100"
                >
{`function greet(name: string): string {
    return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);`}
                </pre>
            </div>
        </div>
    );
};

export default FontPreview;