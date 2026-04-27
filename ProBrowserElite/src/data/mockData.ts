// Mock Data for Pro Browser Elite
// All data is local/mock with setTimeout loading states

export const mockAIResponses = [
  { id: '1', role: 'assistant', content: 'Hello! How can I help you today?' },
  { id: '2', role: 'user', content: 'What can you do?' },
  { id: '3', role: 'assistant', content: 'I can help you with browsing, managing tabs, bookmarks, and more!' },
];

export const aiSuggestions = [
  'Search the web',
  'Open a new tab',
  'Manage bookmarks',
  'View history',
  'Check downloads',
];

export const speedDials = [
  { id: '1', title: 'Google', url: 'https://google.com', icon: '🔍' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
  { id: '3', title: 'Amazon', url: 'https://amazon.com', icon: '📦' },
  { id: '4', title: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
  { id: '5', title: 'Facebook', url: 'https://facebook.com', icon: '👥' },
  { id: '6', title: 'Wikipedia', url: 'https://wikipedia.org', icon: '📚' },
  { id: '7', title: 'Reddit', url: 'https://reddit.com', icon: '🤖' },
  { id: '8', title: 'Netflix', url: 'https://netflix.com', icon: '🎬' },
  { id: '9', title: 'Gmail', url: 'https://gmail.com', icon: '✉️' },
  { id: '10', title: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
  { id: '11', title: 'Instagram', url: 'https://instagram.com', icon: '📸' },
  { id: '12', title: 'WhatsApp', url: 'https://whatsapp.com', icon: '💬' },
];

export const mockTabs = [
  { id: '1', title: 'Google', url: 'https://google.com', favicon: '🔍' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', favicon: '▶️' },
];

export const mockBookmarks = [
  { id: '1', title: 'Google', url: 'https://google.com', folder: 'Default' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', folder: 'Entertainment' },
];

export const mockHistory = [
  { id: '1', title: 'Google', url: 'https://google.com', timestamp: Date.now() },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', timestamp: Date.now() - 86400000 },
];

export const mockDownloads = [
  { id: '1', filename: 'document.pdf', size: 1024, progress: 100, status: 'Complete' },
  { id: '2', filename: 'image.jpg', size: 512, progress: 50, status: 'Downloading' },
];
