import React, { useState, useRef, useEffect } from 'react';
import { AppData, Asset, Category } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Upload, Trash2, ArrowUp, ArrowDown, FolderPlus, Image as ImageIcon, LogOut, CheckCircle, XCircle, GripVertical, Pencil, Star, MoreVertical, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  data: AppData;
  onUpdate: (newData: AppData) => void;
  onLogout: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ContextMenuState {
  x: number;
  y: number;
  assetId: string;
}

// State interfaces for our new Modals
interface DeleteModalState {
  isOpen: boolean;
  assetId: string;
  assetName: string;
}

interface RenameModalState {
  isOpen: boolean;
  assetId: string;
  currentName: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data, onUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'assets' | 'categories'>('upload');
  const [uploadCategory, setUploadCategory] = useState<string>(data.categories[0]?.id || '');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  
  // Modal States
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, assetId: '', assetName: '' });
  const [renameModal, setRenameModal] = useState<RenameModalState>({ isOpen: false, assetId: '', currentName: '' });
  const [renameInputValue, setRenameInputValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Focus rename input when modal opens
  useEffect(() => {
    if (renameModal.isOpen && renameInputRef.current) {
      setTimeout(() => renameInputRef.current?.select(), 100);
    }
  }, [renameModal.isOpen]);

  // --- Notification Helpers ---
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // --- Actions ---

  const initiateDeleteAsset = (id: string) => {
    const asset = data.assets.find(a => a.id === id);
    if (!asset) return;
    setDeleteModal({ isOpen: true, assetId: id, assetName: asset.name });
  };

  const confirmDeleteAsset = () => {
    const { assetId } = deleteModal;
    const updatedAssets = data.assets.filter(a => a.id !== assetId);
    
    // Also check if it was a default for any category and clear it
    const updatedCategories = data.categories.map(c => {
      if (c.defaultAssetId === assetId) {
        return { ...c, defaultAssetId: undefined };
      }
      return c;
    });

    onUpdate({
      ...data,
      assets: updatedAssets,
      categories: updatedCategories
    });
    addToast("Asset deleted");
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
  };

  const initiateRenameAsset = (id: string) => {
    const asset = data.assets.find(a => a.id === id);
    if (!asset) return;
    setRenameInputValue(asset.name);
    setRenameModal({ isOpen: true, assetId: id, currentName: asset.name });
  };

  const confirmRenameAsset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { assetId } = renameModal;
    const newName = renameInputValue.trim();

    if (newName && newName !== "") {
       const updatedAssets = data.assets.map(a => 
         a.id === assetId ? { ...a, name: newName } : a
       );
       onUpdate({
         ...data,
         assets: updatedAssets
       });
       addToast("Asset renamed");
    }
    setRenameModal(prev => ({ ...prev, isOpen: false }));
  };

  const performSetDefaultAsset = (id: string) => {
    const asset = data.assets.find(a => a.id === id);
    if (!asset) return;
    
    const updatedCategories = data.categories.map(c => 
      c.id === asset.categoryId ? { ...c, defaultAssetId: id } : c
    );

    onUpdate({
      ...data,
      categories: updatedCategories
    });
    addToast("Set as default");
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsProcessingUpload(true);
    
    const fileReaders = Array.from(files).map(file => {
      return new Promise<Asset | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            resolve({
              id: crypto.randomUUID(),
              name: file.name.split('.')[0],
              categoryId: uploadCategory,
              src: result
            });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => {
          console.error(`Failed to read file: ${file.name}`);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(fileReaders);
      const newAssets = results.filter((a): a is Asset => a !== null);
      
      if (newAssets.length > 0) {
        onUpdate({
          ...data,
          assets: [...data.assets, ...newAssets]
        });
        addToast(`Successfully uploaded ${newAssets.length} asset(s)!`);
        setActiveTab('assets'); 
      } else {
        addToast("No valid files found to upload.", "error");
      }
    } catch (error) {
      console.error("Upload process error", error);
      addToast("An error occurred during upload.", "error");
    } finally {
      setIsProcessingUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  // Keep these as simple prompts for now as requested
  const handleCreateCategory = () => {
    setTimeout(() => {
      const name = prompt("Enter category name:");
      if (name) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        const maxZ = Math.max(0, ...data.categories.map(c => c.zIndex));
        const newCategory: Category = { id, name, zIndex: maxZ + 10 };
        onUpdate({
          ...data,
          categories: [...data.categories, newCategory]
        });
        setUploadCategory(id);
        addToast(`Category "${name}" created`);
      }
    }, 50);
  };

  const handleDeleteCategory = (id: string) => {
    setTimeout(() => {
      if (window.confirm("Delete category? This will delete all assets in it.")) {
        onUpdate({
          categories: data.categories.filter(c => c.id !== id),
          assets: data.assets.filter(a => a.categoryId !== id)
        });
        if (uploadCategory === id) {
          setUploadCategory(data.categories[0]?.id || '');
        }
        addToast("Category deleted");
      }
    }, 50);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const sorted = [...data.categories].sort((a, b) => a.zIndex - b.zIndex);
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    // Swap z-indexes
    const tempZ = sorted[index].zIndex;
    sorted[index].zIndex = sorted[targetIndex].zIndex;
    sorted[targetIndex].zIndex = tempZ;

    onUpdate({
      ...data,
      categories: sorted
    });
  };

  // --- Drag and Drop for Assets ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAssetId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropAsset = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedAssetId || draggedAssetId === targetId) return;

    const sourceIndex = data.assets.findIndex(a => a.id === draggedAssetId);
    const newAssets = [...data.assets];
    const [movedAsset] = newAssets.splice(sourceIndex, 1);
    const targetIndex = newAssets.findIndex(a => a.id === targetId);
    newAssets.splice(targetIndex, 0, movedAsset);

    onUpdate({ ...data, assets: newAssets });
    setDraggedAssetId(null);
  };

  // --- Context Menu Handler ---
  const onContextMenu = (e: React.MouseEvent, assetId: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    setContextMenu({ x: e.clientX, y: e.clientY, assetId });
  };


  // --- Render ---

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col font-sans text-stone-700">
      
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg transform transition-all animate-bounce ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
             {toast.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
             <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* --- MODALS --- */}
      
      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        title="Delete Asset"
        variant="danger"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteAsset}>
              Delete Asset
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">Are you sure you want to delete this asset? This action cannot be undone.</p>
          </div>
          <p className="font-bold text-lg text-stone-800 ml-1">
            "{deleteModal.assetName}"
          </p>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={renameModal.isOpen}
        onClose={() => setRenameModal(prev => ({ ...prev, isOpen: false }))}
        title="Rename Asset"
        footer={
          <>
             <Button variant="secondary" onClick={() => setRenameModal(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => confirmRenameAsset()}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={confirmRenameAsset} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-stone-500 mb-1.5">Asset Name</label>
            <input 
              ref={renameInputRef}
              type="text" 
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all text-stone-800 font-medium"
              placeholder="Enter asset name..."
              autoFocus
            />
          </div>
          <p className="text-xs text-stone-400">
             Tip: Keep names descriptive for easier searching in the future.
          </p>
        </form>
      </Modal>


      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full text-left px-4 py-3 hover:bg-stone-50 text-sm font-medium text-stone-700 flex items-center gap-2"
            onClick={() => { setContextMenu(null); initiateRenameAsset(contextMenu.assetId); }}
          >
            <Pencil className="w-4 h-4 text-emerald-500" /> Rename
          </button>
           <button 
            className="w-full text-left px-4 py-3 hover:bg-stone-50 text-sm font-medium text-stone-700 flex items-center gap-2"
            onClick={() => { setContextMenu(null); performSetDefaultAsset(contextMenu.assetId); }}
          >
            <Star className="w-4 h-4 text-amber-400" /> Set Default
          </button>
          <button 
            className="w-full text-left px-4 py-3 hover:bg-rose-50 text-sm font-medium text-rose-600 flex items-center gap-2 border-t border-stone-100"
            onClick={() => { setContextMenu(null); initiateDeleteAsset(contextMenu.assetId); }}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <span className="bg-emerald-400 text-white p-1.5 rounded-lg rotate-3 shadow-sm">CP</span>
          Admin Dashboard
        </h1>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={() => window.location.hash = ''}>
             View Public Site
           </Button>
           <Button variant="ghost" onClick={onLogout} title="Logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-stone-100 flex flex-col p-6 gap-3">
          <Button 
            variant={activeTab === 'upload' ? 'primary' : 'ghost'} 
            className="justify-start w-full" 
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="w-4 h-4 mr-3" /> Upload Assets
          </Button>
          <Button 
            variant={activeTab === 'assets' ? 'primary' : 'ghost'} 
            className="justify-start w-full" 
            onClick={() => setActiveTab('assets')}
          >
            <ImageIcon className="w-4 h-4 mr-3" /> Asset Library
          </Button>
          <Button 
            variant={activeTab === 'categories' ? 'primary' : 'ghost'} 
            className="justify-start w-full" 
            onClick={() => setActiveTab('categories')}
          >
            <FolderPlus className="w-4 h-4 mr-3" /> Layers
          </Button>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-10 overflow-y-auto bg-[#fdfbf7]">
          
          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <h2 className="text-2xl font-bold mb-6 text-stone-800">Upload New Assets</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-stone-600 mb-2">Assign Category</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={uploadCategory} 
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="block w-full appearance-none rounded-xl border-stone-200 bg-stone-50 text-stone-700 py-3 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                    >
                      <option value="" disabled>Select a category...</option>
                      {data.categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={handleCreateCategory}>New</Button>
                </div>
              </div>

              <div 
                className={`border-4 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                  isDragging 
                  ? 'border-emerald-400 bg-emerald-50 scale-[1.02]' 
                  : 'border-stone-200 hover:border-emerald-300 hover:bg-stone-50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
              >
                {isProcessingUpload ? (
                  <div className="flex flex-col items-center justify-center py-4">
                     <svg className="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-stone-500">Processing files...</p>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto h-16 w-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-stone-800">
                      <label htmlFor="file-upload" className="relative cursor-pointer text-emerald-500 hover:text-emerald-600 hover:underline">
                        <span>Click to upload</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/png,image/svg+xml" ref={fileInputRef} onChange={(e) => handleFileUpload(e.target.files)} />
                      </label>
                      <span className="pl-1 text-stone-500">or drag and drop</span>
                    </h3>
                    <p className="mt-2 text-sm text-stone-400">Upload multiple PNG or SVG files • 800x800px recommended</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ASSETS TAB */}
          {activeTab === 'assets' && (
             <div>
               <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-stone-800">Asset Library</h2>
                  <p className="text-stone-500 mt-1">Right-click to Rename, Set Default or Delete. Drag to reorder.</p>
                </div>
                <span className="bg-stone-200 text-stone-600 px-3 py-1 rounded-full text-sm font-bold">{data.assets.length} items</span>
               </div>
               
               {data.categories.map(cat => {
                 const catAssets = data.assets.filter(a => a.categoryId === cat.id);
                 if (catAssets.length === 0) return null;

                 return (
                   <div key={cat.id} className="mb-10 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                     <h3 className="text-xl font-bold mb-4 pb-2 border-b border-stone-100 text-stone-700 capitalize flex items-center gap-2">
                       {cat.name}
                       {cat.defaultAssetId && <span className="text-amber-500 text-xs flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full"><Star className="w-3 h-3 fill-current"/> has default</span>}
                       <span className="text-xs font-normal text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full ml-auto">{catAssets.length}</span>
                     </h3>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                       {catAssets.map(asset => {
                         const isDefault = cat.defaultAssetId === asset.id;
                         return (
                         <div 
                            key={asset.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropAsset(e, asset.id)}
                            onContextMenu={(e) => onContextMenu(e, asset.id)}
                            className={`group relative bg-stone-50 border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-move select-none ${isDefault ? 'border-amber-400 ring-2 ring-amber-100' : 'border-transparent hover:border-emerald-300'}`}
                         >
                           {/* Drag Handle Indicator */}
                           <div className="absolute top-2 left-2 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                             <GripVertical className="w-4 h-4" />
                           </div>

                           {/* Default Indicator */}
                           {isDefault && (
                             <div className="absolute top-0 right-0 bg-amber-400 text-white p-1 rounded-bl-lg z-10 shadow-sm">
                               <Star className="w-3 h-3 fill-current" />
                             </div>
                           )}

                           <div className="aspect-square p-3">
                             <img src={asset.src} alt={asset.name} className="w-full h-full object-contain pointer-events-none" />
                           </div>
                           <div className="p-2 bg-white text-xs truncate font-medium text-stone-600 text-center border-t border-stone-100 group-hover:text-emerald-600">
                             {asset.name}
                           </div>
                           
                           {/* Action Buttons overlay */}
                           <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                             <div className={`flex flex-col gap-1 ${isDefault ? 'mt-6' : ''}`}>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); initiateDeleteAsset(asset.id); }}
                                  onMouseDown={(e) => e.stopPropagation()} 
                                  className="bg-white shadow-sm text-rose-500 p-1.5 rounded-full hover:bg-rose-50 hover:scale-110"
                                  title="Delete Asset"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); initiateRenameAsset(asset.id); }}
                                  onMouseDown={(e) => e.stopPropagation()} 
                                  className="bg-white shadow-sm text-emerald-500 p-1.5 rounded-full hover:bg-emerald-50 hover:scale-110"
                                  title="Rename Asset"
                               >
                                 <Pencil className="w-3.5 h-3.5" />
                               </button>
                             </div>
                           </div>
                         </div>
                       );})}
                     </div>
                   </div>
                 );
               })}
               {data.assets.length === 0 && (
                 <div className="text-center py-20 text-stone-400">
                   <p>No assets uploaded yet.</p>
                   <Button variant="outline" className="mt-4" onClick={() => setActiveTab('upload')}>Go to Upload</Button>
                 </div>
               )}
             </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-stone-800">Layer Order</h2>
                <Button onClick={handleCreateCategory}><FolderPlus className="w-4 h-4 mr-2"/> Add Category</Button>
              </div>
              <p className="text-sm text-stone-500 mb-6 bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100">
                <strong>Tip:</strong> Items higher in this list will appear <em>on top</em> of items lower in the list on the character canvas.
              </p>

              <div className="flex flex-col gap-3">
                {[...data.categories].sort((a, b) => a.zIndex - b.zIndex).reverse().map((cat, idx, arr) => (
                  <div key={cat.id} className="p-4 bg-white rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-emerald-200">
                    <div className="flex items-center gap-4">
                       <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-inner">
                         {cat.zIndex}
                       </span>
                       <div>
                         <h4 className="font-bold text-stone-800 flex items-center gap-2">
                            {cat.name}
                            {cat.defaultAssetId && <span className="text-[10px] uppercase bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold tracking-wider">Default Set</span>}
                         </h4>
                         <span className="text-xs text-stone-400">
                           ID: {cat.id} • {data.assets.filter(a => a.categoryId === cat.id).length} assets
                         </span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        disabled={idx === 0} 
                        onClick={() => moveCategory(arr.length - 1 - idx, 'up')}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        disabled={idx === arr.length - 1} 
                        onClick={() => moveCategory(arr.length - 1 - idx, 'down')}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <div className="w-px h-6 bg-stone-200 mx-2"></div>
                      <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};