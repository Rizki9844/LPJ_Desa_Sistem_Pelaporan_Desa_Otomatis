/**
 * ================================================================
 * Pilar 2 — SPJ Keuangan: Kuitansi & Daftar Nominatif HOK
 * ================================================================
 * Generate dokumen Word berisi:
 *   1. Tanda Bukti Pengeluaran Uang (Kuitansi)  — per expense
 *   2. Daftar Nominatif Pembayaran Upah Pekerja (HOK)  — per kegiatan
 *
 * Sesuai format SPJ Keuangan Desa (Permendagri 20/2018).
 */

import {
    Document, Packer, Table, TableRow, AlignmentType,
    WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { formatRupiah } from '../data/sampleData';
import { angkaKeTerbilang } from './terbilang';
import {
    SZ,
    p, pCenter, emptyLine,
    cell, headerCell, noBorderCell,
    buildKopSurat, makeSection,
} from './wordHelpers';

// ── Helpers ──
const BULAN_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function generateNomorKuitansi(index, tahun) {
    const urutan = String(index).padStart(4, '0');
    const now = new Date();
    const bulan = BULAN_ROMAWI[now.getMonth()] || 'I';
    return `KWT/${urutan}/${bulan}/${tahun || now.getFullYear()}`;
}

/** Build a generic 3-column signing block (no-border table).
 * @param {Array<{title: string, name: string}>} cols — 3 column definitions */
function build3ColSigningBlock(cols) {
    const placeholder = '( .................... )';
    return new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: [
            new TableRow({
                children: cols.map(c =>
                    noBorderCell(c.title, { bold: true, alignment: AlignmentType.CENTER, width: 3000, size: SZ.sm }),
                ),
            }),
            ...Array.from({ length: 3 }, () => new TableRow({
                children: cols.map(() => noBorderCell('', { width: 3000 })),
            })),
            new TableRow({
                children: cols.map(c =>
                    noBorderCell(c.name || placeholder, { bold: true, underline: true, alignment: AlignmentType.CENTER, width: 3000, size: SZ.sm }),
                ),
            }),
        ],
    });
}

// ══════════════════════════════════════════
//   KUITANSI EXPORT
// ══════════════════════════════════════════

/**
 * Generate bundel Kuitansi (Tanda Bukti Pengeluaran Uang).
 *
 * @param {Array} expenseItems  - expense_items with tipe='kuitansi' (from AppContext)
 * @param {Array} expenses      - expenses array (from AppContext)
 * @param {Object} villageInfo  - villageInfo from AppContext
 * @returns {Promise<string>} filename
 */
