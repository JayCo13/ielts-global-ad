import React, { useState } from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import API_BASE from '../../config/api';

const PackageFormModal = ({ onClose, onSuccess, isCreate, packageData }) => {
  const [formData, setFormData] = useState({
    name: packageData?.name || '',
    duration_months: packageData?.duration_months || 1,
    price: packageData?.price || 0,
    description: packageData?.description || '',
    is_active: packageData?.is_active !== undefined ? packageData.is_active : true,
    package_type: packageData?.package_type || 'all_skills',
    skill_type: packageData?.skill_type || null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Package name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Package name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Package name must not exceed 50 characters';
    }

    // Duration validation
    if (!formData.duration_months || formData.duration_months < 1) {
      newErrors.duration_months = 'Duration must be at least 1 month';
    } else if (formData.duration_months > 36) {
      newErrors.duration_months = 'Duration must not exceed 36 months';
    }

    // Price validation for USD
    if (formData.price < 0) {
      newErrors.price = 'Price must not be negative';
    } else if (formData.price > 500) {
      newErrors.price = 'Price must not exceed $500 USD';
    }

    // Description validation
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must not exceed 1000 characters';
    }

    // Skill type validation
    if (formData.package_type === 'single_skill' && !formData.skill_type) {
      newErrors.skill_type = 'Please select a skill type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = isCreate 
        ? `${API_BASE}/admin/vip/packages` 
        : `${API_BASE}/admin/vip/packages/${packageData.package_id}`;
      
      // Build query parameters
      const params = new URLSearchParams({
        name: formData.name,
        duration_months: formData.duration_months.toString(),
        price: formData.price.toString(),
        package_type: formData.package_type,
        is_active: formData.is_active.toString()
      });

      // Add optional parameters
      if (formData.description) {
        params.append('description', formData.description);
      }
      
      if (formData.package_type === 'single_skill' && formData.skill_type) {
        params.append('skill_type', formData.skill_type);
      }

      // Append query parameters to URL
      url = `${url}?${params.toString()}`;

      const response = await fetch(url, {
        method: isCreate ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save package');
      }

      toast.success(isCreate ? 'Package created successfully!' : 'Package updated successfully!');
      onSuccess();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isCreate ? 'Create New Package' : 'Edit Package'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              placeholder="e.g. Premium Monthly Plan"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Type*
            </label>
            <select
              name="package_type"
              value={formData.package_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all_skills">All Skills</option>
              <option value="single_skill">Single Skill</option>
            </select>
          </div>
          
          {formData.package_type === 'single_skill' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Type*
              </label>
              <select
                name="skill_type"
                value={formData.skill_type || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">Select skill</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
                <option value="listening">Listening</option>
              </select>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (months)*
            </label>
            <input
              type="number"
              name="duration_months"
              value={formData.duration_months}
              onChange={handleChange}
              required
              min="1"
              className={`w-full px-3 py-2 border ${errors.duration_months ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
            {errors.duration_months && (
              <p className="mt-1 text-xs text-red-500">{errors.duration_months}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (USD)*
            </label>
            <div className="relative">
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pr-12`}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                USD
              </span>
            </div>
            {errors.price && (
              <p className="mt-1 text-xs text-red-500">{errors.price}</p>
            )}
            {formData.price > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(formData.price)}
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              placeholder="Package description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>
          
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  {isCreate ? 'Create Package' : 'Update Package'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageFormModal;
