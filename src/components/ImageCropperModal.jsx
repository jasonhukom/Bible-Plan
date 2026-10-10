import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';

export default function ImageCropperModal({ imageSrc, onCropComplete, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cal-overlay" style={{ zIndex: 100 }}>
      <div className="cal-popup" style={{ maxWidth: 500, width: "90%", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ margin: 0, textAlign: "center" }}>Crop Profile Picture</h2>
        <div style={{ position: 'relative', width: '100%', height: 300, background: '#333', borderRadius: 8, overflow: 'hidden' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ color: "var(--ink-soft)", fontSize: 14 }}>Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            style={{ flex: 1, accentColor: "var(--gold)" }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button className="btn btn-ghost" type="button" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn" type="button" onClick={handleSave} disabled={isProcessing} style={{ flex: 1 }}>
            {isProcessing ? "Processing…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
