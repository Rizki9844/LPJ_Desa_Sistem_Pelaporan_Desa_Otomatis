// ============================================
// Data Constants & Utilities — LPJ Desa
// ============================================
// Dummy data removed — real data comes from Supabase

// Empty defaults — real data comes from Supabase
export const defaultVillageInfo = {
  nama_desa: '',
  kode_desa: '',
  alamat: '',
  kode_pos: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  telepon: '',
  email: '',
  website: '',
  luas_wilayah: '',
  jumlah_penduduk: '',
  jumlah_kk: '',
  jumlah_rt: '',
  jumlah_rw: '',
  jumlah_dusun: '',
  no_rekening: '',
  nama_bank: '',
  tahun_anggaran: '',
  periode: '',
  pejabat_desa: [],
  kepala_desa: '',
  sekretaris_desa: '',
  bendahara: '',
};

// Empty arrays — real data loaded from Supabase
export const sampleIncomes = [];
export const sampleExpenses = [];
export const sampleActivities = [];

// ── Constants (kept — these are structural definitions, not data) ──

// Hierarchical structure: Bidang → Sub Bidang
export const bidangStructure = {
  'Penyelenggaraan Pemerintahan': {
    icon: 'Landmark',
    color: '#6366f1',
    norek: '1',
    description: 'Pengelolaan administrasi dan operasional pemerintahan desa',
    subBidang: [
      { nama: 'Penghasilan Tetap & Tunjangan', norek: '1.1' },
      { nama: 'Operasional Perkantoran', norek: '1.2' },
      { nama: 'Perencanaan & Musyawarah', norek: '1.3' },
    ],
  },
  'Pembangunan Desa': {
    icon: 'HardHat',
    color: '#10b981',
    norek: '2',
    description: 'Pembangunan infrastruktur, pendidikan, dan kesehatan desa',
    subBidang: [
      { nama: 'Pekerjaan Umum & Penataan Ruang', norek: '2.1' },
      { nama: 'Pendidikan', norek: '2.2' },
      { nama: 'Kesehatan', norek: '2.3' },
    ],
  },
  'Pembinaan Kemasyarakatan': {
    icon: 'Users',
    color: '#f59e0b',
    norek: '3',
    description: 'Pembinaan lembaga dan kehidupan sosial kemasyarakatan',
    subBidang: [
      { nama: 'Ketentraman & Ketertiban Umum', norek: '3.1' },
      { nama: 'Lembaga Kemasyarakatan', norek: '3.2' },
      { nama: 'Kebudayaan & Keagamaan', norek: '3.3' },
    ],
  },
  'Pemberdayaan Masyarakat': {
    icon: 'Rocket',
    color: '#0ea5e9',
    norek: '4',
    description: 'Peningkatan kapasitas dan kemandirian ekonomi masyarakat',
    subBidang: [
      { nama: 'Peningkatan Kapasitas Masyarakat', norek: '4.1' },
      { nama: 'Pertanian & Peternakan', norek: '4.2' },
      { nama: 'BUMDesa', norek: '4.3' },
    ],
  },
  'Penanggulangan Bencana': {
    icon: 'ShieldAlert',
    color: '#f43f5e',
    norek: '5',
    description: 'Pencegahan, mitigasi, dan penanganan bencana',
    subBidang: [
      { nama: 'Tanggap Darurat', norek: '5.1' },
      { nama: 'Pencegahan & Mitigasi', norek: '5.2' },
    ],
  },
};

export const budgetCategories = [
  'Penyelenggaraan Pemerintahan',
  'Pembangunan Desa',
  'Pembinaan Kemasyarakatan',
  'Pemberdayaan Masyarakat',
  'Penanggulangan Bencana',
];

export const incomeCategories = [
  'Pendapatan Asli Desa',
  'Transfer',
  'Pendapatan Lain-lain',
];

// Hierarchical income structure: Kategori Bidang → Sub Kategori with NOREK
export const pendapatanStructure = {
  'Pendapatan Asli Desa': {
    norek: '1',
    subKategori: [
      { norek: '1.1', nama: 'Hasil Usaha Desa' },
      { norek: '1.2', nama: 'Hasil Aset Desa' },
      { norek: '1.3', nama: 'Hasil Swadaya Dan Partisipasi' },
      { norek: '1.4', nama: 'Pendapatan Lain-lain' },
    ],
  },
  'Transfer': {
    norek: '2',
    subKategori: [
      { norek: '2.1', nama: 'Dana Desa' },
      { norek: '2.2', nama: 'Bagian dari Hasil Pajak dan Retribusi Daerah Kabupaten/Kota' },
      { norek: '2.3', nama: 'Alokasi Dana Desa' },
      { norek: '2.4', nama: 'Bantuan Keuangan Provinsi' },
      { norek: '2.5', nama: 'Bantuan Keuangan APBD Kabupaten/Kota' },
    ],
  },
  'Pendapatan Lain-lain': {
    norek: '3',
    subKategori: [
      { norek: '3.1', nama: 'Penerimaan dari Hasil Kerjasama antar Desa' },
      { norek: '3.2', nama: 'Penerimaan dari Hasil Kerjasama Desa dengan Pihak Ketiga' },
      { norek: '3.3', nama: 'Penerimaan dari Bantuan Perusahaan yang berlokasi di Desa' },
      { norek: '3.4', nama: 'Hibah dan sumbangan dari Pihak Ketiga' },
      { norek: '3.5', nama: 'Koreksi kesalahan belanja tahun-tahun anggaran sebelumnya' },
      { norek: '3.6', nama: 'Bunga Bank' },
      { norek: '3.7', nama: 'Lain-lain pendapatan Desa yang sah' },
    ],
  },
};

export const pembiayaanCategories = [
  'Penerimaan Pembiayaan',
  'Pengeluaran Pembiayaan',
];

export const pembiayaanStructure = {
  'Penerimaan Pembiayaan': {
    norek: '1',
    subKategori: [
      { norek: '1.1', nama: 'SILPA Tahun Sebelumnya' },
    ],
  },
  'Pengeluaran Pembiayaan': {
    norek: '2',
    subKategori: [
      { norek: '2.1', nama: 'Pembentukan Dana Cadangan' },
      { norek: '2.2', nama: 'Penyertaan Modal Desa' },
    ],
  },
};

// ── Utility Functions ──

export const formatRupiah = (angka) => {
  if (!angka && angka !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
