import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Key } from 'lucide-react';
import API_BASE from '../config/api';

const ResetPassword = ({ isOpen, closeModal, studentId, studentUsername }) => {
    const [resetStatus, setResetStatus] = useState({
        success: false,
        message: '',
        newPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    // Add this useEffect to reset the status when modal closes
    useEffect(() => {
        if (!isOpen) {
            setResetStatus({
                success: false,
                message: '',
                newPassword: ''
            });
        }
    }, [isOpen]);
    const handleResetPassword = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/students/${studentId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setResetStatus({
                    success: true,
                    message: data.message,
                    newPassword: data.new_temporary_password
                });
            } else {
                setResetStatus({
                    success: false,
                    message: data.detail || 'Failed to reset password',
                    newPassword: ''
                });
            }
        } catch (error) {
            setResetStatus({
                success: false,
                message: 'An error occurred while resetting password',
                newPassword: ''
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="bg-violet-100 dark:bg-violet-900/50 p-3 rounded-full">
                                        <Key className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                    </div>
                                </div>

                                <Dialog.Title className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">
                                    Reset Password for {studentUsername}
                                </Dialog.Title>

                                {!resetStatus.success ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                                            Are you sure you want to reset the password for this student?
                                            A new temporary password will be generated.
                                        </p>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={handleResetPassword}
                                                disabled={isLoading}
                                                className="flex-1 bg-violet-500 text-white py-2 px-4 rounded-md hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50"
                                            >
                                                {isLoading ? 'Resetting...' : 'Reset Password'}
                                            </button>
                                            <button
                                                onClick={closeModal}
                                                disabled={isLoading}
                                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                                            <p className="text-sm text-green-800 dark:text-green-400">
                                                {resetStatus.message}
                                            </p>
                                            <div className="mt-2">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                                                    New Temporary Password:
                                                </p>
                                                <code className="block mt-1 p-2 bg-white dark:bg-gray-900 rounded border border-green-200 dark:border-green-900 text-green-800 dark:text-green-400 font-mono">
                                                    {resetStatus.newPassword}
                                                </code>
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeModal}
                                            className="w-full bg-violet-500 text-white py-2 px-4 rounded-md hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors duration-300"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ResetPassword;
