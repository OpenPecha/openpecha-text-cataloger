import React, { useState } from 'react';
import { usePersons, useCreatePerson, useUpdatePerson, useDeletePerson } from '@/hooks/usePersons';
import type { Person, CreatePersonData } from '@/types/person';

const PersonCRUD = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    nationality: '',
    occupation: ''
  });
  const [formData, setFormData] = useState<CreatePersonData>({
    name: { bo: '', en: '' },
    alt_names: [],
    bdrc: '',
    wiki: null
  });

  const { data: persons = [], isLoading, error, refetch } = usePersons(pagination);
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const deletePersonMutation = useDeletePerson();

  // Helper function to get the main name
  const getMainName = (person: Person): string => {
    if (person.name.bo) return person.name.bo;
    if (person.name.en) return person.name.en;
    return Object.values(person.name)[0] || 'Unknown';
  };

  // Helper function to get alternative names
  const getAltNames = (person: Person): string[] => {
    return person.alt_names.map(altName => Object.values(altName)[0]).slice(0, 3);
  };

  const handleEdit = (person: Person) => {
    setSelectedPerson(person);
    setFormData({
      name: person.name,
      alt_names: person.alt_names,
      bdrc: person.bdrc,
      wiki: person.wiki
    });
    setActiveTab('edit');
  };

  const handleCreate = () => {
    setSelectedPerson(null);
    setFormData({
      name: { bo: '', en: '' },
      alt_names: [],
      bdrc: '',
      wiki: null
    });
    setActiveTab('create');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      deletePersonMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'create') {
      createPersonMutation.mutate(formData, {
        onSuccess: () => {
          setActiveTab('list');
          setFormData({
            name: { bo: '', en: '' },
            alt_names: [],
            bdrc: '',
            wiki: null
          });
        }
      });
    } else if (activeTab === 'edit' && selectedPerson) {
      updatePersonMutation.mutate({
        id: selectedPerson.id,
        ...formData
      }, {
        onSuccess: () => {
          setActiveTab('list');
          setSelectedPerson(null);
        }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name_bo' || name === 'name_en') {
      const lang = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        name: { ...prev.name, [lang]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBackToList = () => {
    setActiveTab('list');
    setSelectedPerson(null);
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
        <p className="text-red-500 mb-4">Error loading persons</p>
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
        <h2 className="text-2xl font-bold text-gray-800">Person Management</h2>
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
            disabled={true}
            className="px-4 py-2 rounded bg-gray-300 text-gray-500 cursor-not-allowed"
            title="Create/Edit/Delete operations not yet implemented in backend"
          >
            Create (Coming Soon)
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={pagination.nationality}
                  onChange={(e) => handlePaginationChange({ nationality: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by nationality"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                <input
                  type="text"
                  value={pagination.occupation}
                  onChange={(e) => handlePaginationChange({ occupation: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by occupation"
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
              <p>Showing {pagination.offset + 1} to {pagination.offset + persons.length} of results</p>
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
                  disabled={persons.length < pagination.limit}
                  className={`px-3 py-1 rounded ${
                    persons.length < pagination.limit 
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
            {persons.map((person: Person) => (
              <div key={person.id} className="bg-white rounded-lg shadow-md p-4 border">
                <h3 className="font-semibold text-gray-800 mb-2">{getMainName(person)}</h3>
                <div className="space-y-1 text-sm text-gray-600">

                <p><span className="font-medium"> ID:</span> {person.id}</p>
                <p><span className="font-medium">BDRC ID:</span> {person.bdrc}</p>
                {person.wiki && <p><span className="font-medium">Wiki:</span> <a href={person.wiki} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a></p>}
                </div>
                
                {/* Alternative Names */}
                {person.alt_names && person.alt_names.length > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-600 text-sm font-medium mb-1">Alternative Names:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {getAltNames(person).map((altName, index) => (
                        <li key={index} className="truncate">• {altName}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 flex space-x-2">
                  <button
                    disabled={true}
                    className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed"
                    title="Edit operation not yet implemented in backend"
                  >
                    Edit
                  </button>
                  <button
                    disabled={true}
                    className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed"
                    title="Delete operation not yet implemented in backend"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'create' || activeTab === 'edit') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            {activeTab === 'create' ? 'Create New Person' : 'Edit Person'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Tibetan)</label>
                <input
                  type="text"
                  name="name_bo"
                  value={formData.name.bo || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Tibetan name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  name="name_en"
                  value={formData.name.en || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter English name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BDRC ID</label>
              <input
                type="text"
                name="bdrc"
                value={formData.bdrc}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter BDRC ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wikipedia URL</label>
              <input
                type="url"
                name="wiki"
                value={formData.wiki || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://en.wikipedia.org/wiki/..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createPersonMutation.isPending || updatePersonMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded"
              >
                {activeTab === 'create' ? 'Create Person' : 'Update Person'}
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

export default PersonCRUD;