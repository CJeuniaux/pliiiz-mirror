import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { pickAvatarUrl, generateInitials, isValidAvatarUrl } from '@/utils/avatar-utils';
import { supabase } from '@/integrations/supabase/client';

interface PublicProfileAvatarProps {
  profile: {
    display_name?: string;
    avatar_url?: string;
    avatar_url_public?: string;
    id?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function PublicProfileAvatar({ 
  profile, 
  size = 'lg',
  className = '' 
}: PublicProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  
  const initials = generateInitials(profile?.display_name);

  // Get optimized avatar URL via Edge Function
  const getDisplayableAvatarUrl = async (profile: any): Promise<string | null> => {
    const rawUrl = pickAvatarUrl(profile);
    
    if (!rawUrl || !isValidAvatarUrl(rawUrl)) {
      return null;
    }

    try {
      // Use Edge Function for better avatar URL handling
      const { data, error } = await supabase.functions.invoke('public-profile-avatar', {
        body: { 
          avatar_url: rawUrl,
          avatar_path: profile.avatar_path 
        }
      });

      if (error || !data?.url) {
        // Fallback to direct URL construction
        return buildDirectUrl(rawUrl);
      }

      return data.url;
    } catch (error) {
      console.warn('Avatar Edge Function error, using fallback:', error);
      return buildDirectUrl(rawUrl);
    }
  };

  // Fallback URL construction
  const buildDirectUrl = (url: string): string => {
    let u = url.trim();
    
    // If it's already a full URL, ensure it's public
    if (/^https?:/i.test(u)) {
      // Convert private URLs to public
      if (u.includes('/storage/v1/object/') && !u.includes('/object/public/')) {
        u = u.replace('/storage/v1/object/', '/storage/v1/object/public/');
      }
      return u;
    }
    
    // If it's a relative path
    const basePath = u.replace(/^\//, '');
    return `https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/${basePath}`;
  };

  useEffect(() => {
    const loadAvatar = async () => {
      setLoading(true);
      setImageError(false);
      
      try {
        const url = await getDisplayableAvatarUrl(profile);
        setDisplayUrl(url);
      } catch (error) {
        console.error('Error loading avatar:', error);
        setDisplayUrl(null);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      loadAvatar();
    } else {
      setLoading(false);
    }
  }, [profile?.avatar_url, profile?.avatar_url_public, profile?.id]);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16', 
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const handleImageLoad = () => {
    setLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setImageError(true);
  };

  // Show skeleton while loading
  if (loading) {
    return (
      <div className={`${sizeClasses[size]} mx-auto border-4 border-white shadow-lg rounded-full bg-muted animate-pulse ${className}`} />
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} mx-auto border-4 border-white shadow-lg rounded-full ${className}`}>
      {displayUrl && !imageError && (
        <AvatarImage 
          src={displayUrl}
          alt={`Avatar de ${profile?.display_name || "l'utilisateur"}`}
          loading="eager"
          className="object-cover w-full h-full"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            aspectRatio: '1',
            objectFit: 'cover'
          }}
        />
      )}
      <AvatarFallback 
        className={`${textSizeClasses[size]} font-semibold bg-[#DCDEDE] text-[#2F4B4E] flex items-center justify-center`}
        style={{ 
          backgroundColor: '#DCDEDE',
          color: '#2F4B4E'
        }}
      >
        <span>{initials}</span>
      </AvatarFallback>
    </Avatar>
  );
}