import {
    Document, Packer, Paragraph, Table, TableRow,
    TextRun, AlignmentType, WidthType,
    ExternalHyperlink,
} from 'docx';
import { saveAs } from 'file-saver';
import { formatRupiah } from '../data/sampleData';

// ── Sort by norek (kode rekening) ──
const sortByNorek = (a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true });

import {
    FONT, SZ, cell, headerCell,
    p, pCenter, emptyLine,
    buildKopSurat, buildInfoTable, buildSigningBlock,
    makeSection,
} from './wordHelpers';

// Export LPJ for a single kegiatan (activity) [Professional summary with kop surat]
export async function exportActivityToWord(activity, villageInfo, attachments = []) {
    const pct = activity.anggaran > 0 ? ((activity.realisasi / activity.anggaran) * 100).toFixed(1) : '0.0';
    const sisa = activity.anggaran - activity.realisasi;

    const children = [
        ...buildKopSurat(villageInfo),
        ...emptyLine(),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 80 },
            children: [new TextRun({ text: 'LAPORAN PERTANGGUNGJAWABAN KEGIATAN', bold: true, size: SZ.xl, font: FONT })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: `${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`, size: SZ.md, font: FONT })],
        }),
        buildInfoTable([
            ['Kode Rekening', activity.norek || '-'],
            ['Nama Kegiatan', activity.nama],
            ['Bidang', activity.bidang],
            ['Sub Bidang', activity.sub_bidang],
            ['Pelaksana', activity.pelaksana || '-'],
            ['Status', (activity.status || 'direncanakan').toUpperCase()],
            ['Progres', `${activity.progres ?? 0}%`],
            ['Anggaran', formatRupiah(activity.anggaran || 0)],
            ['Realisasi', formatRupiah(activity.realisasi || 0)],
            ['Sisa', formatRupiah(sisa || 0)],
            ['Efisiensi', `${pct}%`],
        ]),
        ...emptyLine(2),
        ...buildSigningBlock(villageInfo, {
            leftTitle: 'Mengetahui,',
            leftRole: `KEPALA DESA ${(villageInfo.nama_desa || '').toUpperCase()}`,
            leftName: villageInfo.kepala_desa || '( .................... )',
            rightTitle: 'Pelaksana Kegiatan,',
            rightRole: '',
            rightName: activity.pelaksana || '( .................... )',
        }),
    ];

    const doc = new Document({
        creator: 'Sistem LPJ Desa',
        title: `LPJ Kegiatan - ${activity.nama}`,
        sections: [makeSection(children)],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (activity.nama || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = `LPJ_Kegiatan_${safeName}.docx`;
    saveAs(blob, fileName);

    return fileName;
}
// Export full LPJ to Word (all activities)
export async function exportToWord(state, attachData = { kegiatan: {}, belanja: {}, belanjaTotal: 0 }) {
    const { villageInfo, incomes, expenses, activities } = state;
    const totalIncome = incomes.reduce((s, i) => s + (Number(i.jumlah) || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + (Number(e.jumlah) || 0), 0);

    const sections = [];

    // ---------- COVER PAGE ----------
    const coverChildren = [
        ...Array(4).fill(0).map(() => new Paragraph({ children: [] })),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'LAPORAN PERTANGGUNGJAWABAN', bold: true, size: SZ.xxl, font: FONT })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'REALISASI PELAKSANAAN APBDesa', bold: true, size: SZ.xxl, font: FONT })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: (villageInfo.periode || '').toUpperCase(), bold: true, size: SZ.xl, font: FONT })],
        }),
        ...Array(2).fill(0).map(() => new Paragraph({ children: [] })),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: (villageInfo.nama_desa || '').toUpperCase(), bold: true, size: SZ.xl, font: FONT })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: (villageInfo.kecamatan || '').toUpperCase(), size: SZ.lg, font: FONT })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: (villageInfo.kabupaten || '').toUpperCase(), size: SZ.lg, font: FONT })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: `TAHUN ANGGARAN ${villageInfo.tahun_anggaran}`, bold: true, size: SZ.lg, font: FONT })],
        }),
    ];

    sections.push({ children: coverChildren });

    // ---------- BAB I ----------
    const bab1Children = [
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'BAB I - PENDAHULUAN', bold: true, size: SZ.xl, font: FONT })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({
                text: `Laporan Pertanggungjawaban (LPJ) Realisasi Pelaksanaan APBDesa ${villageInfo.nama_desa}, ${villageInfo.kecamatan}, ${villageInfo.kabupaten}, ${villageInfo.provinsi} Tahun Anggaran ${villageInfo.tahun_anggaran} disusun berdasarkan Peraturan Menteri Dalam Negeri dan peraturan terkait pengelolaan keuangan desa.`,
                size: SZ.md, font: FONT,
            })],
        }),
        new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Informasi Desa:', bold: true, size: SZ.md, font: FONT })],
        }),
    ];

    const infoTable = new Table({
        rows: [
            ['Nama Desa', villageInfo.nama_desa],
            ['Kecamatan', villageInfo.kecamatan],
            ['Kabupaten', villageInfo.kabupaten],
            ['Provinsi', villageInfo.provinsi],
            ['Kepala Desa', villageInfo.kepala_desa],
            ['Sekretaris Desa', villageInfo.sekretaris_desa],
            ['Bendahara', villageInfo.bendahara],
        ].map(([label, value]) =>
            new TableRow({
                children: [
                    cell(label, { bold: true, width: 3000 }),
                    cell(': ' + value, { width: 6000 }),
                ],
            })
        ),
        width: { size: 9000, type: WidthType.DXA },
    });

    bab1Children.push(infoTable);
    sections.push({ children: bab1Children });

    // ---------- BAB II: PENDAPATAN ----------
    const bab2Children = [
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'BAB II - PENDAPATAN DESA', bold: true, size: SZ.xl, font: FONT })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({
                text: `Realisasi pendapatan ${villageInfo.nama_desa} pada ${villageInfo.periode} adalah sebagai berikut:`,
                size: SZ.md, font: FONT,
            })],
        }),
    ];

    const incomeTableRows = [
        new TableRow({
            children: [
                headerCell('Kode Rek', 800),
                headerCell('Sumber Pendapatan', 3000),
                headerCell('Kategori', 2500),
                headerCell('Jumlah (Rp)', 2200),
            ],
        }),
        ...[...incomes].sort(sortByNorek).map((item) =>
            new TableRow({
                children: [
                    cell(item.norek || '-', { alignment: AlignmentType.CENTER, width: 800 }),
                    cell(item.sumber, { width: 3000 }),
                    cell(item.kategori, { width: 2500 }),
                    cell(formatRupiah(item.jumlah), { alignment: AlignmentType.RIGHT, width: 2200 }),
                ],
            })
        ),
        new TableRow({
            children: [
                cell('', { width: 800 }),
                cell('', { width: 3000 }),
                cell('TOTAL PENDAPATAN', { bold: true, width: 2500 }),
                cell(formatRupiah(totalIncome), { bold: true, alignment: AlignmentType.RIGHT, width: 2200 }),
            ],
        }),
    ];

    bab2Children.push(new Table({ rows: incomeTableRows, width: { size: 8500, type: WidthType.DXA } }));
    sections.push({ children: bab2Children });

    // ---------- BAB III: BELANJA ----------
    const bab3Children = [
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'BAB III - BELANJA DESA', bold: true, size: SZ.xl, font: FONT })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({
                text: `Realisasi belanja ${villageInfo.nama_desa} pada ${villageInfo.periode} adalah sebagai berikut:`,
                size: SZ.md, font: FONT,
            })],
        }),
    ];

    const expenseTableRows = [
        new TableRow({
            children: [
                headerCell('Kode Rek', 800),
                headerCell('Uraian Belanja', 3000),
                headerCell('Kategori', 2500),
                headerCell('Jumlah (Rp)', 2200),
            ],
        }),
        ...[...expenses].sort(sortByNorek).map((item) =>
            new TableRow({
                children: [
                    cell(item.norek || '-', { alignment: AlignmentType.CENTER, width: 800 }),
                    cell(item.uraian, { width: 3000 }),
                    cell(item.kategori, { width: 2500 }),
                    cell(formatRupiah(item.jumlah), { alignment: AlignmentType.RIGHT, width: 2200 }),
                ],
            })
        ),
        new TableRow({
            children: [
                cell('', { width: 800 }),
                cell('', { width: 3000 }),
                cell('TOTAL BELANJA', { bold: true, width: 2500 }),
                cell(formatRupiah(totalExpense), { bold: true, alignment: AlignmentType.RIGHT, width: 2200 }),
            ],
        }),
    ];

    bab3Children.push(new Table({ rows: expenseTableRows, width: { size: 8500, type: WidthType.DXA } }));
    sections.push({ children: bab3Children });

    // ---------- BAB IV: KEGIATAN ----------
    const bab4Children = [
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'BAB IV - PELAKSANAAN KEGIATAN', bold: true, size: SZ.xl, font: FONT })],
        }),
    ];

    const activityTableRows = [
        new TableRow({
            children: [
                headerCell('Kode Rek', 800),
                headerCell('Kegiatan', 2200),
                headerCell('Bidang', 1400),
                headerCell('Status', 900),
                headerCell('Anggaran', 1500),
                headerCell('Realisasi', 1500),
            ],
        }),
        ...[...activities].sort(sortByNorek).map((a) =>
            new TableRow({
                children: [
                    cell(a.norek || '-', { alignment: AlignmentType.CENTER, width: 800 }),
                    cell(a.nama, { width: 2200 }),
                    cell(a.bidang, { width: 1400 }),
                    cell((a.status || 'direncanakan').charAt(0).toUpperCase() + (a.status || 'direncanakan').slice(1), { alignment: AlignmentType.CENTER, width: 900 }),
                    cell(formatRupiah(a.anggaran), { alignment: AlignmentType.RIGHT, width: 1500 }),
                    cell(formatRupiah(a.realisasi), { alignment: AlignmentType.RIGHT, width: 1500 }),
                ],
            })
        ),
    ];

    bab4Children.push(new Table({ rows: activityTableRows, width: { size: 8200, type: WidthType.DXA } }));
    sections.push({ children: bab4Children });

    // ---------- BAB V: PENUTUP ----------
    const bab5Children = [
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'BAB V - PENUTUP', bold: true, size: SZ.xl, font: FONT })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({
                text: `Demikian Laporan Pertanggungjawaban Realisasi Pelaksanaan APBDesa ${villageInfo.nama_desa} ${villageInfo.periode} Tahun Anggaran ${villageInfo.tahun_anggaran}. Laporan ini disusun dengan sebenar-benarnya dan dapat dipertanggungjawabkan sesuai dengan peraturan perundang-undangan yang berlaku.`,
                size: SZ.md, font: FONT,
            })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `Total Pendapatan: ${formatRupiah(totalIncome)}`, size: SZ.md, font: FONT })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `Total Belanja: ${formatRupiah(totalExpense)}`, size: SZ.md, font: FONT })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `Sisa Anggaran: ${formatRupiah(totalIncome - totalExpense)}`, bold: true, size: SZ.md, font: FONT })],
        }),
        ...buildSigningBlock(villageInfo, {
            leftTitle: 'Mengetahui,',
            leftRole: `KEPALA DESA ${(villageInfo.nama_desa || '').toUpperCase()}`,
            leftName: villageInfo.kepala_desa || '( .................... )',
            rightTitle: 'Dibuat Oleh,',
            rightRole: 'BENDAHARA DESA',
            rightName: villageInfo.bendahara || '( .................... )',
        }),
    ];

    sections.push({ children: bab5Children });

    // ── BAB 6: Daftar Lampiran ──
    const daftarLampiranChildren = [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: 'DAFTAR LAMPIRAN', bold: true, size: SZ.xl, font: FONT })],
        }),
        new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Berikut adalah daftar dokumen lampiran yang menjadi bagian tidak terpisahkan dari Laporan Pertanggungjawaban Realisasi Pelaksanaan APBDesa ini:', size: SZ.md, font: FONT })],
        }),
    ];

    // Lampiran Keuangan
    let lampiranNo = 1;
    const belanjaTotal = attachData.belanjaTotal || 0;
    const keuanganItems = [
        'Rincian Pendapatan Desa',
        belanjaTotal > 0
            ? `Rincian Belanja Desa (dilengkapi ${belanjaTotal} dokumen bukti nota/kuitansi)`
            : 'Rincian Belanja Desa',
        'Laporan Realisasi APBDesa (Ringkasan per Bidang)',
    ];
    keuanganItems.forEach(item => {
        daftarLampiranChildren.push(new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: `${lampiranNo}. Lampiran ${item}`, size: SZ.md, font: FONT })],
        }));
        lampiranNo++;
    });

    // Lampiran per Kegiatan
    daftarLampiranChildren.push(
        new Paragraph({ children: [] }),
        new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: 'Lampiran Dokumen Per Kegiatan:', bold: true, size: SZ.md, font: FONT })],
        }),
    );

    // Create table for activities
    const lampiranRows = [
        new TableRow({
            children: [
                headerCell('No', 500),
                headerCell('Nama Kegiatan', 2800),
                headerCell('Bidang', 1600),
                headerCell('Jenis LPJ', 1000),
                headerCell('Jumlah Dok', 1200),
                headerCell('Bukti Upload', 1000),
            ],
        }),
    ];

    activities.forEach((act, i) => {
        const jenis = act.jenis_lpj === 'non_fisik' ? 'Non-Fisik' : 'Fisik';
        const jumlahDok = act.jenis_lpj === 'non_fisik' ? '7 Dokumen' : '15 Dokumen';
        const actAttachments = attachData.kegiatan?.[act.id] || [];
        const buktiCount = actAttachments.length;
        lampiranRows.push(new TableRow({
            children: [
                cell(String(i + 1), { alignment: AlignmentType.CENTER, width: 500 }),
                cell(act.nama || '-', { bold: true, width: 2800 }),
                cell(act.bidang || '-', { width: 1600 }),
                cell(jenis, { alignment: AlignmentType.CENTER, width: 1000 }),
                cell(jumlahDok, { alignment: AlignmentType.CENTER, width: 1200 }),
                cell(buktiCount > 0 ? `${buktiCount} file` : '-', { alignment: AlignmentType.CENTER, width: 1000 }),
            ],
        }));
    });

    daftarLampiranChildren.push(
        new Table({
            rows: lampiranRows,
            width: { size: 8300, type: WidthType.DXA },
        }),
    );

    // Detail lampiran per kegiatan (list keterangan)
    const activitiesWithAttach = activities.filter(act => (attachData.kegiatan?.[act.id] || []).length > 0);
    if (activitiesWithAttach.length > 0) {
        daftarLampiranChildren.push(
            new Paragraph({ children: [] }),
            new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: 'Rincian Dokumen Bukti per Kegiatan:', bold: true, size: SZ.md, font: FONT })],
            }),
        );

        activitiesWithAttach.forEach(act => {
            const docs = attachData.kegiatan[act.id];
            daftarLampiranChildren.push(
                new Paragraph({
                    spacing: { before: 120, after: 60 },
                    children: [new TextRun({ text: `► ${act.nama}`, bold: true, size: SZ.sm, font: FONT })],
                }),
            );
            docs.forEach((d, idx) => {
                const label = `${idx + 1}. ${d.keterangan}`;
                if (d.file_url) {
                    daftarLampiranChildren.push(
                        new Paragraph({
                            spacing: { after: 30 },
                            indent: { left: 600 },
                            children: [
                                new ExternalHyperlink({
                                    link: d.file_url,
                                    children: [
                                        new TextRun({ text: label, size: SZ.sm, font: FONT, color: '1155CC', underline: {} }),
                                    ],
                                }),
                            ],
                        }),
                    );
                } else {
                    daftarLampiranChildren.push(
                        new Paragraph({
                            spacing: { after: 30 },
                            indent: { left: 600 },
                            children: [new TextRun({ text: label, size: SZ.sm, font: FONT })],
                        }),
                    );
                }
            });
        });
    }

    daftarLampiranChildren.push(
        new Paragraph({ children: [] }),
        new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({
                text: `Total Lampiran Kegiatan: ${activities.length} kegiatan (${activities.filter(a => a.jenis_lpj !== 'non_fisik').length} Fisik, ${activities.filter(a => a.jenis_lpj === 'non_fisik').length} Non-Fisik)`,
                bold: true, size: SZ.md, font: FONT,
            })],
        }),
        new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({
                text: 'Demikian daftar lampiran ini dibuat sebagai bagian dari dokumen LPJ.',
                italics: true, size: SZ.md, font: FONT,
            })],
        }),
    );

    sections.push({ children: daftarLampiranChildren });

    // Build document
    const doc = new Document({
        creator: 'Sistem LPJ Desa',
        title: `LPJ ${villageInfo.nama_desa} ${villageInfo.tahun_anggaran}`,
        description: 'Laporan Pertanggungjawaban Realisasi APBDesa',
        sections: sections.map(s => makeSection(s.children)),
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `LPJ_${(villageInfo.nama_desa || 'Desa').replace(/\s+/g, '_')}_${villageInfo.tahun_anggaran}.docx`;
    saveAs(blob, fileName);

    return fileName;
}

// ── Export activities by Bidang to Word ──
export async function exportBidangToWord(bidang, activities, villageInfo) {
    const isAll = bidang === 'Semua Bidang';
    const items = isAll ? activities : activities.filter(a => a.bidang === bidang);
    const totalAnggaran = items.reduce((s, a) => s + Number(a.anggaran || 0), 0);
    const totalRealisasi = items.reduce((s, a) => s + Number(a.realisasi || 0), 0);

    // Group by bidang → sub-bidang
    const bidangMap = {};
    items.forEach(a => {
        const b = a.bidang || 'Lainnya';
        if (!bidangMap[b]) bidangMap[b] = {};
        if (!bidangMap[b][a.sub_bidang]) bidangMap[b][a.sub_bidang] = [];
        bidangMap[b][a.sub_bidang].push(a);
    });

    const children = [
        pCenter(`LAPORAN KEGIATAN — ${bidang.toUpperCase()}`, { bold: true, size: SZ.xl }),
        pCenter((villageInfo.nama_desa || '').toUpperCase(), { bold: true, size: SZ.lg }),
        pCenter(`Tahun Anggaran ${villageInfo.tahun_anggaran}`, { size: SZ.md }),
        new Paragraph({ children: [] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'I. RINGKASAN', bold: true, size: SZ.lg, font: FONT })] }),
    ];

    // Summary table
    const summaryRows = [
        ['Total Kegiatan', String(items.length)],
        ['Total Anggaran', formatRupiah(totalAnggaran)],
        ['Total Realisasi', formatRupiah(totalRealisasi)],
        ['Sisa Anggaran', formatRupiah(totalAnggaran - totalRealisasi)],
        ['Penyerapan', totalAnggaran > 0 ? `${((totalRealisasi / totalAnggaran) * 100).toFixed(1)}%` : '0%'],
    ];

    children.push(new Table({
        rows: summaryRows.map(([label, val]) => new TableRow({
            children: [cell(label, { bold: true, width: 3000 }), cell(val, { width: 6000 })],
        })),
        width: { size: 9000, type: WidthType.DXA },
    }));

    // Detail per bidang → sub-bidang
    children.push(
        new Paragraph({ children: [] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'II. RINCIAN PER BIDANG & SUB BIDANG', bold: true, size: SZ.lg, font: FONT })] }),
    );

    Object.entries(bidangMap).forEach(([bdg, subMap]) => {
        // Bidang header (only show when exporting all bidang)
        if (isAll) {
            const bdgActs = Object.values(subMap).flat();
            const bdgAnggaran = bdgActs.reduce((s, a) => s + Number(a.anggaran || 0), 0);
            const bdgRealisasi = bdgActs.reduce((s, a) => s + Number(a.realisasi || 0), 0);
            children.push(new Paragraph({
                spacing: { before: 300, after: 100 },
                children: [new TextRun({ text: `BIDANG: ${bdg.toUpperCase()}`, bold: true, size: SZ.lg, font: FONT })],
            }));
            children.push(new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({
                    text: `${bdgActs.length} kegiatan — Anggaran: ${formatRupiah(bdgAnggaran)} — Realisasi: ${formatRupiah(bdgRealisasi)}`,
                    size: SZ.sm, font: FONT, italics: true,
                })],
            }));
        }

        Object.entries(subMap).forEach(([sb, acts]) => {
            const sbAnggaran = acts.reduce((s, a) => s + Number(a.anggaran || 0), 0);
            const sbRealisasi = acts.reduce((s, a) => s + Number(a.realisasi || 0), 0);

            children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: sb, bold: true, size: SZ.md, font: FONT })] }));

            const tableRows = [
                new TableRow({ children: [headerCell('Kode Rek', 800), headerCell('Kegiatan', 3500), headerCell('Anggaran', 2000), headerCell('Realisasi', 2000), headerCell('Status', 1200)] }),
            ];
            [...acts].sort(sortByNorek).forEach((a) => {
                tableRows.push(new TableRow({
                    children: [
                        cell(a.norek || '-', { alignment: AlignmentType.CENTER, width: 800 }),
                        cell(a.nama, { width: 3500 }),
                        cell(formatRupiah(a.anggaran), { alignment: AlignmentType.RIGHT, width: 2000 }),
                        cell(formatRupiah(a.realisasi), { alignment: AlignmentType.RIGHT, width: 2000 }),
                        cell((a.status || 'direncanakan').charAt(0).toUpperCase() + (a.status || 'direncanakan').slice(1), { alignment: AlignmentType.CENTER, width: 1200 }),
                    ],
                }));
            });
            tableRows.push(new TableRow({
                children: [
                    cell('', { width: 800 }), cell('TOTAL', { bold: true, width: 3500 }),
                    cell(formatRupiah(sbAnggaran), { bold: true, alignment: AlignmentType.RIGHT, width: 2000 }),
                    cell(formatRupiah(sbRealisasi), { bold: true, alignment: AlignmentType.RIGHT, width: 2000 }),
                    cell('', { width: 1200 }),
                ],
            }));
            children.push(new Table({ rows: tableRows, width: { size: 9500, type: WidthType.DXA } }));
        });
    });

    const doc = new Document({
        title: `Laporan Bidang ${bidang}`,
        sections: [makeSection(children)],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = bidang.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    const fileName = `LPJ_Bidang_${safeName}.docx`;
    saveAs(blob, fileName);
    return fileName;
}

// ── Export activities by Sub Bidang to Word ──
export async function exportSubBidangToWord(bidang, subBidang, activities, villageInfo) {
    const items = activities.filter(a => a.bidang === bidang && a.sub_bidang === subBidang);
    const totalAnggaran = items.reduce((s, a) => s + Number(a.anggaran || 0), 0);
    const totalRealisasi = items.reduce((s, a) => s + Number(a.realisasi || 0), 0);

    const children = [
        pCenter(`LAPORAN KEGIATAN — ${subBidang.toUpperCase()}`, { bold: true, size: SZ.xl }),
        pCenter(`Bidang: ${bidang}`, { size: SZ.md }),
        pCenter(`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`, { size: SZ.md }),
        new Paragraph({ children: [] }),
    ];

    const tableRows = [
        new TableRow({ children: [headerCell('Kode Rek', 600), headerCell('Kegiatan', 3000), headerCell('Pelaksana', 1800), headerCell('Anggaran', 1600), headerCell('Realisasi', 1600), headerCell('Status', 1000)] }),
    ];

    [...items].sort(sortByNorek).forEach((a) => {
        tableRows.push(new TableRow({
            children: [
                cell(a.norek || '-', { alignment: AlignmentType.CENTER, width: 600 }),
                cell(a.nama, { width: 3000 }),
                cell(a.pelaksana || '-', { width: 1800 }),
                cell(formatRupiah(a.anggaran), { alignment: AlignmentType.RIGHT, width: 1600 }),
                cell(formatRupiah(a.realisasi), { alignment: AlignmentType.RIGHT, width: 1600 }),
                cell((a.status || 'direncanakan').charAt(0).toUpperCase() + (a.status || 'direncanakan').slice(1), { alignment: AlignmentType.CENTER, width: 1000 }),
            ],
        }));
    });

    tableRows.push(new TableRow({
        children: [
            cell('', { width: 600 }), cell('TOTAL', { bold: true, width: 3000 }), cell('', { width: 1800 }),
            cell(formatRupiah(totalAnggaran), { bold: true, alignment: AlignmentType.RIGHT, width: 1600 }),
            cell(formatRupiah(totalRealisasi), { bold: true, alignment: AlignmentType.RIGHT, width: 1600 }),
            cell('', { width: 1000 }),
        ],
    }));

    children.push(new Table({ rows: tableRows, width: { size: 9600, type: WidthType.DXA } }));

    const doc = new Document({
        title: `Laporan Sub Bidang ${subBidang}`,
        sections: [makeSection(children)],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = subBidang.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    const fileName = `LPJ_SubBidang_${safeName}.docx`;
    saveAs(blob, fileName);
    return fileName;
}

// ── Export financial page data to Word ──
export async function exportFinancialToWord(type, data, villageInfo) {
    const configs = {
        pendapatan: {
            title: 'LAPORAN PENDAPATAN DESA',
            headers: ['Kode Rek', 'Sumber', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Keterangan'],
            widths: [600, 2800, 2200, 1600, 1200, 2000],
            row: (item) => [item.norek || '-', item.sumber, item.kategori, formatRupiah(item.jumlah), item.tanggal || '-', item.keterangan || '-'],
        },
        belanja: {
            title: 'LAPORAN BELANJA DESA',
            headers: ['Kode Rek', 'Uraian', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Penerima'],
            widths: [600, 2800, 2200, 1600, 1200, 2000],
            row: (item) => [item.norek || '-', item.uraian, item.kategori, formatRupiah(item.jumlah), item.tanggal || '-', item.penerima || '-'],
        },
        pembiayaan: {
            title: 'LAPORAN PEMBIAYAAN DESA',
            headers: ['Kode Rek', 'Uraian', 'Kategori', 'Sub Kategori', 'Jumlah (Rp)', 'Keterangan'],
            widths: [600, 2200, 1800, 1800, 1600, 2000],
            row: (item) => [item.norek || '-', item.uraian, item.kategori || '-', item.sub_kategori || '-', formatRupiah(item.jumlah), item.keterangan || '-'],
        },
    };

    const cfg = configs[type];
    if (!cfg) return null;

    const children = [
        ...buildKopSurat(villageInfo),
        ...emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: cfg.title, bold: true, size: SZ.xl, font: FONT })] }),
        pCenter(`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`, { size: SZ.md }),
        ...emptyLine(),
    ];

    const tableRows = [
        new TableRow({ children: cfg.headers.map((h, i) => headerCell(h, cfg.widths[i])) }),
    ];

    [...data].sort(sortByNorek).forEach((item, i) => {
        const rowData = cfg.row(item, i);
        tableRows.push(new TableRow({
            children: rowData.map((val, j) => cell(val, {
                width: cfg.widths[j],
                alignment: cfg.headers[j] === 'Jumlah (Rp)' ? AlignmentType.RIGHT : (j === 0 ? AlignmentType.CENTER : AlignmentType.LEFT),
            })),
        }));
    });

    // Total row
    const total = data.reduce((s, item) => s + Number(item.jumlah || 0), 0);
    const jumlahIdx = cfg.headers.indexOf('Jumlah (Rp)');
    const totalRow = cfg.headers.map((_, i) => {
        if (i === 0) return cell('', { width: cfg.widths[0] });
        if (i === 1) return cell('TOTAL', { bold: true, width: cfg.widths[1] });
        if (i === jumlahIdx) return cell(formatRupiah(total), { bold: true, alignment: AlignmentType.RIGHT, width: cfg.widths[jumlahIdx] });
        return cell('', { width: cfg.widths[i] });
    });
    tableRows.push(new TableRow({ children: totalRow }));

    const totalWidth = cfg.widths.reduce((s, w) => s + w, 0);
    children.push(new Table({ rows: tableRows, width: { size: totalWidth, type: WidthType.DXA } }));

    // Signing block
    children.push(
        ...emptyLine(2),
        ...buildSigningBlock(villageInfo, {
            leftTitle: 'Mengetahui,',
            leftRole: `KEPALA DESA ${(villageInfo.nama_desa || '').toUpperCase()}`,
            leftName: villageInfo.kepala_desa || '( .................... )',
            rightTitle: 'Dibuat Oleh,',
            rightRole: 'BENDAHARA DESA',
            rightName: villageInfo.bendahara || '( .................... )',
        }),
    );

    const sheetName = type.charAt(0).toUpperCase() + type.slice(1);
    const doc = new Document({
        title: `Laporan ${sheetName}`,
        sections: [makeSection(children)],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Laporan_${sheetName}_${(villageInfo.nama_desa || 'Desa').replace(/\s+/g, '_')}_${villageInfo.tahun_anggaran}.docx`;
    saveAs(blob, fileName);
    return fileName;
}

