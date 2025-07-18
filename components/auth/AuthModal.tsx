import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock } from '../Icons';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { auth } from '../../firebase.ts';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthTab = 'Login' | 'Register';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('Login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (activeTab === 'Register') {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setLoading(false);
                return;
            }
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                // The onAuthStateChanged listener in App.tsx will handle closing the modal
            } catch (err: any) {
                setError(err.message.replace('Firebase: ', ''));
            }
        } else { // Login
            try {
                await signInWithEmailAndPassword(auth, email, password);
                 // The onAuthStateChanged listener in App.tsx will handle closing the modal
            } catch (err: any)
             {
                setError(err.message.replace('Firebase: ', ''));
            }
        }
        setLoading(false);
    };
    
    const resetState = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
        setActiveTab('Login');
        setLoading(false);
    }

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleTabChange = (tab: AuthTab) => {
        resetState();
        setActiveTab(tab);
    }


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md p-8 bg-white dark:bg-[#212121] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800"
                    >
                        <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-pink-500">
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex mb-6 border-b border-zinc-200 dark:border-zinc-800">
                            <Tab title="Login" activeTab={activeTab} setActiveTab={handleTabChange} />
                            <Tab title="Register" activeTab={activeTab} setActiveTab={handleTabChange} />
                        </div>

                        <form onSubmit={handleAuthAction} className="space-y-4">
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<Mail className="w-4 h-4 text-zinc-400" />}
                                required
                            />
                            <Input 
                                id="password" 
                                type="password" 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<Lock className="w-4 h-4 text-zinc-400" />}
                                required
                            />
                            {activeTab === 'Register' && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            icon={<Lock className="w-4 h-4 text-zinc-400" />}
                                            required
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            )}
                            
                            {error && <p className="text-sm text-red-500 text-center pt-1">{error}</p>}
                            
                            <div className="pt-2">
                                <Button type="submit" className="w-full gap-2" disabled={loading}>
                                    {loading ? 'Processing...' : (activeTab === 'Login' ? 'Sign In' : 'Create Account')}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


interface TabProps {
    title: AuthTab;
    activeTab: AuthTab;
    setActiveTab: (tab: AuthTab) => void;
}

const Tab: React.FC<TabProps> = ({ title, activeTab, setActiveTab }) => {
    const isActive = activeTab === title;
    return (
        <button
            type="button"
            onClick={() => setActiveTab(title)}
            className={`relative w-1/2 py-3 text-sm font-semibold text-center transition-colors focus:outline-none
                ${isActive ? 'text-pink-500' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
        >
            {title}
            {isActive && <motion.div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-pink-500" layoutId="auth-tab-indicator" />}
        </button>
    );
};

export default AuthModal;
