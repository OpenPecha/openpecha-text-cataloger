import { useState, useEffect, useMemo } from "react";
import { usePersons } from "@/hooks/usePersons";
import type { Person } from "@/types/person";
import { Button } from "@/components/ui/button";

interface TextCreationFormProps {
  onSubmit: (textData: any) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

const TextCreationForm = ({
  onSubmit,
  isSubmitting,
  onCancel,
}: TextCreationFormProps) => {
  const [personSearch, setPersonSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [debouncedPersonSearch, setDebouncedPersonSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPersonSearch(personSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [personSearch]);

  const { data: persons = [], isLoading: personsLoading } = usePersons({
    limit: 50,
    offset: 0,
  });

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

  const getPersonDisplayName = (person: Person): string => {
    return (
      person.name.bo ||
      person.name.en ||
      Object.values(person.name)[0] ||
      "Unknown"
    );
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

  // Collect form data and pass to parent whenever form changes
  useEffect(() => {
    const formElement = document.getElementById(
      "text-creation-form"
    ) as HTMLFormElement;
    if (!formElement) return;

    const formData = new FormData(formElement);
    const type = formData.get("type") as string;
    const parentValue = formData.get("parent") as string;

    const textData: any = {
      type,
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

    // Add parent field for translation type
    if (type === "translation") {
      textData.parent = parentValue || "N/A";
    }

    onSubmit(textData);
  }, [selectedType, selectedPerson, onSubmit]);

  return (
    <form id="text-creation-form" className="space-y-4">
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
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
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

      {/* Parent field - only show for translation type */}
      {selectedType === "translation" && (
        <div>
          <label
            htmlFor="parent"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Parent Text ID
            <span className="text-gray-500 text-sm ml-2">
              (Leave empty to use 'N/A' for standalone translations)
            </span>
          </label>
          <input
            id="parent"
            type="text"
            name="parent"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter parent text ID or leave empty for N/A"
          />
        </div>
      )}

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
          onBlur={() => setTimeout(() => setShowPersonDropdown(false), 200)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for person..."
        />

        {personsLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}

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
                  <div className="text-sm text-gray-500">{person.id}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No persons found
              </div>
            )}
          </div>
        )}

        {selectedPerson && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="text-blue-600">
              Selected: {getPersonDisplayName(selectedPerson)}
            </div>
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
    </form>
  );
};

export default TextCreationForm;
