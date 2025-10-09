import React, { useState } from 'react';
import { useTexts, useCreateText } from '@/hooks/useTexts';
import type { OpenPechaText } from '@/types/text';
import { Link } from 'react-router-dom';

const TextCRUD = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedText, setSelectedText] = useState<OpenPechaText | null>(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    language: '',
    author: ''
  });

  const { data: texts = [], isLoading, error, refetch } = useTexts(pagination);
  const createTextMutation = useCreateText();

  const handleEdit = (text: OpenPechaText) => {
    setSelectedText(text);
    setActiveTab('edit');
  };

  const handleCreate = () => {
    setSelectedText(null);
    setActiveTab('create');
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const textData = {
      type: formData.get('type') as string,
      title: {
        en: formData.get('title_en') as string,
        bo: formData.get('title_bo') as string
      },
      language: formData.get('language') as string,
      contributions: formData.get('person_id') ? [{
        person_id: formData.get('person_id') as string,
        role: formData.get('role') as string
      }] : undefined,
      date: formData.get('date') as string || undefined,
      bdrc: formData.get('bdrc') as string || undefined
    };

    createTextMutation.mutate(textData, {
      onSuccess: () => {
        setActiveTab('list');
      }
    });
  };

  const handleBackToList = () => {
    setActiveTab('list');
    setSelectedText(null);
  };

  const handlePaginationChange = (newPagination: Partial<typeof pagination>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  };

  const handleNextPage = () => {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const handlePrevPage = () => {
    setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading texts</p>
        <button onClick={() => refetch()} className="bg-blue-500 text-white px-4 py-2 rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Text Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded ${
              activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            List
          </button>
          <button
            onClick={handleCreate}
            className={`px-4 py-2 rounded ${
              activeTab === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Create
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => handlePaginationChange({ limit: parseInt(e.target.value), offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={30}>30 per page</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input
                  type="text"
                  value={pagination.language}
                  onChange={(e) => handlePaginationChange({ language: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by language (e.g., bo)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={pagination.author}
                  onChange={(e) => handlePaginationChange({ author: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by author ID"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => refetch()}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Pagination Info */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <p>Showing {pagination.offset + 1} to {pagination.offset + texts.length} of results</p>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                  className={`px-3 py-1 rounded ${
                    pagination.offset === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={texts.length < pagination.limit}
                  className={`px-3 py-1 rounded ${
                    texts.length < pagination.limit 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {texts.map((text: OpenPechaText) => (
              <div key={text.id} className="bg-white rounded-lg shadow-md p-4 border">
                <Link to={`/texts/${text.id}/instance`} className="font-semibold text-gray-800 mb-2 truncate">
                  {text.title?.[text.language] || 'Untitled'}
                </Link>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Language:</span> {text.language}</p>
                  <p><span className="font-medium">Type:</span> {text.type}</p>
                  {text.bdrc && <p><span className="font-medium">BDRC:</span> {text.bdrc}</p>}
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => handleEdit(text)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Create New Text</h3>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select type</option>
                  <option value="root">Root</option>
                  <option value="translation">Translation</option>
                  <option value="commentary">Commentary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
                <select name="language" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select language</option>
                  <option value="bo">Tibetan (bo)</option>
                  <option value="en">English (en)</option>
                  <option value="sa">Sanskrit (sa)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  name="title_en"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter English title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Tibetan)</label>
                <input
                  type="text"
                  name="title_bo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Tibetan title"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Person ID</label>
                <input
                  type="text"
                  name="person_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter person ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select name="role" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select role</option>
                  <option value="author">Author</option>
                  <option value="translator">Translator</option>
                  <option value="reviser">Reviser</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BDRC ID</label>
                <input
                  type="text"
                  name="bdrc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter BDRC ID"
                />
              </div>
            </div>

            {createTextMutation.isSuccess && (
              <div className="p-3 rounded-md bg-green-100 text-green-700 border border-green-300">
                Text created successfully!
              </div>
            )}

            {createTextMutation.isError && (
              <div className="p-3 rounded-md bg-red-100 text-red-700 border border-red-300">
                Failed to create text. Please try again.
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createTextMutation.isPending}
                className={`px-6 py-2 rounded ${
                  createTextMutation.isPending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {createTextMutation.isPending ? 'Creating...' : 'Create Text'}
              </button>
              <button
                type="button"
                onClick={handleBackToList}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'edit' && selectedText && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Edit Text</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  defaultValue={selectedText.title?.[selectedText.language] || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input
                  type="text"
                  defaultValue={selectedText.language}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  defaultValue={selectedText.type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BDRC ID</label>
                <input
                  type="text"
                  defaultValue={selectedText.bdrc || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
              >
                Update Text
              </button>
              <button
                type="button"
                onClick={handleBackToList}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TextCRUD;