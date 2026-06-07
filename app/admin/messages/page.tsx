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

  const loadMessages = async () => {
    setMessages(await getMessages());
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Та энэ зурвасыг устгахдаа итгэлтэй байна уу?')) {
      await deleteMessage(id);
      loadMessages();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markMessageAsRead(id);
    loadMessages();
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Зурвасууд</h1>

      <div className="card messages-card">
        {loading ? (
          <div>Ачааллаж байна...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-secondary)' }}>
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
                  <tr key={message.id} style={{ background: message.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)' }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{message.name}</div>
                      <div className="text-secondary" style={{ marginTop: '0.5rem', fontSize: '1rem', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${message.email}`} style={{ color: 'var(--admin-accent)' }}>
                        {message.email}
                      </a>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>
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
