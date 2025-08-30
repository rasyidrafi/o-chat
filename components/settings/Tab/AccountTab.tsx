import React from 'react';
import { Google, LogIn } from '../../Icons';
import Button from '../../ui/Button';
import { auth, provider } from '../../../firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../../contexts/AuthContext';

interface AccountTabProps {
    onOpenAuthModal: () => void;
    onSignOutClick: () => void;
}

const AccountTab: React.FC<AccountTabProps> = ({ onOpenAuthModal, onSignOutClick }) => {
    const { user, isSignedIn } = useAuth();
    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Account</h2>
            {isSignedIn ? (
                <div className="space-y-4">
                    <p>You are signed in as <span className="font-semibold">{user?.email}</span>.</p>
                    <Button onClick={onSignOutClick} variant="destructive">
                        Sign Out
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p>Sign in to sync your history and preferences across devices.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleSignIn} className="gap-2 flex-1">
                            <Google className="w-5 h-5" />
                            Sign in with Google
                        </Button>
                        <Button variant="secondary" className="gap-2 flex-1" onClick={onOpenAuthModal}>
                            <LogIn className="w-5 h-5" />
                            Sign in with Email
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountTab;
