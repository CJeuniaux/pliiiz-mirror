import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserUploads } from '@/hooks/use-user-uploads';
import { Upload, X, Image } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadComponentProps {
  onUploadSuccess?: (url: string) => void;
  maxImages?: number;
  kind?: string;
}

export function ImageUploadComponent({ 
  onUploadSuccess, 
  maxImages = 5,
  kind = 'gift' 
}: ImageUploadComponentProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading, deleteUpload } = useUserUploads();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (uploadedImages.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    const url = await uploadImage(file, kind);
    if (url) {
      setUploadedImages(prev => [...prev, url]);
      onUploadSuccess?.(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="h3">Mes images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-3">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Glissez une image ici ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WebP (max 10MB)
              </p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading || uploadedImages.length >= maxImages}
        />

        {uploading && (
          <div className="text-center text-sm text-muted-foreground">
            Upload en cours...
          </div>
        )}

        {/* Uploaded images preview */}
        {uploadedImages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Images uploadées ({uploadedImages.length}/{maxImages})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-black/[0.06]"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedImages.length === 0 && (
          <div className="text-center text-muted-foreground p-8">
            <Image className="h-12 w-12 mx-auto opacity-50 mb-3" />
            <p className="text-sm">Aucune image uploadée</p>
            <p className="text-xs mt-1">
              Vos images apparaîtront dans les aperçus de vos contacts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}