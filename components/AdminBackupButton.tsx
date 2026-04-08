'use client'
import { useState } from 'react';

export default function BotonBackup() {
  const [loading, setLoading] = useState(false);
  const [urlBackup, setUrlBackup] = useState('');

  const ejecutarBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setUrlBackup(data.urlDescarga);
        alert("¡Copia de seguridad enviada a la nube exitosamente!");
      }
    } catch (error) {
      alert("Error de conexión al generar el backup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <h3 className="text-xl font-bold mb-2">Respaldo del Sistema</h3>
      <p className="text-sm text-gray-600 mb-4">
        Guarda una instantánea de todas las calificaciones y asistencias en la nube (Vercel Blob).
      </p>
      
      <button 
        onClick={ejecutarBackup} 
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 transition-colors"
      >
        {loading ? 'Sincronizando con la nube...' : 'Generar Backup Seguro'}
      </button>

      {urlBackup && (
        <div className="mt-4">
          <a 
            href={urlBackup} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm"
          >
            Descargar archivo JSON generado
          </a>
        </div>
      )}
    </div>
  );
}