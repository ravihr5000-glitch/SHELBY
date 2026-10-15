import React, { useState } from 'react';
import {
  FolderLock,
  FileCode,
  FileText,
  Plus,
  Download,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Save,
  Check,
  FolderOpen,
} from 'lucide-react';
import { ShelbyFile } from '../../types';

interface FilesViewProps {
  files: ShelbyFile[];
  onSaveFile: (file: ShelbyFile) => void;
  onDeleteFile: (id: string) => void;
  onRequirePermission: (action: string, details: string, callback: () => void) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  files,
  onSaveFile,
  onDeleteFile,
  onRequirePermission,
}) => {
  const [selectedFile, setSelectedFile] = useState<ShelbyFile | null>(files[0] || null);
  const [content, setContent] = useState<string>(files[0]?.content || '');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileType, setNewFileType] = useState<string>('markdown');

  const handleSelect = (f: ShelbyFile) => {
    setSelectedFile(f);
    setContent(f.content);
    setIsSaved(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (!selectedFile) return;
    const updated: ShelbyFile = {
      ...selectedFile,
      content,
      updatedAt: 'Just now',
      size: `${(content.length / 1024).toFixed(1)} KB`,
    };
    onSaveFile(updated);
    setSelectedFile(updated);
    setIsSaved(true);
  };

  const handleDelete = () => {
    if (!selectedFile) return;
    onRequirePermission(
      'Permanent File Deletion',
      `Are you sure you want to delete ${selectedFile.name} from the authorized SHELBY workspace? This action is irreversible.`,
      () => {
        onDeleteFile(selectedFile.id);
        const remaining = files.filter((f) => f.id !== selectedFile.id);
        setSelectedFile(remaining[0] || null);
        setContent(remaining[0]?.content || '');
      }
    );
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const ext = newFileType === 'json' ? '.json' : newFileType === 'markdown' ? '.md' : '.txt';
    const fullName = newFileName.endsWith(ext) ? newFileName : `${newFileName}${ext}`;

    const newFile: ShelbyFile = {
      id: `file-${Date.now()}`,
      name: fullName,
      path: `/shelby-workspace/docs/${fullName}`,
      size: '0.1 KB',
      type: newFileType,
      updatedAt: 'Just now',
      content: `# ${fullName}\nCreated within authorized SHELBY workspace.\nTimestamp: ${new Date().toISOString()}`,
      isWorkspace: true,
    };

    onSaveFile(newFile);
    setSelectedFile(newFile);
    setContent(newFile.content);
    setShowNewModal(false);
    setNewFileName('');
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col md:flex-row bg-[#050608]">
      {/* Left Workspace File Explorer */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-amber-500/15 p-4 flex flex-col justify-between bg-[#080a0e]/60">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/15">
            <div className="flex items-center space-x-2">
              <FolderLock className="w-4 h-4 text-amber-400" />
              <h2 className="font-heading text-sm font-bold tracking-wider text-amber-300">
                SHELBY WORKSPACE
              </h2>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="p-1 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30"
              title="Create new file in workspace"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Policy Banner */}
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono-code text-amber-300/80 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Sandboxed storage: Only approved workspace (/shelby-workspace) is accessible.
              External folders require explicit elevation.
            </span>
          </div>

          {/* Files List */}
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
            {files.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => handleSelect(file)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-black/40 border-amber-500/10 hover:border-amber-500/30 text-amber-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    {file.type === 'json' ? (
                      <FileCode className="w-4 h-4 text-yellow-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <p className="font-mono-code text-xs truncate font-medium">{file.name}</p>
                      <p className="text-[10px] text-amber-500/50 truncate font-mono-code">
                        {file.size} • {file.updatedAt}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-amber-500/15 text-[10px] font-mono-code text-amber-500/50">
          PATH: /shelby-workspace
        </div>
      </div>

      {/* Right File Editor / Sandbox Viewer */}
      <div className="flex-1 p-6 flex flex-col justify-between overflow-hidden">
        {selectedFile ? (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* File Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/15">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-mono-code text-base font-bold text-amber-300">
                    {selectedFile.name}
                  </h3>
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {selectedFile.path}
                  </span>
                </div>
                <p className="text-[10px] font-mono-code text-amber-500/60 mt-1">
                  Last Modified: {selectedFile.updatedAt}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  className={`px-3 py-1.5 rounded text-xs font-mono-code flex items-center space-x-1.5 transition-all border ${
                    isSaved
                      ? 'bg-black/40 border-amber-500/20 text-amber-400/70'
                      : 'bg-amber-500 hover:bg-amber-400 text-black font-bold border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'SAVED' : 'SAVE CHANGES'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded bg-black/40 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                  title="Export to local computer disk"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded bg-black/40 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                  title="Delete file (Requires confirmation)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code / Text Area */}
            <div className="flex-1 bg-black/70 border border-amber-500/20 rounded-lg p-3 overflow-hidden flex flex-col">
              <textarea
                value={content}
                onChange={handleContentChange}
                spellCheck={false}
                className="flex-1 bg-transparent text-amber-100 font-mono-code text-xs resize-none focus:outline-none leading-relaxed"
                placeholder="File contents..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-amber-500/60 font-mono-code text-xs">
            <FolderLock className="w-10 h-10 mb-2 text-amber-500/30" />
            <p>Select a file from the workspace explorer.</p>
          </div>
        )}
      </div>

      {/* Create New File Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFile}
            className="w-full max-w-md bg-[#0a0c10] border border-amber-500/40 rounded-xl p-6 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
          >
            <h3 className="font-heading text-lg font-bold text-amber-300">
              Create File in SHELBY Workspace
            </h3>
            <div>
              <label className="text-[11px] font-mono-code text-amber-500/70 block mb-1">
                File Name
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. system_audit_notes"
                className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-mono-code text-amber-500/70 block mb-1">
                Format
              </label>
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
                className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="json">JSON (.json)</option>
                <option value="text">Plain Text (.txt)</option>
              </select>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded text-xs font-mono-code text-amber-400/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono-code"
              >
                Create File
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
