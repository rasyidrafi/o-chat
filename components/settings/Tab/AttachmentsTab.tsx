import React from 'react';

interface AttachmentsTabProps {}

const AttachmentsTab: React.FC<AttachmentsTabProps> = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>Attachments</h2>
            <p className="mt-4">Settings for Attachments are not implemented yet.</p>
        </div>
    );
};

export default AttachmentsTab;
