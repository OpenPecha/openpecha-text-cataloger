import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useTexts,
  useCreateText,
  useCreateTextInstance,
} from "@/hooks/useTexts";
import { usePersons } from "@/hooks/usePersons";
import type { OpenPechaText } from "@/types/text";
import type { Person } from "@/types/person";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const UnifiedCreationForm = () => {
  const navigate = useNavigate();

  // State for text selection/creation
  const [isCreatingNewText, setIsCreatingNewText] = useState(false);
  const [selectedText, setSelectedText] = useState<OpenPechaText | null>(null);
  const [textSearch, setTextSearch] = useState("");
  const [showTextDropdown, setShowTextDropdown] = useState(false);

  // State for person selection (for text contributions)
  const [personSearch, setPersonSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  // Debounced search
  const [debouncedTextSearch, setDebouncedTextSearch] = useState("");
  const [debouncedPersonSearch, setDebouncedPersonSearch] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mutations
  const createTextMutation = useCreateText();
  const createInstanceMutation = useCreateTextInstance();

  // Fetch texts for dropdown
  const { data: texts = [] } = useTexts({ limit: 50, offset: 0 });

  // Fetch persons for author selection
  const { data: persons = [] } = usePersons({ limit: 50, offset: 0 });

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTextSearch(textSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [textSearch]);

  // Debounce person search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPersonSearch(personSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [personSearch]);

  // Filter texts based on search
  const filteredTexts = useMemo(() => {
    if (!debouncedTextSearch.trim()) return texts.slice(0, 10);

    return texts
      .filter((text: OpenPechaText) => {
        const searchLower = debouncedTextSearch.toLowerCase();

        // Search in ALL title languages (en, bo, zh, sa, hi, it, lzh, cmg, etc.)
        const titleMatches = Object.values(text.title).some((title) =>
          title.toLowerCase().includes(searchLower)
        );

        // Also search in text ID
        const idMatches = text.id.toLowerCase().includes(searchLower);

        return titleMatches || idMatches;
      })
      .slice(0, 10);
  }, [texts, debouncedTextSearch]);

  // Filter persons based on search
  const filteredPersons = useMemo(() => {
    if (!debouncedPersonSearch.trim()) return persons.slice(0, 10);

    return persons
      .filter((person) => {
        const mainName =
          person.name.bo ||
          person.name.en ||
          Object.values(person.name)[0] ||
          "";
        const altNames = person.alt_names
          .map((alt) => Object.values(alt)[0])
          .join(" ");
        const searchLower = debouncedPersonSearch.toLowerCase();

        return (
          mainName.toLowerCase().includes(searchLower) ||
          altNames.toLowerCase().includes(searchLower) ||
          person.id.toLowerCase().includes(searchLower)
        );
      })
      .slice(0, 10);
  }, [persons, debouncedPersonSearch]);

  // Helper functions
  const getTextDisplayName = (text: OpenPechaText): string => {
    return (
      text.title.bo ||
      text.title.en ||
      Object.values(text.title)[0] ||
      "Untitled"
    );
  };

  const getPersonDisplayName = (person: Person): string => {
    return (
      person.name.bo ||
      person.name.en ||
      Object.values(person.name)[0] ||
      "Unknown"
    );
  };

  // Handle text selection
  const handleTextSelect = (text: OpenPechaText) => {
    setSelectedText(text);
    setTextSearch(getTextDisplayName(text));
    setShowTextDropdown(false);
    setIsCreatingNewText(false);
  };

  const handleCreateNewText = () => {
    setIsCreatingNewText(true);
    setSelectedText(null);
    setTextSearch("");
    setShowTextDropdown(false);
  };

  const handleTextSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextSearch(e.target.value);
    setShowTextDropdown(true);
    if (!e.target.value) {
      setSelectedText(null);
      setIsCreatingNewText(false);
    }
  };

  // Handle person selection
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

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      let textId: string;
      let createdNewText = false;

      // STEP 1: Get or Create Text
      if (isCreatingNewText) {
        // Create new text
        const textData = {
          type: formData.get("type") as string,
          title: {
            en: formData.get("title_en") as string,
            bo: formData.get("title_bo") as string,
          },
          language: formData.get("language") as string,
          contributions: selectedPerson
            ? [
                {
                  person_id: selectedPerson.id,
                  role: formData.get("role") as string,
                },
              ]
            : undefined,
          date: (formData.get("date") as string) || undefined,
          bdrc: (formData.get("text_bdrc") as string) || undefined,
        };

        console.log("🔵 STEP 1: Creating text with data:", textData);
        const newText = await createTextMutation.mutateAsync(textData);
        console.log("✅ STEP 1 Complete: Text created with ID:", newText.id);
        console.log("📦 Full text response:", newText);

        textId = newText.id;
        createdNewText = true;
        setSuccess("Text created successfully!");
      } else {
        // Use existing text
        if (!selectedText) {
          throw new Error("Please select a text or create a new one");
        }
        console.log("🔵 STEP 1: Using existing text ID:", selectedText.id);
        textId = selectedText.id;
      }

      // STEP 2: Create Instance
      try {
        const instanceData = {
          metadata: {
            type: (formData.get("instance_type") as string) || undefined,
            copyright: (formData.get("copyright") as string) || undefined,
            bdrc: (formData.get("instance_bdrc") as string) || undefined,
            colophon: (formData.get("colophon") as string) || undefined,
            incipit_title: {
              en: (formData.get("incipit_title_en") as string) || undefined,
              bo: (formData.get("incipit_title_bo") as string) || undefined,
            },
          },
          content: formData.get("content") as string,
        };

        console.log("🔵 STEP 2: Creating instance for text ID:", textId);
        console.log("📦 Instance data:", instanceData);

        await createInstanceMutation.mutateAsync({ textId, instanceData });

        console.log("✅ STEP 2 Complete: Instance created successfully!");

        setSuccess("Text and instance created successfully!");

        // Redirect to text list after a short delay
        setTimeout(() => {
          navigate("/texts");
        }, 1500);
      } catch (instanceError: unknown) {
        // Instance creation failed
        const errorMessage =
          instanceError instanceof Error
            ? instanceError.message
            : "Unknown error";
        if (createdNewText) {
          setError(
            `Text created (ID: ${textId}), but instance creation failed: ${errorMessage}. ` +
              `You can add an instance later from the text page.`
          );
          // Optionally navigate to the text's instance page
          setTimeout(() => {
            navigate(`/texts/${textId}/instances`);
          }, 3000);
        } else {
          throw instanceError;
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage || "An error occurred during submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-Black-800 mb-2">
          Create Text & Instance
        </h1>
        <p className="text-gray-600">
          Create a new Text with its Instance, or add an Instance to an existing
          Text.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Text Selection Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            1. Select or Create Text
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <label
                htmlFor="text-search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search for existing text
              </label>
              <input
                id="text-search"
                type="text"
                value={textSearch}
                onChange={handleTextSearchChange}
                onFocus={() => setShowTextDropdown(true)}
                onBlur={() => setTimeout(() => setShowTextDropdown(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by title or ID..."
                disabled={isCreatingNewText}
              />

              {/* Text Dropdown */}
              {showTextDropdown && !isCreatingNewText && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={handleCreateNewText}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-200 font-medium text-blue-600"
                  >
                    ➕ Create New Text
                  </button>

                  {filteredTexts.length > 0 ? (
                    filteredTexts.map((text: OpenPechaText) => (
                      <button
                        key={text.id}
                        type="button"
                        onClick={() => handleTextSelect(text)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100"
                      >
                        <div className="font-medium">
                          {getTextDisplayName(text)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {text.type} • {text.language} • {text.id}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 text-sm">
                      No texts found
                    </div>
                  )}
                </div>
              )}
            </div>

            {isCreatingNewText && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2 rounded-md">
                <span className="text-blue-700 font-medium">
                  Creating new text
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingNewText(false);
                    setTextSearch("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {selectedText && !isCreatingNewText && (
              <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Selected Text:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedText(null);
                      setTextSearch("");
                    }}
                  >
                    Change
                  </Button>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Title:</strong> {getTextDisplayName(selectedText)}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedText.type}
                  </div>
                  <div>
                    <strong>Language:</strong> {selectedText.language}
                  </div>
                  <div>
                    <strong>ID:</strong> {selectedText.id}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Text Metadata Section (only if creating new) */}
        {isCreatingNewText && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. Text Details</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="root">Root</option>
                    <option value="translation">Translation</option>
                    <option value="commentary">Commentary</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Language *
                  </label>
                  <select
                    id="language"
                    name="language"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select language</option>
                    <option value="bo">Tibetan (bo)</option>
                    <option value="en">English (en)</option>
                    <option value="sa">Sanskrit (sa)</option>
                    <option value="zh">Chinese (zh)</option>
                    <option value="lzh">Literary Chinese (lzh)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="it">Italian (it)</option>
                    <option value="cmg">Classical Mongolian (cmg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="title_en"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title (English)
                  </label>
                  <input
                    id="title_en"
                    type="text"
                    name="title_en"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter English title"
                  />
                </div>

                <div>
                  <label
                    htmlFor="title_bo"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title (Tibetan)
                  </label>
                  <input
                    id="title_bo"
                    type="text"
                    name="title_bo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Tibetan title"
                  />
                </div>
              </div>

              {/* Author/Contributor Selection */}
              <div className="relative">
                <label
                  htmlFor="person-search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Author/Contributor
                </label>
                <input
                  id="person-search"
                  type="text"
                  value={personSearch}
                  onChange={handlePersonSearchChange}
                  onFocus={() => setShowPersonDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowPersonDropdown(false), 200)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search for person..."
                />

                {/* Person Dropdown */}
                {showPersonDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredPersons.length > 0 ? (
                      filteredPersons.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => handlePersonSelect(person)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100"
                        >
                          <div className="font-medium">
                            {getPersonDisplayName(person)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {person.id}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No persons found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedPerson && (
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="author">Author</option>
                    <option value="translator">Translator</option>
                    <option value="reviser">Reviser</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    name="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="text_bdrc"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    BDRC ID
                  </label>
                  <input
                    id="text_bdrc"
                    type="text"
                    name="text_bdrc"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., W123456"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Instance Metadata Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isCreatingNewText ? "3. Instance Details" : "2. Instance Details"}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="instance_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Instance Type
                </label>
                <input
                  id="instance_type"
                  type="text"
                  name="instance_type"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., diplomatic"
                />
              </div>

              <div>
                <label
                  htmlFor="copyright"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Copyright
                </label>
                <input
                  id="copyright"
                  type="text"
                  name="copyright"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., public"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="instance_bdrc"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  BDRC ID
                </label>
                <input
                  id="instance_bdrc"
                  type="text"
                  name="instance_bdrc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., W123456"
                />
              </div>

              <div>
                <label
                  htmlFor="colophon"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Colophon
                </label>
                <input
                  id="colophon"
                  type="text"
                  name="colophon"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Colophon text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="incipit_title_en"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Incipit Title (English)
                </label>
                <input
                  id="incipit_title_en"
                  type="text"
                  name="incipit_title_en"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opening words in English"
                />
              </div>

              <div>
                <label
                  htmlFor="incipit_title_bo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Incipit Title (Tibetan)
                </label>
                <input
                  id="incipit_title_bo"
                  type="text"
                  name="incipit_title_bo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="དབུ་ཚིག"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the text content..."
              />
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/texts")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || (!isCreatingNewText && !selectedText)}
          >
            {isSubmitting ? "Creating..." : "Create Text & Instance"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UnifiedCreationForm;
