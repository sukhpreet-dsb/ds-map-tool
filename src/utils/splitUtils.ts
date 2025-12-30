import Feature from "ol/Feature";
import type { Geometry, LineString } from "ol/geom";
import { getLength } from "ol/sphere";

/**
 * Check if a feature is splittable
 * LineString features except Arrow can be split (including Measure)
 */
export const isSplittableFeature = (feature: Feature<Geometry>): boolean => {
  const geometry = feature.getGeometry();

  // Only LineString geometries can be split
  if (!geometry || geometry.getType() !== "LineString") {
    return false;
  }

  // Exclude arrow features
  if (feature.get("isArrow")) {
    return false;
  }

  return true;
};

/**
 * Copy all properties from original feature to split features
 * Preserves styling, names, and custom properties
 * For measure features, recalculates distance for each split segment
 */
export const copyFeatureProperties = (
  original: Feature<Geometry>,
  splitFeatures: Feature<Geometry>[]
): void => {
  const properties = original.getProperties();
  const isMeasure = original.get("isMeasure");

  // Remove geometry from properties as each split feature has its own geometry
  const { geometry, ...otherProps } = properties;

  splitFeatures.forEach((feature, index) => {
    // Copy all properties to the split feature
    Object.entries(otherProps).forEach(([key, value]) => {
      feature.set(key, value);
    });

    // Append index to name if original has a name (for distinction)
    const originalName = original.get("name");
    if (originalName) {
      feature.set("name", `${originalName} (${index + 1})`);
    }

    // Recalculate distance for measure features
    if (isMeasure) {
      const geom = feature.getGeometry() as LineString;
      if (geom) {
        const length = getLength(geom);
        feature.set("distance", length);
      }
    }
  });
};
