import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Search, Tag as TagIcon, Check } from 'lucide-react';
import { SUGGESTED_TAGS, UI_TEXT } from '../constants';

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags?: string[]; // All existing tags from properties
}

const TagManagementModal: React.FC<TagManagementModalProps> = ({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  allTags = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');

  // Combine suggested tags with existing tags from properties
  const allAvailableTags = Array.from(new Set([...SUGGESTED_TAGS, ...allTags])).sort();

  // Filter tags based on search query
  const filteredTags = allAvailableTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query would create a new tag
  const isNewTag = searchQuery.trim() && 
    !allAvailableTags.some(tag => tag.toLowerCase() === searchQuery.trim().toLowerCase());

  const handleAddNewTag = () => {
    const trimmedTag = searchQuery.trim();
    if (trimmedTag && !allAvailableTags.includes(trimmedTag)) {
      const updatedTags = [...selectedTags, trimmedTag];
      onTagsChange(updatedTags);
      setSearchQuery('');
    }
  };

  const handleToggleTag = (tag: string) => {
    const updatedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(updatedTags);
  };

  const handleEditTag = (oldTag: string) => {
    setEditingTag(oldTag);
    setEditTagName(oldTag);
  };

  const handleUpdateTag = () => {
    const trimmedTag = editTagName.trim();
    if (trimmedTag && editingTag && trimmedTag !== editingTag) {
      const updatedTags = selectedTags.map(tag => 
        tag === editingTag ? trimmedTag : tag
      );
      onTagsChange(updatedTags);
    }
    setEditingTag(null);
    setEditTagName('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(updatedTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isNewTag) {
        handleAddNewTag();
      } else if (filteredTags.length === 1) {
        // If there's exactly one filtered tag, toggle it
        handleToggleTag(filteredTags[0]);
        setSearchQuery('');
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold flex items-center">
            <TagIcon size={20} className="mr-2" />
            {UI_TEXT.buttons.manageTags}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search/Add Input */}
          <div className="p-4 border-b bg-gray-50">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search existing tags or type to add new..."
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isNewTag ? (
                  <button
                    onClick={handleAddNewTag}
                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                    title="Add new tag"
                  >
                    <Plus size={18} />
                  </button>
                ) : (
                  <Search size={18} className="text-gray-400" />
                )}
              </div>
            </div>
            {isNewTag && (
              <div className="mt-2 text-sm text-green-600 flex items-center">
                <Plus size={14} className="mr-1" />
                Press Enter or click + to add "{searchQuery.trim()}" as a new tag
              </div>
            )}
          </div>

          {/* Tags Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Check size={16} className="mr-2 text-green-600" />
                    {UI_TEXT.labels.selectedTags} ({selectedTags.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-200 group"
                      >
                        {editingTag === tag ? (
                          <input
                            type="text"
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUpdateTag();
                              }
                            }}
                            onBlur={handleUpdateTag}
                            className="bg-transparent border-none outline-none text-sm w-24 font-medium"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium">{tag}</span>
                        )}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditTag(tag)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-200 transition-colors"
                            title="Edit tag"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors"
                            title="Remove tag"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Tags */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Search size={16} className="mr-2" />
                  {searchQuery ? `Search Results (${filteredTags.length})` : `${UI_TEXT.labels.availableTags} (${filteredTags.length})`}
                </h3>
                {filteredTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg border transition-all hover:scale-105 ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <span>{tag}</span>
                        {selectedTags.includes(tag) && (
                          <Check size={14} className="text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="text-center py-8 text-gray-500">
                    <Search size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No existing tags match "{searchQuery}"</p>
                    {isNewTag && (
                      <p className="text-xs mt-1">Press Enter to add it as a new tag</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{UI_TEXT.noData.noTags}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManagementModal;