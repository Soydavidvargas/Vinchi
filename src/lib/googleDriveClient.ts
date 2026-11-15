import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
] as const;

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({ prompt: 'consent select_account' });

// Token almacenado exclusivamente en memoria (nunca en localStorage ni sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function subscribeGoogleDriveAuth(
  onAuthSuccess: (user: User, accessToken: string) => void,
  onAuthCleared: () => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user && cachedAccessToken) {
      onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      onAuthCleared();
    }
  });
}

export async function signInWithGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se recibió el token de autorización de Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } finally {
    isSigningIn = false;
  }
}

export async function signOutGoogleDrive(): Promise<void> {
  cachedAccessToken = null;
  await signOut(auth);
}

export function getInMemoryDriveToken(): string | null {
  return cachedAccessToken;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
  created: boolean;
}

export interface DriveExistingFile {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveUploadedDocResult {
  id: string;
  name: string;
  webViewLink: string;
  action: 'created' | 'updated';
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function parseDriveError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    if (data?.error?.message) return data.error.message;
  } catch {
    // Fallback abajo
  }
  return `Error de Google Drive (${response.status})`;
}

export async function findFolderByName(
  accessToken: string,
  folderName: string
): Promise<DriveFolderInfo | null> {
  const query = `name='${escapeDriveQueryValue(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,webViewLink)',
    pageSize: '5',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res));
  }
  const data = (await res.json()) as {
    files?: Array<{ id: string; name: string; webViewLink?: string }>;
  };
  const found = data.files?.[0];
  if (!found) return null;
  return {
    id: found.id,
    name: found.name,
    webViewLink: found.webViewLink || `https://drive.google.com/drive/folders/${found.id}`,
    created: false,
  };
}

export async function findOrCreateDriveFolder(
  accessToken: string,
  folderName = 'Vinchi'
): Promise<DriveFolderInfo> {
  const existing = await findFolderByName(accessToken, folderName);
  if (existing) return existing;

  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );
  if (!res.ok) {
    throw new Error(await parseDriveError(res));
  }
  const created = (await res.json()) as { id: string; name: string; webViewLink?: string };
  return {
    id: created.id,
    name: created.name,
    webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
    created: true,
  };
}

export async function listFilesInDriveFolder(
  accessToken: string,
  folderId: string
): Promise<DriveExistingFile[]> {
  const query = `'${escapeDriveQueryValue(folderId)}' in parents and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,webViewLink)',
    pageSize: '100',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseDriveError(res));
  }
  const data = (await res.json()) as { files?: DriveExistingFile[] };
  return data.files ?? [];
}

export async function uploadHtmlAsGoogleDoc(params: {
  accessToken: string;
  folderId: string;
  fileName: string;
  htmlContent: string;
  existingFileId?: string;
}): Promise<DriveUploadedDocResult> {
  const { accessToken, folderId, fileName, htmlContent, existingFileId } = params;
  const boundary = `vinchi_boundary_${Date.now().toString(36)}`;

  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: 'application/vnd.google-apps.document',
  };
  if (!existingFileId) {
    metadata.parents = [folderId];
  }

  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlContent,
    `--${boundary}--`,
  ].join('\r\n');

  const endpoint = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=multipart&fields=id,name,webViewLink`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';

  const res = await fetch(endpoint, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    throw new Error(await parseDriveError(res));
  }

  const file = (await res.json()) as { id: string; name: string; webViewLink?: string };
  return {
    id: file.id,
    name: file.name,
    webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
    action: existingFileId ? 'updated' : 'created',
  };
}
