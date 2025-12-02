import React, { useEffect, useRef, useState } from "react";
import { Vector as VectorSource } from "ol/source";
import { Feature } from "ol";
import type { Geometry } from "ol/geom";
import type { Extent } from "ol/extent";
import type Map from "ol/Map";
import GeoJSON from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import JSZip from "jszip";
import { MapViewToggle } from "./MapViewToggle";
import { LoadingOverlay } from "./LoadingOverlay";
import Toolbar from "./ToolBar";
import FileManager from "./FileManager";
import MapInstance from "./MapInstance";
import MapInteractions from "./MapInteractions";
import ToolManager from "./ToolManager";
import { useMapState } from "@/hooks/useMapState";
import { useToolState } from "@/hooks/useToolState";
import { useFeatureState } from "@/hooks/useFeatureState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { cloneFeature, offsetFeature } from "@/utils/interactionUtils";
import { Select } from "ol/interaction";
import {
  convertFeaturesToGeoJSON,
  convertGeoJSONToFeatures,
  isEmptyExtent,
} from "@/utils/serializationUtils";
import { fitMapToFeatures, restoreMapView } from "@/utils/mapStateUtils";
import { JobSelection } from "./JobSelection";
import { useMapProjects } from "@/hooks/useMapProjects";

// Interface for properly serializable map data
interface SerializedMapData {
  features: any; // GeoJSON FeatureCollection - using any to avoid type issues
  mapState?: {
    center: [number, number];
    zoom: number;
    viewMode: "osm" | "satellite";
  };
}

