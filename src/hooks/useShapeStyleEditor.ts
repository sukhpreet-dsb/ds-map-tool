import { useState, useEffect, useCallback, useMemo } from "react";
import type Map from "ol/Map";
import type Feature from "ol/Feature";
import type { Select } from "ol/interaction";

export interface UseShapeStyleEditorReturn {
  // State
  strokeColor: string;
  fillColor: string;
  fillOpacity: number;
  supportsShapeStyle: boolean;
  isEditingShapeStyle: boolean;

  // Actions
  handleStrokeColorChange: (color: string) => void;
  handleFillColorChange: (color: string) => void;
  handleFillOpacityChange: (opacity: number) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  resetToOriginal: () => void;
  commitShapeStyle: () => void;
}

const DEFAULT_STROKE_COLOR = "#000000";
const DEFAULT_FILL_COLOR = "#ffffff";
const DEFAULT_FILL_OPACITY = 0;

export const useShapeStyleEditor = (
  selectedFeature: Feature | null,
  map: Map | null,
  selectInteraction: Select | null,
  isEditing: boolean
): UseShapeStyleEditorReturn => {
  const [strokeColor, setStrokeColor] = useState<string>(DEFAULT_STROKE_COLOR);
  const [fillColor, setFillColor] = useState<string>(DEFAULT_FILL_COLOR);
  const [fillOpacity, setFillOpacity] = useState<number>(DEFAULT_FILL_OPACITY);

  const [originalStrokeColor, setOriginalStrokeColor] = useState<string>(
    DEFAULT_STROKE_COLOR
  );
  const [originalFillColor, setOriginalFillColor] = useState<string>(
    DEFAULT_FILL_COLOR
  );
  const [originalFillOpacity, setOriginalFillOpacity] = useState<number>(
    DEFAULT_FILL_OPACITY
  );
  const [isEditingShapeStyle, setIsEditingShapeStyle] = useState(false);

  // Check if selected feature is a Box or Circle
  const supportsShapeStyle = useMemo(() => {
    if (!selectedFeature) return false;
    return (
      selectedFeature.get("isBox") || selectedFeature.get("isCircle")
    );
  }, [selectedFeature]);

  // Initialize shape style when feature changes
  useEffect(() => {
    if (selectedFeature && supportsShapeStyle) {
      const strokeColor =
        selectedFeature.get("strokeColor") || DEFAULT_STROKE_COLOR;
      const fillColor =
        selectedFeature.get("fillColor") || DEFAULT_FILL_COLOR;
      const fillOpacity =
        selectedFeature.get("fillOpacity") !== undefined
          ? selectedFeature.get("fillOpacity")
          : DEFAULT_FILL_OPACITY;

      setStrokeColor(strokeColor);
      setFillColor(fillColor);
      setFillOpacity(fillOpacity);
      setOriginalStrokeColor(strokeColor);
      setOriginalFillColor(fillColor);
      setOriginalFillOpacity(fillOpacity);
    } else {
      setStrokeColor(DEFAULT_STROKE_COLOR);
      setFillColor(DEFAULT_FILL_COLOR);
      setFillOpacity(DEFAULT_FILL_OPACITY);
      setOriginalStrokeColor(DEFAULT_STROKE_COLOR);
      setOriginalFillColor(DEFAULT_FILL_COLOR);
      setOriginalFillOpacity(DEFAULT_FILL_OPACITY);
    }
    setIsEditingShapeStyle(false);
  }, [selectedFeature, supportsShapeStyle]);

  // Auto-set isEditingShapeStyle when entering/exiting edit mode
  useEffect(() => {
    if (isEditing && supportsShapeStyle) {
      setIsEditingShapeStyle(true);
    } else {
      setIsEditingShapeStyle(false);
    }
  }, [isEditing, supportsShapeStyle]);

  // Handle shape style editing mode - deselect feature when entering, restore when exiting
  useEffect(() => {
    if (!selectedFeature || !selectInteraction || !supportsShapeStyle) return;

    if (isEditingShapeStyle) {
      // Deselect feature to show actual styling without selection overlay
      selectInteraction.getFeatures().clear();
    } else {
      // Restore selection when exiting shape style editing
      const features = selectInteraction.getFeatures();
      if (!features.getArray().includes(selectedFeature)) {
        features.push(selectedFeature);
      }
    }

    return () => {
      // Cleanup: restore selection on unmount
      if (!isEditingShapeStyle && selectInteraction && selectedFeature) {
        const features = selectInteraction.getFeatures();
        if (!features.getArray().includes(selectedFeature)) {
          features.push(selectedFeature);
        }
      }
    };
  }, [isEditingShapeStyle, selectedFeature, selectInteraction, supportsShapeStyle]);

  // Handle immediate stroke color change with live preview
  const handleStrokeColorChange = useCallback(
    (color: string) => {
      setStrokeColor(color);
      if (selectedFeature) {
        selectedFeature.set("strokeColor", color);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  // Handle immediate fill color change with live preview
  const handleFillColorChange = useCallback(
    (color: string) => {
      setFillColor(color);
      if (selectedFeature) {
        selectedFeature.set("fillColor", color);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  // Handle immediate fill opacity change with live preview
  const handleFillOpacityChange = useCallback(
    (opacity: number) => {
      setFillOpacity(opacity);
      if (selectedFeature) {
        selectedFeature.set("fillOpacity", opacity);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  // Handle dropdown stroke color selection
  const setStrokeColorHandler = useCallback(
    (color: string) => {
      setStrokeColor(color);
      if (selectedFeature) {
        selectedFeature.set("strokeColor", color);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  // Handle dropdown fill color selection
  const setFillColorHandler = useCallback(
    (color: string) => {
      setFillColor(color);
      if (selectedFeature) {
        selectedFeature.set("fillColor", color);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  const resetToOriginal = useCallback(() => {
    setStrokeColor(originalStrokeColor);
    setFillColor(originalFillColor);
    setFillOpacity(originalFillOpacity);
    if (selectedFeature) {
      selectedFeature.set("strokeColor", originalStrokeColor);
      selectedFeature.set("fillColor", originalFillColor);
      selectedFeature.set("fillOpacity", originalFillOpacity);
      selectedFeature.changed();
      map?.render();
    }
  }, [selectedFeature, map, originalStrokeColor, originalFillColor, originalFillOpacity]);

  // Commit current values as new originals (call on save)
  const commitShapeStyle = useCallback(() => {
    setOriginalStrokeColor(strokeColor);
    setOriginalFillColor(fillColor);
    setOriginalFillOpacity(fillOpacity);
  }, [strokeColor, fillColor, fillOpacity]);

  return {
    strokeColor,
    fillColor,
    fillOpacity,
    supportsShapeStyle,
    isEditingShapeStyle,
    handleStrokeColorChange,
    handleFillColorChange,
    handleFillOpacityChange,
    setStrokeColor: setStrokeColorHandler,
    setFillColor: setFillColorHandler,
    resetToOriginal,
    commitShapeStyle,
  };
};
