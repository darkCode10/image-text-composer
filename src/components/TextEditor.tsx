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

const defaultTextStyle: TextStyle = {
  fontSize: 40,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  fill: '#ff0000', // Red text for better visibility
  stroke: '#000000', // Black stroke for better visibility
  strokeWidth: 2,
  textAlign: 'left',
  fontStyle: 'normal',
  opacity: 1,
  lineHeight: 1.2,
  letterSpacing: 0,
  textDecoration: 'none',
  textShadow: {
    color: '#000000',
    blur: 0,
    offsetX: 0,
    offsetY: 0
  },
  paragraphWidth: 300
};

const fontFamilies = [
  // System Fonts (Always Available)
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Lucida Sans Unicode',
  'Tahoma',
  'Arial Black',
  'Bookman Old Style',
  'Century Gothic',
  'Franklin Gothic Medium',
  'Garamond',
  'MS Sans Serif',
  'MS Serif',
  'Palatino',
  'Symbol',
  'Wingdings',
  
  // Web Safe Fonts
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  
  // Popular Google Fonts (Will be loaded via CSS)
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Raleway',
  'Source Sans Pro',
  'Ubuntu',
  'Playfair Display',
  'Merriweather',
  'Inter',
  'Nunito',
  'Work Sans',
  'Quicksand',
  'Dancing Script',
  'Pacifico',
  'Bebas Neue',
  'Oswald',
  'Roboto Condensed',
  'Roboto Mono',
  'Fira Sans',
  'PT Sans',
  'Noto Sans',
  'Noto Serif',
  'Crimson Text',
  'Libre Baskerville',
  'Lora',
  'Source Code Pro',
  'Inconsolata',
  'Space Mono',
  'JetBrains Mono',
  'Fira Code',
  'Cascadia Code',
  'Victor Mono',
  'IBM Plex Mono',
  'Anonymous Pro',
  'Courier Prime',
  'Roboto Slab',
  'Merriweather Sans',
  'Source Serif Pro',
  'Crimson Pro',
  'Libre Franklin',
  'Archivo',
  'Titillium Web',
  'Josefin Sans',
  'Alegreya',
  'Bitter',
  'Domine',
  'Faustina',
  'Gentium Basic',
  'Karla',
  'Lato',
  'Libre Baskerville',
  'Lora',
  'Merriweather',
  'Noto Sans',
  'Noto Serif',
  'Open Sans',
  'Playfair Display',
  'Poppins',
  'PT Sans',
  'PT Serif',
  'Raleway',
  'Roboto',
  'Roboto Condensed',
  'Roboto Mono',
  'Roboto Slab',
  'Source Code Pro',
  'Source Sans Pro',
  'Source Serif Pro',
  'Ubuntu',
  'Work Sans'
];

const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120, 144, 180];

const fontWeights = [
  { value: 'normal', label: 'Normal (400)' },
  { value: 'bold', label: 'Bold (700)' },
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' }
];

const textDecorations = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strikethrough' },
  { value: 'overline', label: 'Overline' }
];

const presetColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082'
];

