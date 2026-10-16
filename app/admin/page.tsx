'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase'; 

export default function AdminPage() {
  const [pesanUtama, setPesanUtama] = useState('');
  const [kajianList, setKajianList] = useState([{ judul: '', pemateri: '' }]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const kajianRef = ref(db, 'pengumuman');
    const unsubscribe = onValue(kajianRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPesanUtama(data.pesanUtama || '');
        if (data.kajianList && Array.isArray(data.kajianList)) {
          setKajianList(data.kajianList);
        } else if (data.judul) {
          // Konversi dari versi lama
          setKajianList([{ judul: data.judul, pemateri: data.pemateri || '' }]);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const tambahKajian = () => setKajianList([...kajianList, { judul: '', pemateri: '' }]);
  
  const hapusKajian = (index: number) => {
    const newList = [...kajianList];
    newList.splice(index, 1);
    setKajianList(newList);
  };

  const ubahKajian = (index: number, field: 'judul' | 'pemateri', value: string) => {
    const newList = [...kajianList];
    newList[index][field] = value;
    setKajianList(newList);
  };

  const simpanData = () => {
    setStatus('Menyimpan...');
    // Buang kajian yang judulnya kosong sebelum disimpan
    const filteredKajian = kajianList.filter(k => k.judul.trim() !== '');
    
    set(ref(db, 'pengumuman'), {
      pesanUtama: pesanUtama,
      kajianList: filteredKajian
    }).then(() => {
      setStatus('Berhasil disimpan! Tampilan jam akan otomatis berubah.');
      setTimeout(() => setStatus(''), 4000);
    }).catch(() => {
      setStatus('Gagal menyimpan. Pastikan internet lancar.');
    });
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 font-modern">
      <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Panel Takmir</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Ubah Teks Berjalan (Running Text)</p>
        
        {/* PESAN UTAMA */}
        <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
          <label className="block text-sm font-bold text-blue-800 mb-2">Teks Pengingat Utama / Ayat</label>
          <textarea 
            rows={3}
            value={pesanUtama}
            onChange={(e) => setPesanUtama(e.target.value)}
            placeholder='Contoh: "Dirikanlah shalat..."'
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none"
          />
        </div>

        {/* DAFTAR KAJIAN */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-gray-700">Jadwal Kajian</label>
            <button onClick={tambahKajian} className="text-sm bg-gray-800 text-white px-3 py-1 rounded-lg hover:bg-gray-700 font-semibold">+ Tambah</button>
          </div>
          
          {kajianList.length === 0 && <p className="text-sm text-gray-500 italic text-center py-2">Tidak ada kajian. Klik "+ Tambah" untuk membuat jadwal.</p>}

          {kajianList.map((kajian, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-3 relative">
              <button 
                onClick={() => hapusKajian(index)} 
                className="absolute top-2 right-2 text-red-500 hover:bg-red-100 p-1 rounded-md text-xs font-bold"
              >
                Hapus
              </button>
              <div className="mb-3 mt-2">
                <input 
                  type="text" value={kajian.judul} onChange={(e) => ubahKajian(index, 'judul', e.target.value)}
                  placeholder="Info Kajian (Cth: Kajian Fiqih)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-black text-sm"
                />
              </div>
              <div>
                <input 
                  type="text" value={kajian.pemateri} onChange={(e) => ubahKajian(index, 'pemateri', e.target.value)}
                  placeholder="Pemateri (Cth: Ustadz Fulan)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-black text-sm"
                />
              </div>
            </div>
          ))}
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