/**
 * ================================================================
 * Pilar 1 — Buku Utama LPJ (Naratif Resmi)
 * ================================================================
 * Generate dokumen Word berisi:
 *   Cover → Kata Pengantar → Daftar Isi → BAB I Pendahuluan →
 *   BAB II Pelaksanaan → BAB III Penutup
 *
 * Sesuai format Permendagri 20/2018 tentang Pengelolaan Keuangan Desa.
 */

import {
    Document, Packer, Table, TableRow, AlignmentType,
    WidthType, ImageRun, Paragraph, TextRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { formatRupiah } from '../data/sampleData';
import { GARUDA_LOGO_BASE64 } from '../assets/garudaLogo';
import { KABUPATEN_LOGO_BASE64 } from '../assets/kabupatenLogo';
import {
    FONT, SZ,
    p, pCenter, emptyLine,
    cell, headerCell,
    buildKopSurat, buildSigningBlock, makeSection,
    base64ToBuffer,
} from './wordHelpers';

// ── Helpers ──

/** Split multi-line text into paragraphs */
function textToParagraphs(text, opts = {}) {
    if (!text) return [p('........................................................................................................', opts)];
    return text.split('\n').filter(Boolean).map(line => p(line.trim(), opts));
}

/** Numbered list item */
function numberedItem(num, text, opts = {}) {
    return p(`${num}. ${text}`, { size: SZ.sm, ...opts });
}

/** Default dasar hukum text */
const DEFAULT_DASAR_HUKUM = [
    'Undang-Undang Nomor 6 Tahun 2014 tentang Desa;',
    'Peraturan Pemerintah Nomor 43 Tahun 2014 tentang Peraturan Pelaksanaan Undang-Undang Nomor 6 Tahun 2014 tentang Desa sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 47 Tahun 2015;',
    'Peraturan Pemerintah Nomor 60 Tahun 2014 tentang Dana Desa yang bersumber dari APBN sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 22 Tahun 2015;',
    'Peraturan Menteri Dalam Negeri Nomor 20 Tahun 2018 tentang Pengelolaan Keuangan Desa;',
    'Peraturan Bupati tentang Pengelolaan Keuangan Desa di Lingkungan Pemerintah Daerah setempat;',
    'Peraturan Desa tentang Anggaran Pendapatan dan Belanja Desa (APBDesa) Tahun Anggaran berjalan.',
];

// ══════════════════════════════════════════
//   SECTION BUILDERS
// ══════════════════════════════════════════

function buildCoverPage(vi) {
    const children = [];

    // Garuda logo
    try {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 200 },
            children: [new ImageRun({
                data: base64ToBuffer(GARUDA_LOGO_BASE64),
                transformation: { width: 90, height: 90 },
                type: 'png',
            })],
        }));
    } catch { /* skip */ }

    // Kabupaten logo
    try {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new ImageRun({
                data: base64ToBuffer(KABUPATEN_LOGO_BASE64),
                transformation: { width: 70, height: 75 },
                type: 'png',
            })],
        }));
    } catch { /* skip */ }

    children.push(
        ...emptyLine(2),
        pCenter('LAPORAN PERTANGGUNGJAWABAN', { bold: true, size: SZ.xxl }),
        pCenter('REALISASI PELAKSANAAN', { bold: true, size: SZ.xxl }),
        pCenter('ANGGARAN PENDAPATAN DAN BELANJA DESA', { bold: true, size: SZ.xxl }),
        ...emptyLine(1),
        pCenter(vi.periode ? vi.periode.toUpperCase() : 'SEMESTER I / SEMESTER II', { bold: true, size: SZ.xl }),
        ...emptyLine(2),
        pCenter(`DESA ${(vi.nama_desa || '............').toUpperCase()}`, { bold: true, size: SZ.xl }),
        pCenter(`KECAMATAN ${(vi.kecamatan || '............').toUpperCase()}`, { size: SZ.lg }),
        pCenter(`KABUPATEN ${(vi.kabupaten || '............').toUpperCase()}`, { size: SZ.lg }),
        pCenter(`PROVINSI ${(vi.provinsi || '............').toUpperCase()}`, { size: SZ.lg }),
        ...emptyLine(3),
        pCenter(`TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, { bold: true, size: SZ.xl }),
    );

    return makeSection(children);
}

function buildKataPengantar(vi, narratives) {
    const kata = narratives.kata_pengantar || '';
    const children = [
        pCenter('KATA PENGANTAR', { bold: true, size: SZ.xl, spacing: { after: 300 } }),
        ...emptyLine(1),
        ...(kata
            ? textToParagraphs(kata, { size: SZ.md })
            : [
                p(`Puji syukur kami panjatkan kehadirat Tuhan Yang Maha Esa, atas limpahan rahmat dan karunia-Nya sehingga Laporan Pertanggungjawaban (LPJ) Realisasi Pelaksanaan Anggaran Pendapatan dan Belanja Desa ${vi.nama_desa || '......'} ${vi.periode || 'Semester ......'} Tahun Anggaran ${vi.tahun_anggaran || '20XX'} dapat disusun dan diselesaikan tepat waktu.`, { size: SZ.md }),
                ...emptyLine(1),
                p(`Laporan ini disusun sebagai bentuk pertanggungjawaban atas pengelolaan keuangan desa selama satu periode anggaran sesuai dengan Peraturan Menteri Dalam Negeri Nomor 20 Tahun 2018 tentang Pengelolaan Keuangan Desa.`, { size: SZ.md }),
                ...emptyLine(1),
                p('Kami menyadari bahwa dalam penyusunan laporan ini masih terdapat kekurangan. Oleh karena itu, saran dan masukan yang konstruktif sangat kami harapkan demi perbaikan di masa mendatang.', { size: SZ.md }),
            ]
        ),
        ...emptyLine(2),
        ...buildSigningBlock(vi, {
            leftTitle: '',
            leftRole: '',
            leftName: '',
            rightTitle: `${vi.nama_desa || '......'}, ........................ ${vi.tahun_anggaran || '20XX'}`,
            rightRole: 'KEPALA DESA ' + (vi.nama_desa || '......').toUpperCase(),
            rightName: vi.kepala_desa || '( .................... )',
        }),
    ];
    return makeSection(children);
}

function buildDaftarIsi() {
    const items = [
        ['KATA PENGANTAR', 'i'],
        ['DAFTAR ISI', 'ii'],
        ['BAB I    PENDAHULUAN', '1'],
        ['          1.1 Latar Belakang', '1'],
        ['          1.2 Tujuan dan Sasaran', '2'],
        ['          1.3 Dasar Hukum', '2'],
        ['BAB II   PELAKSANAAN', '4'],
        ['          2.1 Realisasi Pelaksanaan Fisik', '4'],
        ['          2.2 Realisasi Pelaksanaan Keuangan', '6'],
        ['BAB III  PENUTUP', '8'],
        ['          3.1 Kesimpulan', '8'],
        ['          3.2 Kendala dan Permasalahan', '8'],
        ['          3.3 Saran', '9'],
        ['LAMPIRAN', '10'],
    ];

    const children = [
        pCenter('DAFTAR ISI', { bold: true, size: SZ.xl, spacing: { after: 400 } }),
        ...emptyLine(1),
    ];

    items.forEach(([label, page]) => {
        const isBab = label.startsWith('BAB') || label === 'KATA PENGANTAR' || label === 'DAFTAR ISI' || label === 'LAMPIRAN';
        children.push(
            new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: isBab ? 120 : 40, after: 40 },
                tabStops: [{ type: 'right', position: 8500, leader: 'dot' }],
                children: [
                    new TextRun({ text: label, bold: isBab, size: SZ.md, font: FONT }),
                    new TextRun({ text: '\t', size: SZ.md, font: FONT }),
                    new TextRun({ text: page, size: SZ.md, font: FONT }),
                ],
            })
        );
    });

    return makeSection(children);
}

function buildBabIPendahuluan(vi, narratives) {
    const children = [
        pCenter('BAB I', { bold: true, size: SZ.xl, spacing: { after: 60 } }),
        pCenter('PENDAHULUAN', { bold: true, size: SZ.xl, spacing: { after: 400 } }),

        // 1.1 Latar Belakang
        p('1.1 Latar Belakang', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
        ...(narratives.latar_belakang
            ? textToParagraphs(narratives.latar_belakang, { size: SZ.md })
            : [
                p(`Berdasarkan Undang-Undang Nomor 6 Tahun 2014 tentang Desa, pengelolaan keuangan desa meliputi seluruh kegiatan yang meliputi perencanaan, pelaksanaan, penatausahaan, pelaporan, dan pertanggungjawaban keuangan desa. Kepala Desa adalah pemegang kekuasaan pengelolaan keuangan desa dan mewakili pemerintah desa dalam kepemilikan kekayaan milik desa yang dipisahkan.`, { size: SZ.md }),
                ...emptyLine(1),
                p(`Desa ${vi.nama_desa || '......'}, Kecamatan ${vi.kecamatan || '......'}, Kabupaten ${vi.kabupaten || '......'}, Provinsi ${vi.provinsi || '......'} memiliki kewajiban untuk menyusun Laporan Pertanggungjawaban (LPJ) Realisasi Pelaksanaan Anggaran Pendapatan dan Belanja Desa (APBDesa) Tahun Anggaran ${vi.tahun_anggaran || '20XX'} sebagai bentuk akuntabilitas dan transparansi pengelolaan keuangan desa.`, { size: SZ.md }),
            ]
        ),

        // 1.2 Tujuan dan Sasaran
        ...emptyLine(1),
        p('1.2 Tujuan dan Sasaran', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
        ...(narratives.tujuan_lpj
            ? textToParagraphs(narratives.tujuan_lpj, { size: SZ.md })
            : [
                p('Tujuan penyusunan Laporan Pertanggungjawaban ini adalah:', { size: SZ.md }),
                numberedItem(1, 'Menyajikan informasi mengenai realisasi pelaksanaan APBDesa secara transparan dan akuntabel;'),
                numberedItem(2, 'Memberikan gambaran mengenai capaian kinerja pelaksanaan program dan kegiatan pembangunan desa;'),
                numberedItem(3, 'Memenuhi kewajiban pelaporan keuangan sesuai ketentuan peraturan perundang-undangan;'),
                numberedItem(4, 'Sebagai bahan evaluasi pelaksanaan APBDesa untuk perencanaan tahun anggaran berikutnya.'),
            ]
        ),

        // 1.3 Dasar Hukum
        ...emptyLine(1),
        p('1.3 Dasar Hukum', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
    ];

    // Dasar hukum — use custom or default list
    const dasarHukumText = narratives.dasar_hukum || '';
    if (dasarHukumText) {
        children.push(...textToParagraphs(dasarHukumText, { size: SZ.md }));
    } else {
        DEFAULT_DASAR_HUKUM.forEach((item, i) => {
            children.push(numberedItem(i + 1, item));
        });
    }

    return makeSection(children);
}

function buildBabIIPelaksanaan(vi, narratives, state) {
    const { activities = [], incomes = [], expenses = [], pembiayaan } = state;

    const totalAnggaran = activities.reduce((s, a) => s + (Number(a.anggaran) || 0), 0);
    const totalRealisasi = activities.reduce((s, a) => s + (Number(a.realisasi) || 0), 0);
    const totalIncome = incomes.reduce((s, i) => s + (Number(i.jumlah) || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + (Number(e.jumlah) || 0), 0);
    const totalPembiayaanMasuk = (pembiayaan || []).filter(p => p.kategori === 'Penerimaan Pembiayaan').reduce((s, p) => s + (Number(p.jumlah) || 0), 0);
    const totalPembiayaanKeluar = (pembiayaan || []).filter(p => p.kategori === 'Pengeluaran Pembiayaan').reduce((s, p) => s + (Number(p.jumlah) || 0), 0);
    const surplus = totalIncome - totalExpense;

    const children = [
        pCenter('BAB II', { bold: true, size: SZ.xl, spacing: { after: 60 } }),
        pCenter('PELAKSANAAN', { bold: true, size: SZ.xl, spacing: { after: 400 } }),

        // 2.1 Realisasi Fisik
        p('2.1 Realisasi Pelaksanaan Fisik', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
        ...(narratives.realisasi_fisik_narasi
            ? textToParagraphs(narratives.realisasi_fisik_narasi, { size: SZ.md })
            : [p(`Realisasi pelaksanaan fisik kegiatan di Desa ${vi.nama_desa || '......'} pada ${vi.periode || 'periode ini'} Tahun Anggaran ${vi.tahun_anggaran || '20XX'} dapat dilihat pada tabel berikut:`, { size: SZ.md })]
        ),
        ...emptyLine(1),
    ];

    // ── Tabel Realisasi Fisik per Bidang ──
    const bidangGroups = {};
    activities.forEach(a => {
        if (!bidangGroups[a.bidang]) bidangGroups[a.bidang] = [];
        bidangGroups[a.bidang].push(a);
    });

    const activityRows = [
        new TableRow({
            children: [
                headerCell('No', 500),
                headerCell('Kegiatan', 2400),
                headerCell('Anggaran (Rp)', 1500),
                headerCell('Realisasi (Rp)', 1500),
                headerCell('%', 700),
                headerCell('Status', 1100),
            ],
        }),
    ];

    let rowNum = 0;
    Object.entries(bidangGroups).forEach(([bidang, acts]) => {
        // Bidang header row
        activityRows.push(new TableRow({
            children: [
                cell('', { width: 500, shading: 'F2F2F2' }),
                cell(bidang, { bold: true, width: 2400, shading: 'F2F2F2', colspan: 5 }),
            ],
        }));
        acts.forEach(a => {
            rowNum++;
            const pct = a.anggaran > 0 ? ((a.realisasi / a.anggaran) * 100).toFixed(1) : '0.0';
            activityRows.push(new TableRow({
                children: [
                    cell(String(rowNum), { alignment: AlignmentType.CENTER, width: 500 }),
                    cell(a.nama || '-', { width: 2400 }),
                    cell(formatRupiah(a.anggaran || 0), { alignment: AlignmentType.RIGHT, width: 1500 }),
                    cell(formatRupiah(a.realisasi || 0), { alignment: AlignmentType.RIGHT, width: 1500 }),
                    cell(pct + '%', { alignment: AlignmentType.CENTER, width: 700 }),
                    cell((a.status || 'direncanakan').charAt(0).toUpperCase() + (a.status || 'direncanakan').slice(1), { alignment: AlignmentType.CENTER, width: 1100 }),
                ],
            }));
        });
    });

    // Total row
    const pctTotal = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : '0.0';
    activityRows.push(new TableRow({
        children: [
            cell('', { width: 500, shading: 'D9E2F3' }),
            cell('JUMLAH TOTAL', { bold: true, width: 2400, shading: 'D9E2F3' }),
            cell(formatRupiah(totalAnggaran), { bold: true, alignment: AlignmentType.RIGHT, width: 1500, shading: 'D9E2F3' }),
            cell(formatRupiah(totalRealisasi), { bold: true, alignment: AlignmentType.RIGHT, width: 1500, shading: 'D9E2F3' }),
            cell(pctTotal + '%', { bold: true, alignment: AlignmentType.CENTER, width: 700, shading: 'D9E2F3' }),
            cell('', { width: 1100, shading: 'D9E2F3' }),
        ],
    }));

    children.push(new Table({ rows: activityRows, width: { size: 7700, type: WidthType.DXA } }));

    // 2.2 Realisasi Keuangan
    children.push(
        ...emptyLine(2),
        p('2.2 Realisasi Pelaksanaan Keuangan', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
        ...(narratives.realisasi_keuangan_narasi
            ? textToParagraphs(narratives.realisasi_keuangan_narasi, { size: SZ.md })
            : [p(`Realisasi keuangan Desa ${vi.nama_desa || '......'} pada ${vi.periode || 'periode ini'} Tahun Anggaran ${vi.tahun_anggaran || '20XX'} terdiri atas Pendapatan, Belanja, dan Pembiayaan sebagai berikut:`, { size: SZ.md })]
        ),
        ...emptyLine(1),

        // Sub-heading: PENDAPATAN
        p('A. Pendapatan Desa', { bold: true, size: SZ.md, spacing: { before: 120, after: 80 } }),
    );

    // Tabel Pendapatan
    const incomeRows = [
        new TableRow({
            children: [
                headerCell('Kode Rek', 800),
                headerCell('Sumber Pendapatan', 2400),
                headerCell('Kategori', 1800),
                headerCell('Jumlah (Rp)', 2000),
            ],
        }),
    ];
    [...incomes].sort((a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true })).forEach((item) => {
        incomeRows.push(new TableRow({
            children: [
                cell(item.norek || '-', { alignment: AlignmentType.CENTER, width: 800 }),
                cell(item.sumber || '-', { width: 2400 }),
                cell(item.kategori || '-', { width: 1800 }),
                cell(formatRupiah(item.jumlah || 0), { alignment: AlignmentType.RIGHT, width: 2000 }),
            ],
        }));
    });
    incomeRows.push(new TableRow({
        children: [
            cell('', { width: 800, shading: 'D9E2F3' }),
            cell('', { width: 2400, shading: 'D9E2F3' }),
            cell('TOTAL PENDAPATAN', { bold: true, width: 1800, shading: 'D9E2F3' }),
            cell(formatRupiah(totalIncome), { bold: true, alignment: AlignmentType.RIGHT, width: 2000, shading: 'D9E2F3' }),
        ],
    }));
    children.push(new Table({ rows: incomeRows, width: { size: 7000, type: WidthType.DXA } }));

    // Sub-heading: BELANJA
    children.push(
        ...emptyLine(1),
        p('B. Belanja Desa', { bold: true, size: SZ.md, spacing: { before: 120, after: 80 } }),
    );

    const expenseRows = [
        new TableRow({
            children: [
                headerCell('Kode Rek', 800),
                headerCell('Uraian Belanja', 2400),
                headerCell('Kategori', 1800),
                headerCell('Jumlah (Rp)', 2000),
            ],
        }),
    ];
    [...expenses].sort((a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true })).forEach((item) => {
        expenseRows.push(new TableRow({
            children: [
                cell(item.norek || '-', { alignment: AlignmentType.CENTER, width: 800 }),
                cell(item.uraian || '-', { width: 2400 }),
                cell(item.kategori || '-', { width: 1800 }),
                cell(formatRupiah(item.jumlah || 0), { alignment: AlignmentType.RIGHT, width: 2000 }),
            ],
        }));
    });
    expenseRows.push(new TableRow({
        children: [
            cell('', { width: 800, shading: 'D9E2F3' }),
            cell('', { width: 2400, shading: 'D9E2F3' }),
            cell('TOTAL BELANJA', { bold: true, width: 1800, shading: 'D9E2F3' }),
            cell(formatRupiah(totalExpense), { bold: true, alignment: AlignmentType.RIGHT, width: 2000, shading: 'D9E2F3' }),
        ],
    }));
    children.push(new Table({ rows: expenseRows, width: { size: 7000, type: WidthType.DXA } }));

    // Sub-heading: PEMBIAYAAN
    if ((pembiayaan || []).length > 0) {
        children.push(
            ...emptyLine(1),
            p('C. Pembiayaan Desa', { bold: true, size: SZ.md, spacing: { before: 120, after: 80 } }),
        );
        const pemRows = [
            new TableRow({
                children: [
                    headerCell('Kode Rek', 800),
                    headerCell('Uraian', 2400),
                    headerCell('Kategori', 1800),
                    headerCell('Jumlah (Rp)', 2000),
                ],
            }),
        ];
        [...pembiayaan].sort((a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true })).forEach((item) => {
            pemRows.push(new TableRow({
                children: [
                    cell(item.norek || '-', { alignment: AlignmentType.CENTER, width: 800 }),
                    cell(item.uraian || '-', { width: 2400 }),
                    cell(item.kategori || '-', { width: 1800 }),
                    cell(formatRupiah(item.jumlah || 0), { alignment: AlignmentType.RIGHT, width: 2000 }),
                ],
            }));
        });
        pemRows.push(new TableRow({
            children: [
                cell('', { width: 800, shading: 'D9E2F3' }),
                cell('', { width: 2400, shading: 'D9E2F3' }),
                cell('NETTO PEMBIAYAAN', { bold: true, width: 1800, shading: 'D9E2F3' }),
                cell(formatRupiah(totalPembiayaanMasuk - totalPembiayaanKeluar), { bold: true, alignment: AlignmentType.RIGHT, width: 2000, shading: 'D9E2F3' }),
            ],
        }));
        children.push(new Table({ rows: pemRows, width: { size: 7000, type: WidthType.DXA } }));
    }

    // Ringkasan
    children.push(
        ...emptyLine(1),
        p(`D. Ringkasan Realisasi Keuangan`, { bold: true, size: SZ.md, spacing: { before: 120, after: 80 } }),
    );

    const summaryRows = [
        ['Total Pendapatan', formatRupiah(totalIncome)],
        ['Total Belanja', formatRupiah(totalExpense)],
        ['Surplus / (Defisit)', formatRupiah(surplus)],
        ['Pembiayaan Netto', formatRupiah(totalPembiayaanMasuk - totalPembiayaanKeluar)],
        ['Sisa Lebih Pembiayaan Anggaran (SiLPA)', formatRupiah(surplus + totalPembiayaanMasuk - totalPembiayaanKeluar)],
    ];

    children.push(new Table({
        rows: summaryRows.map(([label, value], i) => new TableRow({
            children: [
                cell(label, { bold: i === summaryRows.length - 1, width: 5000, shading: i === summaryRows.length - 1 ? 'D9E2F3' : undefined }),
                cell(value, { bold: i === summaryRows.length - 1, alignment: AlignmentType.RIGHT, width: 2400, shading: i === summaryRows.length - 1 ? 'D9E2F3' : undefined }),
            ],
        })),
        width: { size: 7400, type: WidthType.DXA },
    }));

    return makeSection(children);
}

function buildBabIIIPenutup(vi, narratives, state) {
    const { incomes = [], expenses = [], pembiayaan } = state;
    const totalIncome = incomes.reduce((s, i) => s + (Number(i.jumlah) || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + (Number(e.jumlah) || 0), 0);
    const surplus = totalIncome - totalExpense;

    const children = [
        pCenter('BAB III', { bold: true, size: SZ.xl, spacing: { after: 60 } }),
        pCenter('PENUTUP', { bold: true, size: SZ.xl, spacing: { after: 400 } }),

        // 3.1 Kesimpulan
        p('3.1 Kesimpulan', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
        p(`Berdasarkan hasil pelaksanaan APBDesa ${vi.nama_desa || '......'} ${vi.periode || '......'} Tahun Anggaran ${vi.tahun_anggaran || '20XX'}, dapat disimpulkan sebagai berikut:`, { size: SZ.md }),
        numberedItem(1, `Total Pendapatan Desa sebesar ${formatRupiah(totalIncome)};`),
        numberedItem(2, `Total Belanja Desa sebesar ${formatRupiah(totalExpense)};`),
        numberedItem(3, `${surplus >= 0 ? 'Surplus' : 'Defisit'} anggaran sebesar ${formatRupiah(Math.abs(surplus))};`),
        numberedItem(4, `Seluruh kegiatan telah dilaksanakan sesuai dengan rencana kerja yang telah dituangkan dalam APBDesa.`),

        // 3.2 Kendala
        ...emptyLine(1),
        p('3.2 Kendala dan Permasalahan', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
        ...(narratives.kendala
            ? textToParagraphs(narratives.kendala, { size: SZ.md })
            : [
                p('Dalam pelaksanaan APBDesa, beberapa kendala yang dihadapi antara lain:', { size: SZ.md }),
                numberedItem(1, '...................................................................................................'),
                numberedItem(2, '...................................................................................................'),
                numberedItem(3, '...................................................................................................'),
            ]
        ),

        // 3.3 Saran
        ...emptyLine(1),
        p('3.3 Saran', { bold: true, size: SZ.lg, spacing: { before: 200, after: 120 } }),
        ...(narratives.saran
            ? textToParagraphs(narratives.saran, { size: SZ.md })
            : [
                p('Berdasarkan kendala tersebut, beberapa saran yang dapat disampaikan:', { size: SZ.md }),
                numberedItem(1, '...................................................................................................'),
                numberedItem(2, '...................................................................................................'),
                numberedItem(3, '...................................................................................................'),
            ]
        ),

        // Penutup
        ...emptyLine(1),
        p(`Demikian Laporan Pertanggungjawaban Realisasi Pelaksanaan APBDesa ${vi.nama_desa || '......'} ${vi.periode || '......'} Tahun Anggaran ${vi.tahun_anggaran || '20XX'} ini disusun dengan sebenar-benarnya sebagai bentuk tanggung jawab dalam pengelolaan keuangan desa. Atas perhatian dan kerjasama semua pihak, kami ucapkan terima kasih.`, { size: SZ.md }),

        // TTD Kepala Desa + Bendahara
        ...buildSigningBlock(vi, {
            leftTitle: 'Mengetahui,',
            leftRole: 'BENDAHARA DESA',
            leftName: vi.bendahara || '( .................... )',
            rightTitle: '',
            rightRole: 'KEPALA DESA ' + (vi.nama_desa || '......').toUpperCase(),
            rightName: vi.kepala_desa || '( .................... )',
        }),
    ];

    return makeSection(children);
}

// ══════════════════════════════════════════
//   MAIN EXPORT
// ══════════════════════════════════════════

/**
 * Generate Buku Utama LPJ (Pilar 1) — dokumen naratif resmi.
 *
 * @param {Object} state  - AppContext state (villageInfo, incomes, expenses, activities, pembiayaan)
 * @param {Object} narratives - lpjNarratives object from DB
 * @returns {Promise<string>} filename
 */
export async function exportBukuUtamaToWord(state, narratives = {}) {
    const vi = state.villageInfo;
    const narr = narratives || {};

    const doc = new Document({
        creator: 'Sistem LPJ Desa',
        title: `Buku Utama LPJ - ${vi.nama_desa || 'Desa'} - TA ${vi.tahun_anggaran || ''}`,
        description: 'Laporan Pertanggungjawaban Realisasi Pelaksanaan APBDesa',
        sections: [
            buildCoverPage(vi),
            buildKataPengantar(vi, narr),
            buildDaftarIsi(),
            buildBabIPendahuluan(vi, narr),
            buildBabIIPelaksanaan(vi, narr, state),
            buildBabIIIPenutup(vi, narr, state),
        ],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (vi.nama_desa || 'Desa').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const fileName = `Buku_Utama_LPJ_${safeName}_${vi.tahun_anggaran || ''}.docx`;
    saveAs(blob, fileName);
    return fileName;
}
