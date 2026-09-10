import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Download, ExternalLink, FileText } from 'lucide-react';

export const PDFViewerModal = ({
  isOpen,
  onClose,
  fileUrl,
  title = 'Document Viewer',
}) => {
  if (!isOpen) return null;

  // Prepend backend URL if relative
  const absoluteUrl = fileUrl?.startsWith('http')
    ? fileUrl
    : `${window.location.origin}${fileUrl?.startsWith('/') ? '' : '/'}${fileUrl}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Preview or download the attached document below"
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>PDF Document Viewer</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={absoluteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in New Tab
            </a>
            <a
              href={absoluteUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
          </div>
        </div>
      }
    >
      <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
        {fileUrl ? (
          <iframe
            src={`${absoluteUrl}#toolbar=1&navpanes=0`}
            title={title}
            className="w-full h-full border-0"
          />
        ) : (
          <div className="text-center p-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No document file available to preview.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
