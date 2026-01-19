import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useHiddenFeaturesStore } from "@/stores/useHiddenFeaturesStore";
import { Vector as VectorSource } from "ol/source";
import type { Feature } from "ol";
import type { Geometry } from "ol/geom";
import type { LucideIcon } from "lucide-react";
import {
  Eye,
  EyeOff,
  Trash2,
  ArrowUp,
  Slash,
  Type,
  Ruler,
  Minus,
  MapPin,
  Circle,
  Square,
  Spline,
  Cloud,
  Layers,
  CircleDot,
  Radio,
  Triangle,
  GitBranch,
} from "lucide-react";

interface SeparateFeaturesProps {
  vectorSource: VectorSource<Feature<Geometry>>;
  onSaveMapState: () => void;
}

// Get appropriate icon based on feature type
function getFeatureIcon(feature: Feature<Geometry>): LucideIcon {
  if (feature.get("isArrow")) return ArrowUp;
  if (feature.get("isPolyline")) return Slash;
  if (feature.get("isFreehand")) return Slash;
  if (feature.get("isText")) return Type;
  if (feature.get("isMeasure")) return Ruler;
  if (feature.get("islegends")) return Minus;
  if (feature.get("isTriangle")) return Triangle;
  if (feature.get("isPit")) return CircleDot;
  if (feature.get("isGP")) return MapPin;
  if (feature.get("isJunction")) return GitBranch;
  if (feature.get("isTower")) return Radio;
  if (feature.get("isIcon")) return MapPin;
  if (feature.get("isBox")) return Square;
  if (feature.get("isCircle")) return Circle;
  if (feature.get("isArc")) return Spline;
  if (feature.get("isRevisionCloud")) return Cloud;
  if (feature.get("isPoint")) return MapPin;

  // Default based on geometry type
  const geomType = feature.getGeometry()?.getType();
  if (geomType === "Point") return MapPin;
  if (geomType === "LineString" || geomType === "MultiLineString") return Slash;
  if (geomType === "Polygon" || geomType === "MultiPolygon") return Square;
  return Circle;
}

// Get feature type name for display
function getFeatureTypeName(feature: Feature<Geometry>): string {
  if (feature.get("isArrow")) return "Arrow";
  if (feature.get("isPolyline")) return "Polyline";
  if (feature.get("isFreehand")) return "Freehand";
  if (feature.get("isText")) return "Text";
  if (feature.get("isMeasure")) return "Measure";
  if (feature.get("islegends")) return "Legend";
  if (feature.get("isTriangle")) return "Triangle";
  if (feature.get("isPit")) return "Pit";
  if (feature.get("isGP")) return "GP";
  if (feature.get("isJunction")) return "Junction";
  if (feature.get("isTower")) return "Tower";
  if (feature.get("isIcon")) return "Icon";
  if (feature.get("isBox")) return "Box";
  if (feature.get("isCircle")) return "Circle";
  if (feature.get("isArc")) return "Arc";
  if (feature.get("isRevisionCloud")) return "RevCloud";
  if (feature.get("isPoint")) return "Point";

  // Default based on geometry type
  const geomType = feature.getGeometry()?.getType();
  if (geomType === "Point") return "Point";
  if (geomType === "LineString") return "Line";
  if (geomType === "Polygon") return "Polygon";
  return "Feature";
}

// Get display name for feature
function getFeatureName(feature: Feature<Geometry>): string {
  const name = feature.get("name");
  if (name) return name;

  // Generate default name based on type and ID
  const typeName = getFeatureTypeName(feature);
  const uid = (feature as any).ol_uid;
  return `${typeName} ${uid}`;
}

// Get unique ID for feature
function getFeatureId(feature: Feature<Geometry>): string {
  return String((feature as any).ol_uid);
}

export function SeparateFeatures({
  vectorSource,
  onSaveMapState,
}: SeparateFeaturesProps) {
  const [features, setFeatures] = useState<Feature<Geometry>[]>([]);
  const { hiddenFeatureIds, toggleFeature, removeFeatureId } =
    useHiddenFeaturesStore();

  // Update features list from vector source
  const updateFeatures = useCallback(() => {
    const allFeatures = vectorSource.getFeatures();
    setFeatures([...allFeatures]);
  }, [vectorSource]);

  // Listen to vector source changes
  useEffect(() => {
    // Initial load
    updateFeatures();

    // Listen for feature changes
    const onAddFeature = () => updateFeatures();
    const onRemoveFeature = () => updateFeatures();
    const onClear = () => {
      setFeatures([]);
    };

    vectorSource.on("addfeature", onAddFeature);
    vectorSource.on("removefeature", onRemoveFeature);
    vectorSource.on("clear", onClear);

    return () => {
      vectorSource.un("addfeature", onAddFeature);
      vectorSource.un("removefeature", onRemoveFeature);
      vectorSource.un("clear", onClear);
    };
  }, [vectorSource, updateFeatures]);

  // Handle visibility toggle
  const handleToggleVisibility = (feature: Feature<Geometry>) => {
    const featureId = getFeatureId(feature);
    toggleFeature(featureId);
  };

  // Handle delete
  const handleDelete = (feature: Feature<Geometry>) => {
    const featureId = getFeatureId(feature);
    // Remove from hidden set if it was hidden
    removeFeatureId(featureId);
    // Remove from vector source (this triggers UndoRedo tracking)
    vectorSource.removeFeature(feature);
    // Save state to database
    onSaveMapState();
  };

  return (
    <Sheet>
      <SheetTrigger asChild className="absolute left-32 bottom-2">
        <Button variant="outline" className="gap-2">
          <Layers className="size-4" />
          Features
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Layers className="size-5" />
            Features ({features.length})
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
          {features.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No features yet. Draw or import features to see them here.
            </div>
          ) : (
            features.map((feature) => {
              const featureId = getFeatureId(feature);
              const Icon = getFeatureIcon(feature);
              const name = getFeatureName(feature);
              const isHidden = hiddenFeatureIds.has(featureId);

              return (
                <div
                  key={featureId}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent group ${
                    isHidden ? "opacity-50" : ""
                  }`}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span
                    className="flex-1 text-sm truncate"
                    title={name}
                  >
                    {name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleToggleVisibility(feature)}
                      title={isHidden ? "Show feature" : "Hide feature"}
                    >
                      {isHidden ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(feature)}
                      title="Delete feature"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
