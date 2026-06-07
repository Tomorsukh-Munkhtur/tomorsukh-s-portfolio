import { Project, Message } from './data';
import { getSupabase } from './supabase';
import { getAdminToken } from './auth';

// ---------------------------------------------------------------------------
// Helpers: map Supabase rows (snake_case) <-> app types (camelCase)
// ---------------------------------------------------------------------------

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  images: string[] | null;
  featured: boolean;
};

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url ?? '',
    images: row.images ?? [],
    featured: !!row.featured,
  };
}

function adminHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAdminToken()}`,
  };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProjects error:', error.message);
    return [];
  }
  return (data ?? []).map(rowToProject);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToProject(data);
}

export async function addProject(project: Omit<Project, 'id'>): Promise<Project | null> {
  const { data, error } = await getSupabase()
    .from('projects')
    .insert({
      title: project.title,
      description: project.description,
      category: project.category,
      image_url: project.imageUrl,
      images: project.images ?? [],
      featured: project.featured,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('addProject error:', error?.message);
    return null;
  }
  return rowToProject(data);
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const patch: Partial<ProjectRow> = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.imageUrl !== undefined) patch.image_url = updates.imageUrl;
  if (updates.images !== undefined) patch.images = updates.images;
  if (updates.featured !== undefined) patch.featured = updates.featured;

  const { data, error } = await getSupabase()
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('updateProject error:', error?.message);
    return null;
  }
  return rowToProject(data);
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('projects').delete().eq('id', id);
  if (error) {
    console.error('deleteProject error:', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('name')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getCategories error:', error.message);
    return [];
  }
  return (data ?? []).map((c: { name: string }) => c.name);
}

export async function addCategory(category: string): Promise<boolean> {
  const name = category.trim();
  if (!name) return false;

  const { error } = await getSupabase().from('categories').insert({ name });
  // A unique-constraint violation means the category already exists.
  if (error) {
    console.error('addCategory error:', error.message);
    return false;
  }
  return true;
}

export async function deleteCategory(category: string): Promise<boolean> {
  const { error } = await getSupabase().from('categories').delete().eq('name', category);
  if (error) {
    console.error('deleteCategory error:', error.message);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Messages
//  - Submitting (insert) is public: the contact form uses the anon client.
//  - Reading / updating / deleting is admin-only and goes through API routes
//    that use the service-role key, so message contents (emails) are never
//    exposed to the public.
// ---------------------------------------------------------------------------

export async function saveMessage(
  message: Omit<Message, 'id' | 'createdAt' | 'read'>
): Promise<boolean> {
  const { error } = await getSupabase().from('messages').insert({
    name: message.name,
    email: message.email,
    content: message.content,
  });
  if (error) {
    console.error('saveMessage error:', error.message);
    return false;
  }
  return true;
}

export async function getMessages(): Promise<Message[]> {
  const res = await fetch('/api/messages', { headers: adminHeaders() });
  if (!res.ok) {
    console.error('getMessages failed:', res.status);
    return [];
  }
  const json = await res.json();
  return (json.messages ?? []) as Message[];
}

export async function deleteMessage(id: string): Promise<void> {
  await fetch(`/api/messages/${id}`, { method: 'DELETE', headers: adminHeaders() });
}

export async function markMessageAsRead(id: string): Promise<void> {
  await fetch(`/api/messages/${id}`, { method: 'PATCH', headers: adminHeaders() });
}
