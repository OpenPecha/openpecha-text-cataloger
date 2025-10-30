import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface InstanceCreationFormProps {
  onSubmit: (instanceData: any) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

interface TitleEntry {
  language: string;
  value: string;
}

const InstanceCreationForm = ({
  onSubmit,
  isSubmitting,
  onCancel,
}: InstanceCreationFormProps) => {
  const [type, setType] = useState<"diplomatic" | "critical" | "collated">(
    "diplomatic"
  );
  const [copyright, setCopyright] = useState("public");
  const [bdrc, setBdrc] = useState("");
  const [wiki, setWiki] = useState("");
  const [colophon, setColophon] = useState("");
  const [content, setContent] = useState("");

  // Incipit title management
  const [showIncipitTitle, setShowIncipitTitle] = useState(false);
  const [incipitTitles, setIncipitTitles] = useState<TitleEntry[]>([]);

  // Alternative incipit titles management
  const [altIncipitTitles, setAltIncipitTitles] = useState<TitleEntry[][]>([]);

  // Annotation management (span-based)
  const [annotations, setAnnotations] = useState<
    Array<{
      span: { start: number; end: number };
      index: number;
      alignment_index: number[];
    }>
  >([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper functions for incipit titles
  const addIncipitTitle = () => {
    setShowIncipitTitle(true);
    if (incipitTitles.length === 0) {
      setIncipitTitles([{ language: "", value: "" }]);
    }
  };

  const removeIncipitTitleSection = () => {
    setShowIncipitTitle(false);
    setIncipitTitles([]);
    setAltIncipitTitles([]); // Also remove alternatives
  };

  const addIncipitLanguage = () => {
    setIncipitTitles([...incipitTitles, { language: "", value: "" }]);
  };

  const updateIncipitTitle = (
    index: number,
    field: "language" | "value",
    value: string
  ) => {
    const updated = [...incipitTitles];
    updated[index][field] = value;
    setIncipitTitles(updated);
  };

  const removeIncipitLanguage = (index: number) => {
    setIncipitTitles(incipitTitles.filter((_, i) => i !== index));
  };

  // Helper functions for alternative incipit titles
  const addAltIncipitTitle = () => {
    setAltIncipitTitles([...altIncipitTitles, [{ language: "", value: "" }]]);
  };

  const removeAltIncipitTitle = (groupIndex: number) => {
    setAltIncipitTitles(altIncipitTitles.filter((_, i) => i !== groupIndex));
  };

  const addAltLanguage = (groupIndex: number) => {
    const updated = [...altIncipitTitles];
    updated[groupIndex].push({ language: "", value: "" });
    setAltIncipitTitles(updated);
  };

  const updateAltTitle = (
    groupIndex: number,
    langIndex: number,
    field: "language" | "value",
    value: string
  ) => {
    const updated = [...altIncipitTitles];
    updated[groupIndex][langIndex][field] = value;
    setAltIncipitTitles(updated);
  };

  const removeAltLanguage = (groupIndex: number, langIndex: number) => {
    const updated = [...altIncipitTitles];
    updated[groupIndex] = updated[groupIndex].filter((_, i) => i !== langIndex);
    setAltIncipitTitles(updated);
  };

  // Helper functions for annotations
  const addAnnotation = () => {
    setAnnotations([
      ...annotations,
      {
        span: { start: 0, end: 0 },
        index: annotations.length,
        alignment_index: [0],
      },
    ]);
  };

  const removeAnnotation = (indexToRemove: number) => {
    const updated = annotations
      .filter((_, i) => i !== indexToRemove)
      .map((item, i) => ({ ...item, index: i, alignment_index: [i] }));
    setAnnotations(updated);
  };

  const updateAnnotation = (
    index: number,
    field: "start" | "end",
    value: number
  ) => {
    const updated = [...annotations];
    updated[index].span[field] = value;
    setAnnotations(updated);
  };

  // Data cleaning function
  const cleanFormData = () => {
    const cleaned: any = {
      metadata: {
        type: type,
      },
      annotation: annotations,
      content: content.trim(),
    };

    // Add optional metadata fields only if non-empty
    if (copyright) {
      cleaned.metadata.copyright = copyright;
    }

    if (bdrc?.trim()) {
      cleaned.metadata.bdrc = bdrc.trim();
    }

    if (wiki?.trim()) {
      cleaned.metadata.wiki = wiki.trim();
    }

    if (colophon?.trim()) {
      cleaned.metadata.colophon = colophon.trim();
    }

    // Build incipit_title only if has non-empty values
    const incipitTitle: Record<string, string> = {};
    incipitTitles.forEach(({ language, value }) => {
      if (language && value.trim()) {
        incipitTitle[language] = value.trim();
      }
    });
    if (Object.keys(incipitTitle).length > 0) {
      cleaned.metadata.incipit_title = incipitTitle;
    }

    // Build alt_incipit_titles only if incipit_title exists
    if (cleaned.metadata.incipit_title && altIncipitTitles.length > 0) {
      const altTitles = altIncipitTitles
        .map((titleGroup) => {
          const alt: Record<string, string> = {};
          titleGroup.forEach(({ language, value }) => {
            if (language && value.trim()) {
              alt[language] = value.trim();
            }
          });
          return alt;
        })
        .filter((alt) => Object.keys(alt).length > 0);

      if (altTitles.length > 0) {
        cleaned.metadata.alt_incipit_titles = altTitles;
      }
    }

    return cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    if (!type) {
      setErrors({ type: "Type is required" });
      return;
    }

    if (!content.trim()) {
      setErrors({ content: "Content is required and cannot be empty" });
      return;
    }

    // Validate BDRC ID for diplomatic type
    if (type === "diplomatic" && !bdrc?.trim()) {
      setErrors({ bdrc: "BDRC ID is required when type is Diplomatic" });
      return;
    }

    // Validate alt_incipit_titles requires incipit_title
    const hasIncipitTitle = incipitTitles.some(
      (t) => t.language && t.value.trim()
    );
    const hasAltTitles = altIncipitTitles.some((group) =>
      group.some((t) => t.language && t.value.trim())
    );

    if (hasAltTitles && !hasIncipitTitle) {
      setErrors({
        alt_incipit_titles:
          "Alternative incipit titles can only be set when incipit title is also provided",
      });
      return;
    }

    // Validate annotation positions (only if annotations exist)
    if (annotations.length > 0) {
      const contentLength = content.trim().length;

      for (let i = 0; i < annotations.length; i++) {
        const annotation = annotations[i];
        if (annotation.span.start < 0 || annotation.span.end < 0) {
          setErrors({
            annotations: `Annotation ${
              i + 1
            }: Start and End positions must be non-negative`,
          });
          return;
        }
        if (annotation.span.start >= annotation.span.end) {
          setErrors({
            annotations: `Annotation ${
              i + 1
            }: Start position must be less than End position`,
          });
          return;
        }
        if (annotation.span.end > contentLength) {
          setErrors({
            annotations: `Annotation ${i + 1}: End position (${
              annotation.span.end
            }) exceeds content length (${contentLength})`,
          });
          return;
        }
        if (annotation.span.start >= contentLength) {
          setErrors({
            annotations: `Annotation ${i + 1}: Start position (${
              annotation.span.start
            }) exceeds content length (${contentLength})`,
          });
          return;
        }
      }
    }

    const cleanedData = cleanFormData();
    console.log("Submitting instance data:", cleanedData);
    onSubmit(cleanedData);
  };

  const hasIncipitTitle = incipitTitles.some(
    (t) => t.language && t.value.trim()
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Metadata Section */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="diplomatic">Diplomatic</option>
              <option value="critical">Critical</option>
              <option value="collated">Collated</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Copyright */}
          <div>
            <label
              htmlFor="copyright"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Copyright
            </label>
            <select
              id="copyright"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public</option>
              <option value="copyrighted">Copyrighted</option>
            </select>
          </div>

          {/* BDRC ID */}
          <div>
            <label
              htmlFor="bdrc"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              BDRC ID
              {type === "diplomatic" && (
                <span className="text-red-500"> *</span>
              )}
            </label>
            <input
              id="bdrc"
              type="text"
              value={bdrc}
              onChange={(e) => setBdrc(e.target.value)}
              required={type === "diplomatic"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., W123456"
            />
            {errors.bdrc && (
              <p className="mt-1 text-sm text-red-600">{errors.bdrc}</p>
            )}
          </div>

          {/* Wiki */}
          <div>
            <label
              htmlFor="wiki"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Wiki
            </label>
            <input
              id="wiki"
              type="text"
              value={wiki}
              onChange={(e) => setWiki(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Wiki reference"
            />
          </div>

          {/* Colophon */}
          <div className="md:col-span-2">
            <label
              htmlFor="colophon"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Colophon
            </label>
            <input
              id="colophon"
              type="text"
              value={colophon}
              onChange={(e) => setColophon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Colophon text"
            />
          </div>
        </div>

        {/* Incipit Title Section */}
        <div className="mt-4">
          {!showIncipitTitle ? (
            <Button
              type="button"
              onClick={addIncipitTitle}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Incipit Title
            </Button>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Incipit Title
                </label>
                <Button
                  type="button"
                  onClick={removeIncipitTitleSection}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {incipitTitles.map((title, index) => (
                <div key={index} className="flex gap-2 items-start mb-3">
                  <input
                    type="text"
                    value={title.language}
                    onChange={(e) =>
                      updateIncipitTitle(index, "language", e.target.value)
                    }
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lang"
                  />
                  <input
                    type="text"
                    value={title.value}
                    onChange={(e) =>
                      updateIncipitTitle(index, "value", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter incipit title"
                  />
                  {incipitTitles.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeIncipitLanguage(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                onClick={addIncipitLanguage}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 mt-2"
              >
                <Plus className="h-4 w-4" />
                Add Language
              </Button>
            </div>
          )}
        </div>

        {/* Alternative Incipit Titles Section */}
        {hasIncipitTitle && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Alternative Incipit Titles
              </label>
              <Button
                type="button"
                onClick={addAltIncipitTitle}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Alternative Title
              </Button>
            </div>

            {altIncipitTitles.map((titleGroup, groupIndex) => (
              <div
                key={groupIndex}
                className="border rounded-lg p-4 bg-blue-50 mb-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Alternative {groupIndex + 1}
                  </span>
                  <Button
                    type="button"
                    onClick={() => removeAltIncipitTitle(groupIndex)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {titleGroup.map((title, langIndex) => (
                  <div key={langIndex} className="flex gap-2 items-start mb-2">
                    <input
                      type="text"
                      value={title.language}
                      onChange={(e) =>
                        updateAltTitle(
                          groupIndex,
                          langIndex,
                          "language",
                          e.target.value
                        )
                      }
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Lang"
                    />
                    <input
                      type="text"
                      value={title.value}
                      onChange={(e) =>
                        updateAltTitle(
                          groupIndex,
                          langIndex,
                          "value",
                          e.target.value
                        )
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter alternative title"
                    />
                    {titleGroup.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeAltLanguage(groupIndex, langIndex)}
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={() => addAltLanguage(groupIndex)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Language
                </Button>
              </div>
            ))}

            {errors.alt_incipit_titles && (
              <p className="mt-1 text-sm text-red-600">
                {errors.alt_incipit_titles}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Annotation Section */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-900">Annotations</h4>
          <Button
            type="button"
            onClick={addAnnotation}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Annotation
          </Button>
        </div>

        {annotations.map((annotation, index) => (
          <div
            key={`annotation-${annotation.index}-${index}`}
            className="border rounded-lg p-3 mb-3 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Annotation {index + 1}
              </span>
              <Button
                type="button"
                onClick={() => removeAnnotation(index)}
                variant="outline"
                size="sm"
                className="text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor={`annotation-${index}-start`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Position <span className="text-red-500">*</span>
                </label>
                <input
                  id={`annotation-${index}-start`}
                  type="number"
                  value={annotation.span.start}
                  onChange={(e) =>
                    updateAnnotation(
                      index,
                      "start",
                      parseInt(e.target.value) || 0
                    )
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label
                  htmlFor={`annotation-${index}-end`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Position <span className="text-red-500">*</span>
                </label>
                <input
                  id={`annotation-${index}-end`}
                  type="number"
                  value={annotation.span.end}
                  onChange={(e) =>
                    updateAnnotation(
                      index,
                      "end",
                      parseInt(e.target.value) || 0
                    )
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Index
                </label>
                <input
                  type="number"
                  value={annotation.index}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
              </div>
            </div>
          </div>
        ))}

        {errors.annotations && (
          <p className="mt-1 text-sm text-red-600">{errors.annotations}</p>
        )}
      </div>

      {/* Content Section */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">
          Content <span className="text-red-500">*</span>
        </h4>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter the text content..."
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
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
