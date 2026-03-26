import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import loginImage from '../../images/thiieltstrenmaytinh.png';
import API_BASE from '../../config/api';

const LoginForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        general: ''
    });
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
        // Clear error when user starts typing
        setErrors({
            ...errors,
            [e.target.id]: '',
            general: ''
        });
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            username: '',
            password: '',
            general: ''
        };

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            isValid = false;
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();  // This line is crucial to prevent form auto-submission

        // First validate the form
        if (!validateForm()) {
            return;
        }

        try {
            const formBody = new URLSearchParams();
            formBody.append('username', formData.username);
            formBody.append('password', formData.password);

            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    setErrors({
                        ...errors,
                        general: 'Invalid username or password'
                    });
                } else {
                    setErrors({
                        ...errors,
                        general: errorData.detail || 'An error occurred during login'
                    });
                }
                return;
            }

            const data = await response.json();

            if (!data.access_token) {
                setErrors({
                    ...errors,
                    general: 'Invalid server response - no access token received'
                });
                return;
            }

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_role', data.role);
            localStorage.setItem('username', data.username);

            navigate('/');

        } catch (err) {
            setErrors({
                ...errors,
                general: 'Login failed. Please try again later.'
            });
            console.error('Login error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl flex overflow-hidden">
                {/* Left side with logo */}
                <div className="w-1/2 p-12 relative flex flex-col items-center justify-center overflow-hidden">
                    {/* Modern white background with subtle gradients */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-300" />

                    {/* Enhanced geometric patterns */}
                    <div className="absolute inset-0">
                        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-gray-100 to-gray-50 rounded-full blur-3xl animate-pulse opacity-60" />
                        <div className="absolute right-0 w-[400px] h-[400px] bg-gradient-to-l from-gray-50 to-white rounded-full blur-3xl animate-pulse opacity-50" />
                        <div className="absolute left-20 top-20 w-[200px] h-[200px] bg-gradient-to-tr from-teal-50 to-blue-50 rounded-full blur-2xl animate-pulse-slow opacity-40" />
                        <div className="absolute right-20 bottom-20 w-[300px] h-[300px] bg-gradient-to-bl from-pink-50 to-purple-50 rounded-full blur-2xl animate-float opacity-30" />
                    </div>

                    {/* Logo content */}
                    <div className="mb-8 flex flex-col items-center relative z-10 animate-fade-in">
                        <img
                            src={loginImage}
                            alt="Logo"
                            width={200}
                            height={170}
                            className="hover:scale-105 transition-transform duration-300"
                        />
                        <i><span className="text-gray-600 text-lg font-semibold">
                            Powered by Jayden Co
                        </span></i>
                    </div>

                    {/* Footer links */}
                    <div className="absolute bottom-6 flex gap-6 text-sm text-gray-500 relative z-10">
                        <a href="#" className="hover:text-gray-800 transition-colors duration-300 hover:scale-105">About</a>
                        <a href="#" className="hover:text-gray-800 transition-colors duration-300 hover:scale-105">Privacy</a>
                        <a href="#" className="hover:text-gray-800 transition-colors duration-300 hover:scale-105">Terms of use</a>
                        <a href="#" className="hover:text-gray-800 transition-colors duration-300 hover:scale-105">FAQ</a>
                    </div>
                </div>

                {/* Right side with login form */}
                <div className="w-1/2 p-12">
                    <div className="max-w-sm mx-auto">
                        <i><h2 className="text-2xl font-bold text-teal-400 mb-8">Ielts TaJun Dashboard Login</h2></i>

                        {errors.general && (
                            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded">
                                {errors.general}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6"
                            autoComplete="off"  // Add this to prevent browser auto-complete
                        >
                            <div>
                                <label htmlFor="username" className="block text-sm text-gray-600 font-bold mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 transition-shadow duration-300`}
                                />
                                {errors.username && (
                                    <p className="mt-1 text-xs text-red-500">{errors.username}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-bold text-gray-600 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 transition-shadow duration-300`}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-teal-400 text-white py-2 px-4 rounded-md hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg"
                            >
                                Log in
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
