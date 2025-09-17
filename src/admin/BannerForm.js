import React, { useState, useEffect } from 'react';
import '../components/BannerForm.css';

const BannerForm = ({ onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.imageUrl || '');
      setButtonText(initialData.buttonText || '');
      setTags(initialData.tags || []);
    }
  }, [initialData]);

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      // For editing, we need to handle both file upload and direct URL updates
      if (imageFile) {
        // If a new file is uploaded, we need to upload it first
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        const uploadResponse = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadResult = await uploadResponse.json();
        const bannerData = {
          title,
          description,
          buttonText,
          tags,
          imageUrl: uploadResult.imageUrl
        };
        onSave(bannerData);
      } else if (imageUrl) {
        // For new banners or edits without file upload, send the data directly
        const bannerData = {
          title,
          description,
          buttonText,
          tags,
          imageUrl: imageUrl
        };
        onSave(bannerData);
      } else {
        alert('Please either upload an image or provide an image URL.');
        return;
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner. Please try again.');
    }
  };

  return (
    <div className="banner-form-overlay">
      <div className="banner-form-container">
        <h2>{initialData ? 'Edit Banner' : 'Add New Banner'}</h2>
        <form onSubmit={handleSubmit} className="banner-form">
          <label>
            Title<span className="required">*</span>:
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label>
            Description<span className="required">*</span>:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
          <label>
            Image Upload{!initialData && <span className="required">*</span>}:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              required={!initialData}
            />
            {imageUrl && !imageFile && (
              <div className="current-image">
                <p>Current image:</p>
                <img src={imageUrl} alt="Current banner" style={{ width: '100px', height: '60px', objectFit: 'cover' }} />
              </div>
            )}
          </label>
          <label>
            Button Text:
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
            />
          </label>
          <label>
            Tags:
            <div className="tags-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
              />
              <button type="button" className="btn-add-tag" onClick={handleAddTag}>+</button>
            </div>
            <div className="tags-list">
              {tags.map(tag => (
                <span key={tag} className="tag-item" onClick={() => alert(`Search for tag: ${tag}`)}>
                  {tag} &times;
                  <button type="button" className="btn-remove-tag" onClick={() => handleRemoveTag(tag)}>x</button>
                </span>
              ))}
            </div>
          </label>
          <div className="banner-form-buttons">
            <button type="submit" className="btn-save">{initialData ? 'Update' : 'Save'}</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerForm;
