import { useState } from 'react';
import { useAddText } from '../hooks/useTexts';

interface TextData {
  title: string;
  author: string;
  language: string;
  content: string;
}

const AddText = () => {
  const [formData, setFormData] = useState<TextData>({
    title: '',
    author: '',
    language: '',
    content: ''
  });
  const addTextMutation = useAddText();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addTextMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({ title: '', author: '', language: '', content: '' });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Add New Text</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter text title"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
            Author
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter author name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <input
            type="text"
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter language code (e.g., bo, en)"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter text content"
          />
        </div>

        {addTextMutation.isSuccess && (
          <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 border border-green-300">
            Text added successfully!
          </div>
        )}

        {addTextMutation.isError && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-300">
            Failed to add text. Please try again.
          </div>
        )}

        <button
          type="submit"
          disabled={addTextMutation.isPending}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            addTextMutation.isPending
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {addTextMutation.isPending ? 'Adding...' : 'Add Text'}
        </button>
      </form>
    </div>
  );
};

export default AddText;