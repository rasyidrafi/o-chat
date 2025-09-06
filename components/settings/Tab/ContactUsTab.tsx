import React from 'react';

interface ContactUsTabProps {}

const ContactUsTab: React.FC<ContactUsTabProps> = () => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>Contact Us</h2>
            <p className="mt-4">Settings for Contact Us are not implemented yet.</p>
        </div>
    );
};

export default ContactUsTab;
