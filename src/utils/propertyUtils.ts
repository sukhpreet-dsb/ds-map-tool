import type Feature from "ol/Feature";
import { extractCoordinates } from "./coordinateUtils";

export interface CustomProperty {
  id: string;
  key: string;
  value: string;
}

/** Properties that cannot have their key changed */
export const PROTECTED_PROPERTY_KEYS = ["name", "long", "lat"] as const;

/**
 * Check if a property key is protected (cannot be deleted or renamed)
 */
export const isProtectedProperty = (key: string): boolean => {
  return PROTECTED_PROPERTY_KEYS.includes(
    key as (typeof PROTECTED_PROPERTY_KEYS)[number]
  );
};

/**
 * Check if a property should be excluded from display
 */
const shouldExcludeProperty = (key: string): boolean => {
  if (key.startsWith("is")) return true;
  if (key === "nonEditable") return true;
  if (key.startsWith("_")) return true;
  if (key === "name") return true;
  return false;
};

/**
 * Extracts all displayable properties from a feature.
 * Includes coordinates (name, long, lat) and custom properties.
 */
export const extractAllProperties = (feature: Feature): CustomProperty[] => {
  const coords = extractCoordinates(feature);
  const properties = feature.getProperties();
  delete properties.geometry;

  const allProperties: CustomProperty[] = [];
  const geometry = feature.getGeometry();
  const geometryType = geometry?.getType();

  // Add name first
  allProperties.push({ id: "prop-name", key: "name", value: coords.name });

  // Add lon/lat for all features except LineString
  if (geometryType !== "LineString") {
    allProperties.push(
      { id: "prop-long", key: "long", value: coords.long },
      { id: "prop-lat", key: "lat", value: coords.lat }
    );
  }

  // Add custom properties (filtered)
  const filteredEntries = Object.entries(properties).filter(
    ([key]) => !shouldExcludeProperty(key)
  );

  filteredEntries.forEach(([key, value], index) => {
    allProperties.push({
      id: `prop-${index}-${Date.now()}`,
      key,
      value: String(value),
    });
  });

  return allProperties;
};

/**
 * Applies properties to a feature, including coordinate updates.
 */
export const applyPropertiesToFeature = (
  feature: Feature,
  properties: CustomProperty[],
  updateCoordinates: (lon: number, lat: number, name: string) => void
): void => {
  // Extract coordinates from properties
  const nameProp = properties.find((p) => p.key === "name");
  const longProp = properties.find((p) => p.key === "long");
  const latProp = properties.find((p) => p.key === "lat");

  // Update coordinates if they exist
  if (longProp && latProp) {
    const lon = parseFloat(longProp.value);
    const lat = parseFloat(latProp.value);
    if (!isNaN(lon) && !isNaN(lat)) {
      updateCoordinates(lon, lat, nameProp?.value || "");
    }
  } else if (nameProp) {
    // Update name only
    if (nameProp.value.trim()) {
      feature.set("name", nameProp.value.trim());
    } else {
      feature.unset("name");
    }
  }

  // Clear existing custom properties
  const currentProperties = feature.getProperties();
  Object.keys(currentProperties).forEach((key) => {
    if (
      !key.startsWith("is") &&
      key !== "geometry" &&
      key !== "name" &&
      key !== "nonEditable" &&
      !key.startsWith("_")
    ) {
      feature.unset(key);
    }
  });

  // Set new custom properties
  properties.forEach((prop) => {
    if (
      prop.key.trim() &&
      prop.value.trim() &&
      !isProtectedProperty(prop.key)
    ) {
      feature.set(prop.key.trim(), prop.value.trim());
    }
  });
};

/**
 * Creates a new empty custom property
 */
export const createEmptyProperty = (): CustomProperty => ({
  id: `prop-new-${Date.now()}`,
  key: "",
  value: "",
});
