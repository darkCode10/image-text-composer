'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Stage, Layer, Image, Text, Transformer, Line } from 'react-konva';

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
  opacity: number;
  lineHeight: number;
  letterSpacing: number;
  textDecoration: string;
  textShadow: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  paragraphWidth: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  locked: boolean;
  // Warp/Curved text properties
  isWarped: boolean;
  warpPath: string; // SVG path data
  warpPathType: string; // Type of path (arc, circle, wave, etc.)
  warpRadius: number;
  warpAngle: number;
  warpSpacing: number;
  // Smart spacing properties
  showSpacingHints: boolean;
  spacingHintColor: string;
  spacingHintOpacity: number;
  // Custom font properties
  customFonts: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface KonvaCanvasProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  textLayers: TextLayer[];
  setTextLayers: React.Dispatch<React.SetStateAction<TextLayer[]>>;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  customFonts: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

const KonvaCanvas = forwardRef<any, KonvaCanvasProps>(({ 
  imageUrl, 
  imageWidth, 
  imageHeight, 
  textLayers,
  setTextLayers,
  selectedIds,
  setSelectedIds,
  customFonts
}, ref) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const textRefs = useRef<{ [key: string]: any }>({});
  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  // Expose stage ref to parent component
  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current
  }));

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
    if (transformerRef.current) {
      try {
        if (selectedIds.size > 0) {
          const selectedNodes = Array.from(selectedIds)
            .map(id => textRefs.current[id])
            .filter(node => node && node.getAbsoluteTransform);
          
          const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
          const hasUnlockedLayers = selectedLayers.some(layer => !layer.locked);
          
          if (selectedNodes.length > 0 && hasUnlockedLayers) {
            transformerRef.current.nodes(selectedNodes);
            const layer = transformerRef.current.getLayer();
            if (layer && typeof layer.batchDraw === 'function') {
              layer.batchDraw();
            }
          } else {
            // Clear transformer if no valid nodes or all layers are locked
            transformerRef.current.nodes([]);
            const layer = transformerRef.current.getLayer();
            if (layer && typeof layer.batchDraw === 'function') {
              layer.batchDraw();
            }
          }
        } else {
          transformerRef.current.nodes([]);
          const layer = transformerRef.current.getLayer();
          if (layer && typeof layer.batchDraw === 'function') {
            layer.batchDraw();
          }
        }
      } catch (error) {
        console.error('Error updating transformer:', error);
        // Clear transformer on error
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
        }
      }
    }
  }, [selectedIds, textLayers]);

  // Force re-render when text layers change (for font weight updates)
  useEffect(() => {
    try {
      if (textLayers.length > 0) {
        const layer = stageRef.current?.getLayer();
        if (layer && typeof layer.batchDraw === 'function') {
          layer.batchDraw();
        }
      }
      
      // Clean up refs for removed text layers
      const currentIds = new Set(textLayers.map(layer => layer.id));
      Object.keys(textRefs.current).forEach(id => {
        if (!currentIds.has(id)) {
          delete textRefs.current[id];
        }
      });
    } catch (error) {
      console.error('Error updating text layers:', error);
    }
  }, [textLayers]);

  // Function to ensure custom fonts are loaded
  const ensureCustomFontsLoaded = useCallback(() => {
    customFonts.forEach(font => {
      // Check if font is already loaded
      const isLoaded = Array.from(document.fonts).some(f => f.family === font.name);
      if (!isLoaded) {
        // Create and load font face
        const fontFace = new FontFace(font.name, `url(${font.url})`);
        fontFace.load().then(() => {
          document.fonts.add(fontFace);
          console.log(`Custom font loaded: ${font.name}`);
        }).catch(error => {
          console.error(`Failed to load custom font ${font.name}:`, error);
        });
      }
    });
  }, [customFonts]);

  // Ensure custom fonts are loaded
  useEffect(() => {
    ensureCustomFontsLoaded();
  }, [ensureCustomFontsLoaded]);

  // Function to render spacing hints between layers
  const renderSpacingHints = () => {
    const layersWithHints = textLayers.filter(layer => layer.showSpacingHints);
    if (layersWithHints.length < 2) return null;

    const hints: JSX.Element[] = [];
    
    // Sort layers by x position for horizontal spacing hints
    const sortedByX = [...layersWithHints].sort((a, b) => a.x - b.x);
    
    for (let i = 0; i < sortedByX.length - 1; i++) {
      const currentLayer = sortedByX[i];
      const nextLayer = sortedByX[i + 1];
      
      // Calculate spacing between layers
      const spacing = nextLayer.x - currentLayer.x;
      const centerX = currentLayer.x + spacing / 2;
      const centerY = (currentLayer.y + nextLayer.y) / 2;
      
      // Create spacing hint line
      hints.push(
        <Line
          key={`spacing-hint-h-${currentLayer.id}-${nextLayer.id}`}
          points={[centerX - 20, centerY, centerX + 20, centerY]}
          stroke={currentLayer.spacingHintColor || '#3B82F6'}
          strokeWidth={2}
          opacity={currentLayer.spacingHintOpacity || 0.6}
          dash={[5, 5]}
        />
      );
      
      // Add spacing measurement text
      hints.push(
        <Text
          key={`spacing-text-h-${currentLayer.id}-${nextLayer.id}`}
          x={centerX}
          y={centerY - 15}
          text={`${Math.round(spacing)}px`}
          fontSize={12}
          fill={currentLayer.spacingHintColor || '#3B82F6'}
          opacity={currentLayer.spacingHintOpacity || 0.6}
          align="center"
        />
      );
    }
    
    // Sort layers by y position for vertical spacing hints
    const sortedByY = [...layersWithHints].sort((a, b) => a.y - b.y);
    
    for (let i = 0; i < sortedByY.length - 1; i++) {
      const currentLayer = sortedByY[i];
      const nextLayer = sortedByY[i + 1];
      
      // Calculate spacing between layers
      const spacing = nextLayer.y - currentLayer.y;
      const centerX = (currentLayer.x + nextLayer.x) / 2;
      const centerY = currentLayer.y + spacing / 2;
      
      // Create spacing hint line
      hints.push(
        <Line
          key={`spacing-hint-v-${currentLayer.id}-${nextLayer.id}`}
          points={[centerX, centerY - 20, centerX, centerY + 20]}
          stroke={currentLayer.spacingHintColor || '#3B82F6'}
          strokeWidth={2}
          opacity={currentLayer.spacingHintOpacity || 0.6}
          dash={[5, 5]}
        />
      );
      
      // Add spacing measurement text
      hints.push(
        <Text
          key={`spacing-text-v-${currentLayer.id}-${nextLayer.id}`}
          x={centerX + 15}
          y={centerY}
          text={`${Math.round(spacing)}px`}
          fontSize={12}
          fill={currentLayer.spacingHintColor || '#3B82F6'}
          opacity={currentLayer.spacingHintOpacity || 0.6}
          align="left"
        />
      );
    }
    
    return hints;
  };

  // Enhanced function to render warped text along a path
  const renderWarpedText = (textLayer: TextLayer) => {
    if (!textLayer.isWarped || !textLayer.warpPath) {
      return null;
    }

    const chars = textLayer.text.split('');
    const centerX = textLayer.x;
    const centerY = textLayer.y;
    const radius = textLayer.warpRadius;
    const angle = textLayer.warpAngle;
    const spacing = textLayer.warpSpacing;

    // Function to get position and rotation for different path types
    const getPositionAndRotation = (index: number, totalChars: number) => {
      const progress = index / Math.max(totalChars - 1, 1);
      
      // Use the stored path type for accurate rendering
      const pathType = textLayer.warpPathType || 'arc';
      let x, y, rotation;
      
      switch (pathType) {
        case 'arc':
          // Arc calculation
          const angleRad = (angle * Math.PI) / 180;
          const currentAngle = -angleRad / 2 + (progress * angleRad);
          x = centerX + radius * Math.cos(currentAngle);
          y = centerY + radius * Math.sin(currentAngle);
          rotation = (currentAngle * 180) / Math.PI + 90;
          break;
          
        case 'circle':
          // Full circle
          const circleAngle = progress * 2 * Math.PI;
          x = centerX + radius * Math.cos(circleAngle);
          y = centerY + radius * Math.sin(circleAngle);
          rotation = (circleAngle * 180) / Math.PI + 90;
          break;
          
        case 'wave':
          // Wave pattern
          const waveCount = Math.max(1, Math.floor(angle / 60));
          const waveProgress = progress * waveCount;
          const waveIndex = Math.floor(waveProgress);
          const waveFraction = waveProgress - waveIndex;
          
          const waveX = centerX + (waveIndex - waveCount/2) * (radius * 2 / waveCount);
          const nextWaveX = centerX + (waveIndex + 1 - waveCount/2) * (radius * 2 / waveCount);
          const waveRadius = radius * 0.3;
          
          x = waveX + waveFraction * (nextWaveX - waveX);
          y = centerY + Math.sin(waveFraction * Math.PI) * waveRadius;
          rotation = Math.cos(waveFraction * Math.PI) * 45;
          break;
          
        case 'spiral':
          // Spiral pattern
          const spiralTurns = 3;
          const spiralProgress = progress * spiralTurns * 2 * Math.PI;
          const spiralRadius = radius * 0.8 * progress;
          x = centerX + spiralRadius * Math.cos(spiralProgress);
          y = centerY + spiralRadius * Math.sin(spiralProgress);
          rotation = (spiralProgress * 180) / Math.PI + 90;
          break;
          
        case 'zigzag':
          // Zigzag pattern
          const zigzagCount = Math.max(2, Math.floor(angle / 45));
          const zigzagProgress = progress * zigzagCount;
          const zigzagIndex = Math.floor(zigzagProgress);
          const zigzagFraction = zigzagProgress - zigzagIndex;
          
          const startX = centerX - radius;
          const endX = centerX + radius;
          const zigzagHeight = radius * 0.4;
          
          x = startX + progress * (endX - startX);
          y = centerY + (zigzagIndex % 2 === 0 ? -zigzagHeight : zigzagHeight) * (1 - zigzagFraction);
          rotation = 0;
          break;
          
        case 'heart':
          // Heart shape
          const heartAngle = progress * 2 * Math.PI;
          const heartScale = radius / 50;
          const heartX = 16 * Math.pow(Math.sin(heartAngle), 3);
          const heartY = -(13 * Math.cos(heartAngle) - 5 * Math.cos(2 * heartAngle) - 2 * Math.cos(3 * heartAngle) - Math.cos(4 * heartAngle));
          x = centerX + heartX * heartScale;
          y = centerY + heartY * heartScale;
          rotation = Math.atan2(Math.cos(heartAngle), -Math.sin(heartAngle)) * 180 / Math.PI;
          break;
          
        case 'star':
          // Star shape
          const starPoints = 5;
          const starAngle = progress * 2 * Math.PI;
          const starIndex = Math.floor(starAngle / (2 * Math.PI / starPoints));
          const starFraction = (starAngle % (2 * Math.PI / starPoints)) / (2 * Math.PI / starPoints);
          
          const outerRadius = radius;
          const innerRadius = radius * 0.4;
          const currentRadius = starIndex % 2 === 0 ? outerRadius : innerRadius;
          const nextRadius = starIndex % 2 === 0 ? innerRadius : outerRadius;
          
          const angle1 = starIndex * (2 * Math.PI / starPoints);
          const angle2 = (starIndex + 1) * (2 * Math.PI / starPoints);
          
          const radius1 = currentRadius;
          const radius2 = nextRadius;
          
          const interpolatedRadius = radius1 + starFraction * (radius2 - radius1);
          const interpolatedAngle = angle1 + starFraction * (angle2 - angle1);
          
          x = centerX + interpolatedRadius * Math.cos(interpolatedAngle);
          y = centerY + interpolatedRadius * Math.sin(interpolatedAngle);
          rotation = (interpolatedAngle * 180) / Math.PI + 90;
          break;
          
        case 'custom':
        default:
          // Default to arc calculation for custom and other paths
          const defaultAngleRad = (angle * Math.PI) / 180;
          const defaultCurrentAngle = -defaultAngleRad / 2 + (progress * defaultAngleRad);
          x = centerX + radius * Math.cos(defaultCurrentAngle);
          y = centerY + radius * Math.sin(defaultCurrentAngle);
          rotation = (defaultCurrentAngle * 180) / Math.PI + 90;
          break;
      }
      
      return { x, y, rotation };
    };

    return chars.map((char, index) => {
      const { x, y, rotation } = getPositionAndRotation(index, chars.length);

      // Ensure font weight is properly formatted
      const fontWeight = textLayer.fontWeight === 'normal' ? '400' : 
                       textLayer.fontWeight === 'bold' ? '700' : 
                       textLayer.fontWeight;

      return (
        <Text
          key={`${textLayer.id}-char-${index}`}
          x={x}
          y={y}
          text={char}
          fontSize={textLayer.fontSize}
          fontFamily={textLayer.fontFamily}
          fontWeight={fontWeight}
          fill={textLayer.fill}
          stroke={textLayer.stroke}
          strokeWidth={textLayer.strokeWidth}
          opacity={textLayer.opacity}
          rotation={rotation}
          draggable={!textLayer.locked}
          onClick={(e) => {
            if (!textLayer.locked) {
              const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
              if (isMultiSelect) {
                setSelectedIds(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(textLayer.id)) {
                    newSet.delete(textLayer.id);
                  } else {
                    newSet.add(textLayer.id);
                  }
                  return newSet;
                });
              } else {
                setSelectedIds(new Set([textLayer.id]));
              }
            }
          }}
          onTap={(e) => {
            if (!textLayer.locked) {
              const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
              if (isMultiSelect) {
                setSelectedIds(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(textLayer.id)) {
                    newSet.delete(textLayer.id);
                  } else {
                    newSet.add(textLayer.id);
                  }
                  return newSet;
                });
              } else {
                setSelectedIds(new Set([textLayer.id]));
              }
            }
          }}
        />
      );
    });
  };

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
      ref={stageRef}
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
        
        {/* Spacing Hints */}
        {renderSpacingHints()}
        
        {/* Text Layers */}
        {textLayers.map((textLayer) => {
          // Create text shadow filter for Konva
          const shadowFilter = textLayer.textShadow.blur > 0 || textLayer.textShadow.offsetX !== 0 || textLayer.textShadow.offsetY !== 0
            ? {
                shadowColor: textLayer.textShadow.color,
                shadowBlur: textLayer.textShadow.blur,
                shadowOffsetX: textLayer.textShadow.offsetX,
                shadowOffsetY: textLayer.textShadow.offsetY,
                shadowOpacity: 1
              }
            : {};

          // Handle text decoration using Konva's textDecoration property
          const textDecorationProps = {
            textDecoration: textLayer.textDecoration === 'none' ? undefined : textLayer.textDecoration
          };

          // Use paragraph width for proper alignment
          const actualWidth = textLayer.paragraphWidth || 300;

          // For paragraph-based alignment, we don't change the X position
          // Instead, we let Konva handle the alignment within the text width
          const alignX = textLayer.x;

          // Debug logging
          console.log('Text Layer Properties:', {
            id: textLayer.id,
            text: textLayer.text,
            fontFamily: textLayer.fontFamily,
            fontWeight: textLayer.fontWeight,
            textAlign: textLayer.textAlign,
            paragraphWidth: textLayer.paragraphWidth,
            actualWidth,
            alignX,
            textShadow: textLayer.textShadow
          });

          // Ensure font weight is properly formatted
          const fontWeight = textLayer.fontWeight === 'normal' ? '400' : 
                           textLayer.fontWeight === 'bold' ? '700' : 
                           textLayer.fontWeight;

          // Render warped text if enabled, otherwise render normal text
          if (textLayer.isWarped && textLayer.warpPath) {
            return renderWarpedText(textLayer);
          }

          return (
            <Text
              key={`${textLayer.id}-${fontWeight}-${textLayer.fontFamily}`}
              ref={(el) => {
                if (el && el.getAbsoluteTransform) {
                  textRefs.current[textLayer.id] = el;
                } else if (el === null) {
                  // Clean up ref when element is unmounted
                  delete textRefs.current[textLayer.id];
                }
              }}
              x={alignX}
              y={textLayer.y}
              text={textLayer.text}
              fontSize={textLayer.fontSize}
              fontFamily={textLayer.fontFamily}
              fontWeight={fontWeight}
              fill={textLayer.fill}
              stroke={textLayer.stroke}
              strokeWidth={textLayer.strokeWidth}
              align={textLayer.textAlign}
              fontStyle={textLayer.fontStyle}
              opacity={textLayer.opacity}
              lineHeight={textLayer.lineHeight}
              letterSpacing={textLayer.letterSpacing}
              width={actualWidth}
              wrap="word"
              rotation={textLayer.rotation}
              scaleX={textLayer.scaleX}
              scaleY={textLayer.scaleY}
              draggable={!textLayer.locked}
              onClick={(e) => {
                if (!textLayer.locked) {
                  const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
                  if (isMultiSelect) {
                    setSelectedIds(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(textLayer.id)) {
                        newSet.delete(textLayer.id);
                      } else {
                        newSet.add(textLayer.id);
                      }
                      return newSet;
                    });
                  } else {
                    setSelectedIds(new Set([textLayer.id]));
                  }
                }
              }}
              onTap={(e) => {
                if (!textLayer.locked) {
                  const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
                  if (isMultiSelect) {
                    setSelectedIds(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(textLayer.id)) {
                        newSet.delete(textLayer.id);
                      } else {
                        newSet.add(textLayer.id);
                      }
                      return newSet;
                    });
                  } else {
                    setSelectedIds(new Set([textLayer.id]));
                  }
                }
              }}
              onDragEnd={(e) => {
                const node = e.target;
                if (node && typeof node.x === 'function' && typeof node.y === 'function') {
                  try {
                    setTextLayers(prev => prev.map(layer => 
                      layer.id === textLayer.id 
                        ? { ...layer, x: node.x(), y: node.y() }
                        : layer
                    ));
                  } catch (error) {
                    console.error('Error updating text layer position:', error);
                  }
                }
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                if (node && 
                    typeof node.x === 'function' && 
                    typeof node.y === 'function' && 
                    typeof node.rotation === 'function' && 
                    typeof node.scaleX === 'function' && 
                    typeof node.scaleY === 'function') {
                  try {
                    setTextLayers(prev => prev.map(layer => 
                      layer.id === textLayer.id 
                        ? { 
                            ...layer, 
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                            scaleX: node.scaleX(),
                            scaleY: node.scaleY()
                          }
                        : layer
                    ));
                  } catch (error) {
                    console.error('Error updating text layer transform:', error);
                  }
                }
              }}
              {...shadowFilter}
              {...textDecorationProps}
            />
          );
        })}
        
        {/* Transformer for selected text */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
});

KonvaCanvas.displayName = 'KonvaCanvas';

export default KonvaCanvas;
