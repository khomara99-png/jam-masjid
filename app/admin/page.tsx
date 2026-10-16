'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase'; 

export default function AdminPage() {
  const [judul, setJudul] = useState('');
  const [pemateri, setPemateri] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const kajianRef = ref(db, 'pengumuman');
    const unsubscribe = onValue(kajianRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setJudul(data.judul || '');
        setPemateri(data.pemateri || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const simpanData = () => {
    setStatus('Menyimpan...');
    set(ref(db, 'pengumuman'), {
      judul: judul,
      pemateri: pemateri
    }).then(() => {
      setStatus('Berhasil disimpan! Tampilan jam akan otomatis berubah.');
      setTimeout(() => setStatus(''), 4000);
    }).catch(() => {
      setStatus('Gagal menyimpan. Pastikan internet lancar.');
    });
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 font-modern">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Panel Takmir</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Ubah teks berjalan (Running Text) di sini</p>
        
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Info / Judul Kajian</label>
          <input 
            type="text" 
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Kajian Fiqih Bab Shalat"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 text-black"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Pemateri (Opsional)</label>
          <input 
            type="text" 
            value={pemateri}
            onChange={(e) => setPemateri(e.target.value)}
            placeholder="Contoh: Bersama Ustadz Fulan"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 text-black"
          />
        </div>

        <button 
          onClick={simpanData}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all"
        >
          SIMPAN PERUBAHAN
        </button>

        {status && (
          <p className={`text-center mt-4 font-semibold ${status.includes('Berhasil') ? 'text-green-600' : 'text-orange-500'}`}>
            {status}
          </p>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
        .font-modern { font-family: 'Outfit', sans-serif; }
      `}} />
    </div>
  );
}