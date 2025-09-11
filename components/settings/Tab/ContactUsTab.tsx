import React from 'react';
import { GitHub } from '../../Icons';

interface ContactUsTabProps {}

const ContactUsTab: React.FC<ContactUsTabProps> = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-1 text-zinc-900 dark:text-white">Contact Us</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                    Get in touch with us or contribute to the project
                </p>
            </div>

            {/* Open Source Section */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-white">
                    Open Source Project
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    O-Chat is an open-source project. You can view the source code, report issues, 
                    contribute features, or star the repository on GitHub.
                </p>
                
                <a
                    href="https://github.com/rasyidrafi/o-chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                    <GitHub size={20} />
                    View on GitHub
                </a>
            </div>

            {/* Contributing Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
                    Contributing
                </h3>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                    We welcome contributions from the community! Here's how you can help:
                </p>
                <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-200">
                    <li>Report bugs or request features via GitHub Issues</li>
                    <li>Submit pull requests with improvements or fixes</li>
                    <li>Help improve documentation</li>
                    <li>Share feedback and suggestions</li>
                </ul>
            </div>

            {/* Support Section */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
                    Get Support
                </h3>
                <p className="text-green-800 dark:text-green-200 mb-4">
                    Need help or have questions? Here are the best ways to reach us:
                </p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-green-800 dark:text-green-200">
                            <strong>GitHub Issues:</strong> For bug reports and feature requests
                        </span>
                    </div>
                </div>
            </div>

            {/* Project Info */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    O-Chat is built with ❤️ by the open source community
                </p>
            </div>
        </div>
    );
};

export default ContactUsTab;
