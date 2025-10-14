import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShareLink } from '@/hooks/use-share-link';

interface ProfileQRGeneratorProps {
  size?: number;
  showControls?: boolean;
  className?: string;
}

export function ProfileQRGenerator({ 
  size = 200, 
  showControls = true,
  className 
}: ProfileQRGeneratorProps) {
  const { shareLink, loading, getShareUrl } = useShareLink();
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (shareLink && shareLink.is_active) {
      const url = getShareUrl();
      setQrValue(url);
    } else {
      setQrValue('');
    }
  }, [shareLink, getShareUrl]);

  const handleCopyUrl = async () => {
    if (!qrValue) return;
    
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success('URL copiée dans le presse-papier');
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const handleDownloadQR = () => {
    if (!qrValue) return;

    // Create a canvas element to generate the QR code image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    // Create SVG string
    const svgElement = document.querySelector('.profile-qr-code svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pliiiz-qr-${shareLink?.slug || 'profile'}.png`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        toast.success('QR code téléchargé');
      });
      
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const handleShare = async () => {
    if (!qrValue) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon profil Pliiiz',
          text: 'Découvrez mon profil Pliiiz',
          url: qrValue
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Sharing cancelled or failed');
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className={`bg-muted rounded`} style={{ width: size, height: size }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shareLink || !shareLink.is_active || !qrValue) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">QR Code</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-sm text-muted-foreground">
            Lien de partage inactif
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showControls && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4" />
            QR Code de partage
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="profile-qr-code bg-white p-4 rounded-lg">
            <QRCodeSVG
              value={qrValue}
              size={size}
              level="M"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
          
          {showControls && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copier URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Télécharger
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Partager
              </Button>
            </div>
          )}

          {showControls && (
            <div className="text-xs text-muted-foreground text-center break-all">
              {qrValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}