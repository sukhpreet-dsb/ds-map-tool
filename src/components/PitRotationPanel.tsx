import React from 'react';
import { X } from 'lucide-react';

interface PitRotationPanelProps {
  rotation: number;
  scale: number;
  onRotationChange: (angle: number) => void;
  onScaleChange: (scale: number) => void;
  onClose: () => void;
}

const PitRotationPanel: React.FC<PitRotationPanelProps> = ({
  rotation,
  scale,
  onRotationChange,
  onScaleChange,
  onClose,
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Transform Pit Icon</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          title="Close transform panel"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Rotation Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">Rotation</h4>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Angle:</span>
          <span className="font-mono font-medium">{rotation}°</span>
        </div>

        <div className="relative">
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => onRotationChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${rotation / 3.6}%, #e5e7eb ${rotation / 3.6}%, #e5e7eb 100%)`
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0°</span>
          <span>90°</span>
          <span>180°</span>
          <span>270°</span>
          <span>360°</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onRotationChange(0)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => onRotationChange(45)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            45°
          </button>
          <button
            onClick={() => onRotationChange(90)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            90°
          </button>
        </div>
        </div>

        {/* Scale Controls */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-600">Scale</h4>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Size:</span>
            <span className="font-mono font-medium">{scale.toFixed(1)}x</span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={scale}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              style={{
                background: `linear-gradient(to right, #16a34a 0%, #16a34a ${((scale - 0.5) / 2.5) * 100}%, #e5e7eb ${((scale - 0.5) / 2.5) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
            <span>3.0x</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onScaleChange(0.5)}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              0.5x
            </button>
            <button
              onClick={() => onScaleChange(1.0)}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              1.0x
            </button>
            <button
              onClick={() => onScaleChange(1.5)}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              1.5x
            </button>
            <button
              onClick={() => onScaleChange(2.0)}
              className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              2.0x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitRotationPanel;