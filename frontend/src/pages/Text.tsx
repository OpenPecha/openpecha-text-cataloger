import React, { useState, useEffect, useMemo } from 'react';
import { useTexts, useCreateText } from '@/hooks/useTexts';
import { usePersons } from '@/hooks/usePersons';
import type { OpenPechaText } from '@/types/text';
import type { Person } from '@/types/person';
import { Button } from '@/components/ui/button';
import TextListCard from '@/components/TextListCard';

const TextCRUD = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedText, setSelectedText] = useState<OpenPechaText | null>(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    language: '',
    author: ''
  });
  
  // Person selection state
  const [personSearch, setPersonSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const { data: texts = [], isLoading, error, refetch } = useTexts(pagination);
  const createTextMutation = useCreateText();
  
  // Person search with debouncing
  const [debouncedPersonSearch, setDebouncedPersonSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPersonSearch(personSearch);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [personSearch]);
  
  const { data: persons = [], isLoading: personsLoading } = usePersons({
    limit: 20,
    offset: 0
  });
  
  // Filter persons based on search
  const filteredPersons = useMemo(() => {
    if (!debouncedPersonSearch.trim()) return persons.slice(0, 10);
    
    return persons.filter(person => {
      const mainName = person.name.bo || person.name.en || Object.values(person.name)[0] || '';
      const altNames = person.alt_names.map(alt => Object.values(alt)[0]).join(' ');
      const searchLower = debouncedPersonSearch.toLowerCase();
      
      return mainName.toLowerCase().includes(searchLower) || 
             altNames.toLowerCase().includes(searchLower) ||
             person.id.toLowerCase().includes(searchLower);
    }).slice(0, 10);
  }, [persons, debouncedPersonSearch]);

  const handleEdit = (text: OpenPechaText) => {
    setSelectedText(text);
    setActiveTab('edit');
  };

  const handleCreate = () => {
    setSelectedText(null);
    setSelectedPerson(null);
    setPersonSearch('');
    setActiveTab('create');
  };
  
  // Person selection helpers
  const getPersonDisplayName = (person: Person): string => {
    return person.name.bo || person.name.en || Object.values(person.name)[0] || 'Unknown';
  };
  
  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    setPersonSearch(getPersonDisplayName(person));
    setShowPersonDropdown(false);
  };
  
  const handlePersonSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonSearch(e.target.value);
    setShowPersonDropdown(true);
    if (!e.target.value) {
      setSelectedPerson(null);
    }
  };
  
  const handlePersonInputFocus = () => {
    setShowPersonDropdown(true);
  };
  
  const handlePersonInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowPersonDropdown(false), 200);
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
      contributions: selectedPerson ? [{
        person_id: selectedPerson.id,
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
                <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                <select
                  id="limit"
                  value={pagination.limit}
                  onChange={(e) => handlePaginationChange({ limit: parseInt(e.target.value), offset: 0 })}
                  className="w-full py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={30}>30 per page</option>
                </select>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input
                  id="language"
                  type="text"
                  value={pagination.language}
                  onChange={(e) => handlePaginationChange({ language: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by language (e.g., bo)"
                />
              </div>
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  id="author"
                  type="text"
                  value={pagination.author}
                  onChange={(e) => handlePaginationChange({ author: e.target.value, offset: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by author ID"
                />
              </div>
                <Button
                  onClick={() => refetch()}
                  variant={activeTab === 'list' ? 'default' : 'outline'}
                >
                  Refresh
                </Button>
            </div>
            
            {/* Pagination Info */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <p>Showing {pagination.offset + 1} to {pagination.offset + texts.length} of results</p>
              <div className="flex space-x-2">
                <Button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0}
                  className={`px-3 py-1 rounded ${
                    pagination.offset === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextPage}
                  disabled={texts.length < pagination.limit}
                  className={`px-3 py-1 rounded ${
                    texts.length < pagination.limit 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {texts.map((text: OpenPechaText) => (
              <TextListCard 
                key={text.id} 
                text={text} 
                onEdit={handleEdit}
              />
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
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select id="type" name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select type</option>
                  <option value="root">Root</option>
                  <option value="translation">Translation</option>
                  <option value="commentary">Commentary</option>
                </select>
              </div>
              <div>
                <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">Language *</label>
                <select id="language-select" name="language" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select language</option>
                  <option value="bo">Tibetan (bo)</option>
                  <option value="en">English (en)</option>
                  <option value="sa">Sanskrit (sa)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title_en" className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                <input
                  id="title_en"
                  type="text"
                  name="title_en"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter English title"
                />
              </div>
              <div>
                <label htmlFor="title_bo" className="block text-sm font-medium text-gray-700 mb-1">Title (Tibetan)</label>
                <input
                  id="title_bo"
                  type="text"
                  name="title_bo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Tibetan title"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="person-search" className="block text-sm font-medium text-gray-700 mb-1">Person</label>
                <div className="relative">
                  <input
                    id="person-search"
                    type="text"
                    value={personSearch}
                    onChange={handlePersonSearchChange}
                    onFocus={handlePersonInputFocus}
                    onBlur={handlePersonInputBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search for a person..."
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showPersonDropdown}
                    aria-haspopup="listbox"
                    aria-controls="person-dropdown"
                  />
                  {personsLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {/* Dropdown */}
                  {showPersonDropdown && (
                    <div 
                      id="person-dropdown"
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      role="listbox"
                      aria-label="Person search results"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {filteredPersons.length > 0 ? (
                        filteredPersons.map((person) => (
                          <button
                            key={person.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePersonSelect(person);
                            }}
                            type="button"
                            className="px-3 w-full text-left py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            role="option"
                            tabIndex={0}
                            aria-selected="false"
                          >
                              {getPersonDisplayName(person)}
                       
                            {person.alt_names && person.alt_names.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                Alt: {person.alt_names.slice(0, 2).map(alt => Object.values(alt)[0]).join(', ')}
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          {debouncedPersonSearch.trim() ? 'No persons found' : 'Start typing to search...'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedPerson && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="text-blue-600">ID: {selectedPerson.id}</div>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select id="role" name="role" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="bdrc" className="block text-sm font-medium text-gray-700 mb-1">BDRC ID</label>
                <input
                  id="bdrc"
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
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  defaultValue={selectedText.title?.[selectedText.language] || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <input
                  id="edit-language"
                  type="text"
                  defaultValue={selectedText.language}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  id="edit-type"
                  type="text"
                  defaultValue={selectedText.type}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-bdrc" className="block text-sm font-medium text-gray-700 mb-1">BDRC ID</label>
                <input
                  id="edit-bdrc"
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