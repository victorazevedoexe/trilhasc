import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from '@uploadthing/react';

// Para compatibilidade com o hook useUploadThing ainda usado no Documentos.jsx
export const { useUploadThing } = generateReactHelpers({
  url: typeof window !== 'undefined'
    ? `${window.location.origin}/api/uploadthing`
    : '/api/uploadthing',
});

export const UploadButton = generateUploadButton({
  url: typeof window !== 'undefined'
    ? `${window.location.origin}/api/uploadthing`
    : '/api/uploadthing',
});

export const UploadDropzone = generateUploadDropzone({
  url: typeof window !== 'undefined'
    ? `${window.location.origin}/api/uploadthing`
    : '/api/uploadthing',
});
