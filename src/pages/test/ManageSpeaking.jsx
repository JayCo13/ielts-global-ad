import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Home, ChevronRight, Plus, Edit, Trash2, AlertTriangle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Toaster, toast } from 'react-hot-toast';
import EditSpeakingAccessDialog from '../../components/dialogs/EditSpeakingAccessDialog';
import API_BASE from '../../config/api';

const ManageSpeaking = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);
    const [loading, setLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        sortBy: 'created_at',
    });
    const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
    const [selectedMaterialForAccess, setSelectedMaterialForAccess] = useState(null);
    const [selectedAccessTypes, setSelectedAccessTypes] = useState([]);

    const toAbsoluteUrl = (u) => (u && u.startsWith('/')) ? `${API_BASE}${u}` : u;

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/admin/speaking/materials`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            const data = await response.json();
            setMaterials(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching speaking materials:', error);
            setLoading(false);
        }
    };

    const handleDeleteMaterial = async () => {
        if (!materialToDelete) return;

        try {
            const response = await fetch(`${API_BASE}/admin/speaking/materials/${materialToDelete.material_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.ok) {
                setIsDeleteDialogOpen(false);
                fetchMaterials();
                toast.success('Speaking material deleted successfully', {
                    style: {
                        background: '#10B981',
                        color: '#FFFFFF',
                    },
                });
            } else {
                const data = await response.json();
                toast.error(data.detail || 'Failed to delete speaking material', {
                    style: {
                        background: '#EF4444',
                        color: '#FFFFFF',
                    },
                });
            }
        } catch (error) {
            console.error('Error deleting speaking material:', error);
            toast.error('Failed to delete speaking material');
        }
    };

    const handleEditMaterial = (m) => {
        navigate(`/edit-speaking-test/${m.material_id}`);
    };

    const handleUpdateAccess = async () => {
        if (!selectedMaterialForAccess) return;
        try {
            const response = await fetch(`${API_BASE}/admin/speaking/materials/${selectedMaterialForAccess.material_id}/access`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ access_types: selectedAccessTypes })
            });

            if (response.ok) {
                toast.success('Access types updated successfully');
                setIsAccessDialogOpen(false);
                setSelectedMaterialForAccess(null);
            } else {
                toast.error('Failed to update access types');
            }
        } catch (error) {
            console.error('Error updating access types:', error);
            toast.error('Failed to update access types');
        }
    };

    const handleAccessClick = (material) => {
        setSelectedMaterialForAccess(material);
        setIsAccessDialogOpen(true);
    };

    // Filter and sort materials
    const filteredItems = materials.filter(m => {
        return (m.title || '').toLowerCase().includes(filters.search.toLowerCase());
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (filters.sortBy === 'title') {
            return (a.title || '').localeCompare(b.title || '');
        } else if (filters.sortBy === 'created_at') {
            return new Date(b.created_at) - new Date(a.created_at);
        }
        return 0;
    });

    // Pagination
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = sortedItems.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Toaster position="top-right" />
            <nav className="bg-white border-b border-gray-200 flex-none">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center space-x-2 py-4">
                        <Link to="/" className="text-gray-400 hover:text-violet-600">
                            <Home size={20} />
                        </Link>
                        <ChevronRight className="text-gray-400" size={20} />
                        <span className="text-violet-600">Manage Speaking Forecast</span>
                    </div>
                </div>
            </nav>

            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                                Speaking Forecast Materials
                            </h2>
                            <Link
                                to="/create_speaking_test"
                                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <Plus size={18} />
                                <span>Create New Material</span>
                            </Link>
                        </div>

                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <input
                                        type="text"
                                        placeholder="Search topics..."
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    />
                                </div>
                                <div className="w-48">
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                    >
                                        <option value="created_at">Sort by Date</option>
                                        <option value="title">Sort by Title</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading materials...</p>
                            </div>
                        ) : currentItems.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="bg-gray-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto">
                                    <FileText className="text-gray-400" size={24} />
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">No speaking materials found</h3>
                                <p className="mt-2 text-gray-600">
                                    {filters.search ? 'Try adjusting your search criteria.' : 'Create your first speaking material to get started.'}
                                </p>
                                {!filters.search && (
                                    <Link
                                        to="/test/create-speaking"
                                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                    >
                                        <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                        Create New Material
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Title
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                PDF
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentItems.map((m) => (
                                            <tr key={m.material_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{m.title}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {m.created_at ? format(new Date(m.created_at), 'MMM d, yyyy') : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {m.pdf_url ? (
                                                        <a href={toAbsoluteUrl(m.pdf_url)} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">View</a>
                                                    ) : (
                                                        <span className="text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleAccessClick(m)}
                                                            className="text-violet-600 hover:text-violet-900 p-1 rounded-full hover:bg-violet-50"
                                                            title="Manage Access"
                                                        >
                                                            <Shield size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditMaterial(m)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setMaterialToDelete(m);
                                                                setIsDeleteDialogOpen(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && sortedItems.length > itemsPerPage && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Previous
                                </button>
                                <div className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Transition show={isDeleteDialogOpen}>
                <Dialog
                    as="div"
                    className="fixed inset-0 z-10 overflow-y-auto"
                    onClose={() => setIsDeleteDialogOpen(false)}
                >
                    <div className="min-h-screen px-4 text-center">
                        <TransitionChild
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black opacity-30" />
                        </TransitionChild>

                        <span
                            className="inline-block h-screen align-middle"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>

                        <TransitionChild
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>

                                <DialogTitle
                                    as="h3"
                                    className="mt-4 text-lg font-medium leading-6 text-center text-gray-900"
                                >
                                    Delete Speaking Material
                                </DialogTitle>

                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 text-center">
                                        Are you sure you want to delete the material "{materialToDelete?.title}"? This action cannot be undone.
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-center space-x-4">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                                        onClick={handleDeleteMaterial}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </TransitionChild>
                    </div>
                </Dialog>
            </Transition>

            <EditSpeakingAccessDialog
                isOpen={isAccessDialogOpen}
                onClose={() => {
                    setIsAccessDialogOpen(false);
                    setSelectedMaterialForAccess(null);
                }}
                onUpdate={handleUpdateAccess}
                selectedAccessTypes={selectedAccessTypes}
                setSelectedAccessTypes={setSelectedAccessTypes}
                materialId={selectedMaterialForAccess?.material_id}
            />
        </div>
    );
};

export default ManageSpeaking;