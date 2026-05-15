import { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Download, Eye, AlertCircle, Loader2 } from 'lucide-react';
import type { AttachedDocument } from '../../types';
import { generateId } from '../../utils/helpers';
import { useStaffStore } from '../../store/staffStore';

interface DocumentUploadProps {
  attachments: AttachedDocument[];
  onChange: (next: AttachedDocument[]) => void;
  label?: string;
  accept?: string;        // e.g. "application/pdf,image/*"
  maxFileMB?: number;     // per-file limit
  maxTotalMB?: number;    // sum limit
  readOnly?: boolean;
}

const DEFAULT_ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif,image/gif,image/tiff,application/dicom,.dcm,.pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,.gif,.tif,.tiff';

export default function DocumentUpload({
  attachments,
  onChange,
  label = 'Documents',
  accept = DEFAULT_ACCEPT,
  maxFileMB = 8,
  maxTotalMB = 20,
  readOnly = false,
}: DocumentUploadProps) {
  const { currentUser } = useStaffStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<AttachedDocument | null>(null);

  const totalBytes = attachments.reduce((s, a) => s + a.sizeBytes, 0);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const added: AttachedDocument[] = [];
      let runningTotal = totalBytes;
      for (const file of Array.from(files)) {
        if (file.size > maxFileMB * 1024 * 1024) {
          setError(`"${file.name}" is larger than ${maxFileMB} MB. Compress before uploading.`);
          continue;
        }
        if (runningTotal + file.size > maxTotalMB * 1024 * 1024) {
          setError(`Total attachment size would exceed ${maxTotalMB} MB. Remove old files first.`);
          break;
        }
        const dataUrl = await readFileAsDataUrl(file);
        added.push({
          id: 'doc-' + generateId(),
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown',
        });
        runningTotal += file.size;
      }
      if (added.length > 0) onChange([...attachments, ...added]);
    } catch (e) {
      setError(`Failed to read file: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAttachment(id: string) {
    onChange(attachments.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {attachments.length > 0 && (
          <span className="text-xs text-gray-500">
            {attachments.length} file{attachments.length === 1 ? '' : 's'} · {formatBytes(totalBytes)} / {maxTotalMB} MB
          </span>
        )}
      </div>

      {/* Upload area */}
      {!readOnly && (
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-1 text-gray-600">
            {busy ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <p className="text-sm">{busy ? 'Reading file…' : 'Click or drag files to upload'}</p>
            <p className="text-xs text-gray-400">PDF, images, DICOM · up to {maxFileMB} MB each · {maxTotalMB} MB total</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white text-sm">
              {a.mimeType.startsWith('image/') ? (
                <img src={a.dataUrl} alt={a.filename} className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  {a.mimeType === 'application/pdf' ? <FileText size={18} className="text-red-600" /> : <FileText size={18} className="text-gray-500" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate text-xs">{a.filename}</p>
                <p className="text-[10px] text-gray-500">
                  {formatBytes(a.sizeBytes)} · {a.mimeType.split('/')[1] || a.mimeType} · by {a.uploadedBy} · {new Date(a.uploadedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {(a.mimeType.startsWith('image/') || a.mimeType === 'application/pdf') && (
                  <button
                    type="button"
                    onClick={() => setPreview(a)}
                    title="Preview"
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye size={14} />
                  </button>
                )}
                <a
                  href={a.dataUrl}
                  download={a.filename}
                  title="Download"
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Download size={14} />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    title="Remove"
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal (inline, no portal) */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-lg max-w-5xl max-h-[90vh] w-full overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0">
                {preview.mimeType.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                <p className="font-medium text-sm truncate">{preview.filename}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href={preview.dataUrl} download={preview.filename} className="btn-secondary text-xs"><Download size={14} /> Download</a>
                <button onClick={() => setPreview(null)} className="btn-secondary text-xs"><X size={14} /> Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100">
              {preview.mimeType.startsWith('image/') ? (
                <img src={preview.dataUrl} alt={preview.filename} className="max-w-full mx-auto" />
              ) : (
                <iframe src={preview.dataUrl} title={preview.filename} className="w-full h-full min-h-[70vh]" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
