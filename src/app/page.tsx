'use client';

import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import TextEditor from '../components/TextEditor';

interface ImageData {
  file: File;
  width: number;
  height: number;
  aspectRatio: number;
  preview: string;
}

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<ImageData | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'edit'>('upload');

  const handleImageUpload = (imageData: ImageData) => {
    console.log('Image uploaded:', {
      name: imageData.file.name,
      size: imageData.file.size,
      dimensions: `${imageData.width} × ${imageData.height}`,
      aspectRatio: imageData.aspectRatio.toFixed(2)
    });
    
    setUploadedImage(imageData);
    setCurrentStep('edit');
  };

  const handleBackToUpload = () => {
    setUploadedImage(null);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Image Text Composer
          </h1>
          <p className="text-lg text-gray-600">
            Upload a PNG image and add text layers with full styling control
          </p>
        </div>
        
        {currentStep === 'upload' ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ImageUploader
              onImageUpload={handleImageUpload}
              maxSize={10}
              className="mb-4"
            />
          </div>
        ) : uploadedImage ? (
          <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToUpload}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Upload
              </button>
              <div className="text-sm text-gray-500">
                {uploadedImage.file.name} • {uploadedImage.width} × {uploadedImage.height}
              </div>
            </div>

            {/* Text Editor */}
            <TextEditor
              imageUrl={uploadedImage.preview}
              imageWidth={uploadedImage.width}
              imageHeight={uploadedImage.height}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
