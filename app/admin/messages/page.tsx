'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMessages, deleteMessage, markMessageAsRead } from '@/app/lib/storage';
import { Message } from '@/app/lib/data';
import '../admin.css'; // Import global admin styles

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    setMessages(getMessages());
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Та энэ зурвасыг устгахдаа итгэлтэй байна уу?')) {
      deleteMessage(id);
      loadMessages();
    }
  };

  const handleMarkAsRead = (id: string) => {
    markMessageAsRead(id);
    loadMessages();
  };

  return (
    <div className="admin-container">
      {/* Header removed as requested */}
      
      <div className="card messages-card">
        {loading ? (
          <div>Ачааллаж байна...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Одоогоор зурвас байхгүй байна.
          </div>
        ) : (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Зурвас</th>
                  <th>Имэйл</th>
                  <th>Огноо</th>
                  <th>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message.id} style={{ background: message.read ? 'transparent' : 'rgba(var(--accent-primary-rgb), 0.1)' }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{message.name}</div>
                      <div className="text-secondary" style={{ marginTop: '0.5rem', fontSize: '1rem', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${message.email}`} style={{ color: 'var(--accent-primary)' }}>
                        {message.email}
                      </a>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(message.createdAt).toLocaleDateString('mn-MN')} <br/>
                      {new Date(message.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!message.read && (
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handleMarkAsRead(message.id)}
                            title="Уншсан гэж тэмдэглэх"
                          >
                            ✓
                          </button>
                        )}
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(message.id)}
                          title="Устгах"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
