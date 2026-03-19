import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  userId: string;
  type: 'company' | 'freelancer';
  name: string;
  size?: number;
  onAvatarChange?: (url: string | null) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export function getAvatarUrl(type: 'company' | 'freelancer', userId: string): string {
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${type}/${userId}/avatar.jpg`);
  return data.publicUrl;
}

export function AvatarUpload({ userId, type, name, size = 80, onAvatarChange }: AvatarUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const storagePath = `${type}/${userId}/avatar.jpg`;

  useEffect(() => {
    // Check if avatar exists
    const checkAvatar = async () => {
      const { data } = await supabase.storage.from('avatars').list(`${type}/${userId}`);
      if (data && data.length > 0) {
        const url = getAvatarUrl(type, userId);
        setAvatarUrl(`${url}?t=${Date.now()}`);
        setImgError(false);
      }
    };
    if (userId) checkAvatar();
  }, [userId, type]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'Imagem muito grande. Máximo 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .upload(storagePath, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const url = getAvatarUrl(type, userId);
      const newUrl = `${url}?t=${Date.now()}`;
      setAvatarUrl(newUrl);
      setImgError(false);
      onAvatarChange?.(newUrl);
    } catch {
      toast({ title: 'Erro ao enviar foto. Tente novamente.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.storage.from('avatars').remove([storagePath]);
      setAvatarUrl(null);
      setImgError(false);
      onAvatarChange?.(null);
    } catch {
      toast({ title: 'Erro ao remover foto.', variant: 'destructive' });
    }
  };

  const showImage = avatarUrl && !imgError;
  const isCompany = type === 'company';

  return (
    <div className="relative group inline-block" style={{ width: size, height: size }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'w-full h-full rounded-full flex items-center justify-center overflow-hidden relative transition-all',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent'
        )}
        style={{ width: size, height: size }}
        disabled={uploading}
      >
        {showImage ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center font-semibold',
              isCompany ? 'bg-accent text-accent-foreground' : 'bg-foreground text-background'
            )}
            style={{ fontSize: size * 0.35 }}
          >
            {getInitials(name)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
          {uploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </div>
      </button>

      {/* Remove button */}
      {showImage && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Display-only avatar component for use across the app
interface UserAvatarProps {
  type: 'company' | 'freelancer';
  userId: string;
  name: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ type, userId, name, size = 40, className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const checkAvatar = async () => {
      const { data } = await supabase.storage.from('avatars').list(`${type}/${userId}`);
      if (data && data.length > 0) {
        const url = getAvatarUrl(type, userId);
        setAvatarUrl(`${url}?t=${Date.now()}`);
      }
    };
    checkAvatar();
  }, [userId, type]);

  const showImage = avatarUrl && !imgError;
  const isCompany = type === 'company';

  return (
    <div
      className={cn('rounded-full overflow-hidden flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center font-semibold',
            isCompany ? 'bg-accent text-accent-foreground' : 'bg-foreground text-background'
          )}
          style={{ fontSize: size * 0.35 }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
