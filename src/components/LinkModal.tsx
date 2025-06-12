import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from '../types';
import { useStore } from '../store/store';
import { LINK_TYPES, UI_TEXT } from '../constants';

interface LinkModalProps {
  propertyId: number;
  link?: Link;
  onClose: () => void;
}

const LinkModal: React.FC<LinkModalProps> = ({ propertyId, link, onClose }) => {
  const { createLink, updateLink, loadingStates, isMobileView } = useStore();
  
  const [formData, setFormData] = useState<Partial<Link>>({
    property_id: propertyId,
    link: '',
    type: 'Website',
    anchor: ''
  });

  const [isValidUrl, setIsValidUrl] = useState(true);
  const isLoading = loadingStates.creating || loadingStates.updating;

  useEffect(() => {
    if (link) {
      setFormData(link);
    }
  }, [link]);

  // Validate URL format
  const validateUrl = (url: string) => {
    if (!url.trim()) {
      setIsValidUrl(true);
      return;
    }
    
    try {
      new URL(url);
      setIsValidUrl(true);
    } catch {
      // Check if it's a relative URL or missing protocol
      if (url.includes('.') && !url.includes(' ')) {
        setIsValidUrl(true);
      } else {
        setIsValidUrl(false);
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, link: url });
    validateUrl(url);
  };

  const formatUrl = (url: string) => {
    if (!url) return '';
    
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      return `https://${url}`;
    }
    
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.link?.trim() || isLoading) {
      return;
    }

    const linkData = {
      ...formData,
      property_id: propertyId,
      link: formatUrl(formData.link.trim()),
      anchor: formData.anchor?.trim() || undefined,
      type: formData.type || 'Website'
    } as Link;

    try {
      if (link) {
        await updateLink(linkData);
      } else {
        const { id, created_at, ...newLinkData } = linkData;
        await createLink(newLinkData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save link:', error);
    }
  };

  const previewUrl = formData.link ? formatUrl(formData.link) : '';

  return (
    <div className={`fixed bg-black bg-opacity-50 z-[60] flex items-center justify-center ${
      isMobileView ? 'inset-0' : 'inset-0'
    }`}>
      <div className={`bg-white w-full ${
        isMobileView 
          ? 'h-full max-w-none rounded-none flex flex-col' 
          : 'rounded-lg max-w-md'
      }`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <LinkIcon size={20} className="mr-2" />
            {link ? UI_TEXT.buttons.editLink : UI_TEXT.buttons.addLink}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`p-4 space-y-4 ${
          isMobileView ? 'flex-1 overflow-y-auto' : ''
        }`}>
          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.url} *</label>
            <input
              type="text"
              value={formData.link || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={`w-full border rounded-md p-2 ${
                !isValidUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={UI_TEXT.placeholders.link.url}
              required
              disabled={isLoading}
            />
            {!isValidUrl && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
            )}
            {previewUrl && isValidUrl && (
              <div className="mt-2 p-2 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500 mb-1">Preview:</div>
                <div className="flex items-center space-x-2">
                  <ExternalLink size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-blue-600 truncate">{previewUrl}</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.linkType}</label>
            <select
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border rounded-md p-2"
              disabled={isLoading}
            >
              {LINK_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.displayText}</label>
            <input
              type="text"
              value={formData.anchor || ''}
              onChange={(e) => setFormData({ ...formData, anchor: e.target.value })}
              className="w-full border rounded-md p-2"
              placeholder={UI_TEXT.placeholders.link.anchor}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              If left empty, the URL will be used as display text
            </p>
          </div>

          <div className={`flex justify-end space-x-3 pt-4 ${
            isMobileView ? 'sticky bottom-0 bg-white border-t -mx-4 px-4 py-4' : ''
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              {UI_TEXT.buttons.cancel}
            </button>
            <button
              type="submit"
              disabled={!formData.link?.trim() || !isValidUrl || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              <span>
                {link ? UI_TEXT.buttons.updateLink : UI_TEXT.buttons.addLink}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkModal;