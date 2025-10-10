import { useTextInstance, useCreateTextInstance, useText } from '@/hooks/useTexts';
import { useParams } from 'react-router-dom';
import TextInstanceCard from '@/components/TextInstanceCard';
import type { OpenPechaTextInstance } from '@/types/text';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

function TextInstanceCRUD() {
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    metadata: {
      type: '',
      copyright: 'public',
      bdrc: '',
      colophon: '',
      incipit_title: {
        en: '',
        bo: ''
      }
    },
    annotation: [
      {
        span: {
          start: 0,
          end: 0
        },
        index: 0
      }
    ],
    content: ''
  });
  
  const {
    data: instances = [],
    isLoading,
    error,
    refetch,
    isRefetching
  } = useTextInstance(id || '');
  const { data: text = [] } = useText(id || '');
  const createInstanceMutation = useCreateTextInstance();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('metadata.')) {
      const field = name.replace('metadata.', '');
      if (field.startsWith('incipit_title.')) {
        const lang = field.replace('incipit_title.', '');
        setFormData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            incipit_title: {
              ...prev.metadata.incipit_title,
              [lang]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            [field]: value
          }
        }));
      }
    } else if (name.startsWith('annotation.')) {
      const parts = name.split('.');
      const annotationIndex = parseInt(parts[1]);
      const field = parts[2];
      
      if (field === 'start' || field === 'end') {
        setFormData(prev => ({
          ...prev,
          annotation: prev.annotation.map((item, i) => ({
            ...item,
            span: {
              ...item.span,
              ...(i === annotationIndex && field === 'start' ? { start: parseInt(value) || 0 } : {}),
              ...(i === annotationIndex && field === 'end' ? { end: parseInt(value) || 0 } : {})
            },
            // Auto-calculate index as incremental value (0, 1, 2, 3...)
            index: i
          }))
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.metadata.type) {
      alert('Type is required');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('Content is required');
      return;
    }
    
    // Validate BDRC ID for diplomatic type
    if (formData.metadata.type === 'diplomatic' && !formData.metadata.bdrc.trim()) {
      alert('BDRC ID is required when type is Diplomatic');
      return;
    }
    
    // Validate annotation positions
    for (let i = 0; i < formData.annotation.length; i++) {
      const annotation = formData.annotation[i];
      if (annotation.span.start < 0 || annotation.span.end < 0) {
        alert(`Annotation ${i + 1}: Start and End positions must be non-negative`);
        return;
      }
      if (annotation.span.start >= annotation.span.end) {
        alert(`Annotation ${i + 1}: Start position must be less than End position`);
        return;
      }
    }

    createInstanceMutation.mutate({
      textId: id || '',
      instanceData: formData
    }, {
      onSuccess: () => {
        setShowModal(false);
        setFormData({
          metadata: {
            type: '',
            copyright: 'public',
            bdrc: '',
            colophon: '',
            incipit_title: {
              en: '',
              bo: ''
            }
          },
          annotation: [
            {
              span: {
                start: 0,
                end: 0
              },
              index: 0,
            }
          ],
          content: ''
        });
        alert('Text instance created successfully!');
      },
      onError: (error) => {
        alert(`Error creating instance: ${error.message}`);
      }
    });
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const addAnnotation = () => {
    setFormData(prev => ({
      ...prev,
      annotation: [
        ...prev.annotation,
        {
          span: {
            start: 0,
            end: 0
          },
          index: prev.annotation.length, // Will be the next incremental index
          alignment_index: [0]
        }
      ]
    }));
  };

  const removeAnnotation = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      annotation: prev.annotation
        .filter((_, i) => i !== indexToRemove)
        .map((item, i) => ({
          ...item,
          index: i // Recalculate indices as incremental values
        }))
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading text instances...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading text instances</h3>
            <p className="text-sm text-red-600 mt-1">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Text Instances Found</h3>
        <p className="text-gray-500">This text doesn't have any instances yet.</p>
      </div>
    );
  }

  const title = text.title.bo || text.title.en || text.title.sa || 'Untitled';
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">
            Found {instances.length} instance{instances.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={openModal}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Instance
          </Button>
   
        </div>
      </div>

      <div className="grid gap-6">
        {instances.map((instance: OpenPechaTextInstance) => (
          <TextInstanceCard key={instance.id} instance={instance} />
        ))}
      </div>

      {/* Create Instance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create Text Instance</h3>
              <Button
              variant={'ghost'}
                onClick={closeModal}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Metadata Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="metadata.type" className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="metadata.type"
                      name="metadata.type"
                      value={formData.metadata.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="diplomatic">Diplomatic</option>
                      <option value="critical">Critical</option>
                      <option value="collated">Collated</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="metadata.copyright" className="block text-sm font-medium text-gray-700 mb-1">Copyright</label>
                    <input
                      id="metadata.copyright"
                      name="metadata.copyright"
                      type="text"
                      value={formData.metadata.copyright}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., public"
                    />
                  </div>
                  <div>
                    <label htmlFor="metadata.bdrc" className="block text-sm font-medium text-gray-700 mb-1">
                      BDRC ID
                      {formData.metadata.type === 'diplomatic' && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      id="metadata.bdrc"
                      name="metadata.bdrc"
                      type="text"
                      value={formData.metadata.bdrc}
                      onChange={handleInputChange}
                      required={formData.metadata.type === 'diplomatic'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., W123456"
                    />
                  </div>
                  <div>
                    <label htmlFor="metadata.colophon" className="block text-sm font-medium text-gray-700 mb-1">Colophon</label>
                    <input
                      id="metadata.colophon"
                      name="metadata.colophon"
                      type="text"
                      value={formData.metadata.colophon}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Colophon text"
                    />
                  </div>
                </div>
                
                {/* Incipit Title */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Incipit Title</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="metadata.incipit_title.en" className="block text-sm font-medium text-gray-700 mb-1">English</label>
                      <input
                        id="metadata.incipit_title.en"
                        name="metadata.incipit_title.en"
                        type="text"
                        value={formData.metadata.incipit_title.en}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="English incipit title"
                      />
                    </div>
                    <div>
                      <label htmlFor="metadata.incipit_title.bo" className="block text-sm font-medium text-gray-700 mb-1">Tibetan</label>
                      <input
                        id="metadata.incipit_title.bo"
                        name="metadata.incipit_title.bo"
                        type="text"
                        value={formData.metadata.incipit_title.bo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tibetan incipit title"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Annotation Section */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Annotations</h4>
                  <button
                    type="button"
                    onClick={addAnnotation}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Annotation
                  </button>
                </div>
                
                {formData.annotation.map((annotation, index) => (
                  <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Annotation {index + 1}</span>
                      {formData.annotation.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAnnotation(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor={`annotation.${index}.start`} className="block text-sm font-medium text-gray-700 mb-1">
                          Start Position <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`annotation.${index}.start`}
                          name={`annotation.${index}.start`}
                          type="number"
                          value={annotation.span.start}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor={`annotation.${index}.end`} className="block text-sm font-medium text-gray-700 mb-1">
                          End Position <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`annotation.${index}.end`}
                          name={`annotation.${index}.end`}
                          type="number"
                          value={annotation.span.end}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor={`annotation.${index}.index`} className="block text-sm font-medium text-gray-700 mb-1">Index (Auto-calculated)</label>
                        <input
                          id={`annotation.${index}.index`}
                          name={`annotation.${index}.index`}
                          type="number"
                          value={annotation.index}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                          readOnly
                          placeholder="Incremental (0, 1, 2...)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Content Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Content *</h4>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the text content..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInstanceMutation.isPending}
                >
                  {createInstanceMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Instance'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TextInstanceCRUD;
