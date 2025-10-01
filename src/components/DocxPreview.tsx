"use client";
import { useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxPreviewProps {
  file: Blob | null;
}

export function DocxPreview({ file }: DocxPreviewProps) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file && viewerRef.current) {
      renderAsync(file, viewerRef.current)
        .then(() => console.log("docx rendered"))
        .catch(error => console.error("error rendering docx", error));
    }
  }, [file]);

  return <div ref={viewerRef} id="docx-viewer"></div>;
}
