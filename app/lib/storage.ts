import { Project, projects as initialProjects, Message } from './data';

const STORAGE_KEY = 'tomorsukh_projects';
const CATEGORIES_KEY = 'tomorsukh_categories';

const DEFAULT_CATEGORIES = [
  'Ãâ€™ÃÂµÃÂ± ÃÂ´ÃÂ¸ÃÂ·ÃÂ°ÃÂ¹ÃÂ½',
  'ÃÅ“ÃÂ¾ÃÂ±ÃÂ°ÃÂ¹ÃÂ» ÃÂ´ÃÂ¸ÃÂ·ÃÂ°ÃÂ¹ÃÂ½',
  'Ãâ€ÃÂ¸ÃÂ¶ÃÂ¸Ã‘â€šÃÂ°ÃÂ» ÃÂ·Ã‘Æ’Ã‘â‚¬ÃÂ°ÃÂ³',
  'Ãâ€™ÃÂµÃÂ± Ã‘ÂÃÂ¸Ã‘ÂÃ‘â€šÃÂµÃÂ¼',
  'Ãâ€ºÃÂ¾ÃÂ³ÃÂ¾',
  'Ãâ€˜Ã‘â‚¬Ã‘ÂÃÂ½ÃÂ´ÃÂ±Ã’Â¯Ã’Â¯ÃÂº'
];

// Initialize storage with default projects if empty
function initializeStorage(): void {
  if (typeof window !== 'undefined') {
    const storedProjects = localStorage.getItem(STORAGE_KEY);
    if (!storedProjects) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialProjects));
    }
    
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);
    if (!storedCategories) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }
  }
}

// Get all projects from storage
export function getProjects(): Project[] {
  if (typeof window !== 'undefined') {
    initializeStorage();
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialProjects;
  }
  return initialProjects;
}

// Save projects to storage
export function saveProjects(projects: Project[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
}

// Add a new project
export function addProject(project: Omit<Project, 'id'>): Project {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: Date.now().toString(),
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
}

// Update an existing project
export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  projects[index] = { ...projects[index], ...updates };
  saveProjects(projects);
  return projects[index];
}

// Delete a project
export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  if (filtered.length === projects.length) return false;
  
  saveProjects(filtered);
  return true;
}

// Get a single project by ID
export function getProjectById(id: string): Project | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

// --- Category Management ---

// Get all categories
export function getCategories(): string[] {
  if (typeof window !== 'undefined') {
    initializeStorage();
    const stored = localStorage.getItem(CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  }
  return DEFAULT_CATEGORIES;
}

// Add a new category
export function addCategory(category: string): boolean {
  const categories = getCategories();
  if (categories.includes(category)) return false;
  
  const newCategories = [...categories, category];
  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
  }
  return true;
}

// Delete a category
export function deleteCategory(category: string): boolean {
  const categories = getCategories();
  const newCategories = categories.filter(c => c !== category);
  
  if (categories.length === newCategories.length) return false;

  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
  }
  return true;
}

// Message Management
export const getMessages = (): Message[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('portfolio_messages');
  if (!stored) return [];
  try {
    return JSON.parse(stored).sort((a: Message, b: Message) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

export const saveMessage = (message: Omit<Message, 'id' | 'createdAt' | 'read'>): Message => {
  const messages = getMessages();
  const newMessage: Message = {
    ...message,
    id: Date.now().toString(),
    createdAt: Date.now(),
    read: false,
  };
  messages.push(newMessage);
  localStorage.setItem('portfolio_messages', JSON.stringify(messages));
  return newMessage;
};

export const deleteMessage = (id: string) => {
  const messages = getMessages().filter(m => m.id !== id);
  localStorage.setItem('portfolio_messages', JSON.stringify(messages));
};

export const markMessageAsRead = (id: string) => {
  const messages = getMessages().map(m => {
    if (m.id === id) {
      return { ...m, read: true };
    }
    return m;
  });
  localStorage.setItem('portfolio_messages', JSON.stringify(messages));
};