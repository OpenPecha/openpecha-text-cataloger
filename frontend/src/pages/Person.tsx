import React, { useState } from 'react';
import { usePersons, useCreatePerson, useUpdatePerson } from '@/hooks/usePersons';
import type { Person, CreatePersonData } from '@/types/person';
import { Button } from '@/components/ui/button';
import PersonCard from '@/components/PersonCard';
import BreadCrumb from '@/components/BreadCrumb';

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.en && !formData.name.bo) {
      alert('Please provide at least one name (English or Tibetan)');
      return;
    }
    
    if (activeTab === 'create') {
      // Clean up alt_names by removing id fields before sending to API
      const cleanFormData = {
        ...formData,
        alt_names: formData.alt_names.map(altName => {
          // Remove id field before sending to API
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...cleanAltName } = altName;
          return cleanAltName;
        })
      };
      createPersonMutation.mutate(cleanFormData, {
        onSuccess: () => {
          alert('Person created successfully!');
          setActiveTab('list');
          setFormData({
            name: { bo: '', en: '' },
            alt_names: [],
            bdrc: '',
            wiki: null
          });
        },
        onError: (error) => {
          alert(`Error creating person: ${error.message}`);
        }
      });
    } else if (activeTab === 'edit' && selectedPerson) {
      updatePersonMutation.mutate({
        id: selectedPerson.id,
        ...formData
      }, {
        onSuccess: () => {
          alert('Person updated successfully!');
          setActiveTab('list');
          setSelectedPerson(null);
        },
        onError: (error) => {
          alert(`Error updating person: ${error.message}`);
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

  const addAltName = () => {
    setFormData(prev => ({
      ...prev,
      alt_names: [...prev.alt_names, { en: '', bo: '', id: Date.now().toString() }]
    }));
  };

  const removeAltName = (index: number) => {
    setFormData(prev => ({
      ...prev,
      alt_names: prev.alt_names.filter((_, i) => i !== index)
    }));
  };

  const updateAltName = (index: number, lang: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      alt_names: prev.alt_names.map((altName, i) => 
        i === index ? { ...altName, [lang]: value } : altName
      )
    }));
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

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Breadcrumb */}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Person Management</h2>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button
          variant={activeTab === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveTab('list')}
            className="flex-1 sm:flex-none"
          >
            List
          </Button>
          <Button
            onClick={handleCreate}
            variant={activeTab === 'create' ? 'default' : 'outline'}
            className="flex-1 sm:flex-none"
          >
            Create Person
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div>
                <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                <select
                  id="limit"
                  value={pagination.limit}
                  onChange={(e) => handlePaginationChange({ limit: parseInt(e.target.value), offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  id="nationality"
                  type="text"
                  value={pagination.nationality}
                  onChange={(e) => handlePaginationChange({ nationality: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by nationality"
                />
              </div>
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                <input
                  id="occupation"
                  type="text"
                  value={pagination.occupation}
                  onChange={(e) => handlePaginationChange({ occupation: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by occupation"
                />
              </div>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4 border-t border-gray-200">
              <Button
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              <span className="text-xs sm:text-sm text-gray-600 text-center">
                Showing {pagination.offset + 1} - {pagination.offset + persons.length}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={persons.length < pagination.limit}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md mx-1 sm:mx-0">
              <div className="text-center px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">Loading persons...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 mx-1 sm:mx-0">
              <div className="text-center">
                <p className="text-sm sm:text-base text-red-500 mb-4">Error loading persons</p>
                <button
                  onClick={() => refetch()}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : persons.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 mx-1 sm:mx-0">
              <div className="text-center text-gray-500">
                <p className="text-base sm:text-lg">No persons found</p>
                <p className="text-xs sm:text-sm mt-2">Try adjusting your filters or create a new person</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {persons.map((person: Person) => (
              <PersonCard 
                key={`person-card-${person.id}`} 
                person={person} 
                onEdit={handleEdit}
              />
            ))}
            </div>
          )}
        </div>
      )}

      {(activeTab === 'create' || activeTab === 'edit') && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            {activeTab === 'create' ? 'Create New Person' : 'Edit Person'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name_bo" className="block text-sm font-medium text-gray-700 mb-1">Name (Tibetan)</label>
                <input
                  id="name_bo"
                  type="text"
                  name="name_bo"
                  value={formData.name.bo || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Tibetan name"
                />
              </div>
              <div>
                <label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input
                  id="name_en"
                  type="text"
                  name="name_en"
                  value={formData.name.en || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter English name"
                />
              </div>
            </div>
            
            {/* Alternative Names Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="block text-sm font-medium text-gray-700">Alternative Names</span>
                <button
                  type="button"
                  onClick={addAltName}
                  className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Add Alternative Name
                </button>
              </div>
              {formData.alt_names.map((altName, index) => (
                <div key={altName.id || `alt-name-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    value={altName.en || ''}
                    onChange={(e) => updateAltName(index, 'en', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="English alternative name"
                  />
                  <input
                    type="text"
                    value={altName.bo || ''}
                    onChange={(e) => updateAltName(index, 'bo', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tibetan alternative name"
                  />
                  <button
                    type="button"
                    onClick={() => removeAltName(index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            <div>
              <label htmlFor="bdrc" className="block text-sm font-medium text-gray-700 mb-1">BDRC ID</label>
              <input
                id="bdrc"
                type="text"
                name="bdrc"
                value={formData.bdrc}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter BDRC ID"
              />
            </div>
            <div>
              <label htmlFor="wiki" className="block text-sm font-medium text-gray-700 mb-1">Wikipedia URL</label>
              <input
                id="wiki"
                type="url"
                name="wiki"
                value={formData.wiki || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://en.wikipedia.org/wiki/..."
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                type="submit"
                disabled={createPersonMutation.isPending || updatePersonMutation.isPending}
              >
                {activeTab === 'create' ? 'Create Person' : 'Update Person'}
              </Button>
              <Button
                type="button"
                onClick={handleBackToList}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PersonCRUD;