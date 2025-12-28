import React, { useRef, useEffect, useState, useCallback } from 'react';
// Import icons for tools
import { Brush, Eraser, Circle, Square, Triangle, Star, Heart, RotateCcw, RotateCw, Trash2, Palette, Ruler, Save, Stamp } from 'lucide-react'; // Added Stamp

// Define available shapes for stamping
const stampShapes = [
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'square', icon: Square, label: 'Square' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'star', icon: Star, label: 'Star' },
    { id: 'heart', icon: Heart, label: 'Heart' },
    // Add more simple shapes if desired
];

const DrawingBoard = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [color, setColor] = useState('#3B82F6'); // Default color blue
    const [brushSize, setBrushSize] = useState(5);
    const [canvasHistory, setCanvasHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- New State for Tools ---
    const [toolMode, setToolMode] = useState('draw'); // 'draw', 'erase', 'stamp'
    const [selectedStamp, setSelectedStamp] = useState(null); // e.g., 'circle', 'square'

    // --- Removed AI-related state ---
    // const [isLoading, setIsLoading] = useState(false);
    // const [message, setMessage] = useState('');
    // const [recognizedShape, setRecognizedShape] = useState('');

    // --- Canvas Context Memoization ---
    // Memoize the context to avoid repeated lookups
    const [ctx, setCtx] = useState(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            setCtx(canvas.getContext('2d'));
        }
    }, []); // Run only once

    // --- Canvas Setup & Resizing ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !ctx) return;

        // Save current state before resizing if history exists
        let currentImageData = null;
        if (historyIndex >= 0 && canvasHistory.length > 0) {
             currentImageData = canvasHistory[historyIndex];
        }


        const setCanvasSize = () => {
            // Adjust size, maybe slightly smaller than full window for better UI fit
            const toolbarHeight = 80; // Approximate height of bottom toolbar
            const sidePadding = 80; // Approximate width of side toolbar
            canvas.width = window.innerWidth - sidePadding - 10; // Add some buffer
            canvas.height = window.innerHeight - toolbarHeight - 20; // Add some buffer

            // Redraw the last saved state after resizing
            redrawCanvasState(currentImageData);
        };

        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);
        // Initial save state for undo/redo
        saveCanvasState(); // Save initial blank state

        return () => window.removeEventListener('resize', setCanvasSize);
    // Include ctx in dependencies to ensure it's set before running
    // Include canvasHistory only if you want resizing to potentially change history (usually not desired)
    }, [ctx]); // Dependency on ctx ensures canvas context is ready


    // --- Canvas State Management (Undo/Redo) ---
    const saveCanvasState = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        requestAnimationFrame(() => { // Ensure drawing is complete before saving
             const imageData = canvas.toDataURL();
             // If we undo and then draw, overwrite the future history
             const newHistory = canvasHistory.slice(0, historyIndex + 1);
             setCanvasHistory([...newHistory, imageData]);
             setHistoryIndex(newHistory.length);
        });

    }, [canvasHistory, historyIndex]);

    const redrawCanvasState = useCallback((imageDataUrl) => {
        const canvas = canvasRef.current;
        if (!canvas || !ctx) return;
        if (!imageDataUrl) { // Handle case where there's no history (e.g., initial load)
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Optionally fill with a default background color
            // ctx.fillStyle = '#FFFFFF';
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const img = new Image();
        img.src = imageDataUrl;
        img.onload = () => {
             ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear before drawing image
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Scale image if needed
        };
         img.onerror = () => { // Handle potential image loading errors
             console.error("Failed to load canvas state image.");
             // Fallback: Clear canvas or show error
              ctx.clearRect(0, 0, canvas.width, canvas.height);
         }
    }, [ctx]); // Dependency on ctx

    const undo = useCallback(() => {
        if (historyIndex > 0) { // Can only undo if not at the very beginning
            const newIndex = historyIndex - 1;
            redrawCanvasState(canvasHistory[newIndex]);
            setHistoryIndex(newIndex);
        } else if (historyIndex === 0) { // If at first state, undo means clear
            const canvas = canvasRef.current;
             if(canvas && ctx) {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 // Don't change historyIndex from 0 if clearing via undo
             }
        }
    }, [historyIndex, canvasHistory, redrawCanvasState, ctx]);

    const redo = useCallback(() => {
        if (historyIndex < canvasHistory.length - 1) { // Can only redo if not at the latest state
            const newIndex = historyIndex + 1;
            redrawCanvasState(canvasHistory[newIndex]);
            setHistoryIndex(newIndex);
        }
    }, [historyIndex, canvasHistory, redrawCanvasState]);


    // --- Drawing Logic ---
    const getPos = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        // Calculate scale factors if canvas CSS size differs from internal resolution
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        return { x, y };
    }, []); // canvasRef is stable


    const startDrawing = useCallback((e) => {
        if (!ctx || toolMode === 'stamp') return; // Don't start line drawing in stamp mode
        e.preventDefault(); // Prevent scrolling on touch devices
        setIsDrawing(true);
        const pos = getPos(e);
        setLastPos(pos);
        // Start path immediately for smoother lines
        ctx.beginPath(); // Begin path here
        ctx.moveTo(pos.x, pos.y); // Move to start point
        // Set line properties
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = toolMode === 'erase' ? '#ffffff' : color; // Use white for eraser
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round'; // Smoother corners

    }, [ctx, getPos, brushSize, color, toolMode]);

    const draw = useCallback((e) => {
        if (!isDrawing || !ctx || toolMode === 'stamp') return;
        e.preventDefault(); // Prevent scrolling on touch devices
        const currentPos = getPos(e);

        ctx.lineTo(currentPos.x, currentPos.y); // Draw line segment
        ctx.stroke(); // Render the segment
        // No need to beginPath or moveTo here, continue the existing path

        setLastPos(currentPos); // Update last position for the next segment
    }, [isDrawing, ctx, getPos, toolMode]);

    const stopDrawing = useCallback(() => {
        if (isDrawing && ctx && toolMode !== 'stamp') {
             ctx.closePath(); // Close the path for the current stroke
             saveCanvasState(); // Save state after finishing a stroke
        }
        setIsDrawing(false);
    }, [isDrawing, ctx, toolMode, saveCanvasState]);


    // --- Stamping Logic ---
    const handleCanvasClickStamp = useCallback((e) => {
        if (toolMode !== 'stamp' || !selectedStamp || !ctx) return;

        const { x, y } = getPos(e);
        const size = Math.max(20, brushSize * 5); // Base size on brushSize, with minimum

        ctx.fillStyle = color; // Use fill for stamps
        ctx.strokeStyle = color; // Also set stroke in case shapes use it
        ctx.lineWidth = Math.max(1, Math.floor(brushSize / 3)); // Thinner stroke for stamps

        ctx.beginPath(); // Start a new path for the stamp

        switch (selectedStamp) {
            case 'circle':
                ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
                break;
            case 'square':
                ctx.rect(x - size / 2, y - size / 2, size, size);
                break;
            case 'triangle':
                ctx.moveTo(x, y - size / 2);
                ctx.lineTo(x + size / (2 * Math.sqrt(3)) * 2 , y + size / 2 ); // Equilateral triangle approx
                ctx.lineTo(x - size / (2 * Math.sqrt(3)) * 2 , y + size / 2 );
                ctx.closePath();
                break;
            case 'star':
                drawStarStamp(ctx, x, y, 5, size / 2, size / 4); // Use a helper
                break;
            case 'heart':
                drawHeartStamp(ctx, x, y, size * 0.6); // Use a helper, adjust size factor
                 ctx.fillStyle = color; // Ensure heart uses fill
                 ctx.fill(); // Fill the heart path
                 ctx.stroke(); // Optionally add a stroke
                // Skip default fill/stroke below for heart
                saveCanvasState();
                return; // Exit early as heart handles fill/stroke
            default:
                console.warn("Unknown stamp shape:", selectedStamp);
                return; // Don't draw or save state
        }
         ctx.fill(); // Fill the shape
         ctx.stroke(); // Optionally add an outline

        saveCanvasState(); // Save state after stamping

    }, [toolMode, selectedStamp, ctx, getPos, color, brushSize, saveCanvasState]);


     // --- Stamp Helper Functions (Modified from old AI code) ---
    const drawStarStamp = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
        }
        ctx.closePath();
    };

    const drawHeartStamp = (ctx, x, y, size) => {
        // Heart drawing logic - slightly adjusted coordinates for better centering
        ctx.moveTo(x, y + size * 0.25);
        ctx.bezierCurveTo(x, y, x - size * 0.7, y - size * 0.4, x - size * 0.7, y + size * 0.1);
        ctx.bezierCurveTo(x - size * 0.7, y + size * 0.5, x, y + size * 0.8, x, y + size);
        ctx.bezierCurveTo(x, y + size * 0.8, x + size * 0.7, y + size * 0.5, x + size * 0.7, y + size * 0.1);
        ctx.bezierCurveTo(x + size * 0.7, y - size * 0.4, x, y, x, y + size * 0.25);
        ctx.closePath();
    };


    // --- Other Canvas Actions ---
    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Save the cleared state as the new history point
        saveCanvasState();
        // Reset message/shape state if they were used previously
        // setMessage('');
        // setRecognizedShape('');
    }, [ctx, saveCanvasState]);

    const saveCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png'); // Save as PNG
        link.download = `my_drawing_${Date.now()}.png`; // Add timestamp for uniqueness
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []); // canvasRef is stable

    // --- Tool Selection Handlers ---
    const selectTool = (tool) => {
        setToolMode(tool);
        setSelectedStamp(null); // Deselect stamp when choosing draw/erase
        console.log("Tool selected:", tool);
    };

    const selectStamp = (shapeId) => {
        setToolMode('stamp');
        setSelectedStamp(shapeId);
        console.log("Stamp selected:", shapeId);
    };


    return (
        // Added overflow-hidden to parent and adjusted padding
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen w-full overflow-hidden p-2">

            {/* Toolbar Area (Combined Side and Bottom for simplicity) */}
             <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md shadow-lg p-3 flex justify-center items-center flex-wrap gap-4 md:gap-6 border-t border-gray-200">

                {/* --- Tool Selection --- */}
                 <div className="flex items-center gap-2 border-r pr-4 mr-4 border-gray-300">
                     <button
                         title="Draw"
                         onClick={() => selectTool('draw')}
                         className={`p-2 rounded-lg transition-colors duration-200 ${toolMode === 'draw' ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                     >
                         <Brush className="w-5 h-5 md:w-6 md:h-6" />
                     </button>
                     <button
                         title="Eraser"
                         onClick={() => selectTool('erase')}
                         className={`p-2 rounded-lg transition-colors duration-200 ${toolMode === 'erase' ? 'bg-gray-700 text-white shadow-md ring-2 ring-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                     >
                         <Eraser className="w-5 h-5 md:w-6 md:h-6" />
                     </button>
                 </div>

                 {/* --- Stamp Selection --- */}
                 <div className="flex items-center gap-2 border-r pr-4 mr-4 border-gray-300">
                      <Stamp className={`w-5 h-5 md:w-6 md:h-6 mr-1 ${toolMode === 'stamp' ? 'text-purple-600' : 'text-gray-500'}`} />
                     {stampShapes.map(shape => (
                         <button
                             key={shape.id}
                             title={`Stamp ${shape.label}`}
                             onClick={() => selectStamp(shape.id)}
                             className={`p-2 rounded-lg transition-colors duration-200 ${toolMode === 'stamp' && selectedStamp === shape.id ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                         >
                             <shape.icon className="w-5 h-5 md:w-6 md:h-6" />
                         </button>
                     ))}
                 </div>


                 {/* --- Color Picker --- */}
                 <div className="flex items-center gap-2">
                     <Palette className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                     <input
                         type="color"
                         value={color}
                         onChange={(e) => setColor(e.target.value)}
                         className="w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer border-2 border-gray-300 shadow-sm p-0 overflow-hidden appearance-none bg-transparent" // Improved styling
                         style={{ backgroundColor: color }} // Show selected color as background
                         title="Select Color"
                    />
                 </div>

                 {/* --- Brush Size --- */}
                 <div className="flex items-center gap-2">
                     <Ruler className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                     <input
                         type="range"
                         min="1"
                         max="30" // Increased max size
                         value={brushSize}
                         onChange={(e) => setBrushSize(parseInt(e.target.value))}
                         className="w-24 md:w-32 cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none dark:bg-gray-700 accent-blue-500" // Styled range input
                         title={`Brush Size: ${brushSize}px`}
                    />
                    <span className="text-xs md:text-sm text-gray-600 w-8 text-right">{brushSize}px</span>
                 </div>

                 {/* --- Actions --- */}
                 <div className="flex items-center gap-2 border-l pl-4 ml-4 border-gray-300">
                    <button
                        title="Undo"
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                     <button
                         title="Redo"
                         onClick={redo}
                         disabled={historyIndex >= canvasHistory.length - 1}
                         className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                     >
                         <RotateCw className="w-5 h-5 md:w-6 md:h-6" />
                     </button>
                     <button
                         title="Clear Canvas"
                         onClick={clearCanvas}
                         className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
                     >
                         <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                     </button>
                     <button
                         title="Save Drawing"
                         onClick={saveCanvas}
                         className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                    >
                        <Save className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                 </div>
            </div>

            {/* The Canvas */}
            <canvas
                ref={canvasRef}
                // --- Updated Event Handlers ---
                onMouseDown={(e) => toolMode === 'stamp' ? handleCanvasClickStamp(e) : startDrawing(e)}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing} // Stop drawing if mouse leaves canvas
                onTouchStart={(e) => toolMode === 'stamp' ? handleCanvasClickStamp(e) : startDrawing(e)}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                // --- End of Updates ---
                className="bg-white shadow-inner rounded-lg border border-gray-300" // Added border
                // Width/Height are set dynamically in useEffect
                style={{ touchAction: 'none' }} // Prevent page scroll on touch devices while drawing
            />

            {/* Removed the AI message display area */}

        </div>
    );
};

export default DrawingBoard;