export async function exportKuitansiToWord(expenseItems, expenses, villageInfo) {
    const vi = villageInfo;
    const kuitansiItems = (expenseItems || []).filter(ei => ei.tipe === 'kuitansi');

    if (kuitansiItems.length === 0) {
        throw new Error('Tidak ada data kuitansi untuk di-export. Silakan tambahkan detail kuitansi di halaman Belanja.');
    }

    // Group expense_items by expense_id
    const groupedByExpense = {};
    kuitansiItems.forEach(item => {
        const eid = item.expense_id;
        if (!groupedByExpense[eid]) groupedByExpense[eid] = [];
        groupedByExpense[eid].push(item);
    });

    const expenseMap = {};
    (expenses || []).forEach(e => { expenseMap[e.id] = e; });

    const sections = [];
    let kwtNumber = 0;

    Object.entries(groupedByExpense).forEach(([expenseId, items]) => {
        kwtNumber++;
        const parentExpense = expenseMap[expenseId] || {};
        const totalKwt = items.reduce((s, it) => s + (Number(it.jumlah) || 0), 0);
        const primaryPenerima = items[0]?.dibayar_kepada || parentExpense.penerima || '';
        const primaryUraian = items.length === 1
            ? (items[0].uraian || parentExpense.uraian || '-')
            : (parentExpense.uraian || items[0].uraian || '-');
        const primaryTanggal = items[0]?.tanggal || parentExpense.tanggal || '';

        const children = [
            ...buildKopSurat(vi),
            ...emptyLine(1),
            pCenter('TANDA BUKTI PENGELUARAN UANG', { bold: true, size: SZ.lg, spacing: { after: 200 } }),
            ...emptyLine(1),
        ];

        // Info block (no-border table)
        const infoTable = new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
                ['Nomor Bukti', generateNomorKuitansi(kwtNumber, vi.tahun_anggaran)],
                ['Tanggal', primaryTanggal],
                ['Dibayar Kepada', primaryPenerima],
                ['Uraian', primaryUraian],
            ].map(([label, value]) => new TableRow({
                children: [
                    noBorderCell(label, { bold: true, width: 2500, size: SZ.sm }),
                    noBorderCell(':', { width: 300, size: SZ.sm }),
                    noBorderCell(String(value || '-'), { width: 6200, size: SZ.sm }),
                ],
            })),
        });
        children.push(infoTable, ...emptyLine(1));

        // Detail items table
        const detailRows = [
            new TableRow({
                children: [
                    headerCell('No', 500),
                    headerCell('Uraian', 3000),
                    headerCell('Volume', 800),
                    headerCell('Satuan', 800),
                    headerCell('Harga Satuan (Rp)', 1700),
                    headerCell('Jumlah (Rp)', 1700),
                ],
            }),
        ];

        items.forEach((item, idx) => {
            detailRows.push(new TableRow({
                children: [
                    cell(String(idx + 1), { alignment: AlignmentType.CENTER, width: 500 }),
                    cell(item.uraian || '-', { width: 3000 }),
                    cell(String(item.volume || 1), { alignment: AlignmentType.CENTER, width: 800 }),
                    cell(item.satuan || '-', { width: 800 }),
                    cell(formatRupiah(item.harga_satuan || 0), { alignment: AlignmentType.RIGHT, width: 1700 }),
                    cell(formatRupiah(item.jumlah || 0), { alignment: AlignmentType.RIGHT, width: 1700 }),
                ],
            }));
        });

        // Total row
        detailRows.push(new TableRow({
            children: [
                cell('', { width: 500, shading: 'D9E2F3' }),
                cell('JUMLAH', { bold: true, width: 3000, shading: 'D9E2F3', colspan: 4 }),
                cell(formatRupiah(totalKwt), { bold: true, alignment: AlignmentType.RIGHT, width: 1700, shading: 'D9E2F3' }),
            ],
        }));

        children.push(new Table({ rows: detailRows, width: { size: 8500, type: WidthType.DXA } }));

        // Terbilang
        children.push(
            ...emptyLine(1),
            p(`Terbilang : # ${angkaKeTerbilang(totalKwt)} #`, { bold: true, italics: true, size: SZ.sm }),
            ...emptyLine(2),
        );

        // 3-column signing
        children.push(build3ColSigningBlock([
            { title: 'Penerima,', name: primaryPenerima },
            { title: 'Bendahara Desa,', name: vi.bendahara },
            { title: 'Mengetahui,\nKepala Desa', name: vi.kepala_desa },
        ]));

        sections.push(makeSection(children));
    });

    const doc = new Document({
        creator: 'Sistem LPJ Desa',
        title: `Kuitansi SPJ - ${vi.nama_desa || 'Desa'} - TA ${vi.tahun_anggaran || ''}`,
        sections,
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (vi.nama_desa || 'Desa').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const fileName = `Kuitansi_SPJ_${safeName}_${vi.tahun_anggaran || ''}.docx`;
    saveAs(blob, fileName);
    return fileName;
}

// ══════════════════════════════════════════
//   DAFTAR HOK EXPORT
// ══════════════════════════════════════════

/**
 * Generate Daftar Nominatif Pembayaran Upah Pekerja (HOK).
 *
 * @param {Array} expenseItems  - expense_items with tipe='hok' (from AppContext)
 * @param {Array} activities    - activities array (from AppContext)
 * @param {Array} expenses      - expenses array (from AppContext)
 * @param {Object} villageInfo  - villageInfo from AppContext
 * @returns {Promise<string>} filename
 */
export async function exportDaftarHOKToWord(expenseItems, activities, expenses, villageInfo) {
    const vi = villageInfo;
    const hokItems = (expenseItems || []).filter(ei => ei.tipe === 'hok');

    if (hokItems.length === 0) {
        throw new Error('Tidak ada data HOK untuk di-export. Silakan tambahkan detail upah pekerja di halaman Belanja.');
    }

    // Build activity map for lookup
    const activityMap = {};
    (activities || []).forEach(a => { activityMap[a.id] = a; });

    const expenseMap = {};
    (expenses || []).forEach(e => { expenseMap[e.id] = e; });

    // Group HOK items by activity_id (or expense_id as fallback group)
    const groupedByActivity = {};
    hokItems.forEach(item => {
        const groupKey = item.activity_id
            ? `act_${item.activity_id}`
            : `exp_${item.expense_id}`;
        if (!groupedByActivity[groupKey]) groupedByActivity[groupKey] = [];
        groupedByActivity[groupKey].push(item);
    });

    const sections = [];

    Object.entries(groupedByActivity).forEach(([groupKey, items]) => {
        const activityId = groupKey.startsWith('act_') ? Number(groupKey.replace('act_', '')) : null;
        const expenseId = groupKey.startsWith('exp_') ? Number(groupKey.replace('exp_', '')) : null;
        const activity = activityId ? activityMap[activityId] : null;
        const parentExpense = expenseId ? expenseMap[expenseId] : null;

        const kegiatanNama = activity?.nama || parentExpense?.uraian || 'Kegiatan Tidak Diketahui';
        const subBidang = activity?.sub_bidang || parentExpense?.sub_bidang || '-';
        const pelaksana = activity?.pelaksana || '';
        const periode = activity
            ? `${activity.mulai || '......'} s/d ${activity.selesai || '......'}`
            : '-';

        const totalHOK = items.reduce((s, it) => s + (Number(it.jumlah) || 0), 0);

        const children = [
            ...buildKopSurat(vi),
            ...emptyLine(1),
            pCenter('DAFTAR NOMINATIF', { bold: true, size: SZ.lg }),
            pCenter('PEMBAYARAN UPAH PEKERJA (HOK)', { bold: true, size: SZ.lg, spacing: { after: 200 } }),
            ...emptyLine(1),
        ];

        // Info block
        const infoTable = new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
                ['Nama Kegiatan', kegiatanNama],
                ['Sub Bidang', subBidang],
                ['Pelaksana', pelaksana || '-'],
                ['Periode', periode],
            ].map(([label, value]) => new TableRow({
                children: [
                    noBorderCell(label, { bold: true, width: 2500, size: SZ.sm }),
                    noBorderCell(':', { width: 300, size: SZ.sm }),
                    noBorderCell(String(value || '-'), { width: 6200, size: SZ.sm }),
                ],
            })),
        });
        children.push(infoTable, ...emptyLine(1));

        // HOK table
        const hokRows = [
            new TableRow({
                children: [
                    headerCell('No', 500),
                    headerCell('Nama Pekerja', 2500),
                    headerCell('NIK', 1800),
                    headerCell('Hari Kerja', 800),
                    headerCell('Upah/Hari (Rp)', 1500),
                    headerCell('Jumlah (Rp)', 1500),
                ],
            }),
        ];

        items.forEach((item, idx) => {
            hokRows.push(new TableRow({
                children: [
                    cell(String(idx + 1), { alignment: AlignmentType.CENTER, width: 500 }),
                    cell(item.dibayar_kepada || '-', { width: 2500 }),
                    cell(item.nik || '-', { width: 1800 }),
                    cell(String(item.volume || 0), { alignment: AlignmentType.CENTER, width: 800 }),
                    cell(formatRupiah(item.harga_satuan || 0), { alignment: AlignmentType.RIGHT, width: 1500 }),
                    cell(formatRupiah(item.jumlah || 0), { alignment: AlignmentType.RIGHT, width: 1500 }),
                ],
            }));
        });

        // Total
        hokRows.push(new TableRow({
            children: [
                cell('', { width: 500, shading: 'D9E2F3' }),
                cell('JUMLAH TOTAL', { bold: true, width: 2500, shading: 'D9E2F3', colspan: 4 }),
                cell(formatRupiah(totalHOK), { bold: true, alignment: AlignmentType.RIGHT, width: 1500, shading: 'D9E2F3' }),
            ],
        }));

        children.push(new Table({ rows: hokRows, width: { size: 8600, type: WidthType.DXA } }));

        // Terbilang
        children.push(
            ...emptyLine(1),
            p(`Terbilang : # ${angkaKeTerbilang(totalHOK)} #`, { bold: true, italics: true, size: SZ.sm }),
            ...emptyLine(2),
        );

        // Signing block: PKA + Bendahara + Kades
        children.push(build3ColSigningBlock([
            { title: 'Pelaksana Kegiatan,', name: pelaksana },
            { title: 'Bendahara Desa,', name: vi.bendahara },
            { title: 'Mengetahui,\nKepala Desa', name: vi.kepala_desa },
        ]));

        sections.push(makeSection(children));
    });

    const doc = new Document({
        creator: 'Sistem LPJ Desa',
        title: `Daftar HOK - ${vi.nama_desa || 'Desa'} - TA ${vi.tahun_anggaran || ''}`,
        sections,
    });

    const blob = await Packer.toBlob(doc);
    const safeName = (vi.nama_desa || 'Desa').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const fileName = `Daftar_HOK_${safeName}_${vi.tahun_anggaran || ''}.docx`;
    saveAs(blob, fileName);
    return fileName;
}
