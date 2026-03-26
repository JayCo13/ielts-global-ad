import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Transition from '../utils/Transition';
import { format } from 'date-fns';
import { Bell, BookOpen, DollarSign, MessageSquare, Mic, CheckCircle, XCircle, Clock } from 'lucide-react';
import API_BASE from '../config/api';

function DropdownNotifications({ align }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [error, setError] = useState(null);

  const trigger = useRef(null);
  const dropdown = useRef(null);
  const originalTitle = useRef(document.title);
  const notificationSound = useRef(new Audio('/sounds/notification.mp3'));
  const lastChecked = useRef(localStorage.getItem('last_notification_checked') || new Date().toISOString());
  const navigate = useNavigate();

  // Add the handleNotificationItemClick function inside the component
  const handleNotificationItemClick = (notification) => {
    // Navigate based on notification type
    if (notification.type === 'vip_transaction') {
      navigate('/subscriptions');
    } else if (notification.type === 'writing_submission') {
      navigate('/admin/writing-submissions');
    } else if (notification.type === 'speaking_submission') {
      navigate('/admin/speaking-submissions');
    } else if (notification.type === 'exam_completion') {
      navigate('/admin/exam-results');
    }

    // Mark notification as read when clicked
    if (!notification.is_read) {
      try {
        fetch(`${API_BASE}/admin/notifications/mark-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notification_ids: [notification.id]
          })
        }).then(response => {
          if (response.ok) {
            // Update local state to mark this notification as read
            setNotifications(prev =>
              prev.map(item =>
                item.id === notification.id
                  ? { ...item, is_read: true }
                  : item
              )
            );
          }
        });
      } catch (error) {
        console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      }
    }

    // Close dropdown
    setDropdownOpen(false);
  };

  // Add window event listener for notifications
  useEffect(() => {
    const handleNotificationCheck = () => {
      fetchNotifications();
    };

    window.addEventListener('checkNotifications', handleNotificationCheck);
    return () => window.removeEventListener('checkNotifications', handleNotificationCheck);
  }, []);

  // Modify fetchNotifications to properly handle new notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/dashboard/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) throw new Error('Không thể tải thông báo');

      const data = await response.json();
      console.log('Dữ liệu thông báo:', data); // Debug log

      // Make sure we have the full data
      const latestNotifications = data.slice(0, 4);

      // Check for new notifications based on is_read flag
      const hasUnread = latestNotifications.some(notification => notification.is_read === false);

      if (hasUnread && !dropdownOpen) {
        setHasNewNotifications(true);
        document.title = `(${latestNotifications.filter(n => n.is_read === false).length}) Mới • ${originalTitle.current}`;
        try {
          await notificationSound.current.play();
        } catch (err) {
          console.log('Phát âm thanh thất bại:', err);
        }
      }

      setNotifications(latestNotifications);
    } catch (err) {
      setError('Không thể tải thông báo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async () => {
    setDropdownOpen(!dropdownOpen);

    // Only mark as read when closing the dropdown, not when opening it
    if (dropdownOpen && hasNewNotifications) {
      try {
        const unreadNotifications = notifications
          .filter(notification => notification.is_read === false)
          .map(notification => notification.id);

        if (unreadNotifications.length > 0) {
          console.log('Đánh dấu đã đọc:', unreadNotifications);

          const response = await fetch(`${API_BASE}/admin/notifications/mark-read`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              notification_ids: unreadNotifications
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Phản hồi đánh dấu đã đọc:', result);

            // Update local notification state to reflect read status
            setNotifications(prev =>
              prev.map(notification =>
                result.notification_ids.includes(notification.id)
                  ? { ...notification, is_read: true }
                  : notification
              )
            );

            setHasNewNotifications(false);
            document.title = originalTitle.current;
            lastChecked.current = new Date().toISOString();
            localStorage.setItem('last_notification_checked', lastChecked.current);
          }
        }
      } catch (error) {
        console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      }
    }
  };

  // Add polling effect
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      document.title = originalTitle.current;
    };
  }, []);

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const getNotificationIcon = (type) => {
    const icons = {
      exam_completion: <BookOpen className="inline-block w-4 h-4 mr-2 text-blue-500" />,
      vip_transaction: <DollarSign className="inline-block w-4 h-4 mr-2 text-green-500" />,
      writing_submission: <MessageSquare className="inline-block w-4 h-4 mr-2 text-violet-500" />,
      speaking_submission: <Mic className="inline-block w-4 h-4 mr-2 text-amber-500" />
    };
    return icons[type] || null;
  };

  const getStatusIcon = (notification) => {
    if (notification.type !== 'vip_transaction') return null;
    if (notification.status === 'completed') {
      return <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-1" />;
    } else if (notification.status === 'reject') {
      return <XCircle className="w-3.5 h-3.5 text-red-500 ml-1" />;
    }
    return <Clock className="w-3.5 h-3.5 text-yellow-500 ml-1" />;
  };

  return (
    <div className="relative inline-flex">
      <button
        ref={trigger}
        className={`w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full ${dropdownOpen && 'bg-gray-200'}`}
        onClick={handleNotificationClick}
      >
        <span className="sr-only">Thông báo</span>
        <div className="relative">
          <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          {hasNewNotifications && (
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse"></div>
          )}
        </div>
      </button>

      <Transition
        show={dropdownOpen}
        className={`origin-top-right z-50 absolute top-full -mr-48 sm:mr-0 min-w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
        enter="transition ease-out duration-200 transform"
        enterStart="opacity-0 -translate-y-2"
        enterEnd="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveStart="opacity-100"
        leaveEnd="opacity-0"
      >
        <div ref={dropdown}>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase pt-1.5 pb-2 px-4">
            <span>Thông báo</span>
            {loading && <span className="text-xs text-gray-500">Đang tải...</span>}
          </div>

          {error && (
            <div className="px-4 py-2 text-sm text-red-500">{error}</div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Không có thông báo</p>
            </div>
          )}

          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              console.log(`Thông báo ${notification.id} đã đọc:`, notification.is_read);
              return (
                <li key={notification.id} className="border-b border-gray-200 dark:border-gray-700/60 last:border-0">
                  <div
                    onClick={() => handleNotificationItemClick(notification)}
                    className={`block py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer ${notification.is_read === true
                      ? 'bg-gray-50 dark:bg-gray-800'
                      : 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="block text-sm">
                        {notification.type === 'vip_transaction' ? getStatusIcon(notification) : getNotificationIcon(notification.type)}
                        <span className={`font-medium ml-1 ${notification.is_read === true
                          ? 'text-gray-800 dark:text-gray-100'
                          : 'text-blue-800 dark:text-blue-200'
                          }`}>{notification.title}</span>
                        {' '}{notification.message}
                      </span>
                      {!notification.is_read && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-500/20 ml-2">
                          Mới
                        </span>
                      )}
                    </div>
                    <span className="block text-xs font-medium text-gray-400 dark:text-gray-500">
                      {formatDate(notification.timestamp)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Transition>
    </div>
  );
}

export default DropdownNotifications;
