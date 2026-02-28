/**
 * ================================================================
 * Export LPJ Non-Fisik — Full Document Bundle
 * ================================================================
 * Generates a Word document with 7 official sections for
 * non-physical activities (pengadaan barang/jasa via penyedia).
 *
 * Sections:
 *  1. Kerangka Acuan Kerja (KAK)
 *  2. Spesifikasi Teknis Barang/Jasa
 *  3. Harga Perkiraan Sendiri (HPS)
 *  4. BA / Lembar Hasil Survei Harga
 *  5. Analisis Harga Satuan Pekerjaan
 *  6. RAB Pengadaan via Penyedia
 *  7. Laporan Realisasi Pelaksanaan Kegiatan
 */

import { Document, Packer, Table, TableRow, Paragraph, TextRun, ExternalHyperlink, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { formatRupiah } from '../data/sampleData';
import {
    SZ, FONT, cell, headerCell,
    p, pCenter, emptyLine,
    buildKopSurat, buildInfoTable, buildSigningBlock,
    makeSection,
    calcDuration, fallbackLokasi,
} from './wordHelpers';

// ================================================================
// 1. Kerangka Acuan Kerja (KAK)
// ================================================================
function buildKAK(activity, vi) {
    return [
        pCenter('KERANGKA ACUAN KERJA (KAK)', { bold: true, size: SZ.lg }),
        pCenter('PENGADAAN BARANG/JASA MELALUI PENYEDIA', { bold: true }),
        ...emptyLine(1),
        buildInfoTable([
            ['Desa', vi.nama_desa || '...'],
            ['Kecamatan', vi.kecamatan || '...'],
            ['Kabupaten', vi.kabupaten || '...'],
            ['Kegiatan', activity.nama || '...'],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('NO', 500), headerCell('URAIAN', 3000), headerCell('KETERANGAN / ISI', 5000)] }),
                ...[
                    ['1', 'Latar Belakang', `Untuk mendukung pelaksanaan kegiatan "${activity.nama || '...'}" di Desa ${vi.nama_desa || '...'}, diperlukan pengadaan barang/jasa melalui penyedia.`],
                    ['2', 'Maksud dan Tujuan', `a. Maksud: Melakukan pengadaan barang/jasa untuk kegiatan ${activity.nama || '...'}.\nb. Tujuan: Tersedianya barang/jasa yang layak pakai sesuai kebutuhan.`],
                    ['3', 'Lokasi Kegiatan', activity.lokasi || `Desa ${vi.nama_desa || '...'}`],
                    ['4', 'Sumber Dana', `APBDesa Tahun Anggaran ${vi.tahun_anggaran || '...'}`],
                    ['5', 'Pagu Anggaran', formatRupiah(activity.anggaran || 0) + ' (Sesuai DPA/RAB)'],
                    ['6', 'Waktu Pelaksanaan', calcDuration(activity)],
                    ['7', 'Spesifikasi Barang/Jasa', 'Terlampir dalam dokumen Spesifikasi Teknis.'],
                    ['8', 'Persyaratan Penyedia', '1. Memiliki Izin Usaha (NIB/SIUP)\n2. Memiliki NPWP yang valid\n3. Memiliki tempat usaha yang jelas\n4. Tidak dalam pengawasan pengadilan/sanksi'],
                    ['9', 'Produk yang Dihasilkan', `Tersedianya barang/jasa dalam kondisi 100% baru dan berfungsi baik.`],
                ].map(([no, uraian, isi]) =>
                    new TableRow({ children: [cell(no, { bold: true, alignment: 'center', width: 500 }), cell(uraian, { bold: true, width: 3000 }), cell(isi, { width: 5000 })] })
                ),
            ],
            width: { size: 8500, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: 'Pelaksana Kegiatan Anggaran',
            rightRole: '',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 2. Spesifikasi Teknis Barang/Jasa
// ================================================================
function buildSpesifikasiBarang(activity, vi) {
    return [
        pCenter('SPESIFIKASI TEKNIS BARANG/JASA', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Desa', vi.nama_desa || '...'],
            ['Kecamatan', vi.kecamatan || '...'],
            ['Kabupaten', vi.kabupaten || '...'],
            ['Jenis Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
            ['Waktu Pelaksanaan', calcDuration(activity)],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('No', 500), headerCell('Nama Barang / Jasa', 2200), headerCell('Spesifikasi Teknis & Kualitas', 2800), headerCell('Volume', 800), headerCell('Satuan', 800), headerCell('Keterangan', 1400)] }),
                ...['1', '2', '3'].map(no =>
                    new TableRow({ children: [cell(no, { alignment: 'center', width: 500 }), cell('[Nama Barang]', { bold: true, width: 2200 }), cell('[Isi spesifikasi detail]', { width: 2800 }), cell('...', { alignment: 'center', width: 800 }), cell('Unit', { alignment: 'center', width: 800 }), cell('', { width: 1400 })] })
                ),
            ],
            width: { size: 8500, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: '', leftRole: '', leftName: '',
            rightTitle: 'Pelaksana Kegiatan Anggaran',
            rightRole: '',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 3. Harga Perkiraan Sendiri (HPS)
// ================================================================
function buildHPS(activity, vi) {
    return [
        pCenter('HARGA PERKIRAAN SENDIRI (HPS)', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Desa', vi.nama_desa || '...'],
            ['Kecamatan', vi.kecamatan || '...'],
            ['Kabupaten', vi.kabupaten || '...'],
            ['Jenis Kegiatan', activity.nama || '...'],
            ['Sumber Data', 'Survei harga pasar / DPA Desa / Katalog harga daerah'],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('No', 500), headerCell('Uraian Barang / Jasa', 2400), headerCell('Volume', 800), headerCell('Satuan', 800), headerCell('Harga Satuan (Rp)', 1600), headerCell('Jumlah Harga (Rp)', 1600), headerCell('Sumber Harga', 1200)] }),
                ...['1', '2', '3'].map(no =>
                    new TableRow({ children: [cell(no, { alignment: 'center', width: 500 }), cell('[Nama Barang]', { width: 2400 }), cell('...', { alignment: 'center', width: 800 }), cell('Unit', { alignment: 'center', width: 800 }), cell('...', { alignment: 'right', width: 1600 }), cell('...', { alignment: 'right', width: 1600 }), cell('Harga Toko', { italics: true, width: 1200 })] })
                ),
                new TableRow({ children: [cell('A', { bold: true, width: 500 }), cell('JUMLAH TOTAL', { bold: true, width: 2400 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1600 }), cell(formatRupiah(activity.anggaran || 0), { bold: true, alignment: 'right', width: 1600 }), cell('', { width: 1200 })] }),
                new TableRow({ children: [cell('B', { bold: true, width: 500 }), cell('PPN 11%', { bold: true, width: 2400 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1600 }), cell('(Jika > Rp 2 Juta)', { italics: true, width: 1600 }), cell('', { width: 1200 })] }),
                new TableRow({ children: [cell('C', { bold: true, width: 500 }), cell('TOTAL HPS (A + B)', { bold: true, width: 2400 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1600 }), cell(formatRupiah(activity.anggaran || 0), { bold: true, alignment: 'right', width: 1600 }), cell('', { width: 1200 })] }),
            ],
            width: { size: 8900, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: 'Ditetapkan Oleh,',
            leftRole: `KEPALA DESA ${(vi.nama_desa || '').toUpperCase()}`,
            leftName: vi.kepala_desa || '( .................... )',
            rightTitle: 'Disusun Oleh,',
            rightRole: 'Pelaksana Kegiatan Anggaran',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 4. BA / Lembar Hasil Survei Harga
// ================================================================
function buildSurveiHarga(activity, vi) {
    return [
        pCenter('BERITA ACARA / LEMBAR HASIL SURVEI HARGA', { bold: true }),
        pCenter('PENGADAAN BARANG/JASA MELALUI PENYEDIA', { bold: true }),
        ...emptyLine(1),
        buildInfoTable([
            ['Desa', vi.nama_desa || '...'],
            ['Kecamatan', vi.kecamatan || '...'],
            ['Kabupaten', vi.kabupaten || '...'],
            ['Jenis Kegiatan', activity.nama || '...'],
            ['Tanggal Survei', '..............................'],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('No', 400), headerCell('Uraian Barang / Jasa', 1800), headerCell('Satuan', 700), headerCell('Harga Toko A (Rp)', 1400), headerCell('Harga Toko B (Rp)', 1400), headerCell('Harga Toko C (Rp)', 1400), headerCell('Harga Terpilih (HPS)', 1400)] }),
                ...['1', '2', '3'].map(no =>
                    new TableRow({ children: [cell(no, { alignment: 'center', width: 400 }), cell('[Nama Barang]', { bold: true, width: 1800 }), cell('Unit', { alignment: 'center', width: 700 }), cell('[...]', { alignment: 'right', width: 1400 }), cell('[...]', { alignment: 'right', width: 1400 }), cell('[...]', { alignment: 'right', width: 1400 }), cell('[Terendah]', { bold: true, alignment: 'right', width: 1400 })] })
                ),
            ],
            width: { size: 8500, type: WidthType.DXA },
        }),
        ...emptyLine(1),
        p('SUMBER DATA:', { bold: true }),
        p('Nama Toko A: ..............................', { bold: true }),
        p('Nama Toko B: ..............................', { bold: true }),
        p('Nama Toko C: ..............................', { bold: true }),
        ...buildSigningBlock(vi, {
            leftTitle: '', leftRole: '', leftName: '',
            rightTitle: 'Pelaksana Kegiatan Anggaran',
            rightRole: '',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 5. Analisis Harga Satuan Pekerjaan
// ================================================================
function buildAnalisisHarga(activity, vi) {
    return [
        pCenter('ANALISIS HARGA SATUAN PEKERJAAN', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Jenis Pekerjaan', activity.nama || '[Misal: 1 m3 Pasangan Batu Belah]'],
            ['Kode Analisa', '[Misal: SNI 2835:2008]'],
            ['Satuan', '[m3 / m2 / m\']'],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('No.', 500), headerCell('Uraian (Tenaga/Bahan/Alat)', 2600), headerCell('Kode', 800), headerCell('Satuan', 800), headerCell('Koefisien', 1000), headerCell('Harga Satuan (Rp)', 1400), headerCell('Jumlah Harga (Rp)', 1400)] }),
                // A. TENAGA KERJA
                new TableRow({ children: [cell('A.', { bold: true, width: 500 }), cell('TENAGA KERJA', { bold: true, width: 2600 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1000 }), cell('', { width: 1400 }), cell('', { width: 1400 })] }),
                ...['Pekerja|L.01|OH', 'Tukang Batu|L.02|OH', 'Kepala Tukang|L.03|OH', 'Mandor|L.04|OH'].map((item, i) => {
                    const [name, kode, sat] = item.split('|');
                    return new TableRow({ children: [cell(String(i + 1), { alignment: 'center', width: 500 }), cell(name, { width: 2600 }), cell(kode, { alignment: 'center', width: 800 }), cell(sat, { alignment: 'center', width: 800 }), cell('[...]', { alignment: 'center', width: 1000 }), cell('[...]', { alignment: 'right', width: 1400 }), cell('[...]', { alignment: 'right', width: 1400 })] });
                }),
                // B. BAHAN
                new TableRow({ children: [cell('B.', { bold: true, width: 500 }), cell('BAHAN', { bold: true, width: 2600 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1000 }), cell('', { width: 1400 }), cell('', { width: 1400 })] }),
                ...['Batu Belah|M.01|m3', 'Semen Portland|M.02|Kg', 'Pasir Pasang|M.03|m3'].map((item, i) => {
                    const [name, kode, sat] = item.split('|');
                    return new TableRow({ children: [cell(String(i + 1), { alignment: 'center', width: 500 }), cell(name, { width: 2600 }), cell(kode, { alignment: 'center', width: 800 }), cell(sat, { alignment: 'center', width: 800 }), cell('[...]', { alignment: 'center', width: 1000 }), cell('[...]', { alignment: 'right', width: 1400 }), cell('[...]', { alignment: 'right', width: 1400 })] });
                }),
                // C. PERALATAN
                new TableRow({ children: [cell('C.', { bold: true, width: 500 }), cell('PERALATAN', { bold: true, width: 2600 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1000 }), cell('', { width: 1400 }), cell('', { width: 1400 })] }),
                new TableRow({ children: [cell('1', { alignment: 'center', width: 500 }), cell('[Misal: Sewa Molen]', { width: 2600 }), cell('E.01', { alignment: 'center', width: 800 }), cell('Jam', { alignment: 'center', width: 800 }), cell('[...]', { alignment: 'center', width: 1000 }), cell('[...]', { alignment: 'right', width: 1400 }), cell('[...]', { alignment: 'right', width: 1400 })] }),
                // TOTAL
                new TableRow({ children: [cell('D.', { bold: true, width: 500 }), cell('TOTAL HARGA SATUAN (A + B + C)', { bold: true, width: 2600 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1000 }), cell('', { width: 1400 }), cell(formatRupiah(activity.anggaran || 0), { bold: true, alignment: 'right', width: 1400 })] }),
            ],
            width: { size: 8500, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: '', leftRole: '', leftName: '',
            rightTitle: 'Pelaksana Kegiatan Anggaran',
            rightRole: '',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 6. RAB Pengadaan via Penyedia
// ================================================================
function buildRABPenyedia(activity, vi) {
    return [
        pCenter('RENCANA ANGGARAN BIAYA (RAB)', { bold: true, size: SZ.lg }),
        ...emptyLine(1),
        buildInfoTable([
            ['Desa', vi.nama_desa || '...'],
            ['Kecamatan', vi.kecamatan || '...'],
            ['Kabupaten', vi.kabupaten || '...'],
            ['Jenis Kegiatan', activity.nama || '...'],
            ['Lokasi', fallbackLokasi(activity, vi)],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({ children: [headerCell('No', 500), headerCell('Uraian Kegiatan', 2200), headerCell('Spesifikasi', 1600), headerCell('Volume', 800), headerCell('Satuan', 800), headerCell('Harga Satuan (Rp)', 1400), headerCell('Jumlah Harga (Rp)', 1400)] }),
                ...['I. PEKERJAAN PERSIAPAN', 'II. PEKERJAAN UTAMA', 'III. PEKERJAAN AKHIR'].map(cat =>
                    new TableRow({ children: [cell('', { bold: true, width: 500 }), cell(cat, { bold: true, width: 2200 }), cell('', { width: 1600 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1400 }), cell('', { width: 1400 })] })
                ),
                new TableRow({ children: [cell('', { width: 500 }), cell('TOTAL HARGA', { bold: true, width: 2200 }), cell('', { width: 1600 }), cell('', { width: 800 }), cell('', { width: 800 }), cell('', { width: 1400 }), cell(formatRupiah(activity.anggaran || 0), { bold: true, alignment: 'right', width: 1400 })] }),
            ],
            width: { size: 8700, type: WidthType.DXA },
        }),
        ...buildSigningBlock(vi, {
            leftTitle: '', leftRole: '', leftName: '',
            rightTitle: 'Pelaksana Kegiatan Anggaran',
            rightRole: '',
            rightName: '( .................... )',
        }),
    ];
}

// ================================================================
// 7. Laporan Realisasi Pelaksanaan Kegiatan
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
            ['Penyedia', activity.pelaksana || '..............................'],
        ]),
        ...emptyLine(1),
        new Table({
            rows: [
                new TableRow({
                    children: [
                        headerCell('NO', 500),
                        headerCell('URAIAN BELANJA', 2600),
                        headerCell('ANGGARAN (Rp)', 1600),
                        headerCell('REALISASI (Rp)', 1600),
                        headerCell('SELISIH (Rp)', 1600),
                        headerCell('KET', 600),
                    ],
                }),
                ...['I. BELANJA BARANG/JASA', 'II. BIAYA KIRIM', 'III. PEMASANGAN', 'IV. OPERASIONAL'].map(cat =>
                    new TableRow({
                        children: [
                            cell('', { width: 500 }),
                            cell(cat, { bold: true, width: 2600 }),
                            cell('...', { alignment: 'right', width: 1600 }),
                            cell('...', { alignment: 'right', width: 1600 }),
                            cell('...', { alignment: 'right', width: 1600 }),
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
        p(`1. Realisasi kegiatan telah mencapai ${activity.progres || '...'}%.`),
        p(`2. Selisih anggaran sebesar ${formatRupiah(sisa)} (Jika Ada) telah dikembalikan ke Rekening Kas Desa.`),
        p('Demikian laporan ini dibuat sebagai bentuk pertanggungjawaban pelaksanaan kegiatan.'),
        ...buildSigningBlock(vi),
    ];
}

// ================================================================
// MAIN EXPORT FUNCTION — LPJ Non-Fisik Bundel
// ================================================================
export async function exportLPJNonFisikToWord(activity, villageInfo, attachments = []) {
    const vi = villageInfo;
    const act = activity;

    const sections = [
        makeSection(buildKAK(act, vi)),
        makeSection(buildSpesifikasiBarang(act, vi)),
        makeSection(buildHPS(act, vi)),
        makeSection(buildSurveiHarga(act, vi)),
        makeSection(buildAnalisisHarga(act, vi)),
        makeSection(buildRABPenyedia(act, vi)),
        makeSection(buildLaporanRealisasi(act, vi)),
    ];

    // ── 8. Daftar Bukti Lampiran (jika ada) ──
    if (attachments.length > 0) {
        const lampiranChildren = [
            ...buildKopSurat(vi),
            pCenter('DAFTAR BUKTI LAMPIRAN', { bold: true, size: SZ.xl }),
            pCenter(`Kegiatan: ${act.nama || '-'}`, { size: SZ.md }),
            ...emptyLine(1),
            p(`Berikut adalah daftar ${attachments.length} dokumen bukti yang telah diunggah untuk kegiatan ini:`, { size: SZ.sm }),
            ...emptyLine(1),
        ];

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
        title: `LPJ Non-Fisik - ${act.nama || 'Kegiatan'}`,
        description: 'Laporan Pertanggungjawaban Kegiatan Non-Fisik (Pengadaan via Penyedia)',
        sections,
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (act.nama || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = `LPJ_NonFisik_${safeName}.docx`;
    saveAs(blob, fileName);

    return fileName;
}
