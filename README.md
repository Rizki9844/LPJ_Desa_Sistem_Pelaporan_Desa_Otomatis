Markdown
<div align="center">

# 🏛️ LPJ Desa

**Sistem Informasi Pelaporan & Administrasi Desa Terpadu**

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Vite](https://img.shields.io/badge/Vite_7-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![Vanilla CSS](https://img.shields.io/badge/Vanilla_CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)

</div>

## 📌 Deskripsi Proyek

**LPJ Desa** adalah *Single Page Application* (SPA) yang dirancang untuk mempermudah proses penyusunan Laporan Pertanggung Jawaban (LPJ) di tingkat pemerintahan desa. Proyek ini dikembangkan dengan fokus implementasi awal untuk optimalisasi birokrasi di **Desa Begawat**.

Sistem ini memfasilitasi manajemen data informasi desa, pendapatan, belanja, pembiayaan, dan kegiatan desa, lengkap dengan fitur *generate* dokumen fisik maupun non-fisik secara otomatis dengan format resmi.

## ✨ Core Features

* **Client-Side Document Generation:** Mengekspor laporan ke format PDF, DOCX (multi-part), dan XLSX sepenuhnya di sisi *browser*, menghilangkan beban komputasi server.
* **Role-Based Access Control (RBAC):** Pemisahan otorisasi ketat antara Admin, Operator, dan Kepala Desa.
* **Real-time Analytics:** Visualisasi serapan anggaran interaktif menggunakan `recharts`.
* **Zero-Dependency Styling:** Antarmuka dibangun murni menggunakan Vanilla CSS (arsitektur `@layer`) untuk *bundle size* yang minimal dan *rendering* yang lebih cepat.

## 🛠️ Stack & Dependencies

| Kategori | Teknologi | Versi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Core** | React, React DOM | 19.2.4 | UI Framework |
| **Tooling** | Vite | 7.3.1 | Bundler & Dev Server |
| **Routing** | React Router DOM | 7.13.0 | Lazy-loaded client routing |
| **BaaS** | Supabase JS | 2.96.0 | DB, Auth, Storage, RLS |
| **Styling** | Vanilla CSS | - | Modular, Mobile-first, Dark Mode |
| **PDF Engine** | jsPDF, autotable | 4.2.0 | `doc.autoTable()` API |
| **Word/Excel**| docx, xlsx | 9.x / 0.18.x | Document compilation |

## 🏗️ Architecture & Design Decisions

Sistem ini mengadopsi *Feature-based architecture* dengan beberapa keputusan teknis utama:

1. **State Management:** Menggunakan React Context API murni (`AppContext`, `AuthContext`) tanpa *overhead* eksternal seperti Redux.
2. **Security:** Autentikasi dikelola via Supabase Auth, didukung oleh *Row Level Security* (RLS) di level *database* untuk memastikan isolasi data antar pengguna.
3. **Performance:** Rute diimplementasikan menggunakan `React.lazy()` dan `Suspense` untuk memecah *bundle* JavaScript (*Code Splitting*), sehingga mempercepat *Time-to-Interactive* (TTI).

<details>
<summary><b>📂 Lihat Struktur Direktori (Folder Tree)</b></summary>

```text
src/
├── assets/         # Base64 assets untuk generator dokumen
├── components/     # Reusable UI (Layout, Feedback, Data Display)
├── context/        # Global state providers
├── hooks/          # Custom hooks (useRole, useKeyboardShortcuts)
├── pages/          # Halaman utama (Lazy-loaded)
├── styles/         # Arsitektur CSS (@layer base, components, layout, pages)
└── utils/          # Logic helper & document generators
</details>

🚀 Instalasi & Development
Prasyarat: Node.js v18+ dan npm atau yarn.

Bash
# 1. Clone repository
git clone [https://github.com/rizkimalikfajar/lpj-desa.git](https://github.com/rizkimalikfajar/lpj-desa.git)

# 2. Masuk ke direktori
cd lpj-desa

# 3. Install dependencies
npm install

# 4. Setup environment (buat file .env di root)
# Tambahkan: 
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

# 5. Jalankan server lokal
npm run dev
<div align="center">
<p><b>Hak Cipta © 2026 Rizki Malik Fajar (Vibecode).</b></p>
<p><i>Dikembangkan sebagai bagian dari inovasi teknologi di lingkungan Pemerintah Desa.</i></p>
</div>