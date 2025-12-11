'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { saveMessage } from '@/app/lib/storage';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    content: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate network delay for better UX
    setTimeout(() => {
      saveMessage(formData);
      setStatus('success');
      setFormData({ name: '', email: '', content: '' });
    }, 1000);
  };

  return (
    <>
      <Header />
      <main style={{ paddingTop: '8rem', paddingBottom: '5rem', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem', textAlign: 'center' }}>Холбоо барих</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '4rem' }}>
            Бро танд төслийн санаа байна уу эсвэл зүгээр л мэндчилмээр байна уу? Би тантай ярилцахдаа таатай байх болно. Жич энэ миний албан ёсны имэйл шүү.  
            <a href="mailto:tomorsukh.official@gmail.com" style={{ color: 'var(--accent-primary)', marginLeft: '0.5rem' }}>
               tomorsukh.official@gmail.com
            </a>
          </p>
          
          <div style={{ background: 'var(--surface)', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
             {status === 'success' ? (
               <div style={{ textAlign: 'center', padding: '2rem' }}>
                 <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                 <h3 style={{ marginBottom: '1rem' }}>Зурвас амжилттай илгээгдлээ!</h3>
                 <p style={{ color: 'var(--text-secondary)' }}>Би тантай удахгүй холбогдох болно.</p>
                 <button 
                   onClick={() => setStatus('idle')}
                   style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
                 >
                   Дахин зурвас бичих
                 </button>
               </div>
             ) : (
               <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 <div>
                   <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Таны нэр эсвэл хоч</label>
                   <input 
                    id="name"
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--background)', color: 'var(--text-primary)' }} 
                    placeholder="Таны нэр" 
                   />
                 </div>
                 <div>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Таны имэйл</label>
                   <input 
                    id="email"
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--background)', color: 'var(--text-primary)' }} 
                    placeholder="tani@email.com" 
                   />
                 </div>
                 <div>
                   <label htmlFor="content" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Зурвас</label>
                   <textarea 
                    id="content"
                    required
                    rows={5} 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'inherit' }} 
                    placeholder="Төслийнхөө талаар бичнэ үү"
                   ></textarea>
                 </div>
                 <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  style={{ padding: '1rem', background: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: status === 'submitting' ? 0.7 : 1 }}
                 >
                   {status === 'submitting' ? 'Илгээж байна...' : 'Илгээх'}
                 </button>
               </form>
             )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}