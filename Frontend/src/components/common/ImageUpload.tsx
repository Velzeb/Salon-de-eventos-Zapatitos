import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { toast } from 'sonner';
import MediaViewerR2 from './MediaViewerR2';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
}

const ImageUpload = ({ 
  value = '', 
  onChange, 
  folder = 'catalogo',
  label = 'Imagen o Video del Elemento',
  accept = 'image/*,video/*'
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadService.uploadImagen(file, folder);
      onChange(url);
      toast.success('Archivo subido correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[160px]
          ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/50 bg-slate-50/50 hover:bg-slate-50'}
          ${isUploading ? 'pointer-events-none opacity-65' : ''}`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        {value ? (
          <div className="relative w-full h-44 rounded-2xl overflow-hidden group">
            <MediaViewerR2 
              url={value} 
              alt="Vista previa" 
              className="w-full h-full" 
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button 
                type="button"
                onClick={handleRemove}
                className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-3">
            {isUploading ? (
              <>
                <Loader2 size={36} className="text-primary animate-spin" />
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Subiendo archivo a R2...</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-bg-dark uppercase tracking-widest">Arrastra tu foto/video o haz clic aquí</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Soporta PNG, JPG, MP4 hasta 50MB</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
