'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Create a wrapper component for the entire canvas to avoid dynamic import issues
const KonvaCanvas = dynamic(() => import('./KonvaCanvas').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Loading canvas...</p>
    </div>
  )
});

interface TextEditorProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  className?: string;
}

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  textAlign: string;
  fontStyle: string;
}

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

const defaultTextStyle: TextStyle = {
  fontSize: 40,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fill: '#ff0000', // Red text for better visibility
  stroke: '#000000', // Black stroke for better visibility
  strokeWidth: 2,
  textAlign: 'left',
  fontStyle: 'normal'
};

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Lucida Sans Unicode'
];

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120];

export default function TextEditor({ 
  imageUrl, 
  imageWidth, 
  imageHeight, 
  className = '' 
}: TextEditorProps) {
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textStyle, setTextStyle] = useState<TextStyle>(defaultTextStyle);
  const transformerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure component only runs on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add new text
  const addText = useCallback(() => {
    const newText: TextLayer = {
      id: Date.now().toString(),
      x: 100,
      y: 100,
      text: 'Double click to edit',
      fontSize: textStyle.fontSize,
      fontFamily: textStyle.fontFamily,
      fontWeight: textStyle.fontWeight,
      fill: textStyle.fill,
      stroke: textStyle.stroke,
      strokeWidth: textStyle.strokeWidth,
      textAlign: textStyle.textAlign,
      fontStyle: textStyle.fontStyle,
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    };

    setTextLayers(prev => [...prev, newText]);
    setSelectedId(newText.id);
  }, [textStyle]);

  // Update text style
  const updateTextStyle = useCallback((property: keyof TextStyle, value: string | number) => {
    if (!selectedId) return;

    setTextLayers(prev => prev.map(layer => 
      layer.id === selectedId 
        ? { ...layer, [property]: value }
        : layer
    ));

    setTextStyle(prev => ({ ...prev, [property]: value }));
  }, [selectedId]);

  // Update text content
  const updateTextContent = useCallback((text: string) => {
    if (!selectedId) return;

    setTextLayers(prev => prev.map(layer => 
      layer.id === selectedId 
        ? { ...layer, text }
        : layer
    ));
  }, [selectedId]);

  // Update text transform (position, rotation, scale)
  const updateTextTransform = useCallback((id: string, transform: { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }) => {
    setTextLayers(prev => prev.map(layer => 
      layer.id === id 
        ? { ...layer, ...transform }
        : layer
    ));
  }, []);

  // Delete selected text
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;

    setTextLayers(prev => prev.filter(layer => layer.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // Bring to front
  const bringToFront = useCallback(() => {
    if (!selectedId) return;

    setTextLayers(prev => {
      const selected = prev.find(layer => layer.id === selectedId);
      const others = prev.filter(layer => layer.id !== selectedId);
      return selected ? [...others, selected] : prev;
    });
  }, [selectedId]);

  // Send to back
  const sendToBack = useCallback(() => {
    if (!selectedId) return;

    setTextLayers(prev => {
      const selected = prev.find(layer => layer.id === selectedId);
      const others = prev.filter(layer => layer.id !== selectedId);
      return selected ? [selected, ...others] : prev;
    });
  }, [selectedId]);

  // Export as image
  const exportImage = useCallback(() => {
    const stage = transformerRef.current?.getStage();
    if (!stage) return;

    const dataURL = stage.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png'
    });

    const link = document.createElement('a');
    link.download = 'image-with-text.png';
    link.href = dataURL;
    link.click();
  }, []);

  const selectedText = textLayers.find(layer => layer.id === selectedId);

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading editor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* Canvas Area */}
      <div className="flex-1">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Text Editor</h3>
            <div className="flex gap-2">
              <button
                onClick={addText}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Add Text
              </button>
              <button
                onClick={exportImage}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Export
              </button>
            </div>
          </div>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                         <KonvaCanvas
               imageUrl={imageUrl}
               imageWidth={imageWidth}
               imageHeight={imageHeight}
               textLayers={textLayers}
               selectedId={selectedId}
               onTextSelect={setSelectedId}
               onTextUpdate={updateTextContent}
               onTextDoubleClick={(text: string) => {
                 const newText = prompt('Edit text:', text);
                 if (newText !== null) {
                   updateTextContent(newText);
                 }
               }}
               onTextDoubleTap={(text: string) => {
                 const newText = prompt('Edit text:', text);
                 if (newText !== null) {
                   updateTextContent(newText);
                 }
               }}
               onTextTransform={updateTextTransform}
               transformerRef={transformerRef}
             />
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-full lg:w-80">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Text Controls</h3>
          
          {selectedText ? (
            <div className="space-y-4">
              {/* Text Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Content
                </label>
                <textarea
                  value={selectedText.text}
                  onChange={(e) => updateTextContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  value={selectedText.fontFamily}
                  onChange={(e) => updateTextStyle('fontFamily', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {fontFamilies.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <select
                  value={selectedText.fontSize}
                  onChange={(e) => updateTextStyle('fontSize', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {fontSizes.map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedText.fill}
                    onChange={(e) => updateTextStyle('fill', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{selectedText.fill}</span>
                </div>
              </div>

              {/* Stroke Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stroke Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedText.stroke}
                    onChange={(e) => updateTextStyle('stroke', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{selectedText.stroke}</span>
                </div>
              </div>

              {/* Stroke Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stroke Width
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={selectedText.strokeWidth}
                  onChange={(e) => updateTextStyle('strokeWidth', parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{selectedText.strokeWidth}px</span>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Alignment
                </label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => updateTextStyle('textAlign', align)}
                      className={`flex-1 py-2 px-3 border rounded-md text-sm ${
                        selectedText.textAlign === align
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

                             {/* Font Style */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Font Style
                 </label>
                 <div className="flex gap-2">
                   <button
                     onClick={() => updateTextStyle('fontWeight', selectedText.fontWeight === 'bold' ? 'normal' : 'bold')}
                     className={`flex-1 py-2 px-3 border rounded-md text-sm ${
                       selectedText.fontWeight === 'bold'
                         ? 'bg-blue-500 text-white border-blue-500'
                         : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                     }`}
                   >
                     Bold
                   </button>
                   <button
                     onClick={() => updateTextStyle('fontStyle', selectedText.fontStyle === 'italic' ? 'normal' : 'italic')}
                     className={`flex-1 py-2 px-3 border rounded-md text-sm ${
                       selectedText.fontStyle === 'italic'
                         ? 'bg-blue-500 text-white border-blue-500'
                         : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                     }`}
                   >
                     Italic
                   </button>
                 </div>
               </div>

               {/* Rotation Control */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Rotation
                 </label>
                 <div className="flex items-center gap-2">
                   <input
                     type="range"
                     min="0"
                     max="360"
                     value={selectedText.rotation}
                     onChange={(e) => selectedId && updateTextTransform(selectedId, { rotation: parseInt(e.target.value) })}
                     className="flex-1"
                   />
                   <span className="text-sm text-gray-500 w-12 text-right">{selectedText.rotation}°</span>
                 </div>
                 <div className="flex gap-2 mt-2">
                   <button
                     onClick={() => selectedId && updateTextTransform(selectedId, { rotation: selectedText.rotation - 15 })}
                     className="flex-1 py-1 px-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200"
                   >
                     -15°
                   </button>
                   <button
                     onClick={() => selectedId && updateTextTransform(selectedId, { rotation: 0 })}
                     className="flex-1 py-1 px-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200"
                   >
                     Reset
                   </button>
                   <button
                     onClick={() => selectedId && updateTextTransform(selectedId, { rotation: selectedText.rotation + 15 })}
                     className="flex-1 py-1 px-2 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200"
                   >
                     +15°
                   </button>
                 </div>
               </div>

              {/* Layer Controls */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Layer Controls</h4>
                <div className="flex gap-2">
                  <button
                    onClick={bringToFront}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-200"
                  >
                    Bring to Front
                  </button>
                  <button
                    onClick={sendToBack}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-200"
                  >
                    Send to Back
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={deleteSelected}
                className="w-full py-2 px-3 bg-red-500 text-white border border-red-500 rounded-md text-sm hover:bg-red-600"
              >
                Delete Text
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Select a text object to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
