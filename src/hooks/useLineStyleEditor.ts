import { useState, useEffect, useCallback, useMemo } from "react";
import type Map from "ol/Map";
import type Feature from "ol/Feature";
import type { Select } from "ol/interaction";
import {
  supportsCustomLineStyle,
  DEFAULT_LINE_STYLE,
} from "@/utils/featureTypeUtils";

export interface UseLineStyleEditorReturn {
  // State
  lineColor: string;
  lineWidth: number;
  supportsLineStyle: boolean;
  isEditingLineStyle: boolean;

  // Actions
  handleColorChange: (color: string) => void;
  handleWidthChange: (width: number) => void;
  setLineColor: (color: string) => void;
  resetToOriginal: () => void;
  commitLineStyle: () => void;
}

export const useLineStyleEditor = (
  selectedFeature: Feature | null,
  map: Map | null,
  selectInteraction: Select | null,
  isEditing: boolean
): UseLineStyleEditorReturn => {
  const [lineColor, setLineColor] = useState<string>(DEFAULT_LINE_STYLE.color);
  const [lineWidth, setLineWidth] = useState<number>(DEFAULT_LINE_STYLE.width);
  const [originalLineColor, setOriginalLineColor] = useState<string>(
    DEFAULT_LINE_STYLE.color
  );
  const [originalLineWidth, setOriginalLineWidth] = useState<number>(
    DEFAULT_LINE_STYLE.width
  );
  const [isEditingLineStyle, setIsEditingLineStyle] = useState(false);

  // Check if selected feature supports custom line styling
  const supportsLineStyle = useMemo(() => {
    if (!selectedFeature) return false;
    return supportsCustomLineStyle(selectedFeature);
  }, [selectedFeature]);

  // Initialize line style when feature changes
  useEffect(() => {
    if (selectedFeature && supportsCustomLineStyle(selectedFeature)) {
      const color =
        selectedFeature.get("lineColor") || DEFAULT_LINE_STYLE.color;
      const width =
        selectedFeature.get("lineWidth") || DEFAULT_LINE_STYLE.width;
      setLineColor(color);
      setLineWidth(width);
      setOriginalLineColor(color);
      setOriginalLineWidth(width);
    } else {
      setLineColor(DEFAULT_LINE_STYLE.color);
      setLineWidth(DEFAULT_LINE_STYLE.width);
      setOriginalLineColor(DEFAULT_LINE_STYLE.color);
      setOriginalLineWidth(DEFAULT_LINE_STYLE.width);
    }
    setIsEditingLineStyle(false);
  }, [selectedFeature]);

  // Auto-set isEditingLineStyle when entering/exiting edit mode
  useEffect(() => {
    if (isEditing && supportsLineStyle) {
      setIsEditingLineStyle(true);
    } else {
      setIsEditingLineStyle(false);
    }
  }, [isEditing, supportsLineStyle]);

  // Handle line style editing mode - deselect feature when entering, restore when exiting
  useEffect(() => {
    if (!selectedFeature || !selectInteraction || !supportsLineStyle) return;

    if (isEditingLineStyle) {
      // Deselect feature to show actual styling without selection overlay
      selectInteraction.getFeatures().clear();
    } else {
      // Restore selection when exiting line style editing
      const features = selectInteraction.getFeatures();
      if (!features.getArray().includes(selectedFeature)) {
        features.push(selectedFeature);
      }
    }

    return () => {
      // Cleanup: restore selection on unmount
      if (!isEditingLineStyle && selectInteraction && selectedFeature) {
        const features = selectInteraction.getFeatures();
        if (!features.getArray().includes(selectedFeature)) {
          features.push(selectedFeature);
        }
      }
    };
  }, [isEditingLineStyle, selectedFeature, selectInteraction, supportsLineStyle]);

  // Handle immediate line color change with live preview
  const handleColorChange = useCallback(
    (color: string) => {
      setLineColor(color);
      if (selectedFeature) {
        selectedFeature.set("lineColor", color);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  // Handle dropdown color selection
  const setLineColorHandler = useCallback(
    (color: string) => {
      setLineColor(color);
      if (selectedFeature) {
        selectedFeature.set("lineColor", color);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  // Handle immediate line width change with live preview
  const handleWidthChange = useCallback(
    (width: number) => {
      setLineWidth(width);
      if (selectedFeature) {
        selectedFeature.set("lineWidth", width);
        selectedFeature.changed();
        map?.render();
      }
    },
    [selectedFeature, map]
  );

  const resetToOriginal = useCallback(() => {
    setLineColor(originalLineColor);
    setLineWidth(originalLineWidth);
    if (selectedFeature) {
      selectedFeature.set("lineColor", originalLineColor);
      selectedFeature.set("lineWidth", originalLineWidth);
      selectedFeature.changed();
      map?.render();
    }
  }, [selectedFeature, map, originalLineColor, originalLineWidth]);

  // Commit current values as new originals (call on save)
  const commitLineStyle = useCallback(() => {
    setOriginalLineColor(lineColor);
    setOriginalLineWidth(lineWidth);
  }, [lineColor, lineWidth]);

  return {
    lineColor,
    lineWidth,
    supportsLineStyle,
    isEditingLineStyle,
    handleColorChange,
    handleWidthChange,
    setLineColor: setLineColorHandler,
    resetToOriginal,
    commitLineStyle,
  };
};
