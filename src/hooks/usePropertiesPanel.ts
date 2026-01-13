import { useState, useEffect, useCallback } from "react";
import type Map from "ol/Map";
import type Feature from "ol/Feature";
import {
  extractCoordinates,
  updateFeatureCoordinates,
  type CoordinateState,
} from "@/utils/coordinateUtils";
import {
  extractAllProperties,
  applyPropertiesToFeature,
  createEmptyProperty,
  type CustomProperty,
} from "@/utils/propertyUtils";

export interface UsePropertiesPanelReturn {
  // State
  coordinates: CoordinateState;
  customProperties: CustomProperty[];
  isEditing: boolean;

  // Actions
  setIsEditing: (editing: boolean) => void;
  updateProperty: (id: string, field: "key" | "value", value: string) => void;
  addProperty: () => void;
  deleteProperty: (id: string) => void;
  save: () => void;
  cancel: () => void;
}

const EMPTY_COORDINATES: CoordinateState = { long: "", lat: "", name: "" };

export const usePropertiesPanel = (
  selectedFeature: Feature | null,
  map: Map | null,
  onSave?: () => void
): UsePropertiesPanelReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const [coordinates, setCoordinates] =
    useState<CoordinateState>(EMPTY_COORDINATES);
  const [originalCoordinates, setOriginalCoordinates] =
    useState<CoordinateState>(EMPTY_COORDINATES);
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>(
    []
  );
  const [originalCustomProperties, setOriginalCustomProperties] = useState<
    CustomProperty[]
  >([]);

  // Sync state when selected feature changes
  useEffect(() => {
    if (selectedFeature) {
      const coords = extractCoordinates(selectedFeature);
      const properties = extractAllProperties(selectedFeature);
      setCoordinates(coords);
      setOriginalCoordinates(coords);
      setCustomProperties(properties);
      setOriginalCustomProperties(properties);
      setIsEditing(false);
    } else {
      setCoordinates(EMPTY_COORDINATES);
      setOriginalCoordinates(EMPTY_COORDINATES);
      setCustomProperties([]);
      setOriginalCustomProperties([]);
      setIsEditing(false);
    }
  }, [selectedFeature]);

  const updateProperty = useCallback(
    (id: string, field: "key" | "value", value: string) => {
      setCustomProperties((prev) =>
        prev.map((prop) =>
          prop.id === id ? { ...prop, [field]: value } : prop
        )
      );
    },
    []
  );

  const addProperty = useCallback(() => {
    setCustomProperties((prev) => [...prev, createEmptyProperty()]);
  }, []);

  const deleteProperty = useCallback((id: string) => {
    setCustomProperties((prev) => prev.filter((prop) => prop.id !== id));
  }, []);

  const save = useCallback(() => {
    if (!selectedFeature || !map) return;

    // Apply properties to feature
    applyPropertiesToFeature(
      selectedFeature,
      customProperties,
      (lon, lat, name) => {
        updateFeatureCoordinates(selectedFeature, map, lon, lat, name);
      }
    );

    // Update original state
    setOriginalCustomProperties(customProperties);

    // Update coordinates state for consistency
    const nameProp = customProperties.find((p) => p.key === "name");
    const longProp = customProperties.find((p) => p.key === "long");
    const latProp = customProperties.find((p) => p.key === "lat");

    if (longProp && latProp) {
      const newCoords = {
        name: nameProp?.value || "",
        long: longProp.value,
        lat: latProp.value,
      };
      setOriginalCoordinates(newCoords);
      setCoordinates(newCoords);
    }

    onSave?.();
    setIsEditing(false);
  }, [selectedFeature, map, customProperties, onSave]);

  const cancel = useCallback(() => {
    setCoordinates(originalCoordinates);
    setCustomProperties(originalCustomProperties);
    setIsEditing(false);
  }, [originalCoordinates, originalCustomProperties]);

  return {
    coordinates,
    customProperties,
    isEditing,
    setIsEditing,
    updateProperty,
    addProperty,
    deleteProperty,
    save,
    cancel,
  };
};