export default function TextEditor({ 
  imageUrl, 
  imageWidth, 
  imageHeight, 
  className = '' 
}: TextEditorProps) {
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [textStyle, setTextStyle] = useState<TextStyle>(defaultTextStyle);
  const transformerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Undo/Redo state
  const [history, setHistory] = useState<TextLayer[][]>([[]]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // Autosave state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [customFonts, setCustomFonts] = useState<Array<{
    name: string;
    url: string;
    type: string;
  }>>([]);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load Google Fonts CSS with all weights
    const googleFonts = [
      'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Raleway',
      'Source Sans Pro', 'Ubuntu', 'Playfair Display', 'Merriweather',
      'Inter', 'Nunito', 'Work Sans', 'Quicksand', 'Dancing Script',
      'Pacifico', 'Bebas Neue', 'Oswald', 'Roboto Condensed', 'Roboto Mono',
      'Fira Sans', 'PT Sans', 'Noto Sans', 'Noto Serif', 'Crimson Text',
      'Libre Baskerville', 'Lora', 'Source Code Pro', 'Inconsolata',
      'Space Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code',
      'Victor Mono', 'IBM Plex Mono', 'Anonymous Pro', 'Courier Prime',
      'Roboto Slab', 'Merriweather Sans', 'Source Serif Pro', 'Crimson Pro',
      'Libre Franklin', 'Archivo', 'Titillium Web', 'Josefin Sans',
      'Alegreya', 'Bitter', 'Domine', 'Faustina', 'Gentium Basic',
      'Karla'
    ];
    
    // Create and append Google Fonts CSS link with all weights
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${googleFonts.map(font => 
      `family=${font.replace(/\s+/g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`
    ).join('&')}`;
    document.head.appendChild(link);
    
    // Wait for fonts to load
    document.fonts.ready.then(() => {
      console.log('All fonts loaded successfully');
    });
  }, []);

  // Helper functions for multi-select
  const selectedText = textLayers.find(layer => layer.id === Array.from(selectedIds)[0]);
  const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
  const isMultiSelect = selectedIds.size > 1;
  const hasSelection = selectedIds.size > 0;

  const addToSelection = useCallback((id: string) => {
    setSelectedIds(prev => new Set([...prev, id]));
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectLayer = useCallback((id: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      if (selectedIds.has(id)) {
        removeFromSelection(id);
      } else {
        addToSelection(id);
      }
    } else {
      setSelectedIds(new Set([id]));
    }
  }, [selectedIds, addToSelection, removeFromSelection]);
  
  // Ensure selectedIds are valid (exist in textLayers)
  useEffect(() => {
    const validIds = new Set(textLayers.map(layer => layer.id));
    const newSelectedIds = new Set<string>();
    
    selectedIds.forEach(id => {
      if (validIds.has(id)) {
        newSelectedIds.add(id);
      }
    });
    
    if (newSelectedIds.size !== selectedIds.size) {
      setSelectedIds(newSelectedIds);
    }
  }, [selectedIds, textLayers]);

  // Undo/Redo functions
  const addToHistory = useCallback((newLayers: TextLayer[]) => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, currentStep + 1);
      newHistory.push(newLayers);
      
      // Keep only last 20 steps
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setCurrentStep(prev => Math.min(prev + 1, 19));
  }, [currentStep, isUndoRedoAction]);

  const undo = useCallback(() => {
    if (currentStep > 0) {
      setIsUndoRedoAction(true);
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      setTextLayers(history[newStep]);
              setSelectedIds(new Set()); // Clear selection after undo
    }
  }, [currentStep, history]);

  const redo = useCallback(() => {
    if (currentStep < history.length - 1) {
      setIsUndoRedoAction(true);
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setTextLayers(history[newStep]);
              setSelectedIds(new Set()); // Clear selection after redo
    }
  }, [currentStep, history]);

  const canUndo = currentStep > 0;
  const canRedo = currentStep < history.length - 1;

  // Autosave functions
  const saveToLocalStorage = useCallback((data: {
    textLayers: TextLayer[];
    history: TextLayer[][];
    currentStep: number;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
  }) => {
    try {
      const saveData = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '1.0' // For future compatibility
      };
      localStorage.setItem('imageTextComposer', JSON.stringify(saveData));
      setLastSaved(new Date());
      console.log('Design saved to localStorage:', saveData);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem('imageTextComposer');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Check if saved data matches current image
        if (parsed.imageUrl === imageUrl && 
            parsed.imageWidth === imageWidth && 
            parsed.imageHeight === imageHeight) {
          
          setTextLayers(parsed.textLayers || []);
          setHistory(parsed.history || [[]]);
          setCurrentStep(parsed.currentStep || 0);
          setLastSaved(new Date(parsed.timestamp));
          
          console.log('Design loaded from localStorage:', parsed);
          return true;
        } else {
          console.log('Saved data doesn\'t match current image, clearing localStorage');
          localStorage.removeItem('imageTextComposer');
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      localStorage.removeItem('imageTextComposer');
    }
    return false;
  }, [imageUrl, imageWidth, imageHeight]);

  const triggerAutosave = useCallback(() => {
    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout for autosave (2 seconds delay)
    autosaveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      saveToLocalStorage({
        textLayers,
        history,
        currentStep,
        imageUrl,
        imageWidth,
        imageHeight
      });
      setIsSaving(false);
    }, 2000);
  }, [textLayers, history, currentStep, imageUrl, imageWidth, imageHeight, saveToLocalStorage]);

  const manualSave = useCallback(() => {
    setIsSaving(true);
    saveToLocalStorage({
      textLayers,
      history,
      currentStep,
      imageUrl,
      imageWidth,
      imageHeight
    });
    setIsSaving(false);
  }, [textLayers, history, currentStep, imageUrl, imageWidth, imageHeight, saveToLocalStorage]);

  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem('imageTextComposer');
      setLastSaved(null);
      console.log('Saved data cleared');
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  }, []);

  const resetDesign = useCallback(() => {
    try {
      // Clear localStorage
      localStorage.removeItem('imageTextComposer');
      
      // Reset all state to initial values
      setTextLayers([]);
              setSelectedIds(new Set());
      setTextStyle(defaultTextStyle);
      setHistory([[]]);
      setCurrentStep(0);
      setLastSaved(null);
      setIsUndoRedoAction(false);
      
      // Clear any autosave timeouts
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
      
      // Hide confirmation dialog
      setShowResetConfirm(false);
      
      console.log('✅ Design reset to blank state');
    } catch (error) {
      console.error('Failed to reset design:', error);
    }
  }, []);

  const showResetConfirmation = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const cancelReset = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  // Keyboard shortcuts for undo/redo and reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        } else if (e.key === 'r') {
          e.preventDefault();
          if (textLayers.length > 0) {
            showResetConfirmation();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, showResetConfirmation, textLayers.length]);

  // Load saved data on component mount
  useEffect(() => {
    if (isClient && imageUrl) {
      const loaded = loadFromLocalStorage();
      if (loaded) {
        console.log('✅ Design restored from localStorage');
      } else {
        console.log('🆕 Starting fresh design');
      }
    }
  }, [isClient, imageUrl, loadFromLocalStorage]);

  // Trigger autosave when textLayers, history, or currentStep changes
  useEffect(() => {
    if (isClient && imageUrl && !isUndoRedoAction) {
      triggerAutosave();
    }
  }, [textLayers, history, currentStep, isClient, imageUrl, isUndoRedoAction, triggerAutosave]);

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, []);

  // Page unload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (textLayers.length > 0 && !isSaving) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [textLayers.length, isSaving]);

  const addText = useCallback(() => {
    const newText: TextLayer = {
      id: `text-${Date.now()}`,
      x: 50,
      y: 50,
      text: 'Double click to edit',
      ...textStyle,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      locked: false,
      // Warp/Curved text properties
      isWarped: false,
      warpPath: '',
      warpPathType: 'arc',
      warpRadius: 100,
      warpAngle: 180,
      warpSpacing: 1,
      // Smart spacing properties
      showSpacingHints: false,
      spacingHintColor: '#3B82F6',
      spacingHintOpacity: 0.6,
      // Custom font properties
      customFonts: []
    };
    const newLayers = [...textLayers, newText];
    setTextLayers(newLayers);
    addToHistory(newLayers);
    setSelectedIds(new Set([newText.id]));
  }, [textStyle, textLayers, addToHistory]);

  const updateTextStyle = useCallback((property: keyof TextStyle, value: string | number) => {
    console.log('updateTextStyle called:', property, value);
    
    if (hasSelection) {
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { ...layer, [property]: value }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
    
    // Update text style for new layers
    if (property === 'fontWeight') {
      console.log('Font weight update:', value);
      setTextStyle(prev => ({ ...prev, fontWeight: value as string }));
    } else {
      setTextStyle(prev => ({ ...prev, [property]: value }));
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const updateTextShadow = useCallback((property: keyof TextStyle['textShadow'], value: string | number) => {
    setTextStyle(prev => ({
      ...prev,
      textShadow: { ...prev.textShadow, [property]: value }
    }));
    
    if (hasSelection) {
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { 
              ...layer, 
              textShadow: { ...layer.textShadow, [property]: value }
            }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const deleteText = useCallback(() => {
    if (hasSelection) {
      const newLayers = textLayers.filter(layer => !selectedIds.has(layer.id));
      setTextLayers(newLayers);
      addToHistory(newLayers);
      setSelectedIds(new Set());
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  // Layer management functions
  const moveLayerUp = useCallback(() => {
    if (hasSelection && selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const currentIndex = textLayers.findIndex(layer => layer.id === selectedId);
      if (currentIndex > 0) {
        const newLayers = [...textLayers];
        const temp = newLayers[currentIndex];
        newLayers[currentIndex] = newLayers[currentIndex - 1];
        newLayers[currentIndex - 1] = temp;
        setTextLayers(newLayers);
        addToHistory(newLayers);
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const moveLayerDown = useCallback(() => {
    if (hasSelection && selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const currentIndex = textLayers.findIndex(layer => layer.id === selectedId);
      if (currentIndex < textLayers.length - 1) {
        const newLayers = [...textLayers];
        const temp = newLayers[currentIndex];
        newLayers[currentIndex] = newLayers[currentIndex + 1];
        newLayers[currentIndex + 1] = temp;
        setTextLayers(newLayers);
        addToHistory(newLayers);
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const bringToFront = useCallback(() => {
    if (hasSelection && selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const selectedLayer = textLayers.find(layer => layer.id === selectedId);
      if (selectedLayer) {
        const otherLayers = textLayers.filter(layer => layer.id !== selectedId);
        const newLayers = [...otherLayers, selectedLayer];
        setTextLayers(newLayers);
        addToHistory(newLayers);
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const sendToBack = useCallback(() => {
    if (hasSelection && selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const selectedLayer = textLayers.find(layer => layer.id === selectedId);
      if (selectedLayer) {
        const otherLayers = textLayers.filter(layer => layer.id !== selectedId);
        const newLayers = [selectedLayer, ...otherLayers];
        setTextLayers(newLayers);
        addToHistory(newLayers);
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  // Lock/Unlock layer(s) - supports single and group selection
  const toggleLock = useCallback(() => {
    if (hasSelection) {
      const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
      if (selectedLayers.length > 0) {
        // If all selected layers are locked, unlock them all
        // If any selected layer is unlocked, lock them all
        const allLocked = selectedLayers.every(layer => layer.locked);
        const newLockState = !allLocked;
        
        const newLayers = textLayers.map(layer => 
          selectedIds.has(layer.id) 
            ? { ...layer, locked: newLockState }
            : layer
        );
        setTextLayers(newLayers);
        addToHistory(newLayers);
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  // Duplicate layer
  const duplicateLayer = useCallback(() => {
    if (hasSelection && selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const selectedLayer = textLayers.find(layer => layer.id === selectedId);
      if (selectedLayer) {
        const duplicatedLayer: TextLayer = {
          ...selectedLayer,
          id: `text-${Date.now()}`,
          x: selectedLayer.x + 20,
          y: selectedLayer.y + 20,
          locked: false
        };
        const newLayers = [...textLayers, duplicatedLayer];
        setTextLayers(newLayers);
        addToHistory(newLayers);
        setSelectedIds(new Set([duplicatedLayer.id]));
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  // Warp/Curved text functions
  const toggleWarp = useCallback(() => {
    if (hasSelection && selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const selectedLayer = textLayers.find(layer => layer.id === selectedId);
      if (selectedLayer) {
        const isCurrentlyWarped = selectedLayer.isWarped;
        let newLayer = { ...selectedLayer, isWarped: !isCurrentlyWarped };
        
        // If enabling warp and no path is set, set a default arc path
        if (!isCurrentlyWarped && !selectedLayer.warpPath) {
          const centerX = selectedLayer.x;
          const centerY = selectedLayer.y;
          const radius = selectedLayer.warpRadius;
          const angle = selectedLayer.warpAngle;
          const angleRad = (angle * Math.PI) / 180;
          const startAngle = -angleRad / 2;
          const endAngle = angleRad / 2;
          
          const startX = centerX + radius * Math.cos(startAngle);
          const startY = centerY + radius * Math.sin(startAngle);
          const endX = centerX + radius * Math.cos(endAngle);
          const endY = centerY + radius * Math.sin(endAngle);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          const defaultPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
          
          newLayer = { ...newLayer, warpPath: defaultPath };
        }
        
        const newLayers = textLayers.map(layer => 
          layer.id === selectedId ? newLayer : layer
        );
        setTextLayers(newLayers);
        addToHistory(newLayers);
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const updateWarpProperty = useCallback((property: 'warpRadius' | 'warpAngle' | 'warpSpacing', value: number) => {
    if (hasSelection) {
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { ...layer, [property]: value }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  // Enhanced warp path generation with better calculations
  const setWarpPath = useCallback((pathType: 'arc' | 'circle' | 'wave' | 'spiral' | 'zigzag' | 'heart' | 'star' | 'custom') => {
    if (hasSelection && selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0];
      const selectedLayer = textLayers.find(layer => layer.id === selectedId);
      if (selectedLayer) {
        let path = '';
        const centerX = selectedLayer.x;
        const centerY = selectedLayer.y;
        const radius = selectedLayer.warpRadius;
        const angle = selectedLayer.warpAngle;

        // Convert angle to radians for calculations
        const angleRad = (angle * Math.PI) / 180;
        
        // Calculate start and end points based on angle
        const startAngle = -angleRad / 2;
        const endAngle = angleRad / 2;
        
        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);

        switch (pathType) {
          case 'arc':
            // Create a proper arc based on the angle setting
            const largeArcFlag = angle > 180 ? 1 : 0;
            path = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
            break;
            
          case 'circle':
            // Full circle path
            path = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}`;
            break;
            
          case 'wave':
            // Multi-wave pattern
            const waveCount = Math.max(1, Math.floor(angle / 60));
            const waveRadius = radius * 0.3;
            let wavePath = `M ${startX} ${startY}`;
            
            for (let i = 0; i < waveCount; i++) {
              const waveX = centerX + (i - waveCount/2) * (radius * 2 / waveCount);
              const waveY = centerY + (i % 2 === 0 ? -waveRadius : waveRadius);
              wavePath += ` Q ${waveX} ${waveY} ${waveX + radius * 2 / waveCount} ${centerY}`;
            }
            path = wavePath;
            break;
            
          case 'spiral':
            // Spiral pattern
            const spiralTurns = 3;
            const spiralRadius = radius * 0.8;
            let spiralPath = `M ${centerX} ${centerY}`;
            
            for (let i = 0; i <= 360 * spiralTurns; i += 10) {
              const angle = (i * Math.PI) / 180;
              const currentRadius = (spiralRadius * i) / (360 * spiralTurns);
              const x = centerX + currentRadius * Math.cos(angle);
              const y = centerY + currentRadius * Math.sin(angle);
              spiralPath += ` L ${x} ${y}`;
            }
            path = spiralPath;
            break;
            
          case 'zigzag':
            // Zigzag pattern
            const zigzagCount = Math.max(2, Math.floor(angle / 45));
            const zigzagHeight = radius * 0.4;
            let zigzagPath = `M ${startX} ${startY}`;
            
            for (let i = 1; i <= zigzagCount; i++) {
              const progress = i / zigzagCount;
              const x = startX + progress * (endX - startX);
              const y = centerY + (i % 2 === 0 ? zigzagHeight : -zigzagHeight);
              zigzagPath += ` L ${x} ${y}`;
            }
            zigzagPath += ` L ${endX} ${endY}`;
            path = zigzagPath;
            break;
            
          case 'heart':
            // Heart shape
            const heartScale = radius / 50;
            path = `M ${centerX} ${centerY - 20 * heartScale} 
                    C ${centerX - 30 * heartScale} ${centerY - 40 * heartScale} 
                      ${centerX - 50 * heartScale} ${centerY - 10 * heartScale} 
                      ${centerX - 50 * heartScale} ${centerY + 10 * heartScale}
                    C ${centerX - 50 * heartScale} ${centerY + 30 * heartScale} 
                      ${centerX - 20 * heartScale} ${centerY + 50 * heartScale} 
                      ${centerX} ${centerY + 30 * heartScale}
                    C ${centerX + 20 * heartScale} ${centerY + 50 * heartScale} 
                      ${centerX + 50 * heartScale} ${centerY + 30 * heartScale} 
                      ${centerX + 50 * heartScale} ${centerY + 10 * heartScale}
                    C ${centerX + 50 * heartScale} ${centerY - 10 * heartScale} 
                      ${centerX + 30 * heartScale} ${centerY - 40 * heartScale} 
                      ${centerX} ${centerY - 20 * heartScale}`;
            break;
            
          case 'star':
            // Star shape
            const starPoints = 5;
            const outerRadius = radius;
            const innerRadius = radius * 0.4;
            let starPath = '';
            
            for (let i = 0; i < starPoints * 2; i++) {
              const angle = (i * Math.PI) / starPoints;
              const currentRadius = i % 2 === 0 ? outerRadius : innerRadius;
              const x = centerX + currentRadius * Math.cos(angle);
              const y = centerY + currentRadius * Math.sin(angle);
              
              if (i === 0) {
                starPath = `M ${x} ${y}`;
              } else {
                starPath += ` L ${x} ${y}`;
              }
            }
            starPath += ' Z';
            path = starPath;
            break;
            
          case 'custom':
            // Enhanced custom curve
            path = `M ${startX} ${startY} 
                    C ${centerX - radius * 0.5} ${centerY - radius * 0.8} 
                      ${centerX + radius * 0.5} ${centerY + radius * 0.8} 
                      ${endX} ${endY}`;
            break;
        }

        const newLayers = textLayers.map(layer => 
          layer.id === selectedId 
            ? { ...layer, warpPath: path, warpPathType: pathType }
            : layer
        );
        setTextLayers(newLayers);
        addToHistory(newLayers);
      }
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  // Smart spacing functions
  const toggleSpacingHints = useCallback(() => {
    if (hasSelection) {
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { ...layer, showSpacingHints: !layer.showSpacingHints }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const updateSpacingHintColor = useCallback((color: string) => {
    if (hasSelection) {
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { ...layer, spacingHintColor: color }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const updateSpacingHintOpacity = useCallback((opacity: number) => {
    if (hasSelection) {
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { ...layer, spacingHintOpacity: opacity }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [hasSelection, selectedIds, textLayers, addToHistory]);

  const distributeLayersEvenly = useCallback(() => {
    if (selectedIds.size >= 3) {
      const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
      const sortedLayers = selectedLayers.sort((a, b) => a.x - b.x);
      
      const firstLayer = sortedLayers[0];
      const lastLayer = sortedLayers[sortedLayers.length - 1];
      const totalDistance = lastLayer.x - firstLayer.x;
      const spacing = totalDistance / (sortedLayers.length - 1);
      
      const newLayers = textLayers.map(layer => {
        if (selectedIds.has(layer.id)) {
          const layerIndex = sortedLayers.findIndex(l => l.id === layer.id);
          return { ...layer, x: firstLayer.x + (layerIndex * spacing) };
        }
        return layer;
      });
      
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [selectedIds, textLayers, addToHistory]);

  const alignLayersVertically = useCallback(() => {
    if (selectedIds.size >= 2) {
      const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
      const centerY = selectedLayers.reduce((sum, layer) => sum + layer.y, 0) / selectedLayers.length;
      
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { ...layer, y: centerY }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [selectedIds, textLayers, addToHistory]);

  const alignLayersHorizontally = useCallback(() => {
    if (selectedIds.size >= 2) {
      const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
      const centerX = selectedLayers.reduce((sum, layer) => sum + layer.x, 0) / selectedLayers.length;
      
      const newLayers = textLayers.map(layer => 
        selectedIds.has(layer.id) 
          ? { ...layer, x: centerX }
          : layer
      );
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [selectedIds, textLayers, addToHistory]);

  const distributeLayersVertically = useCallback(() => {
    if (selectedIds.size >= 3) {
      const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
      const sortedLayers = selectedLayers.sort((a, b) => a.y - b.y);
      
      const firstLayer = sortedLayers[0];
      const lastLayer = sortedLayers[sortedLayers.length - 1];
      const totalDistance = lastLayer.y - firstLayer.y;
      const spacing = totalDistance / (sortedLayers.length - 1);
      
      const newLayers = textLayers.map(layer => {
        if (selectedIds.has(layer.id)) {
          const layerIndex = sortedLayers.findIndex(l => l.id === layer.id);
          return { ...layer, y: firstLayer.y + (layerIndex * spacing) };
        }
        return layer;
      });
      
      setTextLayers(newLayers);
      addToHistory(newLayers);
    }
  }, [selectedIds, textLayers, addToHistory]);

  // Custom font functions
  const uploadCustomFont = useCallback((file: File) => {
    return new Promise<{ name: string; url: string; type: string }>((resolve, reject) => {
      // Validate file type
      const validTypes = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/x-font-ttf', 'application/x-font-otf'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const isValidType = validTypes.includes(file.type) || ['ttf', 'otf', 'woff', 'woff2'].includes(fileExtension || '');
      
      if (!isValidType) {
        reject(new Error('Invalid font file type. Please upload TTF, OTF, WOFF, or WOFF2 files.'));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('Font file too large. Maximum size is 10MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fontName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          const fontUrl = e.target?.result as string;
          const fontType = fileExtension || 'ttf';
          
          // Create font face
          const fontFace = new FontFace(fontName, `url(${fontUrl})`);
          
          fontFace.load().then(() => {
            // Add font to document
            document.fonts.add(fontFace);
            
            // Add to custom fonts state
            const newFont = { name: fontName, url: fontUrl, type: fontType };
            setCustomFonts(prev => [...prev, newFont]);
            
            resolve(newFont);
          }).catch((error) => {
            reject(new Error(`Failed to load font: ${error.message}`));
          });
        } catch (error) {
          reject(new Error('Failed to process font file.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read font file.'));
      };
      
      reader.readAsDataURL(file);
    });
  }, []);

  const removeCustomFont = useCallback((fontName: string) => {
    setCustomFonts(prev => prev.filter(font => font.name !== fontName));
    
    // Remove font from document
    const fontFace = Array.from(document.fonts).find(font => font.family === fontName);
    if (fontFace) {
      document.fonts.delete(fontFace);
    }
  }, []);

  const getAvailableFonts = useCallback(() => {
    const systemFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
      'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Sans Unicode', 'Tahoma',
      'Geneva', 'Lucida Grande', 'Brush Script MT', 'Lucida Handwriting',
      'Copperplate', 'Copperplate Gothic Light', 'Papyrus', 'Chalkduster',
      'Apple Chancery', 'Snell Roundhand', 'Bradley Hand', 'Brush Script Std',
      'Luminari', 'Chalkduster', 'Jazz LET', 'Blippo', 'Stencil Std', 'Marker Felt',
      'Trattatello', 'Big Caslon', 'Bodoni MT', 'Didot', 'Hoefler Text',
      'Lucida Bright', 'Lucida Fax', 'Palatino Linotype', 'Palatino LT STD',
      'Perpetua', 'Perpetua Titling MT', 'Rockwell', 'Rockwell Condensed',
      'Rockwell Extra Bold', 'Baskerville', 'Baskerville Old Face', 'Libre Baskerville',
      'Goudy Old Style', 'Goudy Stout', 'Libre Caslon Text', 'Spectral',
      'Crimson Text', 'Lora', 'Source Sans Pro', 'Open Sans', 'Roboto',
      'Lato', 'Montserrat', 'Raleway', 'Poppins', 'Inter', 'Nunito',
      'Ubuntu', 'Oswald', 'Playfair Display', 'Merriweather', 'PT Sans',
      'Noto Sans', 'Noto Serif', 'Fira Sans', 'Fira Code', 'JetBrains Mono'
    ];
    
    const customFontNames = customFonts.map(font => font.name);
    return [...systemFonts, ...customFontNames];
  }, [customFonts]);

  const exportImage = useCallback(() => {
    if (transformerRef.current) {
      const stage = transformerRef.current.getStage();
      const dataURL = stage.toDataURL();
      const link = document.createElement('a');
      link.download = 'text-editor-export.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  if (!isClient) {
    return (
      <div className={`flex flex-col lg:flex-row h-screen ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col lg:flex-row h-screen bg-gray-100 ${className}`}>
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white shadow-lg m-2 overflow-hidden">
        {/* Canvas Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Image Text Editor</h1>
              </div>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {imageWidth} × {imageHeight}px
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {textLayers.length} text layer{textLayers.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Undo/Redo Controls */}
            <div className="flex items-center gap-1 bg-white bg-opacity-90 rounded-lg p-1 shadow-md">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
            
            {/* History Indicator */}
            <div className="text-xs text-gray-700 bg-white bg-opacity-95 px-3 py-1 rounded-full font-medium shadow-sm border border-gray-200">
              {currentStep + 1}/{history.length}
            </div>
            
            {/* Autosave Status */}
            <div className="flex items-center gap-2">
              {isSaving ? (
                <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full shadow-sm border border-blue-200">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : lastSaved ? (
                <div className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full shadow-sm border border-green-200">
                  Saved {lastSaved.toLocaleTimeString()}
                </div>
              ) : (
                <div className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full shadow-sm border border-gray-200">
                  Not saved
                </div>
              )}
            </div>
            
            <button
              onClick={exportImage}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 border border-green-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="max-w-full max-h-full">
                    <KonvaCanvas
          ref={transformerRef}
          imageUrl={imageUrl}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          textLayers={textLayers}
          setTextLayers={setTextLayers}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          customFonts={customFonts}
        />
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="lg:w-96 flex-shrink-0 h-full flex flex-col bg-white border-l border-gray-200 shadow-xl">
        {/* Controls Header */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Text Properties</h2>
          </div>
          <p className="text-sm text-gray-600 ml-11">Customize your text appearance and styling</p>
        </div>

        {/* Scrollable Controls */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
          <div className="p-6 space-y-6">
            
            {/* Multi-Select Info */}
            {isMultiSelect && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Multi-Select Active</h3>
                <div className="text-xs text-blue-700 mb-2">
                  {selectedIds.size} layer{selectedIds.size !== 1 ? 's' : ''} selected
                </div>
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  <strong>Tip:</strong> Hold Ctrl/Cmd + Click to select multiple layers
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={addText}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 border border-blue-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Text
                </button>
                <button
                  onClick={showResetConfirmation}
                  disabled={textLayers.length === 0}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transform hover:scale-105 border border-red-500 disabled:border-gray-400"
                  title="Reset design to blank state (Ctrl+R)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>
            
          {selectedText ? (
            <>
              {/* Text Content */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-blue-900 mb-2">Text Content</label>
                <textarea
                  value={selectedText?.text || ''}
                  onChange={(e) => {
                    if (hasSelection) {
                      const newLayers = textLayers.map(layer => 
                        selectedIds.has(layer.id) 
                          ? { ...layer, text: e.target.value }
                          : layer
                      );
                      setTextLayers(newLayers);
                      addToHistory(newLayers);
                    }
                  }}
                  className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black resize-none bg-white"
                  rows={3}
                  placeholder="Enter your text here..."
                />
              </div>

              {/* Font Controls */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Font Settings</h3>
                
                {/* Font Family */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select
                  value={selectedText?.fontFamily || 'Arial'}
                  onChange={(e) => updateTextStyle('fontFamily', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <optgroup label="System Fonts">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Impact">Impact</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Lucida Sans Unicode">Lucida Sans Unicode</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Arial Black">Arial Black</option>
                    <option value="Bookman Old Style">Bookman Old Style</option>
                    <option value="Century Gothic">Century Gothic</option>
                    <option value="Franklin Gothic Medium">Franklin Gothic Medium</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Palatino">Palatino</option>
                  </optgroup>
                  
                  <optgroup label="Web Safe Fonts">
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="cursive">Cursive</option>
                    <option value="fantasy">Fantasy</option>
                  </optgroup>
                  
                  <optgroup label="Google Fonts - Sans Serif">
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Raleway">Raleway</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                    <option value="Ubuntu">Ubuntu</option>
                    <option value="Inter">Inter</option>
                    <option value="Nunito">Nunito</option>
                    <option value="Work Sans">Work Sans</option>
                    <option value="Quicksand">Quicksand</option>
                    <option value="Bebas Neue">Bebas Neue</option>
                    <option value="Oswald">Oswald</option>
                    <option value="Roboto Condensed">Roboto Condensed</option>
                    <option value="Fira Sans">Fira Sans</option>
                    <option value="PT Sans">PT Sans</option>
                    <option value="Noto Sans">Noto Sans</option>
                    <option value="Libre Franklin">Libre Franklin</option>
                    <option value="Archivo">Archivo</option>
                    <option value="Titillium Web">Titillium Web</option>
                    <option value="Josefin Sans">Josefin Sans</option>
                    <option value="Karla">Karla</option>
                  </optgroup>
                  
                  <optgroup label="Google Fonts - Serif">
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Merriweather">Merriweather</option>
                    <option value="Noto Serif">Noto Serif</option>
                    <option value="Crimson Text">Crimson Text</option>
                    <option value="Libre Baskerville">Libre Baskerville</option>
                    <option value="Lora">Lora</option>
                    <option value="Roboto Slab">Roboto Slab</option>
                    <option value="Merriweather Sans">Merriweather Sans</option>
                    <option value="Source Serif Pro">Source Serif Pro</option>
                    <option value="Crimson Pro">Crimson Pro</option>
                    <option value="Alegreya">Alegreya</option>
                    <option value="Bitter">Bitter</option>
                    <option value="Domine">Domine</option>
                    <option value="Faustina">Faustina</option>
                    <option value="Gentium Basic">Gentium Basic</option>
                  </optgroup>
                  
                  <optgroup label="Google Fonts - Display & Script">
                    <option value="Dancing Script">Dancing Script</option>
                    <option value="Pacifico">Pacifico</option>
                    <option value="Bebas Neue">Bebas Neue</option>
                    <option value="Oswald">Oswald</option>
                  </optgroup>
                  
                  <optgroup label="Google Fonts - Monospace">
                    <option value="Roboto Mono">Roboto Mono</option>
                    <option value="Source Code Pro">Source Code Pro</option>
                    <option value="Inconsolata">Inconsolata</option>
                    <option value="Space Mono">Space Mono</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Fira Code">Fira Code</option>
                    <option value="Cascadia Code">Cascadia Code</option>
                    <option value="Victor Mono">Victor Mono</option>
                    <option value="IBM Plex Mono">IBM Plex Mono</option>
                    <option value="Anonymous Pro">Anonymous Pro</option>
                    <option value="Courier Prime">Courier Prime</option>
                  </optgroup>
                  
                  {customFonts.length > 0 && (
                    <optgroup label="Custom Fonts">
                      {customFonts.map((font) => (
                        <option key={font.name} value={font.name}>
                          {font.name} ({font.type.toUpperCase()})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Custom Font Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Custom Font</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadCustomFont(file)
                          .then(() => {
                            console.log('Font uploaded successfully');
                          })
                          .catch((error) => {
                            console.error('Font upload failed:', error.message);
                            alert(`Font upload failed: ${error.message}`);
                          });
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: TTF, OTF, WOFF, WOFF2 (max 10MB)
                  </p>
                </div>
                
                {/* Custom Fonts List */}
                {customFonts.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Uploaded Fonts:</label>
                    <div className="space-y-1">
                      {customFonts.map((font) => (
                        <div key={font.name} className="flex items-center justify-between bg-gray-100 p-2 rounded text-xs">
                          <span className="font-medium">{font.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">{font.type.toUpperCase()}</span>
                            <button
                              onClick={() => removeCustomFont(font.name)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title="Remove font"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                <select
                  value={selectedText?.fontSize || 40}
                  onChange={(e) => updateTextStyle('fontSize', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  {fontSizes.map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
                <select
                  value={selectedText?.fontWeight || 'normal'}
                  onChange={(e) => updateTextStyle('fontWeight', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  {fontWeights.map(weight => (
                    <option key={weight.value} value={weight.value}>{weight.label}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Current: {selectedText.fontWeight} | Font: {selectedText.fontFamily}
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => updateTextStyle('fontWeight', 'normal')}
                    className={`px-2 py-1 text-xs border rounded ${
                      selectedText.fontWeight === 'normal' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => updateTextStyle('fontWeight', 'bold')}
                    className={`px-2 py-1 text-xs border rounded ${
                      selectedText.fontWeight === 'bold' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Bold
                  </button>
                  <button
                    onClick={() => updateTextStyle('fontWeight', '300')}
                    className={`px-2 py-1 text-xs border rounded ${
                      selectedText.fontWeight === '300' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => updateTextStyle('fontWeight', '600')}
                    className={`px-2 py-1 text-xs border rounded ${
                      selectedText.fontWeight === '600' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Semi
                  </button>
                  <button
                    onClick={() => {
                      console.log('Testing font weight change...');
                      updateTextStyle('fontWeight', '900');
                      setTimeout(() => {
                        console.log('Font weight should be 900 now');
                      }, 100);
                    }}
                    className="px-2 py-1 text-xs border rounded bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedText.fill}
                    onChange={(e) => updateTextStyle('fill', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedText.fill}
                    onChange={(e) => updateTextStyle('fill', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="#000000"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1 mt-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => updateTextStyle('fill', color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stroke Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedText.stroke}
                    onChange={(e) => updateTextStyle('stroke', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedText.stroke}
                    onChange={(e) => updateTextStyle('stroke', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="#000000"
                  />
                </div>
                <div className="grid grid-cols-8 gap-1 mt-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => updateTextStyle('stroke', color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Stroke Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stroke Width</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={selectedText.strokeWidth}
                  onChange={(e) => updateTextStyle('strokeWidth', Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{selectedText.strokeWidth}</span>
                  <span>10</span>
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedText.opacity}
                  onChange={(e) => updateTextStyle('opacity', Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{Math.round(selectedText.opacity * 100)}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Line Height</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={selectedText.lineHeight}
                  onChange={(e) => updateTextStyle('lineHeight', Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5</span>
                  <span>{selectedText.lineHeight}</span>
                  <span>3.0</span>
                </div>
              </div>

              {/* Letter Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Letter Spacing</label>
                <input
                  type="range"
                  min="-5"
                  max="20"
                  step="1"
                  value={selectedText.letterSpacing}
                  onChange={(e) => updateTextStyle('letterSpacing', Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-5px</span>
                  <span>{selectedText.letterSpacing}px</span>
                  <span>20px</span>
                </div>
              </div>

              {/* Text Decoration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Decoration</label>
                <select
                  value={selectedText.textDecoration}
                  onChange={(e) => updateTextStyle('textDecoration', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  {textDecorations.map(decoration => (
                    <option key={decoration.value} value={decoration.value}>{decoration.label}</option>
                  ))}
                </select>
              </div>

              {/* Text Shadow */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Shadow</label>
                
                {/* Shadow Color */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedText.textShadow.color}
                      onChange={(e) => updateTextShadow('color', e.target.value)}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedText.textShadow.color}
                      onChange={(e) => updateTextShadow('color', e.target.value)}
                      className="flex-1 p-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Shadow Blur */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Blur: {selectedText.textShadow.blur}px</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={selectedText.textShadow.blur}
                    onChange={(e) => updateTextShadow('blur', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Shadow Offset X */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Offset X: {selectedText.textShadow.offsetX}px</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={selectedText.textShadow.offsetX}
                    onChange={(e) => updateTextShadow('offsetX', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Shadow Offset Y */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Offset Y: {selectedText.textShadow.offsetY}px</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={selectedText.textShadow.offsetY}
                    onChange={(e) => updateTextShadow('offsetY', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTextStyle('textAlign', 'left')}
                    className={`flex-1 p-2 border rounded-md transition-colors ${
                      selectedText.textAlign === 'left' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => updateTextStyle('textAlign', 'center')}
                    className={`flex-1 p-2 border rounded-md transition-colors ${
                      selectedText.textAlign === 'center' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => updateTextStyle('textAlign', 'right')}
                    className={`flex-1 p-2 border rounded-md transition-colors ${
                      selectedText.textAlign === 'right' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18v2H3V6zm0 5h14v2H3v-2zm0 5h18v2H3v-2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Paragraph Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paragraph Width</label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="50"
                  value={selectedText.paragraphWidth}
                  onChange={(e) => updateTextStyle('paragraphWidth', Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Narrow</span>
                  <span>{selectedText.paragraphWidth}px</span>
                  <span>Wide</span>
                </div>
              </div>

              {/* Position Controls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedText.x)}
                      onChange={(e) => {
                        if (hasSelection) {
                          const newLayers = textLayers.map(layer => 
                            selectedIds.has(layer.id) 
                              ? { ...layer, x: Number(e.target.value) }
                              : layer
                          );
                          setTextLayers(newLayers);
                          addToHistory(newLayers);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedText.y)}
                      onChange={(e) => {
                        if (hasSelection) {
                          const newLayers = textLayers.map(layer => 
                            selectedIds.has(layer.id) 
                              ? { ...layer, y: Number(e.target.value) }
                              : layer
                          );
                          setTextLayers(newLayers);
                          addToHistory(newLayers);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rotation</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={selectedText.rotation}
                    onChange={(e) => {
                      if (hasSelection) {
                        const newLayers = textLayers.map(layer => 
                          selectedIds.has(layer.id) 
                            ? { ...layer, rotation: Number(e.target.value) }
                            : layer
                        );
                        setTextLayers(newLayers);
                        addToHistory(newLayers);
                      }
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-16 text-right">{selectedText.rotation.toFixed(2)}°</span>
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scale</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">X</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={selectedText.scaleX}
                      onChange={(e) => {
                        if (hasSelection) {
                          const newLayers = textLayers.map(layer => 
                            selectedIds.has(layer.id) 
                              ? { ...layer, scaleX: Number(e.target.value) }
                              : layer
                          );
                          setTextLayers(newLayers);
                          addToHistory(newLayers);
                        }
                      }}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">{selectedText.scaleX.toFixed(1)}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Y</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={selectedText.scaleY}
                      onChange={(e) => {
                        if (hasSelection) {
                          const newLayers = textLayers.map(layer => 
                            selectedIds.has(layer.id) 
                              ? { ...layer, scaleY: Number(e.target.value) }
                              : layer
                          );
                          setTextLayers(newLayers);
                          addToHistory(newLayers);
                        }
                      }}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 text-center">{selectedText.scaleY.toFixed(1)}</div>
                  </div>
                </div>
              </div>

                      {/* Autosave Controls */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Autosave</h3>
          <div className="space-y-2">
            <button
              onClick={manualSave}
              disabled={isSaving}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {isSaving ? 'Saving...' : 'Save Now'}
            </button>
            <button
              onClick={clearSavedData}
              className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Saved Data
            </button>
            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
              <strong>Auto-saves every 2 seconds</strong><br />
              Data is saved to your browser's localStorage
            </div>
          </div>
        </div>

        {/* Warp/Curved Text Controls */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-900 mb-3">Warp/Curved Text</h3>
          
          <div className="mb-3">
            <button
              onClick={toggleWarp}
              disabled={!hasSelection || selectedIds.size !== 1}
              className={`w-full px-3 py-2 text-white rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 ${
                selectedText?.isWarped 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {selectedText?.isWarped ? 'Disable Warp' : 'Enable Warp'}
            </button>
          </div>

          {selectedText?.isWarped && (
            <>
              {/* Path Type Selection */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-green-700 mb-2">Path Type</label>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => setWarpPath('arc')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Arc path"
                  >
                    Arc
                  </button>
                  <button
                    onClick={() => setWarpPath('circle')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Full circle"
                  >
                    Circle
                  </button>
                  <button
                    onClick={() => setWarpPath('wave')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Wave pattern"
                  >
                    Wave
                  </button>
                  <button
                    onClick={() => setWarpPath('spiral')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Spiral pattern"
                  >
                    Spiral
                  </button>
                  <button
                    onClick={() => setWarpPath('zigzag')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Zigzag pattern"
                  >
                    Zigzag
                  </button>
                  <button
                    onClick={() => setWarpPath('heart')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Heart shape"
                  >
                    Heart
                  </button>
                  <button
                    onClick={() => setWarpPath('star')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Star shape"
                  >
                    Star
                  </button>
                  <button
                    onClick={() => setWarpPath('custom')}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                    title="Custom curve"
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Warp Radius */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-green-700 mb-2">Radius: {selectedText.warpRadius}px</label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={selectedText?.warpRadius || 100}
                  onChange={(e) => updateWarpProperty('warpRadius', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Warp Angle */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-green-700 mb-2">Angle: {selectedText.warpAngle}°</label>
                <input
                  type="range"
                  min="90"
                  max="360"
                  step="15"
                  value={selectedText?.warpAngle || 180}
                  onChange={(e) => updateWarpProperty('warpAngle', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Warp Spacing */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-green-700 mb-2">Spacing: {selectedText.warpSpacing}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={selectedText?.warpSpacing || 1}
                  onChange={(e) => updateWarpProperty('warpSpacing', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        {/* Smart Spacing Controls */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3">Smart Spacing</h3>
          
          {/* Spacing Hints Toggle */}
          <div className="mb-3">
            <button
              onClick={toggleSpacingHints}
              disabled={!hasSelection}
              className={`px-3 py-2 text-white rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1 ${
                selectedText?.showSpacingHints 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {selectedText?.showSpacingHints ? 'Hide Hints' : 'Show Hints'}
            </button>
          </div>

          {/* Spacing Hint Color */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-indigo-700 mb-2">Hint Color</label>
            <input
              type="color"
              value={selectedText?.spacingHintColor || '#3B82F6'}
              onChange={(e) => updateSpacingHintColor(e.target.value)}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>

          {/* Spacing Hint Opacity */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-indigo-700 mb-2">Hint Opacity: {Math.round((selectedText?.spacingHintOpacity || 0.6) * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={selectedText?.spacingHintOpacity || 0.6}
              onChange={(e) => updateSpacingHintOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Alignment Tools */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-indigo-700 mb-2">Alignment Tools</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={alignLayersHorizontally}
                disabled={!hasSelection || selectedIds.size < 2}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Align layers horizontally"
              >
                Align H
              </button>
              <button
                onClick={alignLayersVertically}
                disabled={!hasSelection || selectedIds.size < 2}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Align layers vertically"
              >
                Align V
              </button>
            </div>
          </div>

          {/* Distribution Tools */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-indigo-700 mb-2">Distribution Tools</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={distributeLayersEvenly}
                disabled={!hasSelection || selectedIds.size < 3}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Distribute layers evenly horizontally"
              >
                Distribute H
              </button>
              <button
                onClick={distributeLayersVertically}
                disabled={!hasSelection || selectedIds.size < 3}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Distribute layers evenly vertically"
              >
                Distribute V
              </button>
            </div>
          </div>

          {/* Spacing Info */}
          {isMultiSelect && (
            <div className="text-xs text-indigo-600 bg-indigo-100 p-2 rounded">
              <strong>Tip:</strong> Use spacing hints to visualize gaps between layers
            </div>
          )}
        </div>

        {/* Layer Management */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">Layer Management</h3>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={moveLayerUp}
                    disabled={!hasSelection || selectedIds.size !== 1 || textLayers.findIndex(layer => layer.id === Array.from(selectedIds)[0]) === 0}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Move Up
                  </button>
                  <button
                    onClick={moveLayerDown}
                    disabled={!hasSelection || selectedIds.size !== 1 || textLayers.findIndex(layer => layer.id === Array.from(selectedIds)[0]) === textLayers.length - 1}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Move Down
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={bringToFront}
                    disabled={!hasSelection || selectedIds.size !== 1 || textLayers.findIndex(layer => layer.id === Array.from(selectedIds)[0]) === textLayers.length - 1}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                    Bring to Front
                  </button>
                  <button
                    onClick={sendToBack}
                    disabled={!hasSelection || selectedIds.size !== 1 || textLayers.findIndex(layer => layer.id === Array.from(selectedIds)[0]) === 0}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l9.2 9.2M7 7v10h10" />
                    </svg>
                    Send to Back
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={toggleLock}
                    disabled={!hasSelection}
                    className={`px-3 py-2 text-white rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1 ${
                      selectedText?.locked 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {selectedText?.locked ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      )}
                    </svg>
                    {selectedIds.size === 1 
                      ? (selectedText?.locked ? 'Unlock' : 'Lock')
                      : (() => {
                          const selectedLayers = textLayers.filter(layer => selectedIds.has(layer.id));
                          const allLocked = selectedLayers.every(layer => layer.locked);
                          return allLocked ? `Unlock All (${selectedIds.size})` : `Lock All (${selectedIds.size})`;
                        })()
                    }
                  </button>
                  <button
                    onClick={duplicateLayer}
                    disabled={!hasSelection || selectedIds.size !== 1}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate
                  </button>
                </div>
                
                {/* Layer List */}
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-purple-700 mb-2">Layer Order (Top to Bottom)</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {textLayers.slice().reverse().map((layer, index) => (
                      <div
                        key={layer.id}
                        className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                          selectedIds.has(layer.id)
                            ? 'bg-purple-200 text-purple-900 font-medium'
                            : 'bg-white text-gray-700 hover:bg-purple-100'
                        }`}
                        onClick={() => selectLayer(layer.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {layer.locked && (
                              <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                            )}
                            <span className="truncate">
                              {layer.text.length > 20 ? layer.text.substring(0, 20) + '...' : layer.text}
                            </span>
                          </div>
                          <span className="text-purple-500 font-mono">
                            {textLayers.length - index}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <div>
                <button
                  onClick={deleteText}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Text Layer
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Select a text layer to edit its properties</p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reset Design</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset your design? This will:
            </p>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove all text layers
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear undo/redo history
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Delete saved data from browser
              </li>
            </ul>
            
            <p className="text-sm text-red-600 font-medium mb-6">
              This action cannot be undone!
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={cancelReset}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={resetDesign}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Reset Design
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
