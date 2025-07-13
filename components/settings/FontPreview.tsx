import React from 'react';

interface FontPreviewProps {
    mainFont: string;
    codeFont: string;
}

const FontPreview: React.FC<FontPreviewProps> = ({ mainFont, codeFont }) => {
    const codeFontFamily = codeFont.split(' (')[0];

    return (
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg space-y-4 border border-zinc-200 dark:border-zinc-800" style={{ fontFamily: mainFont }}>
             <div className="bg-white dark:bg-zinc-700/50 rounded-lg p-3">
                <p className="text-sm text-zinc-800 dark:text-zinc-200">Can you write me a simple hello world program?</p>
             </div>
             <div className="space-y-2">
                <p className="text-sm text-zinc-800 dark:text-zinc-200">Sure, here you go:</p>
                <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <div className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
                        typescript
                    </div>
                    <div className="p-3 bg-white dark:bg-zinc-800 text-sm" style={{ fontFamily: codeFontFamily }}>
                        <span className="text-purple-500">function</span> <span className="text-blue-500">greet</span>(<span className="text-orange-500">name</span>: <span className="text-teal-400">string</span>) {'{'}<br/>
                        &nbsp;&nbsp;console.<span className="text-blue-500">log</span>(<span className="text-green-500">{`'Hello, ${name}!'`}</span>);<br/>
                        &nbsp;&nbsp;<span className="text-purple-500">return</span> <span className="text-orange-500">true</span>;<br/>
                        {'}'}
                    </div>
                </div>
             </div>
        </div>
    );
};

export default FontPreview;