const MapEditor: React.FC = () => {
  // Core map references
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef(new VectorSource());
  const vectorLayerRef = useRef<any>(null);
  const [interactionReady, setInteractionReady] = useState(false);
  const isProjectReadyRef = useRef(false);

  const {
    projects,
    currentProjectId,
    currentDb,
    loadProject,
    saveMapState: saveToDb,
    loadMapState: loadFromDb,
  } = useMapProjects();

  // Custom hooks
  const {
    currentMapView,
    isTransitioning,
    osmLayerRef,
    satelliteLayerRef,
    handleMapViewChange,
  } = useMapState();

  const { activeTool, selectedLegend, setActiveTool, handleLegendSelect } =
    useToolState();

  const {
    selectedFeature,
    setSelectedFeature,
    clipboardState,
    setCopiedFeatures,
    clearClipboard,
  } = useFeatureState();

  const selectInteractionRef = useRef<Select | null>(null);
  const undoRedoInteractionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File import handler
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) return;

      let features: Feature<Geometry>[] = [];

      try {
        if (name.endsWith(".geojson") || name.endsWith(".json")) {
          const json = JSON.parse(data as string);
          features = new GeoJSON().readFeatures(json, {
            featureProjection: "EPSG:3857",
          });
        } else if (name.endsWith(".kml")) {
          features = new KML({ extractStyles: false }).readFeatures(data, {
            featureProjection: "EPSG:3857",
          });
        } else if (name.endsWith(".kmz")) {
          const zip = await JSZip.loadAsync(file);
          const kmlFile = Object.keys(zip.files).find((f) =>
            f.toLowerCase().endsWith(".kml")
          );
          if (kmlFile) {
            const kmlText = await zip.file(kmlFile)?.async("text");
            if (kmlText) {
              features = new KML({ extractStyles: false }).readFeatures(
                kmlText,
                {
                  featureProjection: "EPSG:3857",
                }
              );
            }
          }
        }

        if (features.length === 0) {
          alert("No valid features found in the file.");
          return;
        }

        vectorSourceRef.current.clear();
        vectorSourceRef.current.addFeatures(features);

        const extent: Extent = vectorSourceRef.current.getExtent();
        if (mapRef.current) {
          fitMapToFeatures(mapRef.current, extent);
        }

        await saveMapState();
      } catch (err) {
        alert("Invalid or unsupported file format.");
      }
    };

    if (name.endsWith(".kmz")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Map initialization
  const handleMapReady = (map: Map) => {
    mapRef.current = map;
  };

  const handleToolActivation = (toolId: string) => {
    setActiveTool(toolId);
  };

  const handleDelete = () => {
    if (selectedFeature) {
      vectorSourceRef.current.removeFeature(selectedFeature);
      setSelectedFeature(null);
      saveMapState();
    } else {
      alert("Please select a feature to delete.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopyOperation = (
    features: Feature<Geometry>[],
    isCut: boolean
  ) => {
    setCopiedFeatures(features, isCut);
  };

  const handlePasteOperation = (
    _features: Feature<Geometry>[],
    coordinates: number[] // target center coordinate for paste
  ) => {
    const pastedFeatures: Feature<Geometry>[] = [];

    const originals = _features;
    if (originals.length === 0) return;

    // 1. Determine a reference point for the group —
    //    here: center of bounding box of first (or you can also compute bounding box of all)
    const refGeom = originals[0].getGeometry();
    if (!refGeom) return;
    const refExtent = refGeom.getExtent();
    const refCenter: [number, number] = [
      (refExtent[0] + refExtent[2]) / 2,
      (refExtent[1] + refExtent[3]) / 2,
    ];

    // 2. Compute how much to shift the *group* so refCenter goes to the user-specified coordinates
    const offsetX = coordinates[0] - refCenter[0];
    const offsetY = coordinates[1] - refCenter[1];

    originals.forEach((originalFeature) => {
      const clone = originalFeature.clone();
      const geom = clone.getGeometry();
      if (geom) {
        // Translate geometry by the group offset
        geom.translate(offsetX, offsetY);
        clone.setGeometry(geom);
      }
      vectorSourceRef.current.addFeature(clone);
      pastedFeatures.push(clone);
    });

    if (pastedFeatures.length > 0) {
      setSelectedFeature(pastedFeatures[0]);
    }

    if (clipboardState.isCutOperation) {
      clearClipboard();
    }
  };

  const handleSelectInteractionReady = (selectInteraction: Select | null) => {
    selectInteractionRef.current = selectInteraction;
  };

  const handleUndoInteractionReady = (undoInteraction: any) => {
    undoRedoInteractionRef.current = undoInteraction;
    setInteractionReady(true);
  };

  const handleUndoOperation = () => {
    if (undoRedoInteractionRef.current?.hasUndo()) {
      undoRedoInteractionRef.current.undo();
    }
  };

  // ✅ SAVE to isolated DB
  const saveMapState = async () => {
    if (!isProjectReadyRef.current) {
      console.warn("Project not ready for saving, skipping");
      return;
    }

    if (!mapRef.current) return;

    try {
      const mapData: SerializedMapData = {
        features: convertFeaturesToGeoJSON(vectorSourceRef.current),
        mapState: {
          center: mapRef.current.getView().getCenter() as [number, number],
          zoom: mapRef.current.getView().getZoom() || 0,
          viewMode: currentMapView,
        },
      };

      await saveToDb(mapData);
      console.log("Saved to isolated DB");
    } catch (error) {
      console.error("Failed to save map state:", error);
    }
  };

  // ✅ LOAD from isolated DB
  const handleLoadMapState = async () => {
    try {
      // 1. ALWAYS clear the map first!
      // This ensures old project data is removed even if the new project is empty
      vectorSourceRef.current.clear();

      const mapData = await loadFromDb();
      if (mapData?.features) {
        // vectorSourceRef.current.clear();
        const features = convertGeoJSONToFeatures(mapData.features);
        vectorSourceRef.current.addFeatures(features);

        const extent = vectorSourceRef.current.getExtent();
        if (!isEmptyExtent(extent) && mapRef.current) {
          fitMapToFeatures(mapRef.current, extent);
        }
      }
      if (mapData?.mapState && mapRef.current) {
        restoreMapView(mapRef.current, mapData.mapState, handleMapViewChange);
      }
      console.log("Map state loaded");
    } catch (error) {
      console.error("Failed to load map state:", error);
    }
  };

  // Update ready flag
  useEffect(() => {
    if (currentProjectId && currentDb && interactionReady) {
      isProjectReadyRef.current = true;
      console.log("Project is ready for saving");
    } else {
      isProjectReadyRef.current = false;
    }
  }, [currentProjectId, currentDb, interactionReady]);

  // Load map state when project changes
  useEffect(() => {
    if (!currentProjectId || !currentDb) {
      console.log("Waiting for project to load...");
      return;
    }

    console.log("Project loaded, loading map state");
    handleLoadMapState();
  }, [currentProjectId, currentDb]);

  // Setup auto-save listeners
  useEffect(() => {
    if (!interactionReady || !currentProjectId || !currentDb) {
      console.log("Waiting for project to be ready...");
      return;
    }

    console.log("Setting up auto-save listeners");

    const onStackAdd = () => {
      console.log("Feature added to stack");
      saveMapState();
    };
    const onUndo = () => {
      console.log("Undo operation performed");
      saveMapState();
    };
    const onRedo = () => {
      console.log("Redo operation performed");
      saveMapState();
    };

    undoRedoInteractionRef.current?.on("stack:add", onStackAdd);
    undoRedoInteractionRef.current?.on("undo", onUndo);
    undoRedoInteractionRef.current?.on("redo", onRedo);

    return () => {
      undoRedoInteractionRef.current?.un("stack:add", onStackAdd);
      undoRedoInteractionRef.current?.un("undo", onUndo);
      undoRedoInteractionRef.current?.un("redo", onRedo);
    };
  }, [interactionReady, currentProjectId, currentDb, currentMapView]);

  const handleRedoOperation = () => {
    if (undoRedoInteractionRef.current?.hasRedo()) {
      undoRedoInteractionRef.current.redo();
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    map: mapRef.current,
    vectorSource: vectorSourceRef.current,
    selectInteraction: selectInteractionRef.current,
    clipboardFeatures: clipboardState.copiedFeatures,
    onCopyOperation: handleCopyOperation,
    onPasteOperation: handlePasteOperation,
    onSetActiveTool: setActiveTool,
    onUndoOperation: handleUndoOperation,
    onRedoOperation: handleRedoOperation,
    disabled: false,
  });

  return (
    <div>
      <MapInstance
        onMapReady={handleMapReady}
        osmLayerRef={osmLayerRef}
        satelliteLayerRef={satelliteLayerRef}
        vectorLayerRef={vectorLayerRef}
        vectorSourceRef={vectorSourceRef}
      />

      <MapInteractions
        map={mapRef.current}
        vectorLayer={vectorLayerRef.current}
        activeTool={activeTool}
        onFeatureSelect={setSelectedFeature}
        clipboardFeatures={clipboardState.copiedFeatures}
        onCopyFeatures={handleCopyOperation}
        onPasteFeatures={handlePasteOperation}
        onSelectInteractionReady={handleSelectInteractionReady}
        onUndoInteractionReady={handleUndoInteractionReady}
      />

      <ToolManager
        map={mapRef.current}
        vectorSource={vectorSourceRef.current}
        activeTool={activeTool}
        selectedLegend={selectedLegend}
        onToolChange={setActiveTool}
      />

      <Toolbar
        onFileImport={handleImportClick}
        onDeleteFeature={handleDelete}
        onToolActivate={handleToolActivation}
        activeTool={activeTool}
        selectedLegend={selectedLegend}
        onLegendSelect={handleLegendSelect}
      />

      <FileManager
        map={mapRef.current}
        vectorSource={vectorSourceRef.current}
        fileInputRef={fileInputRef}
      />

      <input
        type="file"
        accept=".geojson,.json,.kml,.kmz"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <JobSelection
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={loadProject}
      />

      <LoadingOverlay
        isVisible={isTransitioning}
        message="Switching map view..."
      />
      <MapViewToggle
        currentView={currentMapView}
        onViewChange={handleMapViewChange}
      />
    </div>
  );
};

export default MapEditor;
