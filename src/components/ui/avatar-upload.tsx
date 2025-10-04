import React, { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { useAvatar } from '@/hooks/use-avatar';
import { Camera, Trash2 } from 'lucide-react';

interface AvatarUploadProps {
  avatarUrl?: string | null;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export function AvatarUpload({ 
  avatarUrl, 
  displayName = 'User', 
  size = 'md',
  editable = true 
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, deleteAvatar, uploading } = useAvatar();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteClick = async () => {
    await deleteAvatar();
  };

  const initials = displayName
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        
      </div>

      {editable && (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? 'Upload...' : 'Changer'}
          </Button>
          
          {avatarUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteClick}
              disabled={uploading}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}