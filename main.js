const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const brushSizeInput = document.getElementById('brush-size');
const brushColorInput = document.getElementById('brush-color');
const pointColorInput = document.getElementById('point-color');
const pointDistanceInput = document.getElementById('point-distance');
const uploadBtn = document.getElementById('upload-btn');
const saveBtn = document.getElementById('save-btn');
const undoBtn = document.getElementById('undo-btn');
const clearBtn = document.getElementById('clear-btn');
const pointToggle = document.getElementById('point-toggle');

let drawing = false;
let lastX = 0;
let lastY = 0;
let undoStack = [];
let brushSize = brushSizeInput.value;
let brushColor = brushColorInput.value;
let pointColor = pointColorInput.value;
let pointDistance = pointDistanceInput.value;
let isPointBased = false;
let tempDrawing = [];

// Update brush size and color
brushSizeInput.addEventListener('input', () => {
    brushSize = brushSizeInput.value;
});

brushColorInput.addEventListener('input', () => {
    brushColor = brushColorInput.value;
});

pointColorInput.addEventListener('input', () => {
    pointColor = pointColorInput.value;
});

pointDistanceInput.addEventListener('input', () => {
    pointDistance = pointDistanceInput.value;
});

// Update the point toggle
pointToggle.addEventListener('change', () => {
    isPointBased = pointToggle.checked;
});

// Set canvas size based on window size
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;  // Canvas takes 90% of the screen width
    canvas.height = window.innerHeight * 0.6; // Canvas takes 60% of the screen height
    ctx.lineWidth = brushSize;
}

// Call resizeCanvas on window resize
window.addEventListener('resize', resizeCanvas);

// Initial canvas size setup
resizeCanvas();

// Get mouse or touch position
function getPosition(e) {
    let x, y;
    if (e.touches) {
        const rect = canvas.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        const rect = canvas.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    return { x, y };
}

// Start drawing
function startDrawing(e) {
    e.preventDefault();
    drawing = true;
    const position = getPosition(e);
    lastX = position.x;
    lastY = position.y;
    tempDrawing = []; // Reset temporary drawing points
}

// Draw on canvas (using brush color for the line and point color for the points)
function draw(e) {
    e.preventDefault();
    if (drawing) {
        const position = getPosition(e);
        const x = position.x;
        const y = position.y;

        // Store the points for the temporary line
        tempDrawing.push({ x, y });

        // Draw the temporary line with brush color
        drawTempLine();

        // Draw points in red if point-based drawing is enabled
        if (isPointBased) {
            drawPointsOnLine();
        }

        // Update last position
        lastX = x;
        lastY = y;
    }
}

// Draw points along the line based on point distance
function drawPointsOnLine() {
    ctx.fillStyle = pointColor;
    let dist = 0;
    for (let i = 1; i < tempDrawing.length; i++) {
        const dx = tempDrawing[i].x - tempDrawing[i - 1].x;
        const dy = tempDrawing[i].y - tempDrawing[i - 1].y;
        dist += Math.sqrt(dx * dx + dy * dy);

        if (dist >= pointDistance) {
            // Draw point
            ctx.beginPath();
            ctx.arc(tempDrawing[i].x, tempDrawing[i].y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
            dist = 0; // Reset distance
        }
    }
}

// Draw the temporary line with brush color
function drawTempLine() {
    ctx.beginPath();
    for (let i = 0; i < tempDrawing.length - 1; i++) {
        ctx.moveTo(tempDrawing[i].x, tempDrawing[i].y);
        ctx.lineTo(tempDrawing[i + 1].x, tempDrawing[i + 1].y);
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = brushColor; // Use brush color for the temporary line
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

// Stop drawing and render the final line with the selected colors
function stopDrawing() {
    drawing = false;
    undoStack.push(canvas.toDataURL());
    if (!isPointBased) {
        // If not point-based, draw the final line in the selected color
        drawFinalLine();
    }
    tempDrawing = []; // Clear temporary drawing data
}

// Draw the final line in the selected brush color
function drawFinalLine() {
    ctx.beginPath();
    for (let i = 0; i < tempDrawing.length - 1; i++) {
        ctx.moveTo(tempDrawing[i].x, tempDrawing[i].y);
        ctx.lineTo(tempDrawing[i + 1].x, tempDrawing[i + 1].y);
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = brushColor; // Final line color (brush color)
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // Draw points along the line after drawing if point-based drawing is enabled
    if (isPointBased) {
        drawPointsOnLine();
    }
}

// Mouse Events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch Events (for mobile)
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// Clear canvas
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStack = [];
});

// Undo functionality
undoBtn.addEventListener('click', () => {
    if (undoStack.length > 0) {
        const lastState = undoStack.pop();
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
});

// File upload functionality
uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    });
});

// Save canvas as image
saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'canvas-drawing.png';
    link.click();
});
