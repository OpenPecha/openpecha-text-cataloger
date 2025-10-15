import React from 'react';
import type { OpenPechaTextInstance } from '@/types/text';
import { Link, useParams } from 'react-router-dom';

interface TextInstanceCardProps {
  instance: OpenPechaTextInstance;
}

const TextInstanceCard: React.FC<TextInstanceCardProps> = ({ instance }) => {


  const {text_id}=useParams();

  const getTypeColor = (type: string) => {
    if (!type) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (type.toLowerCase()) {
      case 'critical':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'base':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'edition':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCopyrightColor = (copyright: string) => {
    if (!copyright) return 'bg-gray-100 text-gray-800';
    switch (copyright.toLowerCase()) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'private':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const title=instance.incipit_title?instance.incipit_title?.bo:instance.colophon;
  return (
    <Link to={`/texts/${text_id}/instances/${instance.id}`} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {title || "Text Instance"}
          </h3>
          <p className="text-sm text-gray-500 font-mono">
            ID: 
            {instance.id}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(instance.type)}`}>
            {instance.type}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCopyrightColor(instance.copyright)}`}>
            {instance.copyright}
          </span>
        </div>
      </div>
     
    </Link>
  );
};

export default TextInstanceCard;
