import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InstanceCreationFormProps {
  onSubmit: (instanceData: any) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const InstanceCreationForm = ({
  onSubmit,
  isSubmitting,
  onCancel,
}: InstanceCreationFormProps) => {
  const [formData, setFormData] = useState({
    metadata: {
      type: "diplomatic",
      copyright: "public",
      bdrc: "",
      colophon: "",
      incipit_title: {
        en: "",
        bo: "",
      },
    },
    annotation: [
      {
        span: {
          start: 0,
          end: 0,
        },
        index: 0,
        alignment_index: [0],
      },
    ],
    content: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("metadata.")) {
      const field = name.replace("metadata.", "");
      if (field.startsWith("incipit_title.")) {
        const lang = field.replace("incipit_title.", "");
        setFormData((prev) => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            incipit_title: {
              ...prev.metadata.incipit_title,
              [lang]: value,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            [field]: value,
          },
        }));
      }
    } else if (name.startsWith("annotation.")) {
      const parts = name.split(".");
      const annotationIndex = parseInt(parts[1]);
      const field = parts[2];

      if (field === "start" || field === "end") {
        setFormData((prev) => ({
          ...prev,
          annotation: prev.annotation.map((item, i) => ({
            ...item,
            span: {
              ...item.span,
              ...(i === annotationIndex && field === "start"
                ? { start: parseInt(value) || 0 }
                : {}),
              ...(i === annotationIndex && field === "end"
                ? { end: parseInt(value) || 0 }
                : {}),
            },
            index: i,
          })),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.metadata.type) {
      alert("Type is required");
      return;
    }

    if (!formData.content.trim()) {
      alert("Content is required");
      return;
    }

    // Validate BDRC ID for diplomatic type
    if (
      formData.metadata.type === "diplomatic" &&
      !formData.metadata.bdrc.trim()
    ) {
      alert("BDRC ID is required when type is Diplomatic");
      return;
    }

    // Validate annotation positions
    for (let i = 0; i < formData.annotation.length; i++) {
      const annotation = formData.annotation[i];
      if (annotation.span.start < 0 || annotation.span.end < 0) {
        alert(
          `Annotation ${i + 1}: Start and End positions must be non-negative`
        );
        return;
      }
      if (annotation.span.start >= annotation.span.end) {
        alert(
          `Annotation ${i + 1}: Start position must be less than End position`
        );
        return;
      }
    }

    onSubmit(formData);
  };

  const addAnnotation = () => {
    setFormData((prev) => ({
      ...prev,
      annotation: [
        ...prev.annotation,
        {
          span: {
            start: 0,
            end: 0,
          },
          index: prev.annotation.length,
          alignment_index: [0],
        },
      ],
    }));
  };

  const removeAnnotation = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      annotation: prev.annotation
        .filter((_, i) => i !== indexToRemove)
        .map((item, i) => ({
          ...item,
          index: i,
        })),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Metadata Section */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="metadata.type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
              <option value="diplomatic">Diplomatic</option>
              <option value="critical">Critical</option>
              <option value="collated">Collated</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="metadata.copyright"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Copyright
            </label>
            <select
              id="metadata.copyright"
              name="metadata.copyright"
              value={formData.metadata.copyright}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="copyrighted">Copyrighted</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="metadata.bdrc"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              BDRC ID
              {formData.metadata.type === "diplomatic" && (
                <span className="text-red-500"> *</span>
              )}
            </label>
            <input
              id="metadata.bdrc"
              name="metadata.bdrc"
              type="text"
              value={formData.metadata.bdrc}
              onChange={handleInputChange}
              required={formData.metadata.type === "diplomatic"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., W123456"
            />
          </div>
          <div>
            <label
              htmlFor="metadata.colophon"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Colophon
            </label>
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
          <div className="block text-sm font-medium text-gray-700 mb-2">
            Incipit Title
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="metadata.incipit_title.en"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                English
              </label>
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
              <label
                htmlFor="metadata.incipit_title.bo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tibetan
              </label>
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
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Annotation
          </button>
        </div>

        {formData.annotation.map((annotation, index) => (
          <div
            key={`annotation-${annotation.index}-${index}`}
            className="border rounded-lg p-3 mb-3 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Annotation {index + 1}
              </span>
              {formData.annotation.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAnnotation(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor={`annotation.${index}.start`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor={`annotation.${index}.end`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor={`annotation.${index}.index`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Index (Auto)
                </label>
                <input
                  id={`annotation.${index}.index`}
                  name={`annotation.${index}.index`}
                  type="number"
                  value={annotation.index}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  readOnly
                  placeholder="0, 1, 2..."
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </form>
  );
};

export default InstanceCreationForm;
