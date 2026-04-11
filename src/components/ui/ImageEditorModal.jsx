'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, ZoomIn } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const CROP_SIZE = 256; // Output canvas size
const DISPLAY_SIZE = 380; // Display container size (larger like Discord)
const MAX_ZOOM = 3;

export default function ImageEditorModal({ isOpen, onClose, onApply, imageSrc }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [image, setImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoomInput, setZoomInput] = useState('100');
  const [minZoom, setMinZoom] = useState(1);

  // Load image when src changes
  useEffect(() => {
    if (imageSrc && isOpen) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        // Calculate minimum zoom to ensure image always covers the container
        const scaleToCover = Math.max(DISPLAY_SIZE / img.width, DISPLAY_SIZE / img.height);
        setMinZoom(scaleToCover);
        setZoom(scaleToCover);
        setPosition({ x: 0, y: 0 });
        setZoomInput(Math.round(scaleToCover * 100).toString());
      };
      img.src = imageSrc;
    }
  }, [imageSrc, isOpen]);

  // Reset zoom and position
  const resetTransform = useCallback(() => {
    if (!image) return;
    // Reset to minimum zoom that covers the container
    const scaleToCover = Math.max(DISPLAY_SIZE / image.width, DISPLAY_SIZE / image.height);
    setMinZoom(scaleToCover);
    setZoom(scaleToCover);
    setPosition({ x: 0, y: 0 });
    setZoomInput(Math.round(scaleToCover * 100).toString());
  }, [image]);

  // Mouse handlers for dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        resetTransform();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Draw image on canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Calculate the scale to fit the image to the display size (cover mode)
    const scaleToDisplay = Math.max(DISPLAY_SIZE / image.width, DISPLAY_SIZE / image.height);
    const scaledWidth = image.width * scaleToDisplay * zoom;
    const scaledHeight = image.height * scaleToDisplay * zoom;
    const drawX = (DISPLAY_SIZE / 2) - (scaledWidth / 2) + position.x;
    const drawY = (DISPLAY_SIZE / 2) - (scaledHeight / 2) + position.y;

    ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    ctx.drawImage(image, drawX, drawY, scaledWidth, scaledHeight);
  }, [image, zoom, position]);

  // Handle apply - crop and return DataURL
  const handleApply = () => {
    if (!image || !canvasRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Calculate the scale to fit the image to the display size (cover mode)
    const scaleToDisplay = Math.max(DISPLAY_SIZE / image.width, DISPLAY_SIZE / image.height);
    // Scale from display size to crop size
    const scaleToCrop = CROP_SIZE / DISPLAY_SIZE;
    const scaledWidth = image.width * scaleToDisplay * zoom * scaleToCrop;
    const scaledHeight = image.height * scaleToDisplay * zoom * scaleToCrop;
    // Scale position to crop size
    const scaledPositionX = position.x * scaleToCrop;
    const scaledPositionY = position.y * scaleToCrop;
    const drawX = (CROP_SIZE / 2) - (scaledWidth / 2) + scaledPositionX;
    const drawY = (CROP_SIZE / 2) - (scaledHeight / 2) + scaledPositionY;
    ctx.drawImage(image, drawX, drawY, scaledWidth, scaledHeight);

    onApply(canvas.toDataURL('image/png', 0.9));
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Avatar" size="md">
      <div className="image-editor">
        {/* Info bar */}
        <div className="image-editor-info">
          <div className="image-editor-zoom-control">
            <ZoomIn size={14} className="image-editor-zoom-icon" />
            <input
              type="number"
              min={Math.round(minZoom * 100)}
              max={Math.round(MAX_ZOOM * 100)}
              value={zoomInput}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value >= minZoom && value <= MAX_ZOOM) {
                  setZoomInput(e.target.value);
                  setZoom(value);
                }
              }}
              onBlur={() => {
                setZoomInput(Math.round(zoom * 100).toString());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              className="image-editor-zoom-input"
            />
            <span className="image-editor-zoom-percent">%</span>
          </div>
          <button className="image-editor-reset-btn" onClick={resetTransform} title="Reset (Ctrl+R)">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Crop area */}
        <div
          className="image-editor-container"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <canvas ref={canvasRef} className="image-editor-canvas" width={DISPLAY_SIZE} height={DISPLAY_SIZE} />
          <div className="image-editor-crop-overlay" />
          <div className="image-editor-guides">
            <div className="image-editor-guide-h" />
            <div className="image-editor-guide-v" />
          </div>
        </div>

        {/* Zoom slider */}
        <div className="image-editor-slider-container">
          <span className="image-editor-slider-label">{minZoom.toFixed(2)}x</span>
          <input
            type="range"
            min={minZoom}
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setZoom(value);
              setZoomInput(Math.round(value * 100).toString());
            }}
            className="image-editor-slider"
          />
          <span className="image-editor-slider-label">3x</span>
        </div>

        {/* Actions */}
        <div className="image-editor-actions">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </Modal>
  );
}
