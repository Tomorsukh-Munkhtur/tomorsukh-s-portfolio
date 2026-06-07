'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addProject, getCategories } from '../../../lib/storage';
import { compressImage } from '../../../lib/imageCompress';
import Link from 'next/link';

interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  images: string[];
  featured: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    images: [],
    featured: false
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) {
        setFormData(prev => ({ ...prev, category: cats[0] }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure imageUrl is set, fall back to the first uploaded image
    const finalData = {
      ...formData,
      imageUrl: formData.imageUrl || (formData.images.length > 0 ? formData.images[0] : '')
    };

    await addProject(finalData);
    router.push('/admin/projects');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const files = Array.from(e.target.files);

    try {
      const uploadedUrls: string[] = [];

      // Compress and upload each image individually to stay under the
      // serverless request-size limit.
      for (const file of files) {
        const compressed = await compressImage(file);
        const formDataUpload = new FormData();
        formDataUpload.append('file', compressed);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        const data = await response.json();

        if (data.success) {
          uploadedUrls.push(...data.urls);
        } else {
          alert('Зураг хуулахад алдаа гарлаа: ' + data.message);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
          imageUrl: !prev.imageUrl ? uploadedUrls[0] : prev.imageUrl
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Зураг хуулахад алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const removedUrl = newImages[index];
      newImages.splice(index, 1);
      
      let newMainImage = prev.imageUrl;
      if (prev.imageUrl === removedUrl) {
        newMainImage = newImages.length > 0 ? newImages[0] : '';
      }
      
      return {
        ...prev,
        images: newImages,
        imageUrl: newMainImage
      };
    });
  };

  const setMainImage = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/projects" style={{ color: 'var(--admin-accent)', textDecoration: 'none' }}>
          ← Буцах
        </Link>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Шинэ төсөл нэмэх</h1>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label className="form-label">Гарчиг *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="Төслийн нэр"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Тайлбар *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Төслийн тухай богино тайлбар"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Ангилал *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Зураг оруулах (Олон зураг сонгож болно)</label>
          <input
            type="file"
            onChange={handleFileUpload}
            className="form-input"
            multiple
            accept="image/*"
            disabled={uploading}
          />
          {uploading && <p className="text-sm text-secondary mt-2">Хуулж байна...</p>}
        </div>

        {formData.images.length > 0 && (
          <div className="form-group">
            <label className="form-label">Сонгогдсон зургууд (Үндсэн зургийг сонгох)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {formData.images.map((url, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '1', border: formData.imageUrl === url ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <img
                    src={url}
                    alt={`Uploaded ${index}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setMainImage(url)}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}
                  >
                    ×
                  </button>
                  {formData.imageUrl === url && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      background: 'var(--admin-accent)',
                      color: 'white',
                      fontSize: '10px',
                      textAlign: 'center',
                      padding: '2px'
                    }}>Үндсэн</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keeping text input for manual URL entry as fallback */}
        <div className="form-group">
          <label className="form-label">Зургийн URL (Гараар оруулах бол)</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="/projects/example.jpg"
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="form-checkbox"
            />
            <span className="form-label" style={{ margin: 0 }}>Онцлох төсөл болгох</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            Хадгалах
          </button>
          <Link href="/admin/projects" className="btn btn-secondary">
            Цуцлах
          </Link>
        </div>
      </form>
    </div>
  );
}