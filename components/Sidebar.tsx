import React from 'react';
import { Search, User, X, LogIn, Plus } from './Icons';
import { User as FirebaseUser } from 'firebase/auth';
import Button from './ui/Button';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  user: FirebaseUser | null;
  onLoginClick: () => void;
  onSignOutClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, user, onLoginClick, onSignOutClick }) => {

  return (
    <aside className={`fixed md:relative top-0 left-0 h-full flex flex-col bg-zinc-100 dark:bg-[#111111] text-zinc-600 dark:text-zinc-400 p-4 z-40
                       transition-all duration-300 ease-in-out
                       md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                       w-64 ${isCollapsed ? 'md:w-20' : ''}`}>

      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'md:hidden' : 'flex'}`}>
          <span className="font-bold text-lg text-zinc-900 dark:text-white">O-Chat</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded md:hidden" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <Button className={`w-full mb-6 ${isCollapsed ? 'md:px-2.5' : ''}`}>
        {isCollapsed ? <Plus className="w-5 h-5" /> : 'New Chat'}
      </Button>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder={isCollapsed ? '' : "Search your threads..."}
          className="w-full bg-white dark:bg-[#1c1c1c] border border-zinc-300 dark:border-zinc-700 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div className={`flex-grow overflow-y-auto block ${isCollapsed ? 'md:hidden' : ''}`}>
        <div className="text-xs font-semibold text-zinc-500 mb-2">Today</div>
        <ul>
          <li className="py-2 px-3 text-sm text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-800 rounded-md cursor-pointer">
            Meaning of Life Inquiry
          </li>
        </ul>
      </div>

      <div className="mt-auto">
        {user ? (
          <div className="flex flex-col">
            <div className="flex items-center p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.charAt(0).toUpperCase() || 'U'}&background=random`} alt={user.displayName || user.email || 'User avatar'} className="w-8 h-8 rounded-full" />
              <div className={`ml-3 flex-grow block overflow-hidden ${isCollapsed ? 'md:hidden' : ''}`}>
                <div className="font-semibold text-zinc-900 dark:text-white truncate">{user.displayName || user.email}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Signed In</div>
              </div>
            </div>
             <div className={`mt-2 ${isCollapsed ? 'md:hidden' : ''}`}>
               <Button variant="secondary" size="sm" className="w-full" onClick={onSignOutClick}>
                  Sign Out
               </Button>
            </div>
          </div>
        ) : (
          <button onClick={onLoginClick} className={`flex items-center justify-center w-full text-zinc-900 dark:text-white font-semibold py-3.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${isCollapsed ? 'px-2.5' : 'px-4 gap-2'}`}>
            {isCollapsed ? <User className="w-5 h-5" /> : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;