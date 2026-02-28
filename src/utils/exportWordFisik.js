/**
 * ================================================================
 * Export LPJ Fisik (Swakelola) — Full Document Bundle
 * ================================================================
 * Generates a Word document with 15 official sections for
 * physical infrastructure activities (pembangunan).
 *
 * Sections:
 *  1. SK TPK
 *  2. Surat Penyampaian Dokumen Persiapan
 *  3. Jadwal Pelaksanaan Kegiatan
 *  4. Rencana Penggunaan Tenaga/Bahan/Alat
 *  5. Spesifikasi Teknis
 *  6. RAB Pelaksanaan Swakelola
 *  7. Surat Permintaan Penawaran Harga
 *  8. BA Evaluasi & Penetapan Penyedia
 *  9. BA Klarifikasi & Negosiasi Harga
 * 10. Surat Pesanan (SP)
 * 11. BA Pemeriksaan & Penerimaan Barang
 * 12. Laporan Kemajuan Pekerjaan (Mingguan)
 * 13. BAST Hasil Pekerjaan (TPK → PKA)
 * 14. BAST PKA → Kepala Desa
 * 15. Laporan Realisasi Pelaksanaan Kegiatan
 */

import { Document, Packer, Table, TableRow, Paragraph, TextRun, ExternalHyperlink, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { formatRupiah } from '../data/sampleData';
import {
    FONT, SZ, cell, headerCell,
    p, pCenter, emptyLine,
    buildKopSurat, buildGarudaHeader, buildTPKHeader, buildInfoTable,
    buildSigningBlock, buildTPKSigningBlock,
    makeSection, placeholderDate,
    generateNomorSurat, calcDuration, fallbackLokasi,
} from './wordHelpers';

// ================================================================
// 1. SK TPK (Surat Keputusan Tim Pelaksana Kegiatan)
// ================================================================
function buildSKTPK(activity, vi) {
    return [
        ...buildGarudaHeader(),
        pCenter('KEPUTUSAN KEPALA DESA', { bold: true, size: SZ.lg }),
        pCenter((vi.nama_desa || '').toUpperCase(), { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        pCenter(`NOMOR : ${generateNomorSurat('SK-TPK', activity, vi)}`, { bold: true }),
        ...emptyLine(1),
        pCenter('TENTANG', { bold: true }),
        pCenter('PEMBENTUKAN TIM PELAKSANA KEGIATAN (TPK)', { bold: true }),
        pCenter(`${(activity.nama || '').toUpperCase()} DI DESA ${(vi.nama_desa || '').toUpperCase()}`, { bold: true }),
        pCenter(`TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, { bold: true }),
        ...emptyLine(1),
        pCenter(`KEPALA DESA ${(vi.nama_desa || '').toUpperCase()},`, { bold: true }),
        ...emptyLine(1),
        p('Menimbang :', { bold: true }),
        p('a. bahwa untuk melaksanakan kegiatan pembangunan Desa yang bersumber dari Anggaran Pendapatan dan Belanja Desa (APBDesa) Tahun Anggaran ' + (vi.tahun_anggaran || '....') + ', perlu dibentuk Tim Pelaksana Kegiatan (TPK);'),
        p('b. bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a, perlu menetapkan Keputusan Kepala Desa tentang Pembentukan Tim Pelaksana Kegiatan (TPK).'),
        ...emptyLine(1),
        p('Mengingat :', { bold: true }),
        p('1. Undang-Undang Nomor 6 Tahun 2014 tentang Desa;'),
        p('2. Peraturan Pemerintah Nomor 43 Tahun 2014 tentang Peraturan Pelaksanaan Undang-Undang Nomor 6 Tahun 2014 tentang Desa;'),
        p('3. Peraturan Menteri Dalam Negeri Nomor 20 Tahun 2018 tentang Pengelolaan Keuangan Desa;'),
        p('4. Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 12 Tahun 2019;'),
        ...emptyLine(1),
        pCenter('MEMUTUSKAN :', { bold: true }),
        ...emptyLine(1),
        p('KESATU    : Membentuk Tim Pelaksana Kegiatan (TPK) Pengadaan Barang/Jasa Desa ' + (vi.nama_desa || '...') + ' Tahun Anggaran ' + (vi.tahun_anggaran || '...') + ' dengan susunan keanggotaan sebagaimana tercantum dalam Lampiran Keputusan ini.'),
        p('KEDUA     : TPK mempunyai tugas: (1) Melaksanakan Pengadaan Barang/Jasa secara Swakelola; (2) Memeriksa dan melaporkan hasil Pengadaan kepada Kasi/Kaur.'),
        p('KETIGA    : Segala biaya yang timbul akibat ditetapkannya Keputusan ini dibebankan pada APBDesa.'),
        p('KEEMPAT   : Keputusan ini mulai berlaku pada tanggal ditetapkan.'),
        ...emptyLine(1),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: `Ditetapkan di : ${vi.nama_desa || '......'}`,
            rightRole: `KEPALA DESA ${(vi.nama_desa || '').toUpperCase()},`,
            rightName: vi.kepala_desa || '( .................... )',
        }),
        ...emptyLine(2),
        pCenter('LAMPIRAN SK TPK', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildTPKSigningBlock(vi),
        ...emptyLine(1),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: '',
            rightRole: `KEPALA DESA ${(vi.nama_desa || '').toUpperCase()},`,
            rightName: vi.kepala_desa || '( .................... )',
        }),
    ];
}

// ================================================================
// 2. Surat Penyampaian Dokumen Persiapan Pengadaan
// ================================================================
function buildSuratPenyampaian(activity, vi) {
    return [
        ...buildKopSurat(vi),
        buildInfoTable([
            ['Nomor', generateNomorSurat('SP-DOK', activity, vi)],
            ['Sifat', 'Penting'],
            ['Lampiran', '1 (Satu) Bundel'],
            ['Perihal', 'Penyampaian Dokumen Persiapan Pengadaan Secara Swakelola'],
        ]),
        ...emptyLine(1),
        p(`${vi.nama_desa || '......'}, ${placeholderDate(vi)}`),
        p('Yth. Tim Pelaksana Kegiatan (TPK)'),
        p(`Kegiatan ${activity.nama || '...'} Desa ${vi.nama_desa || '...'}`),
        p('di - TEMPAT'),
        ...emptyLine(1),
        p('Dengan hormat,', { bold: true }),
        p(`Menindaklanjuti Keputusan Kepala Desa ${vi.nama_desa || '...'} tentang Penetapan Tim Pelaksana Kegiatan (TPK) dan Dokumen Pelaksanaan Anggaran (DPA) Tahun Anggaran ${vi.tahun_anggaran || '...'}, bersama ini kami sampaikan Dokumen Persiapan Pengadaan Secara Swakelola untuk kegiatan:`),
        pCenter(`"${activity.nama || '...'}"`, { bold: true }),
        ...emptyLine(1),
        p('Adapun dokumen persiapan yang kami lampirkan terdiri dari:'),
        p('1. Jadwal Pelaksanaan Kegiatan;'),
        p('2. Rencana Penggunaan Tenaga Kerja, Kebutuhan Bahan, dan Peralatan;'),
        p('3. Gambar Rencana Kerja;'),
        p('4. Spesifikasi Teknis; dan'),
        p('5. Rencana Anggaran Biaya (RAB) Pengadaan.'),
        ...emptyLine(1),
        p('Demikian surat penyampaian ini kami buat untuk dilaksanakan sebagaimana mestinya.'),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: 'PELAKSANA KEGIATAN ANGGARAN',
            rightRole: '',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 3. Jadwal Pelaksanaan Kegiatan Swakelola
// ================================================================
function buildJadwalPelaksanaan(activity, vi) {
    return [
        pCenter('JADWAL PELAKSANAAN KEGIATAN SWAKELOLA', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Desa', vi.nama_desa || '...'],
            ['Kecamatan', vi.kecamatan || '...'],
            ['Kabupaten', vi.kabupaten || '...'],
            ['Jenis Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
            ['Volume', activity.volume || '1 Paket'],
            ['Waktu Pelaksanaan', calcDuration(activity)],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({
                    children: [
                        headerCell('NO', 600),
                        headerCell('URAIAN PEKERJAAN', 3600),
                        headerCell('BULAN KE-1', 1800),
                        headerCell('BULAN KE-2', 1800),
                    ],
                }),
                ...['PERSIAPAN\n(Pembersihan lahan, Pasang Bowplank)', 'BELANJA MATERIAL\n(Semen, Pasir, Batu, dll)', 'PENGERJAAN FISIK UTAMA\n(Galian, Pondasi, Pasangan)', 'FINISHING & PELAPORAN\n(Plesteran akhir, Bersih-bersih, Laporan)'].map((label, i) =>
                    new TableRow({
                        children: [
                            cell(String(i + 1), { alignment: 'center', width: 600 }),
                            cell(label, { bold: true, width: 3600 }),
                            cell(i < 2 ? 'v' : '-', { alignment: 'center', width: 1800 }),
                            cell(i >= 2 ? 'v' : '-', { alignment: 'center', width: 1800 }),
                        ],
                    })
                ),
            ],
            width: { size: 7800, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: 'Dibuat Oleh,',
            rightRole: 'PELAKSANA KEGIATAN ANGGARAN',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 4. Rencana Penggunaan Tenaga Kerja, Bahan, Peralatan
// ================================================================
function buildRencanaPenggunaan(activity, vi) {
    return [
        pCenter('RENCANA PENGGUNAAN TENAGA KERJA,', { bold: true, size: SZ.lg }),
        pCenter('KEBUTUHAN BAHAN DAN PERALATAN', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Jenis Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
            ['Volume', activity.volume || '1 Paket'],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({
                    children: [
                        headerCell('NO', 600),
                        headerCell('URAIAN', 3000),
                        headerCell('VOLUME', 1200),
                        headerCell('SATUAN', 1200),
                        headerCell('KETERANGAN', 2400),
                    ],
                }),
                // I. TENAGA KERJA
                new TableRow({ children: [cell('I.', { bold: true, width: 600 }), cell('TENAGA KERJA', { bold: true, width: 3000, colspan: 4 })] }),
                ...['Kepala Tukang', 'Tukang Batu', 'Pekerja / Kuli'].map((name, i) =>
                    new TableRow({
                        children: [
                            cell(String(i + 1), { alignment: 'center', width: 600 }),
                            cell(name, { width: 3000 }),
                            cell('...', { alignment: 'center', width: 1200 }),
                            cell('OH', { alignment: 'center', width: 1200 }),
                            cell(i === 0 ? '(Org x Hari)' : '', { width: 2400, italics: true }),
                        ],
                    })
                ),
                // II. BAHAN / MATERIAL
                new TableRow({ children: [cell('II.', { bold: true, width: 600 }), cell('BAHAN / MATERIAL', { bold: true, width: 3000, colspan: 4 })] }),
                ...['Semen (PC 40kg)', 'Pasir Pasang', 'Batu Belah 15/20', 'Benang Nilon', 'Paku (Campur)'].map((name, i) =>
                    new TableRow({
                        children: [
                            cell(String(i + 1), { alignment: 'center', width: 600 }),
                            cell(name, { width: 3000 }),
                            cell('...', { alignment: 'center', width: 1200 }),
                            cell(['Zak', 'm³', 'm³', 'Roll', 'Kg'][i], { alignment: 'center', width: 1200 }),
                            cell('', { width: 2400 }),
                        ],
                    })
                ),
                // III. PERALATAN
                new TableRow({ children: [cell('III.', { bold: true, width: 600 }), cell('PERALATAN', { bold: true, width: 3000, colspan: 4 })] }),
                ...['Papan Nama Proyek', 'Ember Cor', 'Sewa Molen'].map((name, i) =>
                    new TableRow({
                        children: [
                            cell(String(i + 1), { alignment: 'center', width: 600 }),
                            cell(name, { width: 3000 }),
                            cell('...', { alignment: 'center', width: 1200 }),
                            cell(['Bh', 'Bh', 'Hari'][i], { alignment: 'center', width: 1200 }),
                            cell(['Cetak Banner', 'Beli', 'Sewa'][i], { width: 2400, italics: true }),
                        ],
                    })
                ),
            ],
            width: { size: 8400, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: 'Dibuat Oleh,',
            rightRole: 'PELAKSANA KEGIATAN ANGGARAN',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 5. Spesifikasi Teknis Kegiatan Swakelola
// ================================================================
function buildSpesifikasiTeknis(activity, vi) {
    return [
        pCenter('SPESIFIKASI TEKNIS KEGIATAN SWAKELOLA', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Desa', vi.nama_desa || '...'],
            ['Jenis Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('NO', 600), headerCell('URAIAN PEKERJAAN / BAHAN', 3600), headerCell('SPESIFIKASI & SYARAT TEKNIS', 4200)] }),
                // I. SPESIFIKASI BAHAN
                new TableRow({ children: [cell('I', { bold: true, width: 600 }), cell('SPESIFIKASI BAHAN (MATERIAL)', { bold: true, width: 3600, colspan: 2 })] }),
                ...['Semen|Tipe PCC, Kemasan 40kg, Ber-SNI, Tidak menggumpal.', 'Pasir Pasang|Butiran tajam/kasar, bersih dari lumpur, warna hitam/abu.', 'Batu Belah|Batu kali/gunung yang keras, tidak keropos, ukuran 15-20 cm.'].map((item, i) => {
                    const [name, spec] = item.split('|');
                    return new TableRow({
                        children: [
                            cell(String(i + 1), { alignment: 'center', width: 600 }),
                            cell(name, { width: 3600 }),
                            cell(spec, { width: 4200 }),
                        ],
                    });
                }),
                // II. SPESIFIKASI CARA PENGERJAAN
                new TableRow({ children: [cell('II', { bold: true, width: 600 }), cell('SPESIFIKASI CARA PENGERJAAN', { bold: true, width: 3600, colspan: 2 })] }),
                ...['Galian Tanah|Galian harus mencapai tanah keras. Dasar galian diratakan.', 'Campuran Adukan|Perbandingan 1 Semen : 4 Pasir. Air secukupnya.', 'Pemasangan Batu|Batu harus dibasahi dulu. Rongga antar batu wajib terisi penuh adukan.'].map((item, i) => {
                    const [name, spec] = item.split('|');
                    return new TableRow({
                        children: [
                            cell(String(i + 1), { alignment: 'center', width: 600 }),
                            cell(name, { width: 3600 }),
                            cell(spec, { width: 4200 }),
                        ],
                    });
                }),
            ],
            width: { size: 8400, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: 'Dibuat Oleh,',
            rightRole: 'PELAKSANA KEGIATAN ANGGARAN',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 6. RAB Pelaksanaan Swakelola
// ================================================================
function buildRABSwakelola(activity, vi) {
    const anggaran = Number(activity.anggaran || 0);
    return [
        pCenter('RENCANA ANGGARAN BIAYA (RAB)', { bold: true, size: SZ.lg }),
        pCenter('PELAKSANAAN SWAKELOLA', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Bidang', activity.bidang || '...'],
            ['Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
            ['Volume', activity.volume || '1 Paket'],
            ['Waktu', calcDuration(activity)],
            ['Tahun Anggaran', vi.tahun_anggaran || '...'],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({
                    children: [
                        headerCell('NO', 500),
                        headerCell('URAIAN PEKERJAAN', 2600),
                        headerCell('VOLUME', 900),
                        headerCell('SATUAN', 900),
                        headerCell('HARGA SATUAN (Rp)', 1500),
                        headerCell('JUMLAH TOTAL (Rp)', 1500),
                    ],
                }),
                // Sub-categories
                ...['I. BELANJA BAHAN BAKU / MATERIAL', 'II. BELANJA PERALATAN', 'III. UPAH TENAGA KERJA (HOK)', 'IV. BIAYA OPERASIONAL (Jika Ada)'].map((cat, i) =>
                    new TableRow({
                        children: [
                            cell('', { bold: true, width: 500 }),
                            cell(cat, { bold: true, width: 2600, colspan: 5 }),
                        ],
                    })
                ),
                // Total
                new TableRow({
                    children: [
                        cell('', { width: 500 }),
                        cell('TOTAL BIAYA (I + II + III + IV)', { bold: true, width: 2600, colspan: 4 }),
                        cell(formatRupiah(anggaran), { bold: true, alignment: 'right', width: 1500 }),
                    ],
                }),
            ],
            width: { size: 7900, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi),
    ];
}

// ================================================================
// 7. Surat Permintaan Penawaran Harga
// ================================================================
function buildSuratPermintaanPenawaran(activity, vi) {
    return [
        ...buildTPKHeader(vi),
        buildInfoTable([
            ['Nomor', generateNomorSurat('SPH', activity, vi)],
            ['Lampiran', 'Daftar Barang'],
            ['Perihal', 'Permintaan Penawaran Harga'],
        ]),
        ...emptyLine(1),
        p('Kepada Yth.'),
        p('Pimpinan Toko Bangunan ..............................'),
        p('di –'),
        p('TEMPAT'),
        ...emptyLine(1),
        p('Dengan hormat,'),
        p(`Sehubungan dengan akan dilaksanakannya kegiatan ${activity.nama || '...'} di Desa ${vi.nama_desa || '...'} Tahun Anggaran ${vi.tahun_anggaran || '...'} dengan metode Swakelola, kami selaku Tim Pelaksana Kegiatan (TPK) bermaksud melakukan pengadaan material/bahan bangunan.`),
        p('Untuk keperluan tersebut, kami mohon Saudara dapat menyampaikan penawaran harga untuk barang-barang sebagaimana terlampir.'),
        p('Surat Penawaran dari Saudara harap kami terima paling lambat tanggal .............................. ' + (vi.tahun_anggaran || '20XX') + '.'),
        p('Demikian kami sampaikan, atas kerja samanya diucapkan terima kasih.'),
        ...buildSigningBlock(vi, {
            leftTitle: '', leftRole: '', leftName: '',
            rightTitle: 'Ketua TPK,',
            rightRole: '',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 8. BA Evaluasi & Penetapan Calon Penyedia
// ================================================================
function buildBAEvaluasi(activity, vi) {
    return [
        ...buildTPKHeader(vi),
        pCenter('BERITA ACARA EVALUASI DAN PENETAPAN CALON PENYEDIA', { bold: true }),
        pCenter(`Nomor : ${generateNomorSurat('BA-EVL', activity, vi)}`),
        ...emptyLine(1),
        p(`Pada hari ini .................... tanggal .................... bulan .................... tahun ${vi.tahun_anggaran || '20XX'}, TPK Desa ${vi.nama_desa || '...'} telah melaksanakan evaluasi terhadap penawaran yang masuk, dengan hasil sebagai berikut:`),
        ...emptyLine(1),
        p('1. DATA PENAWARAN YANG MASUK:', { bold: true }),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('NO', 500), headerCell('NAMA TOKO', 3000), headerCell('TOTAL HARGA PENAWARAN (Rp)', 2800), headerCell('KELENGKAPAN', 2000)] }),
                new TableRow({ children: [cell('1', { alignment: 'center', width: 500 }), cell('TB. ........................', { width: 3000 }), cell('Rp ......................', { width: 2800 }), cell('LENGKAP', { alignment: 'center', width: 2000 })] }),
                new TableRow({ children: [cell('2', { alignment: 'center', width: 500 }), cell('TB. ........................', { width: 3000 }), cell('Rp ......................', { width: 2800 }), cell('LENGKAP', { alignment: 'center', width: 2000 })] }),
            ],
            width: { size: 8300, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('2. HASIL PERBANDINGAN HARGA SATUAN:', { bold: true }),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('NO', 500), headerCell('JENIS BARANG', 2400), headerCell('HARGA TOKO A', 1800), headerCell('HARGA TOKO B', 1800), headerCell('LEBIH MURAH', 1500)] }),
                ...['Semen PC 40 Kg', 'Pasir Pasang', 'Batu Belah'].map((item, i) =>
                    new TableRow({ children: [cell(String(i + 1), { alignment: 'center', width: 500 }), cell(item, { width: 2400 }), cell('...........', { alignment: 'right', width: 1800 }), cell('...........', { alignment: 'right', width: 1800 }), cell('TOKO ...', { bold: true, alignment: 'center', width: 1500 })] })
                ),
            ],
            width: { size: 8000, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('3. KESIMPULAN & PENETAPAN:', { bold: true }),
        p('Nama Toko    : ..............................', { bold: true }),
        p('Alasan       : Harga Lebih Murah dan Spesifikasi Sesuai.', { bold: true }),
        ...emptyLine(1),
        p('Tim Pelaksana Kegiatan'),
        buildTPKSigningBlock(vi),
    ];
}

// ================================================================
// 9. BA Klarifikasi & Negosiasi Harga
// ================================================================
function buildBAKlarifikasi(activity, vi) {
    return [
        ...buildTPKHeader(vi),
        pCenter('BERITA ACARA KLARIFIKASI DAN NEGOSIASI HARGA', { bold: true }),
        pCenter(`Nomor : ${generateNomorSurat('BA-KLR', activity, vi)}`),
        ...emptyLine(1),
        p(`Pada hari ini .................... tanggal .................... bulan .................... tahun ${vi.tahun_anggaran || '20XX'}, bertempat di Kantor Desa ${vi.nama_desa || '...'}, kami Tim Pelaksana Kegiatan (TPK) telah melakukan klarifikasi dan negosiasi harga kepada:`),
        buildInfoTable([
            ['Nama Toko / Penyedia', '..............................'],
            ['Alamat', '..............................'],
        ]),
        ...emptyLine(1),
        p('Adapun hasil negosiasi adalah sebagai berikut:'),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('NO', 500), headerCell('JENIS BARANG', 2000), headerCell('VOLUME', 1000), headerCell('HARGA TOKO (Rp)', 1600), headerCell('HARGA SETELAH DITAWAR (Rp)', 1800), headerCell('KET', 1000)] }),
                ...['Semen PC 40 Kg', 'Pasir Pasang', 'Batu Belah'].map((item, i) =>
                    new TableRow({ children: [cell(String(i + 1), { alignment: 'center', width: 500 }), cell(item, { width: 2000 }), cell('...', { alignment: 'center', width: 1000 }), cell('...........', { alignment: 'right', width: 1600 }), cell('...........', { alignment: 'right', width: 1800 }), cell('Sepakat', { italics: true, width: 1000 })] })
                ),
                new TableRow({ children: [cell('', { width: 500 }), cell('TOTAL HARGA', { bold: true, width: 2000 }), cell('', { width: 1000 }), cell('Rp ............', { bold: true, width: 1600 }), cell('Rp ............', { bold: true, width: 1800 }), cell('HEMAT', { bold: true, width: 1000 })] }),
            ],
            width: { size: 7900, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('KESIMPULAN: Dari hasil negosiasi tersebut, pihak Toko/Penyedia MENYETUJUI harga penawaran dari TPK.', { bold: true }),
        ...emptyLine(1),
        p('Tim Pelaksana Kegiatan (TPK)'),
        buildTPKSigningBlock(vi),
    ];
}

// ================================================================
// 10. Surat Pesanan (SP)
// ================================================================
function buildSuratPesanan(activity, vi) {
    return [
        ...buildTPKHeader(vi),
        pCenter('SURAT PESANAN (SP)', { bold: true, size: SZ.lg }),
        pCenter(`Nomor : ${generateNomorSurat('SP', activity, vi)}`),
        p(`Paket Pekerjaan : Pengadaan Bahan Material ${activity.nama || '...'}`),
        ...emptyLine(1),
        p('Kepada Yth.', { bold: true }),
        p('Pimpinan Toko / TB ..............................'),
        p('di – TEMPAT'),
        ...emptyLine(1),
        p('Yang bertanda tangan di bawah ini:'),
        buildInfoTable([
            ['Nama', '..............................'],
            ['Jabatan', 'Ketua Tim Pelaksana Kegiatan (TPK)'],
            ['Alamat', `Desa ${vi.nama_desa || '...'}, Kec. ${vi.kecamatan || '...'}, Kab. ${vi.kabupaten || '...'}`],
        ]),
        p('Selanjutnya disebut sebagai PEMESAN, memerintahkan kepada:', { bold: true }),
        buildInfoTable([
            ['Nama Toko / CV', '..............................'],
            ['Alamat', '..............................'],
            ['NPWP (Jika Ada)', '..............................'],
        ]),
        p('Selanjutnya disebut sebagai PENYEDIA, untuk mengirimkan barang dengan rincian terlampir.', { bold: true }),
        ...emptyLine(1),
        p('SYARAT-SYARAT PEMESANAN:', { bold: true }),
        p('1. Waktu Pengiriman: Barang harus dikirim paling lambat tanggal .................... ke lokasi proyek.'),
        p('2. Kualitas Barang: Barang yang dikirim harus baru, baik, dan sesuai spesifikasi.'),
        p('3. Pembayaran: Dilakukan setelah barang diterima 100% dalam keadaan baik.'),
        p('4. Sanksi: Jika terlambat, dikenakan denda keterlambatan sesuai aturan.'),
        ...emptyLine(1),
        ...buildSigningBlock(vi, {
            leftTitle: 'Penerima Pesanan,',
            leftRole: 'Penyedia',
            leftName: '( .................... )',
            rightTitle: 'Pemesan,',
            rightRole: 'Tim Pelaksana Kegiatan (TPK)',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 11. BA Pemeriksaan & Penerimaan Barang
// ================================================================
function buildBAPemeriksaan(activity, vi) {
    return [
        ...buildTPKHeader(vi),
        pCenter('BERITA ACARA PEMERIKSAAN DAN PENERIMAAN BARANG', { bold: true }),
        pCenter(`Nomor : ${generateNomorSurat('BA-PMR', activity, vi)}`),
        ...emptyLine(1),
        p(`Pada hari ini .................... tanggal .................... bulan .................... tahun ${vi.tahun_anggaran || '20XX'}, bertempat di Lokasi Pembangunan, kami Tim Pelaksana Kegiatan (TPK) Desa ${vi.nama_desa || '...'} telah melakukan pemeriksaan terhadap barang yang dikirim oleh:`),
        p('Nama Toko / Penyedia : ..............................', { bold: true }),
        ...emptyLine(1),
        p('Adapun hasil pemeriksaan adalah sebagai berikut:'),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('NO', 500), headerCell('JENIS BARANG', 2200), headerCell('VOL PESANAN', 1300), headerCell('VOL DITERIMA', 1300), headerCell('HASIL KUALITAS', 1500), headerCell('KET', 800)] }),
                ...['Semen PC 40 Kg', 'Pasir Pasang', 'Batu Belah'].map((item, i) =>
                    new TableRow({ children: [cell(String(i + 1), { alignment: 'center', width: 500 }), cell(item, { width: 2200 }), cell('...', { alignment: 'center', width: 1300 }), cell('...', { bold: true, alignment: 'center', width: 1300 }), cell('BAIK / BARU', { bold: true, alignment: 'center', width: 1500 }), cell('OK', { bold: true, alignment: 'center', width: 800 })] })
                ),
            ],
            width: { size: 7600, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('KESIMPULAN: TPK menyatakan bahwa barang-barang tersebut telah DITERIMA DALAM KEADAAN BAIK DAN LENGKAP sesuai dengan spesifikasi yang disyaratkan.', { bold: true }),
        ...emptyLine(1),
        ...buildSigningBlock(vi, {
            leftTitle: 'Yang Menyerahkan,',
            leftRole: 'Penyedia',
            leftName: '( .................... )',
            rightTitle: 'Yang Memeriksa & Menerima,',
            rightRole: 'Tim Pelaksana Kegiatan (TPK)',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 12. Laporan Kemajuan Pekerjaan (Mingguan)
// ================================================================
function buildLaporanKemajuan(activity, vi) {
    const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
    return [
        ...buildTPKHeader(vi),
        pCenter('LAPORAN KEMAJUAN PEKERJAAN (MINGGUAN)', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
            ['Minggu Ke-', '...... (Satu / Dua / Tiga)'],
            ['Periode Tanggal', activity.mulai && activity.selesai ? `${activity.mulai} s/d ${activity.selesai}` : '........... s/d ........... ' + (vi.tahun_anggaran || '20XX')],
        ]),
        ...emptyLine(1),
        p('Rekapitulasi Kegiatan Harian', { bold: true }),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('HARI / TANGGAL', 1800), headerCell('JENIS PEKERJAAN YANG DILAKUKAN', 3000), headerCell('CUACA', 900), headerCell('JML PEKERJA', 1200), headerCell('KET', 800)] }),
                ...days.map(day =>
                    new TableRow({
                        children: [
                            cell(`${day}\n(../..)`, { bold: true, width: 1800 }),
                            cell(day === 'JUMAT' || day === 'MINGGU' ? '(LIBUR)' : '(Isi pekerjaan hari ini)', { italics: true, width: 3000 }),
                            cell(day === 'JUMAT' || day === 'MINGGU' ? '-' : 'Cerah', { alignment: 'center', width: 900 }),
                            cell(day === 'JUMAT' || day === 'MINGGU' ? '-' : 'Tk:.. Pk:..', { alignment: 'center', width: 1200 }),
                            cell('', { width: 800 }),
                        ],
                    })
                ),
            ],
            width: { size: 7700, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('Estimasi Capaian Progres', { bold: true }),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('URAIAN', 2400), headerCell('MINGGU LALU (%)', 1800), headerCell('MINGGU INI (%)', 1800), headerCell('TOTAL (%)', 1800)] }),
                new TableRow({ children: [cell('Kemajuan Fisik', { bold: true, width: 2400 }), cell('... %', { alignment: 'center', width: 1800 }), cell('+ ... %', { alignment: 'center', width: 1800 }), cell(`= ${activity.progres || '...'}%`, { bold: true, alignment: 'center', width: 1800 })] }),
            ],
            width: { size: 7800, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('CATATAN / HAMBATAN MINGGU INI:', { bold: true }),
        p('(Isi jika ada masalah, misal: Hujan terus menerus selama 2 hari, atau pengiriman pasir terlambat)', { italics: true }),
        ...buildSigningBlock(vi, {
            leftTitle: 'Diperiksa Oleh,',
            leftRole: 'Pelaksana Kegiatan Anggaran',
            leftName: '( .................... )',
            rightTitle: 'Dibuat Oleh,',
            rightRole: 'Tim Pelaksana Kegiatan (TPK)',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 13. BAST Hasil Pekerjaan (TPK → PKA)
// ================================================================
function buildBASTtpk(activity, vi) {
    return [
        ...buildTPKHeader(vi),
        pCenter('BERITA ACARA SERAH TERIMA HASIL PEKERJAAN', { bold: true, size: SZ.lg }),
        pCenter(`Nomor : ${generateNomorSurat('BAST-TPK', activity, vi)}`),
        ...emptyLine(1),
        p(`Pada hari ini .................... tanggal .................... bulan .................... tahun ${vi.tahun_anggaran || '20XX'}, kami yang bertanda tangan di bawah ini:`),
        p(`1. Nama    : ${activity.pelaksana || '..............................'}`, { bold: true }),
        p('   Jabatan : Ketua Tim Pelaksana Kegiatan (TPK)', { bold: true }),
        p('   Selanjutnya disebut PIHAK KESATU.'),
        ...emptyLine(1),
        p(`2. Nama    : ${activity.pelaksana || '..............................'}`, { bold: true }),
        p('   Jabatan : Pelaksana Kegiatan Anggaran (PKA)', { bold: true }),
        p('   Selanjutnya disebut PIHAK KEDUA.'),
        ...emptyLine(1),
        p('Menyatakan dengan sebenarnya bahwa:'),
        p(`1. PIHAK KESATU telah menyelesaikan pelaksanaan kegiatan:`),
        p(`   - Jenis Kegiatan : ${activity.nama || '...'}`, { bold: true }),
        p(`   - Lokasi         : ${fallbackLokasi(activity, vi)}`, { bold: true }),
        p(`   - Anggaran       : ${formatRupiah(activity.anggaran || 0)}`, { bold: true }),
        p('2. Pekerjaan tersebut telah diselesaikan 100% (Seratus Persen) dengan baik.', { bold: true }),
        p('3. PIHAK KESATU menyerahkan hasil pekerjaan tersebut kepada PIHAK KEDUA.'),
        p('4. Dengan ditandatanganinya Berita Acara ini, maka tugas PIHAK KESATU dinyatakan selesai.'),
        ...emptyLine(1),
        p('Demikian Berita Acara Serah Terima ini dibuat dalam rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya.'),
        ...buildSigningBlock(vi, {
            leftTitle: 'PIHAK KEDUA,',
            leftRole: 'Pelaksana Kegiatan Anggaran',
            leftName: '( .................... )',
            rightTitle: 'PIHAK KESATU,',
            rightRole: 'Tim Pelaksana Kegiatan (TPK)',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 14. BAST PKA → Kepala Desa
// ================================================================
function buildBASTkades(activity, vi) {
    return [
        ...buildKopSurat(vi),
        pCenter('BERITA ACARA SERAH TERIMA HASIL PEKERJAAN', { bold: true, size: SZ.lg }),
        pCenter('DARI PELAKSANA KEGIATAN KEPADA KEPALA DESA', { bold: true }),
        pCenter(`Nomor : ${generateNomorSurat('BAST-KDS', activity, vi)}`),
        ...emptyLine(1),
        p(`Pada hari ini .................... tanggal .................... bulan .................... tahun ${vi.tahun_anggaran || '20XX'}, kami yang bertanda tangan di bawah ini:`),
        p(`1. Nama    : ${activity.pelaksana || '..............................'}`, { bold: true }),
        p(`   Jabatan : Pelaksana Kegiatan Anggaran (PKA) — Selanjutnya disebut PIHAK KESATU.`),
        ...emptyLine(1),
        p(`2. Nama    : ${vi.kepala_desa || '..............................'}`, { bold: true }),
        p(`   Jabatan : Kepala Desa ${vi.nama_desa || '...'} — Selanjutnya disebut PIHAK KEDUA.`),
        ...emptyLine(1),
        p('Menyatakan dengan sebenarnya bahwa:'),
        p('1. PIHAK KESATU telah menerima hasil pekerjaan dari TPK dan menyatakan layak fungsi.'),
        p('2. Selanjutnya PIHAK KESATU menyerahkan hasil pekerjaan tersebut kepada PIHAK KEDUA, dengan rincian:'),
        p(`   - Jenis Kegiatan : ${activity.nama || '...'}`, { bold: true }),
        p(`   - Lokasi         : ${fallbackLokasi(activity, vi)}`, { bold: true }),
        p(`   - Nilai Aset     : ${formatRupiah(activity.realisasi || activity.anggaran || 0)} (Sesuai Realisasi)`, { bold: true }),
        p('3. PIHAK KEDUA menerima penyerahan hasil pekerjaan tersebut untuk selanjutnya dicatat sebagai Aset / Inventaris Desa.', { bold: true }),
        ...emptyLine(1),
        p('Demikian Berita Acara Serah Terima ini dibuat untuk dipergunakan sebagaimana mestinya.'),
        ...buildSigningBlock(vi, {
            leftTitle: 'PIHAK KEDUA,',
            leftRole: `KEPALA DESA ${(vi.nama_desa || '').toUpperCase()}`,
            leftName: vi.kepala_desa || '( .................... )',
            rightTitle: 'PIHAK KESATU,',
            rightRole: 'PELAKSANA KEGIATAN ANGGARAN',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 15. Laporan Realisasi Pelaksanaan Kegiatan
// ================================================================
function buildLaporanRealisasi(activity, vi) {
    const anggaran = Number(activity.anggaran || 0);
    const realisasi = Number(activity.realisasi || 0);
    const sisa = anggaran - realisasi;
    return [
        ...buildKopSurat(vi),
        pCenter('LAPORAN REALISASI PELAKSANAAN KEGIATAN', { bold: true, size: SZ.lg }),
        pCenter(`TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, { bold: true }),
        ...emptyLine(1),
        buildInfoTable([
            ['Bidang', activity.bidang || '...'],
            ['Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
            ['Penyedia/TPK', `Tim Pelaksana Kegiatan (TPK) — ${activity.pelaksana || '......'}`],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({
                    children: [
                        headerCell('NO', 500),
                        headerCell('URAIAN BELANJA', 2600),
                        headerCell('ANGGARAN / PAGU (Rp)', 1600),
                        headerCell('REALISASI (Rp)', 1600),
                        headerCell('SELISIH / SISA (Rp)', 1600),
                        headerCell('KET', 600),
                    ],
                }),
                ...['I. BELANJA BAHAN BAKU', 'II. BELANJA PERALATAN', 'III. BELANJA UPAH (HOK)', 'IV. BELANJA OPERASIONAL'].map((cat, i) =>
                    new TableRow({
                        children: [
                            cell('', { width: 500 }),
                            cell(cat, { bold: true, width: 2600 }),
                            cell('....................', { alignment: 'right', width: 1600 }),
                            cell('....................', { alignment: 'right', width: 1600 }),
                            cell('....................', { alignment: 'right', width: 1600 }),
                            cell('', { width: 600 }),
                        ],
                    })
                ),
                new TableRow({
                    children: [
                        cell('', { width: 500 }),
                        cell('JUMLAH TOTAL', { bold: true, width: 2600 }),
                        cell(formatRupiah(anggaran), { bold: true, alignment: 'right', width: 1600 }),
                        cell(formatRupiah(realisasi), { bold: true, alignment: 'right', width: 1600 }),
                        cell(formatRupiah(sisa), { bold: true, alignment: 'right', width: 1600 }),
                        cell('100%', { bold: true, alignment: 'center', width: 600 }),
                    ],
                }),
            ],
            width: { size: 8500, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('CATATAN PENTING:', { bold: true }),
        p(`1. Realisasi fisik kegiatan telah mencapai ${activity.progres || '...'}%.`),
        p(`2. Selisih anggaran sebesar ${formatRupiah(sisa)} (Jika Ada) telah dikembalikan ke Rekening Kas Desa.`),
        p('Demikian laporan ini dibuat sebagai bentuk pertanggungjawaban pelaksanaan kegiatan.'),
        ...buildSigningBlock(vi),
    ];
}

// ================================================================
// MAIN EXPORT FUNCTION — LPJ Fisik Bundel
// ================================================================
export async function exportLPJFisikToWord(activity, villageInfo, attachments = []) {
    const vi = villageInfo;
    const act = activity;

    const sections = [
        makeSection(buildSKTPK(act, vi)),
        makeSection(buildSuratPenyampaian(act, vi)),
        makeSection(buildJadwalPelaksanaan(act, vi)),
        makeSection(buildRencanaPenggunaan(act, vi)),
        makeSection(buildSpesifikasiTeknis(act, vi)),
        makeSection(buildRABSwakelola(act, vi)),
        makeSection(buildSuratPermintaanPenawaran(act, vi)),
        makeSection(buildBAEvaluasi(act, vi)),
        makeSection(buildBAKlarifikasi(act, vi)),
        makeSection(buildSuratPesanan(act, vi)),
        makeSection(buildBAPemeriksaan(act, vi)),
        makeSection(buildLaporanKemajuan(act, vi)),
        makeSection(buildBASTtpk(act, vi)),
        makeSection(buildBASTkades(act, vi)),
        makeSection(buildLaporanRealisasi(act, vi)),
    ];

    // ── 16. Daftar Bukti Lampiran (jika ada) ──
    if (attachments.length > 0) {
        const lampiranChildren = [
            ...buildKopSurat(vi),
            pCenter('DAFTAR BUKTI LAMPIRAN', { bold: true, size: SZ.xl }),
            pCenter(`Kegiatan: ${act.nama || '-'}`, { size: SZ.md }),
            ...emptyLine(1),
            p(`Berikut adalah daftar ${attachments.length} dokumen bukti yang telah diunggah untuk kegiatan ini:`, { size: SZ.sm }),
            ...emptyLine(1),
        ];

        // Table of attachments
        const rows = [
            new TableRow({
                children: [
                    headerCell('No', 500),
                    headerCell('Nama Dokumen', 5000),
                    headerCell('Nama File', 3000),
                ],
            }),
        ];

        attachments.forEach((att, idx) => {
            rows.push(new TableRow({
                children: [
                    cell(String(idx + 1), { alignment: 'center', width: 500 }),
                    cell(att.keterangan || att.file_name, { width: 5000 }),
                    cell(att.file_name, { width: 3000, size: SZ.xs }),
                ],
            }));
        });

        lampiranChildren.push(
            new Table({ rows, width: { size: 8500, type: WidthType.DXA } }),
            ...emptyLine(1),
        );

        // Hyperlinks list
        lampiranChildren.push(
            p('Link Dokumen Digital:', { bold: true, size: SZ.sm }),
        );
        attachments.forEach((att, idx) => {
            const label = `${idx + 1}. ${att.keterangan || att.file_name}`;
            if (att.file_url) {
                lampiranChildren.push(
                    new Paragraph({
                        spacing: { after: 30 },
                        indent: { left: 400 },
                        children: [
                            new ExternalHyperlink({
                                link: att.file_url,
                                children: [
                                    new TextRun({ text: label, size: SZ.sm, font: FONT, color: '1155CC', underline: {} }),
                                ],
                            }),
                        ],
                    }),
                );
            } else {
                lampiranChildren.push(p(label, { size: SZ.sm }));
            }
        });

        sections.push(makeSection(lampiranChildren));
    }

    const doc = new Document({
        creator: 'Sistem LPJ Desa',
        title: `LPJ Fisik - ${act.nama || 'Kegiatan'}`,
        description: 'Laporan Pertanggungjawaban Kegiatan Fisik (Swakelola)',
        sections,
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (act.nama || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = `LPJ_Fisik_${safeName}.docx`;
    saveAs(blob, fileName);

    return fileName;
}
