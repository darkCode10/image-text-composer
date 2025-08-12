'use client';

import { useState, useEffect } from 'react';
import { Stage, Layer, Image, Text, Transformer } from 'react-konva';

interface TextLayer {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  textAlign: string;
  fontStyle: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface TextEditorCanvasProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  textLayers: TextLayer[];
  selectedId: string | null;
  onTextSelect: (id: string) => void;
  onTextUpdate: (text: string) => void;
  onTextDoubleClick: (text: string) => void;
  onTextDoubleTap: (text: string) => void;
  transformerRef: any;
}

export default function TextEditorCanvas({ 
  imageUrl, 
  imageWidth, 
  imageHeight, 
  textLayers,
  selectedId,
  onTextSelect,
  onTextUpdate,
  onTextDoubleClick,
  onTextDoubleTap,
  transformerRef
}: TextEditorCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');

  // Load image manually
  useEffect(() => {
    console.log('Loading image:', imageUrl);
    const img = new window.Image();
    // Remove crossOrigin for local images to avoid CORS issues
    
    img.onload = () => {
      console.log('Image loaded successfully:', imageUrl);
      setImage(img);
      setImageStatus('loaded');
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', imageUrl, error);
      setImageStatus('failed');
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate canvas size to fit the image
  const maxWidth = 800;
  const maxHeight = 600;
  const scaleX = maxWidth / imageWidth;
  const scaleY = maxHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY);
  const canvasWidth = imageWidth * scale;
  const canvasHeight = imageHeight * scale;

  console.log('Canvas dimensions:', { canvasWidth, canvasHeight, imageStatus, hasImage: !!image });

  if (imageStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading image...</p>
      </div>
    );
  }

  if (imageStatus === 'failed') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Failed to load image</p>
          <p className="text-sm text-gray-400">URL: {imageUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      style={{ margin: '0 auto', display: 'block' }}
    >
      <Layer>
        {/* Background Image */}
        {image && (
          <Image
            image={image}
            width={canvasWidth}
            height={canvasHeight}
            listening={false}
          />
        )}
        
        {/* Text Layers */}
        {textLayers.map((textLayer) => (
          <Text
            key={textLayer.id}
            {...textLayer}
            draggable
            onClick={() => onTextSelect(textLayer.id)}
            onTap={() => onTextSelect(textLayer.id)}
            onDblClick={() => onTextDoubleClick(textLayer.text)}
            onDblTap={() => onTextDoubleTap(textLayer.text)}
          />
        ))}
        
        {/* Transformer for selected text */}
        {selectedId && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              return newBox.width < 5 ? oldBox : newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
}
