# 🎨 Image Text Composer

A powerful, feature-rich image text editor built with Next.js, React, and Konva.js. Create stunning text overlays on images with professional-grade editing capabilities.

![Image Text Composer](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🖼️ Image Management
- **PNG Image Upload**: Drag & drop or click to upload PNG images
- **Aspect Ratio Matching**: Canvas automatically matches uploaded image dimensions
- **File Validation**: Size limit (5MB) and format validation
- **Image Preview**: Real-time preview of uploaded images

### 📝 Text Editing
- **Rich Text Controls**: Font family, size, weight, color, opacity
- **Text Styling**: Stroke, text shadow, text decoration, letter spacing
- **Text Alignment**: Left, center, right alignment with paragraph width control
- **Multi-line Text**: Support for paragraphs and line breaks
- **Real-time Preview**: Instant visual feedback for all text changes

### 🎨 Font System
- **System Fonts**: 50+ built-in system fonts
- **Google Fonts**: 100+ Google Fonts integration
- **Custom Font Upload**: Upload TTF, OTF, WOFF, WOFF2 files (max 10MB)
- **Font Management**: Add, remove, and organize custom fonts
- **Font Preview**: See fonts in action before applying

### 🔧 Layer Management
- **Multiple Text Layers**: Add unlimited text layers
- **Layer Ordering**: Move layers up/down, bring to front/send to back
- **Layer Locking**: Lock/unlock individual or multiple layers
- **Layer Duplication**: Duplicate layers with offset positioning
- **Layer Selection**: Single or multi-select layers (Ctrl/Cmd + Click)

### 🔒 Advanced Locking System
- **Group Lock/Unlock**: Lock or unlock multiple selected layers at once
- **Smart Lock Logic**: 
  - If all selected layers are locked → unlock all
  - If any selected layer is unlocked → lock all
- **Visual Indicators**: Lock icons and dynamic button text
- **Selection Count**: Shows number of layers being affected

### 📐 Smart Spacing & Alignment
- **Visual Spacing Hints**: Dashed lines showing spacing between layers
- **Pixel Measurements**: Exact distance measurements between layers
- **Alignment Tools**: Horizontal and vertical alignment
- **Distribution Tools**: Evenly distribute layers horizontally or vertically
- **Customizable Hints**: Adjust hint color and opacity

### 🌊 Warp/Curved Text
- **8 Path Types**: Arc, Circle, Wave, Spiral, Zigzag, Heart, Star, Custom
- **Dynamic Controls**: Adjust radius, angle, and spacing
- **Real-time Rendering**: See curved text effects instantly
- **Character-level Positioning**: Each character follows the path precisely
- **Rotation Following**: Characters rotate to follow path direction

### 🔄 Undo/Redo System
- **20-Step History**: Track up to 20 operations
- **Visual History Indicator**: See current position in history
- **Comprehensive Tracking**: All operations are tracked
- **Keyboard Shortcuts**: Ctrl+Z and Ctrl+Y support

### 💾 Autosave & Persistence
- **Browser Storage**: Automatic saving to localStorage
- **Session Persistence**: Restore work after page refresh
- **Smart Validation**: Only restore if image matches
- **Manual Save**: Trigger save manually
- **Reset Functionality**: Clear saved data and start fresh

### 🎯 Multi-Select & Group Operations
- **Multi-Layer Selection**: Select multiple layers with Ctrl/Cmd + Click
- **Group Transforms**: Move, resize, rotate multiple layers together
- **Batch Operations**: Apply changes to all selected layers
- **Visual Feedback**: Clear indication of multi-select state
- **Selection Management**: Add/remove layers from selection

### 📱 User Experience
- **Responsive Design**: Works on desktop and tablet
- **Professional UI**: Clean, modern interface with Tailwind CSS
- **Intuitive Controls**: Easy-to-use interface
- **Visual Feedback**: Real-time updates and status indicators
- **Error Handling**: Clear error messages and validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd image-text-composer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Use

### 1. Upload an Image
- Drag and drop a PNG image onto the upload area
- Or click to browse and select a PNG file
- The canvas will automatically resize to match your image

### 2. Add Text Layers
- Click "Add Text" to create a new text layer
- Text will appear on the canvas with default styling
- Select the text layer to edit its properties

### 3. Edit Text Properties
- **Font Settings**: Choose from system fonts, Google Fonts, or upload custom fonts
- **Text Styling**: Adjust size, weight, color, opacity, stroke
- **Text Effects**: Add shadows, decorations, letter spacing
- **Text Alignment**: Set alignment and paragraph width

### 4. Manage Layers
- **Select Layers**: Click to select single layer, Ctrl/Cmd + Click for multiple
- **Move Layers**: Drag layers around the canvas
- **Resize/Rotate**: Use transform handles to resize or rotate
- **Layer Order**: Use layer management tools to reorder layers
- **Lock Layers**: Lock individual or multiple layers to prevent accidental changes

### 5. Use Advanced Features
- **Warp Text**: Enable warp and choose from 8 different path types
- **Smart Spacing**: Enable spacing hints to visualize layer spacing
- **Alignment Tools**: Use alignment and distribution tools for precise positioning
- **Custom Fonts**: Upload your own font files for unique typography

### 6. Save and Export
- Your work is automatically saved to browser storage
- Use the export button to download your final image as PNG
- Use the reset button to clear all data and start fresh

## 🛠️ Technical Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Canvas**: Konva.js with React-Konva
- **Font Loading**: FontFace API
- **Storage**: Browser localStorage
- **Build Tool**: Turbopack

## 📁 Project Structure

```
image-text-composer/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page component
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── ImageUploader.tsx     # Image upload component
│   │   ├── TextEditor.tsx        # Main text editor component
│   │   └── KonvaCanvas.tsx       # Canvas rendering component
│   └── types/                    # TypeScript type definitions
├── public/                       # Static assets
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🎨 Key Components

### ImageUploader
- Handles PNG image upload with drag & drop
- Validates file type and size
- Provides image preview and dimensions

### TextEditor
- Main editor interface with all controls
- Manages text layers, history, and autosave
- Handles custom font upload and management
- Provides smart spacing and alignment tools

### KonvaCanvas
- Renders image and text layers on canvas
- Handles user interactions (select, drag, transform)
- Manages warp text rendering
- Displays spacing hints and visual guides

## 🔧 Advanced Features

### Custom Font System
```typescript
// Upload custom fonts
const uploadCustomFont = (file: File) => {
  // Validates TTF, OTF, WOFF, WOFF2 files
  // Loads fonts using FontFace API
  // Integrates with existing font system
};
```

### Warp Text Rendering
```typescript
// Render text along various paths
const renderWarpedText = (textLayer: TextLayer) => {
  // Supports 8 path types: arc, circle, wave, spiral, etc.
  // Calculates character positions and rotations
  // Provides real-time visual feedback
};
```

### Smart Spacing System
```typescript
// Visual spacing hints between layers
const renderSpacingHints = () => {
  // Shows dashed lines between selected layers
  // Displays pixel measurements
  // Provides alignment and distribution tools
};
```

## 🎯 Use Cases

- **Social Media Graphics**: Create eye-catching text overlays for posts
- **Marketing Materials**: Design banners, flyers, and promotional content
- **Personal Projects**: Add text to photos for personal use
- **Educational Content**: Create instructional images with text
- **Professional Design**: Quick text editing for design workflows

## 🚀 Performance Features

- **Efficient Rendering**: Optimized canvas updates
- **Memory Management**: Clean up unused resources
- **Lazy Loading**: Load fonts and assets on demand
- **Debounced Autosave**: Prevents excessive storage writes
- **Conditional Rendering**: Only render what's needed

## 🔒 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Required APIs**: FontFace API, File API, Canvas API
- **Mobile Support**: Responsive design for tablets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Konva.js**: Powerful 2D canvas library
- **React-Konva**: React bindings for Konva.js
- **Tailwind CSS**: Utility-first CSS framework
- **Google Fonts**: Extensive font library
- **Next.js**: React framework for production

## 📞 Support

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Ensure you're using a supported browser
3. Verify your image file is a valid PNG
4. Try refreshing the page to restore from autosave

---

**Made with ❤️ using Next.js, React, and Konva.js**
