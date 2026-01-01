import { useEffect, useRef, useState, type ChangeEvent } from "react";
import * as fabric from "fabric";
import {
  LayoutToolbar,
  LayoutCanvas,
  LayoutPropertiesPanel,
  SaveLayoutDialog,
  ZoomControls,
  PAGE_SIZES,
  type ToolType,
  type PageSize,
} from "@/components/layout";
import { ArrowLeft, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useParams, useNavigate } from "react-router";
import { useLayoutStore } from "@/stores/layoutStore";

export default function LayoutEditor() {
  const { layoutId } = useParams<{ layoutId: string }>();
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [selectedObject, setSelectedObject] =
    useState<fabric.FabricObject | null>(null);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(
    layoutId ?? null
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [zoom, setZoom] = useState(100);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync URL param to state when navigating between layouts
  useEffect(() => {
    setCurrentLayoutId(layoutId ?? null);
  }, [layoutId]);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLayout = useLayoutStore((state) => state.addLayout);
  const updateLayout = useLayoutStore((state) => state.updateLayout);
  const getLayout = useLayoutStore((state) => state.getLayout);

  // Get the current layout if editing existing
  const currentLayout = currentLayoutId ? getLayout(currentLayoutId) : null;
  useEffect(()=>{
    if(currentLayout){
      setEditingName(currentLayout?.name)
    }
  },[currentLayout])

  // Delete keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricRef.current) return;

      // Don't delete if editing text
      const activeObj = fabricRef.current.getActiveObject();
      if (
        activeObj?.type === "i-text" &&
        (activeObj as fabric.IText).isEditing
      ) {
        return;
      }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = fabricRef.current.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach((obj) => fabricRef.current?.remove(obj));
          fabricRef.current.discardActiveObject();
          fabricRef.current.requestRenderAll();
          setSelectedObject(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePropertyChange = (key: string, value: unknown) => {
    const canvas = fabricRef.current;
    const activeObj = canvas?.getActiveObject();

    if (activeObj) {
      activeObj.set(key as keyof fabric.FabricObject, value);
      canvas?.requestRenderAll();
    }
  };

  const handleDeleteSelected = () => {
    const canvas = fabricRef.current;
    const activeObjects = canvas?.getActiveObjects();
    if (activeObjects?.length) {
      activeObjects.forEach((obj) => canvas?.remove(obj));
      canvas?.discardActiveObject();
      canvas?.requestRenderAll();
      setSelectedObject(null);
    }
  };

  const handleClear = () => {
    fabricRef.current?.clear();
    if (fabricRef.current) {
      fabricRef.current.backgroundColor = "#ffffff";
    }
    fabricRef.current?.requestRenderAll();
    setSelectedObject(null);
  };


  const handleSaveName = () => {
    if (!currentLayoutId || !editingName.trim()) {
      return;
    }
    updateLayout(currentLayoutId, { name: editingName.trim() });
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    }
  };

  const handleImportImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      fabric.FabricImage.fromURL(dataUrl).then((img) => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        // Scale image to fit canvas while maintaining aspect ratio
        const maxWidth = canvas.width! * 0.8;
        const maxHeight = canvas.height! * 0.8;
        const scale = Math.min(
          maxWidth / img.width!,
          maxHeight / img.height!,
          1
        );

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: "center",
          originY: "center",
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be imported again
    e.target.value = "";
  };

  const handleSaveLayout = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (currentLayoutId && currentLayout) {
      // Update existing layout directly
      saveLayoutWithName(currentLayout.name);
    } else {
      // Show dialog for new layout
      setShowSaveDialog(true);
    }
  };

  const saveLayoutWithName = (name: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Deselect all objects before generating preview
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    // Store original background
    const originalBg = canvas.backgroundColor;

    // Set transparent background for preview
    canvas.backgroundColor = "transparent";

    // Generate preview image with transparent background
    const previewImage = canvas.toDataURL({
      format: "png",
      multiplier: 0.5, // Smaller preview for storage efficiency
    });

    // Restore original background
    canvas.backgroundColor = originalBg;
    canvas.requestRenderAll();

    // Serialize canvas data
    const canvasData = canvas.toJSON();

    if (currentLayoutId && currentLayout) {
      // Update existing layout
      updateLayout(currentLayoutId, {
        name,
        canvasData,
        previewImage,
      });
      console.log("Layout updated:", currentLayoutId);
    } else {
      // Create new layout
      const newId = addLayout({
        name,
        canvasData,
        previewImage,
      });
      setCurrentLayoutId(newId);
      // Update URL to reflect the new layout ID
      navigate(`/layout/${newId}`, { replace: true });
      console.log("Layout saved with ID:", newId);
    }
  };

  // Ctrl+S keyboard shortcut for save
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveLayout();
      }
    };

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header Bar */}
      <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/layouts"
            className="p-2 hover:bg-muted rounded-full transition-colors"
            title="Back to Layouts"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
              <input
                ref={nameInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                className="font-bold text-sm md:text-base bg-transparent  outline-none px-1 -ml-1 min-w-[100px]"
              />
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page Size:</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors">
              {pageSize}
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(PAGE_SIZES) as PageSize[]).map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={pageSize === size ? "bg-accent" : ""}
                >
                  <span className="font-medium">{size}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {PAGE_SIZES[size].label.replace(`${size} `, "")}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-muted/20 overflow-hidden">
        <LayoutToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onDeleteSelected={handleDeleteSelected}
          onClear={handleClear}
          onImportImage={handleImportImage}
          onSaveLayout={handleSaveLayout}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <LayoutCanvas
          fabricRef={fabricRef}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onSelect={setSelectedObject}
          initialData={currentLayout?.canvasData}
          pageSize={pageSize}
          zoom={zoom}
          onZoomChange={setZoom}
        />

        <ZoomControls
          zoom={zoom}
          onZoomChange={setZoom}
        />

        <LayoutPropertiesPanel
          selectedObject={selectedObject}
          onChange={handlePropertyChange}
        />
      </div>

      <SaveLayoutDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={saveLayoutWithName}
        initialName={currentLayout?.name}
        isEditing={!!currentLayout}
      />
    </div>
  );
}
