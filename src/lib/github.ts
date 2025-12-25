const API_BASE = 'https://api.github.com';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface RepoContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url: string | null;
  html_url: string;
}

export interface ImageFile extends RepoContent {
  type: 'file';
  download_url: string;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];

export function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    if (response.status === 403 || response.status === 401) {
      throw new Error('Token lacks required permissions. Please use a classic token with repo and delete_repo scopes.');
    }
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function getUserRepos(token: string): Promise<Repository[]> {
  return fetchWithAuth(`${API_BASE}/user/repos?sort=updated&per_page=100`, token);
}

export async function createRepo(token: string, name: string, isPrivate: boolean, description?: string): Promise<Repository> {
  return fetchWithAuth(`${API_BASE}/user/repos`, token, {
    method: 'POST',
    body: JSON.stringify({
      name,
      private: isPrivate,
      description,
      auto_init: true,
    }),
  });
}

export async function deleteRepo(token: string, owner: string, repo: string): Promise<void> {
  const response = await fetch(`${API_BASE}/repos/${owner}/${repo}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });
  
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

export async function updateRepoVisibility(token: string, owner: string, repo: string, isPrivate: boolean): Promise<Repository> {
  return fetchWithAuth(`${API_BASE}/repos/${owner}/${repo}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ private: isPrivate }),
  });
}

export async function getRepoContents(token: string, owner: string, repo: string, path: string = ''): Promise<RepoContent[]> {
  const url = path 
    ? `${API_BASE}/repos/${owner}/${repo}/contents/${path}`
    : `${API_BASE}/repos/${owner}/${repo}/contents`;
  
  const result = await fetchWithAuth(url, token);
  return Array.isArray(result) ? result : [result];
}

export async function getAllImages(token: string, owner: string, repo: string, path: string = ''): Promise<ImageFile[]> {
  const contents = await getRepoContents(token, owner, repo, path);
  const images: ImageFile[] = [];
  
  for (const item of contents) {
    if (item.type === 'dir') {
      const subImages = await getAllImages(token, owner, repo, item.path);
      images.push(...subImages);
    } else if (item.type === 'file' && isImageFile(item.name) && item.download_url) {
      images.push(item as ImageFile);
    }
  }
  
  return images;
}

export async function uploadFile(
  token: string, 
  owner: string, 
  repo: string, 
  path: string, 
  content: string, 
  message: string
): Promise<void> {
  await fetchWithAuth(`${API_BASE}/repos/${owner}/${repo}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content, // Base64 encoded
    }),
  });
}

export async function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string
): Promise<void> {
  await fetchWithAuth(`${API_BASE}/repos/${owner}/${repo}/contents/${path}`, token, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      sha,
    }),
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export async function downloadMultipleFiles(files: ImageFile[]): Promise<void> {
  for (const file of files) {
    if (file.download_url) {
      await downloadFile(file.download_url, file.name);
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

export async function getUser(token: string) {
  return fetchWithAuth(`${API_BASE}/user`, token);
}
