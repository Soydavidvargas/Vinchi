'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FolderPlus,
  Loader2,
  LogOut,
  ShieldCheck,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { VINCHI_DOCUMENTATION_FILES } from '@/src/data/vinchiDocumentation';
import {
  findFolderByName,
  findOrCreateDriveFolder,
  getInMemoryDriveToken,
  listFilesInDriveFolder,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  subscribeGoogleDriveAuth,
  uploadHtmlAsGoogleDoc,
  type DriveExistingFile,
  type DriveFolderInfo,
  type DriveUploadedDocResult,
} from '@/src/lib/googleDriveClient';

export interface VinchiDocsDriveModalProps {
  open: boolean;
  onClose: () => void;
}

interface PendingConfirmationPlan {
  folderExists: boolean;
  existingFolder: DriveFolderInfo | null;
  items: Array<{
    docId: string;
    driveFileName: string;
    existingFileId?: string;
    action: 'create' | 'update';
  }>;
}

export default function VinchiDocsDriveModal({ open, onClose }: VinchiDocsDriveModalProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(VINCHI_DOCUMENTATION_FILES[0].id);
  const [checkedDocIds, setCheckedDocIds] = useState<string[]>(() =>
    VINCHI_DOCUMENTATION_FILES.map((d) => d.id)
  );

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getInMemoryDriveToken());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [confirmPlan, setConfirmPlan] = useState<PendingConfirmationPlan | null>(null);
  const [uploadedFolder, setUploadedFolder] = useState<DriveFolderInfo | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<DriveUploadedDocResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeGoogleDriveAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const activeDoc = useMemo(
    () =>
      VINCHI_DOCUMENTATION_FILES.find((d) => d.id === selectedDocId) ??
      VINCHI_DOCUMENTATION_FILES[0],
    [selectedDocId]
  );

  const selectedDocsToExport = useMemo(
    () => VINCHI_DOCUMENTATION_FILES.filter((d) => checkedDocIds.includes(d.id)),
    [checkedDocIds]
  );

  if (!open) return null;

  const toggleDocSelection = (id: string) => {
    setCheckedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setIsConnecting(true);
    try {
      const res = await signInWithGoogleDrive();
      setGoogleUser(res.user);
      setAccessToken(res.accessToken);
      setStatusMsg('Cuenta de Google conectada. Ya puedes revisar y enviar los documentos a Drive.');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No se pudo completar la conexión con Google Drive.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setConfirmPlan(null);
    await signOutGoogleDrive();
    setGoogleUser(null);
    setAccessToken(null);
  };

  const handlePrepareUploadConfirmation = async () => {
    setErrorMsg('');
    setStatusMsg('');
    if (!accessToken) {
      setErrorMsg('Primero inicia sesión con Google para habilitar el envío a tu Drive.');
      return;
    }
    if (selectedDocsToExport.length === 0) {
      setErrorMsg('Selecciona al menos un documento para enviar a Google Drive.');
      return;
    }

    setIsCheckingDrive(true);
    try {
      const existingFolder = await findFolderByName(accessToken, 'Vinchi');
      const existingFiles: DriveExistingFile[] = existingFolder
        ? await listFilesInDriveFolder(accessToken, existingFolder.id)
        : [];

      const byName = new Map<string, DriveExistingFile>();
      for (const f of existingFiles) {
        byName.set(f.name.trim().toLowerCase(), f);
      }

      const items = selectedDocsToExport.map((doc) => {
        const match = byName.get(doc.driveFileName.trim().toLowerCase());
        return {
          docId: doc.id,
          driveFileName: doc.driveFileName,
          existingFileId: match?.id,
          action: (match ? 'update' : 'create') as 'create' | 'update',
        };
      });

      setConfirmPlan({
        folderExists: Boolean(existingFolder),
        existingFolder,
        items,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No se pudo verificar la carpeta Vinchi en Google Drive.'
      );
    } finally {
      setIsCheckingDrive(false);
    }
  };

  const handleConfirmAndSendToDrive = async () => {
    if (!accessToken || !confirmPlan) return;
    setErrorMsg('');
    setStatusMsg('');
    setIsUploading(true);

    try {
      const folder = await findOrCreateDriveFolder(accessToken, 'Vinchi');
      setUploadedFolder(folder);

      const results: DriveUploadedDocResult[] = [];
      for (const item of confirmPlan.items) {
        const doc = VINCHI_DOCUMENTATION_FILES.find((d) => d.id === item.docId);
        if (!doc) continue;
        const uploaded = await uploadHtmlAsGoogleDoc({
          accessToken,
          folderId: folder.id,
          fileName: doc.driveFileName,
          htmlContent: doc.htmlBody,
          existingFileId: item.existingFileId,
        });
        results.push(uploaded);
      }

      setUploadedDocs(results);
      setConfirmPlan(null);
      setStatusMsg(
        `Se enviaron ${results.length} documentos técnicos en formato Google Docs dentro de la carpeta "Vinchi" de tu Google Drive.`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Ocurrió un error al subir los documentos a Drive.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadLocal = (doc: typeof activeDoc) => {
    const blob = new Blob([doc.htmlBody], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.driveFileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vinchi-docs-drive-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1033]/75 px-3 py-4 sm:px-6"
    >
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border-2 border-[#bc8ae1]/80 bg-[#ffffff] shadow-2xl">
        {/* Cabecera */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#543b6c] bg-[#442c61] px-5 py-4 text-[#ffffff] sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-[#e9d5ff]">
              <FileText className="h-4 w-4 text-[#fde68a]" aria-hidden="true" />
              <span>Documentación Oficial del Proyecto · Carpeta Google Drive: &ldquo;Vinchi&rdquo;</span>
            </div>
            <h2
              id="vinchi-docs-drive-title"
              className="mt-1 truncate font-display text-lg font-bold tracking-[-0.02em] text-[#ffffff] sm:text-xl"
            >
              SRS, Diseño, Base de Datos, Wireframes, Endpoints y Plan de Vinchi
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar documentación"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#bc8ae1]/40 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
          >
            <X className="h-5 w-5 stroke-[2.3]" aria-hidden="true" />
          </button>
        </div>

        {/* Barra de conexión y envío a Google Drive */}
        <div className="border-b border-[#e9d5ff] bg-[#faf5ff] px-5 py-3.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {!accessToken ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleGoogleSignIn}
                  className="inline-flex h-11 items-center gap-3 rounded-[12px] border border-[#dadce0] bg-[#ffffff] px-4 text-sm font-medium text-[#3c4043] shadow-xs hover:bg-[#f8f9fa] disabled:opacity-60 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isConnecting ? 'Conectando...' : 'Sign in with Google'}</span>
                </button>
                <p className="text-xs text-[#543b6c]">
                  Conecta tu cuenta de Google para crear la carpeta <strong>Vinchi</strong> y subir los documentos con tu permiso.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-[12px] border border-[#16a34a]/35 bg-[#f0fdf4] px-3.5 py-2 text-xs font-semibold text-[#166534]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Conectado a Google Drive:{' '}
                    {googleUser?.email || googleUser?.displayName || 'Cuenta Google'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignOut}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[12px] border border-[#d8c2ef] bg-[#ffffff] px-3 text-xs font-semibold text-[#442c61] hover:bg-[#f3e8ff] cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Desconectar</span>
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={!accessToken || isCheckingDrive || isUploading || selectedDocsToExport.length === 0}
              onClick={handlePrepareUploadConfirmation}
              className="vinchi-transition inline-flex min-h-[44px] items-center gap-2 rounded-[14px] bg-[#9c44dc] px-5 text-xs font-semibold text-[#ffffff] shadow-sm hover:bg-[#543b6c] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
            >
              {isCheckingDrive ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
              ) : (
                <UploadCloud className="h-4.5 w-4.5 stroke-[2.2]" aria-hidden="true" />
              )}
              <span>
                Enviar seleccionados a carpeta &ldquo;Vinchi&rdquo; ({selectedDocsToExport.length}/
                {VINCHI_DOCUMENTATION_FILES.length})
              </span>
            </button>
          </div>

          {statusMsg && (
            <div className="mt-3 rounded-[14px] border border-[#16a34a]/35 bg-[#f0fdf4] p-3 text-xs text-[#166534]">
              <p className="font-semibold">{statusMsg}</p>
              {uploadedFolder && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={uploadedFolder.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#16a34a] px-3 py-1.5 font-semibold text-[#ffffff] hover:bg-[#15803d]"
                  >
                    <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Abrir carpeta &ldquo;{uploadedFolder.name}&rdquo; en Drive</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  {uploadedDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-[10px] border border-[#16a34a]/40 bg-[#ffffff] px-2.5 py-1 font-semibold text-[#166534] hover:bg-[#dcfce7]"
                    >
                      <span>{doc.name}</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-[#dc2626]/35 bg-[#fef2f2] px-3.5 py-2.5 text-xs font-semibold text-[#991b1b]">
              <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Diálogo de Confirmación Explícita antes de crear/actualizar archivos en Google Drive */}
        {confirmPlan && (
          <div className="border-b-2 border-[#9c44dc] bg-[#f3e8ff] px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#442c61]">
                  <ShieldCheck className="h-4.5 w-4.5 text-[#9c44dc]" aria-hidden="true" />
                  <span>Confirmación requerida antes de escribir en tu Google Drive</span>
                </div>
                <p className="mt-1 text-xs text-[#543b6c]">
                  {confirmPlan.folderExists
                    ? 'Se usará la carpeta existente "Vinchi" en tu Google Drive.'
                    : 'Se creará una nueva carpeta llamada "Vinchi" en la raíz de tu Google Drive.'}{' '}
                  Revisa los {confirmPlan.items.length} documentos que se guardarán como Google Docs:
                </p>

                <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                  {confirmPlan.items.map((item) => (
                    <li
                      key={item.docId}
                      className="flex items-center justify-between gap-2 rounded-[10px] border border-[#bc8ae1]/60 bg-[#ffffff] px-3 py-1.5 text-xs"
                    >
                      <span className="truncate font-semibold text-[#442c61]">
                        {item.driveFileName}
                      </span>
                      <span
                        className={`shrink-0 rounded-[6px] px-2 py-0.5 text-[10px] font-bold ${
                          item.action === 'update'
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#dcfce7] text-[#166534]'
                        }`}
                      >
                        {item.action === 'update' ? 'Sobrescribir' : 'Nuevo'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={isUploading}
                onClick={handleConfirmAndSendToDrive}
                className="vinchi-transition inline-flex min-h-[40px] items-center gap-2 rounded-[12px] bg-[#442c61] px-5 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {isUploading ? 'Subiendo a Google Drive...' : 'Confirmar y enviar a Google Drive'}
                </span>
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setConfirmPlan(null)}
                className="inline-flex min-h-[40px] items-center rounded-[12px] border border-[#bc8ae1] bg-[#ffffff] px-4 text-xs font-semibold text-[#442c61] hover:bg-[#faf5ff] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Cuerpo: Lista lateral de 6 documentos + Previsualización */}
        <div className="grid flex-1 overflow-hidden md:grid-cols-12">
          <aside className="overflow-y-auto border-b border-[#e9d5ff] bg-[#ffffff] p-4 space-y-2 md:col-span-4 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-xs font-bold text-[#442c61]">
                Documentos incluidos ({VINCHI_DOCUMENTATION_FILES.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  setCheckedDocIds(
                    checkedDocIds.length === VINCHI_DOCUMENTATION_FILES.length
                      ? []
                      : VINCHI_DOCUMENTATION_FILES.map((d) => d.id)
                  )
                }
                className="text-[11px] font-semibold text-[#9c44dc] hover:underline cursor-pointer"
              >
                {checkedDocIds.length === VINCHI_DOCUMENTATION_FILES.length
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </button>
            </div>

            {VINCHI_DOCUMENTATION_FILES.map((doc) => {
              const isSelected = activeDoc.id === doc.id;
              const isChecked = checkedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`rounded-[16px] border p-3 transition-colors ${
                    isSelected
                      ? 'border-2 border-[#9c44dc] bg-[#faf5ff]'
                      : 'border-[#e5e5e5] bg-[#ffffff] hover:border-[#bc8ae1]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDocSelection(doc.id)}
                      aria-label={`Incluir ${doc.driveFileName} al enviar a Drive`}
                      className="mt-1 h-4 w-4 accent-[#9c44dc] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <p className="text-xs font-bold text-[#442c61]">{doc.driveFileName}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-[#9c44dc]">
                        {doc.category}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#543b6c]">{doc.summary}</p>
                    </button>
                  </div>
                </div>
              );
            })}
          </aside>

          <section className="flex flex-col overflow-hidden bg-[#f8f5fc] md:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e9d5ff] bg-[#ffffff] px-5 py-3">
              <div>
                <h3 className="font-display text-sm font-bold text-[#442c61]">
                  Vista previa: {activeDoc.driveFileName}
                </h3>
                <p className="text-[11px] text-[#543b6c]">
                  Se exportará como documento nativo de Google Docs en la carpeta Vinchi
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadLocal(activeDoc)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-xs font-semibold text-[#442c61] hover:bg-[#f3e8ff] cursor-pointer"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Descargar HTML</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <iframe
                title={`Vista previa ${activeDoc.driveFileName}`}
                srcDoc={activeDoc.htmlBody}
                sandbox=""
                className="h-[520px] w-full rounded-[18px] border border-[#d8c2ef] bg-[#ffffff] shadow-xs"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
