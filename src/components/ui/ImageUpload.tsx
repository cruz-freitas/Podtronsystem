'use client'

import { useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Upload, X, ImageIcon, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

// Use direct client to avoid any auth issues
const storageClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  bucket?: string
  folder?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  bucket = 'products',
  folder = 'misc',
  label,
  size = 'md',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const dimensions = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-full h-44',
  }

  async function handleFile(file: File) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2, 8)
      const fileName = `${folder}/${timestamp}-${random}.${ext}`

      // Upload to Supabase Storage
      const { data, error } = await storageClient.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (error) {
        console.error('Storage error:', error)
        throw new Error(error.message)
      }

      // Get public URL
      const { data: urlData } = storageClient.storage
        .from(bucket)
        .getPublicUrl(data.path)

      if (!urlData?.publicUrl) {
        throw new Error('Não foi possível obter a URL da imagem')
      }

      onChange(urlData.publicUrl)
      toast.success('Foto enviada!')
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(`Erro ao enviar foto: ${err.message || 'Tente novamente'}`)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleClick() {
    if (!uploading) inputRef.current?.click()
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-zinc-400">{label}</label>
      )}

      <div
        className={`relative ${dimensions[size]} rounded-xl border-2 overflow-hidden transition-all cursor-pointer
          ${value
            ? 'border-zinc-700 hover:border-zinc-600'
            : 'border-dashed border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/5'
          }
          bg-zinc-800/50`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Upload loading state */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 z-10 gap-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-xs text-zinc-400">Enviando...</span>
          </div>
        )}

        {/* Image preview */}
        {value && !uploading ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Trocar
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove() }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-xs font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Remover
                  </button>
                )}
              </div>
            </div>
          </>
        ) : !uploading ? (
          /* Empty state */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600 p-3">
            <ImageIcon className={size === 'sm' ? 'w-5 h-5' : 'w-8 h-8'} />
            {size !== 'sm' && (
              <>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 font-medium">Clique ou arraste</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">JPG, PNG, WebP • máx 5MB</p>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          // Reset input so same file can be selected again
          e.target.value = ''
        }}
      />
    </div>
  )
}
