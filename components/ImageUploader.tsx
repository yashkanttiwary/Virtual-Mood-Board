
import React, { useRef, useState, DragEvent } from 'react';
import { UploadCloudIcon } from './IconComponents';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imagePreviewUrl: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreviewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type.startsWith('image/')) {
        onImageUpload(files[0]);
      }
    }
  };


  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative group flex items-center justify-center w-full h-64 border-2 rounded-2xl cursor-pointer transition-all duration-300
        ${isDragOver 
          ? 'border-fuchsia-400 bg-fuchsia-500/20 scale-105 shadow-lg shadow-fuchsia-500/20 ring-2 ring-fuchsia-400' 
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {imagePreviewUrl ? (
        <>
            <img src={imagePreviewUrl} alt="Preview" className="object-contain h-full w-full rounded-2xl p-1" />
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                Change Image
            </div>
        </>
      ) : (
        <div className="text-center text-gray-400 pointer-events-none transition-transform duration-300 group-hover:scale-105">
          <UploadCloudIcon className="mx-auto w-12 h-12 text-fuchsia-400" />
          <p className="mt-2 font-semibold text-gray-200">Click to upload or drag & drop</p>
          <p className="text-sm text-gray-400">PNG, JPG, or WEBP</p>
        </div>
      )}
    </div>
  );
};