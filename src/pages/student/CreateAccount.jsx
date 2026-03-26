import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ChevronRight, UserPlus } from 'lucide-react';
import API_BASE from '../../config/api';

const CreateAccount = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [responseData, setResponseData] = useState(null);
    const [countdown, setCountdown] = useState(20);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_BASE}/create-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                setResponseData(data);
                setIsDialogOpen(true);
                startCountdown();
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleClose = () => {
        setIsDialogOpen(false);
        navigate('/');
    };

    const startCountdown = () => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsDialogOpen(false);
                    navigate('/');
                    return 20;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 py-4">
                        <Link to="/" className="text-gray-400 hover:text-violet-600 transition-colors">
                            <Home size={20} />
                        </Link>
                        <ChevronRight size={20} className="text-gray-400" />
                        <span className="text-violet-600 dark:text-violet-400">Create Student Account</span>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-8 py-6 bg-violet-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                            <UserPlus size={24} className="text-violet-600 dark:text-violet-400" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Student Account</h1>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Enter the student details below</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                                        placeholder="student@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        required
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                                        placeholder="Enter username"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Link
                                    to="/"
                                    className="mr-4 px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors duration-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    className="px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors duration-200"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Transition appear show={isDialogOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsDialogOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
                                    <Dialog.Title className="text-lg font-medium font-bold text-green-500 dark:text-white mb-4">
                                        Account Created Successfully
                                    </Dialog.Title>

                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600 font-bold dark:text-gray-300">
                                            Username: {responseData?.username}
                                        </p>
                                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                                                Temporary Password: {responseData?.temporary_password}
                                            </p>
                                        </div>
                                        <p className="text-xs text-red-500">
                                            This password will be hidden in {countdown} seconds
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleClose}
                                        className="mt-6 w-full bg-violet-600 text-white py-2 px-4 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors duration-200"
                                    >
                                        Close
                                    </button>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default CreateAccount;
