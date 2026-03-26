import React, { useState, useEffect } from 'react';
// Update the import to use DropdownNotifications
import DropdownNotifications from '../components/DropdownNotifications';
import Help from '../components/DropdownHelp';
import UserMenu from '../components/DropdownProfile';
import ThemeToggle from '../components/ThemeToggle';
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Header({
  sidebarOpen,
  setSidebarOpen,
  hasNewNotification,
  setHasNewNotification,
  variant = 'default',
}) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Add this useEffect to ensure proper initialization
  useEffect(() => {
    // Force a check for notifications when the header mounts
    const checkInitialNotifications = async () => {
      const event = new Event('checkNotifications');
      window.dispatchEvent(event);
    };
    
    checkInitialNotifications();
  }, []);

  // Remove or modify this function as it's redundant with what's in DropdownNotifications
  // The handleNotificationClick function in Header is causing conflicts
  const handleNotificationClick = async () => {
    // This function should be removed or modified to not interfere with DropdownNotifications
    // If you need to keep it, make sure it's coordinated with the DropdownNotifications component
    console.log('Đã nhấp vào thông báo Header - điều này nên được xử lý bởi component DropdownNotifications');
  };

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-white/90 dark:max-lg:before:bg-gray-800/90 before:-z-10 z-30 ${variant === 'v2' || variant === 'v3' ? 'before:bg-white after:absolute after:h-px after:inset-x-0 after:top-full after:bg-gray-200 dark:after:bg-gray-700/60 after:-z-10' : 'max-lg:shadow-sm lg:before:bg-gray-100/90 dark:lg:before:bg-gray-900/90'} ${variant === 'v2' ? 'dark:before:bg-gray-800' : ''} ${variant === 'v3' ? 'dark:before:bg-gray-900' : ''}`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'}`}>

          {/* Header: Left side */}
          <div className="flex">

            {/* Hamburger button */}
            <button
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(!sidebarOpen); }}
            >
              <span className="sr-only">Mở thanh bên</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <DropdownNotifications align="right" key="notifications" />
            <ThemeToggle />
            <hr className="w-px h-6 bg-gray-200 dark:bg-gray-700/60 border-none" />
            <UserMenu align="right" />

          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;