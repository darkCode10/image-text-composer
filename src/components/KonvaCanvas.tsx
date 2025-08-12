'use client';

import { useState, useEffect, useRef } from 'react';
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

interface KonvaCanvasProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  textLayers: TextLayer[];
  selectedId: string | null;
  onTextSelect: (id: string) => void;
  onTextUpdate: (text: string) => void;
  onTextDoubleClick: (text: string) => void;
  onTextDoubleTap: (text: string) => void;
  onTextTransform: (id: string, transform: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }) => void;
  transformerRef: any;
}

export default function KonvaCanvas({ 
  imageUrl, 
  imageWidth, 
  imageHeight, 
  textLayers,
  selectedId,
  onTextSelect,
  onTextUpdate,
  onTextDoubleClick,
  onTextDoubleTap,
  onTextTransform,
  transformerRef
}: KonvaCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const textRefs = useRef<{ [key: string]: any }>({});

  // Load image manually
  useEffect(() => {
    const img = new window.Image();
    
    img.onload = () => {
      setImage(img);
      setImageStatus('loaded');
    };
    
    img.onerror = (error) => {
      setImageStatus('failed');
    };
    
    img.src = imageUrl;
  }, [imageUrl]);

  // Handle transformer updates
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const textNode = textRefs.current[selectedId];
      if (textNode) {
        transformerRef.current.nodes([textNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId, transformerRef]);

  // Calculate canvas size to fit the image
  const maxWidth = 800;
  const maxHeight = 600;
  const scaleX = maxWidth / imageWidth;
  const scaleY = maxHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY);
  const canvasWidth = imageWidth * scale;
  const canvasHeight = imageHeight * scale;

  // Show loading state
  if (imageStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading image...</p>
      </div>
    );
  }

  // Show error state
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

  // Show Konva canvas
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
            ref={(el) => {
              if (el) {
                textRefs.current[textLayer.id] = el;
              }
            }}
            {...textLayer}
            draggable
            onClick={() => onTextSelect(textLayer.id)}
            onTap={() => onTextSelect(textLayer.id)}
            onDblClick={() => onTextDoubleClick(textLayer.text)}
            onDblTap={() => onTextDoubleTap(textLayer.text)}
            onDragEnd={(e) => {
              onTextTransform(textLayer.id, {
                x: e.target.x(),
                y: e.target.y()
              });
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              const rotation = node.rotation();
              
              // Reset scale to 1 and adjust fontSize instead
              node.scaleX(1);
              node.scaleY(1);
              
              onTextTransform(textLayer.id, {
                x: node.x(),
                y: node.y(),
                rotation: rotation,
                scaleX: scaleX,
                scaleY: scaleY
              });
            }}
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
            enabledAnchors={['middle-left', 'middle-right', 'top-center', 'bottom-center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']}
            rotateEnabled={true}
            keepRatio={false}
          />
        )}
      </Layer>
    </Stage>
  );
}
