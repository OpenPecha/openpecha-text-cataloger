import React from 'react';
import type { OpenPechaTextInstance } from '@/types/text';

interface InstanceCardProps {
  instance: OpenPechaTextInstance;
}

const InstanceCard: React.FC<InstanceCardProps> = ({ instance }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
    

      {/* Base Text Section */}
      {instance.base && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Base Text
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <textarea value={instance.base} className="text-sm w-full text-gray-800 whitespace-pre-wrap font-mono leading-relaxed"
              rows={10}
              readOnly
              />
            <div className="mt-2 text-xs text-gray-500">
              Length: {instance.base.length} characters
            </div>
          </div>
        </div>
      )}

      {/* Segmentation Annotations Section */}
      {instance.annotations?.segmentation && instance.annotations.segmentation.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Segmentation Annotations
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              {instance.annotations.segmentation.length} segment{instance.annotations.segmentation.length !== 1 ? 's' : ''}
            </span>
          </h4>
          
          <div className="space-y-4">
            {instance.annotations.segmentation.map((annotation) => (
              <div
                key={annotation.id}
                className="bg-green-50 rounded-lg p-4 border border-green-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Segment #{annotation.index}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      ID: <span className="font-mono text-gray-900">{annotation.id}</span>
                    </span>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-4">
                  {/* Span Information */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Start Position</div>
                      <div className="text-lg font-mono font-bold text-green-600">
                        {annotation.span.start}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">End Position</div>
                      <div className="text-lg font-mono font-bold text-red-600">
                        {annotation.span.end}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Length</div>
                      <div className="text-lg font-mono font-bold text-blue-600">
                        {annotation.span.end - annotation.span.start}
                      </div>
                    </div>
                  </div>

                  {/* Text Preview */}
                  {instance.base && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Text Preview</p>
                        <span className="text-xs text-gray-500">
                          Characters {annotation.span.start}-{annotation.span.end}
                        </span>
                      </div>
                        <textarea className="text-sm w-full text-gray-800 font-mono leading-relaxed"
                        rows={1}
                        readOnly
                        value={instance.base.substring(annotation.span.start, annotation.span.end)}
                        />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Instance Summary</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600 font-medium">Base Text Length</div>
            <div className="text-gray-700 font-mono">{instance.base?.length || 0} chars</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">Segments</div>
            <div className="text-gray-700 font-mono">{instance.annotations?.segmentation?.length || 0}</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">Instance ID</div>
            <div className="text-gray-700 font-mono text-xs truncate">{instance.id}</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">Type</div>
            <div className="text-gray-700">{instance.type || 'Unknown'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstanceCard;
