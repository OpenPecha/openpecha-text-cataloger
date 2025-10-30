import React, { useState } from "react";
import { useTexts } from "@/hooks/useTexts";
import type { OpenPechaText } from "@/types/text";
import { Button } from "@/components/ui/button";
import TextListCard from "@/components/TextListCard";

const TextCRUD = () => {
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    language: "",
    author: "",
  });

  const { data: texts = [], isLoading, error, refetch } = useTexts(pagination);

  const handlePaginationChange = (
    newPagination: Partial<typeof pagination>
  ) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
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
        <button
          onClick={() => refetch()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
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
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label
                htmlFor="limit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Limit
              </label>
              <select
                id="limit"
                value={pagination.limit}
                onChange={(e) =>
                  handlePaginationChange({
                    limit: parseInt(e.target.value),
                    offset: 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Language
              </label>
              <select
                id="language"
                value={pagination.language}
                onChange={(e) =>
                  handlePaginationChange({
                    language: e.target.value,
                    offset: 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Languages</option>
                <option value="bo">Tibetan (bo)</option>
                <option value="en">English (en)</option>
                <option value="sa">Sanskrit (sa)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="author"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Author ID
              </label>
              <input
                id="author"
                type="text"
                value={pagination.author}
                onChange={(e) =>
                  handlePaginationChange({ author: e.target.value, offset: 0 })
                }
                placeholder="Enter author ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() =>
                  handlePaginationChange({
                    limit: 10,
                    offset: 0,
                    language: "",
                    author: "",
                  })
                }
                variant="outline"
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <Button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Showing {pagination.offset + 1} -{" "}
              {pagination.offset + texts.length}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={texts.length < pagination.limit}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {texts.map((text: OpenPechaText) => (
            <TextListCard key={text.id} text={text} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextCRUD;
