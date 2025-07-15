import React from 'react';

interface FontPreviewProps {
    mainFont: string;
    codeFont: string;
}

const FontPreview: React.FC<FontPreviewProps> = ({ mainFont, codeFont }) => {
    const codeFontFamily = codeFont.split(' (')[0];
}