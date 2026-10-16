'use client';

import { useState, useEffect } from 'react';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase'; 

export default function JamMasjid() {
  const [waktuSekarang, setWaktuSekarang] = useState<Date | null>(null);
  const [jadwalShalat, setJadwalShalat] = useState<PrayerTimes | null>(null);
  const [waktuImsak, setWaktuImsak] = useState<Date | null>(null);
  const [waktuSelanjutnya, setWaktuSelanjutnya] = useState<{ nama: string, waktu: Date } | null>(null);
  const [teksHitungMundur, setTeksHitungMundur] = useState("-00:00:00");
  const [modeLayar, setModeLayar] = useState('NORMAL');
  const [namaWaktuAktif, setNamaWaktuAktif] = useState('');
  const [teksIqamah, setTeksIqamah] = useState('00:00');
  const [infoKajian, setInfoKajian] = useState({ judul: "", pemateri: "" });

  useEffect(() => {
    const kajianRef = ref(db, 'pengumuman');
    const unsubscribeFirebase = onValue(kajianRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setInfoKajian({ judul: data.judul || "", pemateri: data.pemateri || "" });
    });

    const koordinat = new Coordinates(-6.273, 107.098);
    const parameter = CalculationMethod.Singapore();
    parameter.fajrAngle = 20; 
    parameter.ishaAngle = 18; 

    const jadwalHariIni = new PrayerTimes(koordinat, new Date(), parameter);
    setJadwalShalat(jadwalHariIni);
    const imsakHariIni = new Date(jadwalHariIni.fajr.getTime() - 10 * 60000);
    setWaktuImsak(imsakHariIni);

    const timer = setInterval(() => {
      const sekarang = new Date();
      setWaktuSekarang(sekarang);
      
      if (jadwalHariIni && imsakHariIni) {
        const daftarWaktu = [
          { nama: 'Imsak', waktu: imsakHariIni },
          { nama: 'Subuh', waktu: jadwalHariIni.fajr },
          { nama: 'Syuruk', waktu: jadwalHariIni.sunrise },
          { nama: 'Zuhur', waktu: jadwalHariIni.dhuhr },
          { nama: 'Ashar', waktu: jadwalHariIni.asr },
          { nama: 'Maghrib', waktu: jadwalHariIni.maghrib },
          { nama: 'Isya', waktu: jadwalHariIni.isha }
        ];

        let berikutnya = daftarWaktu.find(w => w.waktu > sekarang);
        if (!berikutnya) {
          const besok = new Date();
          besok.setDate(besok.getDate() + 1);
          const jadwalBesok = new PrayerTimes(koordinat, besok, parameter);
          const imsakBesok = new Date(jadwalBesok.fajr.getTime() - 10 * 60000);
          berikutnya = { nama: 'Imsak', waktu: imsakBesok };
        }
        setWaktuSelanjutnya(berikutnya);

        const selisih = berikutnya.waktu.getTime() - sekarang.getTime();
        const jam = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const menit = Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60));
        const detik = Math.floor((selisih % (1000 * 60)) / 1000);
        setTeksHitungMundur(`${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`);

        const waktuLewat = [...daftarWaktu].reverse().find(w => w.waktu <= sekarang);
        let modeSaatIni = 'NORMAL';
        let namaAktif = '';
        let sisaIq = '00:00';

        if (waktuLewat && !['Imsak', 'Syuruk'].includes(waktuLewat.nama)) {
          const selisihDetikLewat = Math.floor((sekarang.getTime() - waktuLewat.waktu.getTime()) / 1000);
          const DURASI_ADZAN = 3 * 60;   
          const DURASI_IQAMAH = 10 * 60; 
          const DURASI_SHALAT = 15 * 60; 

          if (selisihDetikLewat < DURASI_ADZAN) {
            modeSaatIni = 'ADZAN';
            namaAktif = waktuLewat.nama;
          } else if (selisihDetikLewat < DURASI_ADZAN + DURASI_IQAMAH) {
            modeSaatIni = 'IQAMAH';
            namaAktif = waktuLewat.nama;
            const sisaDetikIqamah = (DURASI_ADZAN + DURASI_IQAMAH) - selisihDetikLewat;
            sisaIq = `${String(Math.floor(sisaDetikIqamah / 60)).padStart(2, '0')}:${String(sisaDetikIqamah % 60).padStart(2, '0')}`;
          } else if (selisihDetikLewat < DURASI_ADZAN + DURASI_IQAMAH + DURASI_SHALAT) {
            modeSaatIni = 'SHALAT';
          }
        }
        setModeLayar(modeSaatIni);
        setNamaWaktuAktif(namaAktif);
        setTeksIqamah(sisaIq);
      }
    }, 1000);
    return () => { clearInterval(timer); unsubscribeFirebase(); };
  }, []);

  const formatJam = (tanggal: Date | null) => tanggal ? tanggal.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "--:--";
  
  const getMasehi = (tanggal: Date) => tanggal.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  // === FUNGSI HIJRIAH ANTI BUG ANDROID ===
  const getHijriah = (tanggal: Date) => {
    let penyesuaianHari = 0; 
    
    // Tambah 1 hari otomatis jika waktu saat ini sudah melewati Maghrib
    if (jadwalShalat && tanggal.getTime() >= jadwalShalat.maghrib.getTime()) {
      penyesuaianHari += 1;
    }

    const tanggalKoreksi = new Date(tanggal.getTime() + (penyesuaianHari * 24 * 60 * 60 * 1000));
    
    try {
      // Ambil murni angkanya saja (format Internasional)
      const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { 
        day: 'numeric', month: 'numeric', year: 'numeric' 
      });
      const parts = formatter.formatToParts(tanggalKoreksi);
      
      let hari = '1', bulan = '1', tahun = '1448';
      parts.forEach(part => {
        if (part.type === 'day') hari = part.value;
        if (part.type === 'month') bulan = part.value;
        if (part.type === 'year') tahun = part.value;
      });

      // Daftar nama bulan paten buatan sendiri
      const daftarBulan = ["Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"];
      
      // Bersihkan teks tahun jika ada sisa huruf aneh (misal SM/AH)
      const tahunBersih = tahun.replace(/[^0-9]/g, '');

      return `${hari} ${daftarBulan[parseInt(bulan) - 1]} ${tahunBersih} H`;
    } catch (e) {
      return "Memuat tanggal...";
    }
  };

  if (!waktuSekarang || !jadwalShalat || !waktuImsak) return <div className="bg-black w-screen h-screen"></div>;

  if (modeLayar === 'ADZAN') return (<div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-white px-4 text-center"><div className="animate-pulse flex flex-col items-center"><h1 className="text-3xl md:text-5xl font-bold mb-4 font-modern text-neutral-400">SAATNYA ADZAN</h1><h2 className="text-6xl md:text-[9rem] font-extrabold text-white my-4 font-digital uppercase">{namaWaktuAktif}</h2></div></div>);
  if (modeLayar === 'IQAMAH') return (<div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-white px-4 text-center"><h1 className="text-2xl md:text-4xl mb-4 md:mb-8 font-modern text-neutral-400">Menuju Iqamah</h1><h2 className="text-[6rem] md:text-[12rem] font-bold text-white leading-none font-digital">{teksIqamah}</h2><p className="text-xl md:text-3xl mt-6 md:mt-12 text-neutral-500 font-modern">Luruskan dan Rapatkan Shaf Anda</p></div>);
  if (modeLayar === 'SHALAT') return (<div className="w-full min-h-screen bg-black flex flex-col items-center justify-center text-white px-4 text-center"><p className="text-xl md:text-3xl opacity-30 uppercase font-modern text-neutral-400">Harap Tenang & Matikan Alat Komunikasi</p></div>);

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-black text-white flex flex-col p-4 md:p-6">
      
      {/* HEADER: Tanpa logo, responsif ditumpuk di HP, menyamping di Laptop */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 md:gap-0 z-10 text-center md:text-left">
        <div>
          <h1 className="text-2xl md:text-4xl font-modern font-extrabold text-white tracking-wide">MASJID NURUL HUDA</h1>
          <h2 className="text-sm md:text-xl text-neutral-400 font-modern font-light mt-1">Blok G - Telaga Harapan</h2>
          <p className="text-xs md:text-sm italic text-neutral-500 font-modern mt-1 hidden md:block">Bersama dalam Iman, Menuju Ridha Allah</p>
        </div>

        <div className="text-center md:text-right font-modern mt-2 md:mt-0">
          <div className="text-lg md:text-2xl font-semibold text-white tracking-wide">{getMasehi(waktuSekarang)}</div>
          <div className="text-neutral-400 text-sm md:text-lg font-light mt-1">{getHijriah(waktuSekarang)}</div>
        </div>
      </div>

      {/* JAM TENGAH: Font Digital & Responsif */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 my-8 md:my-0">
        <div className="text-6xl sm:text-8xl md:text-[9.5rem] font-bold leading-none tracking-tighter text-white font-digital flex items-end justify-center">
          {waktuSekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          <span className="text-lg md:text-4xl font-modern font-light ml-2 md:ml-4 text-neutral-500 mb-2 md:mb-5 tracking-widest uppercase">W I B</span>
        </div>
        
        <div className="bg-neutral-900 border border-neutral-800 rounded-full px-4 md:px-8 py-2 md:py-3 mt-6 md:mt-4 flex items-center gap-2 md:gap-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C12 2 9 5 9 8C9 10.5 11 12 11 12V22H13V12C13 12 15 10.5 15 8C15 5 12 2 12 2Z"/></svg>
          <span className="text-sm md:text-xl font-modern font-medium tracking-wide text-neutral-300">
            Menuju <span className="text-white font-bold">{waktuSelanjutnya?.nama}</span> • -{teksHitungMundur}
          </span>
        </div>
      </div>

      {/* PANEL JADWAL */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-2 md:p-3 flex flex-wrap justify-center md:justify-between gap-y-2 md:gap-0 z-10 mb-4">
        {['Imsak', 'Subuh', 'Syuruk', 'Zuhur', 'Ashar', 'Maghrib', 'Isya'].map((nama) => {
          let waktu, ikon;
          if (nama === 'Imsak') { waktu = waktuImsak; ikon = <path d="M12 2A10 10 0 1022 12A10 10 0 0012 2M12 4A8 8 0 114 12A8 8 0 0112 4Z"/>; }
          else if (nama === 'Subuh') { waktu = jadwalShalat.fajr; ikon = <path d="M12 2l-5 5h3v4h4v-4h3l-5-5zM5 13v2h14v-2H5zm-2 4v2h18v-2H3z"/>; }
          else if (nama === 'Syuruk') { waktu = jadwalShalat.sunrise; ikon = <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.657-5.657l1.414-1.414M4.93 19.07l1.414-1.414m12.728 0l-1.414-1.414M4.93 4.93l1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z"/>; }
          else if (nama === 'Zuhur') { waktu = jadwalShalat.dhuhr; ikon = <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM6.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.061-1.06l-1.591-1.59zM4.5 12a.75.75 0 01-.75.75H1.5a.75.75 0 010-1.5h2.25A.75.75 0 014.5 12zM6.166 6.166a.75.75 0 011.06-1.06l1.59 1.591a.75.75 0 11-1.061 1.06l-1.59-1.591z"/>; }
          else if (nama === 'Ashar') { waktu = jadwalShalat.asr; ikon = <path d="M6 16.5A4.5 4.5 0 0110.5 12h1.365a4.5 4.5 0 110 9H10.5A4.5 4.5 0 016 16.5zM12 8a4 4 0 110-8 4 4 0 010 8z"/>; }
          else if (nama === 'Maghrib') { waktu = jadwalShalat.maghrib; ikon = <path d="M12 3v2a7 7 0 100 14v2a9 9 0 110-18z"/>; }
          else if (nama === 'Isya') { waktu = jadwalShalat.isha; ikon = <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>; }

          const isActive = waktuSelanjutnya?.nama === nama;

          return (
            <div key={nama} className={`flex flex-col items-center justify-center py-2 md:py-3 px-1 md:px-4 rounded-xl w-[24%] md:w-full transition-all duration-300 font-modern ${
              isActive ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-neutral-500 bg-transparent'
            }`}>
              <svg className={`w-5 h-5 md:w-7 md:h-7 mb-1 md:mb-2 ${isActive ? 'text-black' : 'text-neutral-600'}`} fill="currentColor" viewBox="0 0 24 24">{ikon}</svg>
              <p className="text-[10px] md:text-sm font-light uppercase tracking-widest">{nama}</p>
              <p className={`text-lg md:text-4xl font-bold tracking-tight mt-0 md:mt-1 font-digital ${isActive ? 'text-black' : 'text-white'}`}>{formatJam(waktu ?? null)}</p>
            </div>
          )
        })}
      </div>
      
      {/* RUNNING TEXT */}
      <div className="relative py-3 md:py-4 px-2 overflow-hidden bg-neutral-900/30 rounded-full font-modern z-10 border border-neutral-800 flex items-center">
         <div className="animate-[marquee_25s_linear_infinite] whitespace-nowrap text-white tracking-wide text-sm md:text-xl font-light">
           "Dirikanlah shalat, karena shalat itu mencegah dari perbuatan keji dan mungkar." (QS. Al-Ankabut: 45) &nbsp; • &nbsp; {infoKajian.judul ? `Info Kajian: ${infoKajian.judul} ${infoKajian.pemateri}` : "Mari rapatkan shaf dan matikan alat komunikasi."}
         </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Outfit:wght@300;400;600;800&display=swap');
        .font-digital { font-family: 'Orbitron', sans-serif; }
        .font-modern { font-family: 'Outfit', sans-serif; }
        @keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
      `}} />
    </div>
  );
}