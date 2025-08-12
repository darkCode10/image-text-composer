'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

interface ImageData {
  file: File;
  width: number;
  height: number;
  aspectRatio: number;
  preview: string;
}

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function ImageUploader({
  onImageUpload,
  maxSize = 5, // 5MB default
  acceptedTypes = ['image/png'], // Only PNG files
  className = ''
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check if it's a PNG file specifically
    if (file.type !== 'image/png') {
      return 'Please upload a PNG file only';
    }
    
    // Additional check for PNG file extension
    if (!file.name.toLowerCase().endsWith('.png')) {
      return 'Please upload a file with .png extension';
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    return null;
  }, [maxSize]);

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number; aspectRatio: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;
        
        URL.revokeObjectURL(url);
        resolve({ width, height, aspectRatio });
      };
      
      img.src = url;
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      setImageDimensions(dimensions);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setPreview(previewUrl);
        
        // Call parent callback with complete image data
        onImageUpload({
          file,
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.aspectRatio,
          preview: previewUrl
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image. Please try again.');
    }
  }, [validateFile, getImageDimensions, onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeImage = useCallback(() => {
    setPreview(null);
    setImageDimensions(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
      
      {!preview ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Upload an image
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your image here, or click to browse
              </p>
                             <p className="text-xs text-gray-400 mt-2">
                 Supports: PNG files only (max {maxSize}MB)
               </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={preview}
                alt="Uploaded image preview"
                fill
                className="object-contain"
              />
            </div>
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
              type="button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Image Info */}
          {imageDimensions && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Image Details</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Dimensions:</span>
                  <p className="font-medium">{imageDimensions.width} × {imageDimensions.height}</p>
                </div>
                <div>
                  <span className="text-gray-500">Aspect Ratio:</span>
                  <p className="font-medium">{imageDimensions.aspectRatio.toFixed(2)}:1</p>
                </div>
                <div>
                  <span className="text-gray-500">Orientation:</span>
                  <p className="font-medium">
                    {imageDimensions.aspectRatio > 1 ? 'Landscape' : 
                     imageDimensions.aspectRatio < 1 ? 'Portrait' : 'Square'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Canvas Preview with Matching Aspect Ratio */}
          {imageDimensions && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Editor Canvas Preview</h3>
              <div className="flex justify-center">
                <div 
                  className="bg-gray-100 border-2 border-dashed border-gray-300 relative"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    aspectRatio: imageDimensions.aspectRatio,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-8 h-8 text-gray-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <p className="text-xs text-gray-500">Editor Canvas</p>
                      <p className="text-xs text-gray-400">
                        {imageDimensions.width} × {imageDimensions.height}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
