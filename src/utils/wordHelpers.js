/**
 * ================================================================
 * Shared Word Document Builders — LPJ Desa
 * ================================================================
 * Reusable primitives for building official LPJ document sections:
 *   - Kop surat (letterhead)
 *   - Signing blocks (TTD)
 *   - Table helpers
 *   - Page section factory
 */

import {
    Paragraph, Table, TableRow, TableCell,
    TextRun, AlignmentType, BorderStyle, WidthType,
    PageBreak, ImageRun,
} from 'docx';
import { KABUPATEN_LOGO_BASE64 } from '../assets/kabupatenLogo';
import { GARUDA_LOGO_BASE64 } from '../assets/garudaLogo';

// ── Styling Constants ──
export const FONT = 'Bookman Old Style';
export const SZ = { xs: 18, sm: 20, md: 22, lg: 24, xl: 28, xxl: 32 };

export const BORDER = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
};

export const NO_BORDER = {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
};

// ── Margin config for A4 page ──
export const PAGE_MARGINS = {
    top: 1134,       // ~2cm
    bottom: 1134,    // ~2cm
    left: 1985,      // ~3.5cm (matches reference)
    right: 1134,     // ~2cm
};

// ── Cell Helpers ──
export function cell(text, opts = {}) {
    const {
        bold = false,
        alignment = AlignmentType.LEFT,
        width,
        shading,
        borders = BORDER,
        size = SZ.sm,
        italics = false,
        colspan,
        rowspan,
    } = opts;
    return new TableCell({
        borders,
        width: width ? { size: width, type: WidthType.DXA } : undefined,
        shading: shading ? { fill: shading } : undefined,
        columnSpan: colspan,
        rowSpan: rowspan,
        children: [
            new Paragraph({
                alignment,
                spacing: { before: 30, after: 30 },
                children: [
                    new TextRun({ text: String(text ?? ''), bold, italics, size, font: FONT }),
                ],
            }),
        ],
    });
}

export function headerCell(text, width) {
    return cell(text, { bold: true, alignment: AlignmentType.CENTER, width, shading: 'D9E2F3' });
}

export function noBorderCell(text, opts = {}) {
    return cell(text, { ...opts, borders: NO_BORDER });
}

// ── Paragraph Helpers ──
export function p(text, opts = {}) {
    const {
        bold = false,
        alignment = AlignmentType.BOTH,
        size = SZ.md,
        spacing = {},
        italics = false,
        underline = false,
    } = opts;
    return new Paragraph({
        alignment,
        spacing: { before: 60, after: 60, ...spacing },
        children: [
            new TextRun({
                text: String(text ?? ''),
                bold,
                italics,
                size,
                font: FONT,
                underline: underline ? {} : undefined,
            }),
        ],
    });
}

export function pCenter(text, opts = {}) {
    return p(text, { ...opts, alignment: AlignmentType.CENTER });
}

export function pRight(text, opts = {}) {
    return p(text, { ...opts, alignment: AlignmentType.RIGHT });
}

export function emptyLine(count = 1) {
    return Array.from({ length: count }, () => new Paragraph({ children: [] }));
}

export function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

// ── Kop Surat (Official Letterhead with Logo) ──
export function base64ToBuffer(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export function buildKopSurat(villageInfo) {
    const logoChildren = [];
    try {
        logoChildren.push(
            new ImageRun({
                data: base64ToBuffer(KABUPATEN_LOGO_BASE64),
                transformation: { width: 70, height: 75 },
                type: 'png',
            }),
        );
    } catch (e) { /* logo fallback: skip if error */ }

    return [
        // Logo row (centered)
        ...(logoChildren.length > 0 ? [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 0 },
                children: logoChildren,
            }),
        ] : []),
        pCenter(`PEMERINTAH KABUPATEN ${(villageInfo.kabupaten || '').toUpperCase()}`, { bold: true, size: SZ.lg }),
        pCenter(`KECAMATAN ${(villageInfo.kecamatan || '').toUpperCase()}`, { bold: true, size: SZ.lg }),
        pCenter(`DESA ${(villageInfo.nama_desa || '').toUpperCase()}`, { bold: true, size: SZ.xl }),
        pCenter(`Alamat : ${villageInfo.alamat || '-'} Kode Pos ${villageInfo.kode_pos || '-'}`, { size: SZ.xs, italics: true }),
        // Horizontal line
        new Paragraph({
            spacing: { before: 40, after: 120 },
            border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000' } },
            children: [],
        }),
    ];
}

// ── Garuda Header (ONLY for SK TPK / Keputusan Kepala Desa) ──
export function buildGarudaHeader() {
    const children = [];
    try {
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [
                    new ImageRun({
                        data: base64ToBuffer(GARUDA_LOGO_BASE64),
                        transformation: { width: 90, height: 90 },
                        type: 'png',
                    }),
                ],
            }),
        );
    } catch (e) { /* fallback: skip */ }
    return children;
}

// ── TPK Letterhead ──
export function buildTPKHeader(villageInfo) {
    return [
        pCenter('TIM PELAKSANA KEGIATAN', { bold: true, size: SZ.lg }),
        pCenter(`DESA ${(villageInfo.nama_desa || '').toUpperCase()} KECAMATAN ${(villageInfo.kecamatan || '').toUpperCase()} KABUPATEN ${(villageInfo.kabupaten || '').toUpperCase()}`, { bold: true, size: SZ.sm }),
        pCenter(`Alamat : ${villageInfo.alamat || '-'} Kp: ${villageInfo.kode_pos || '-'}`, { size: SZ.xs, italics: true }),
        new Paragraph({
            spacing: { before: 40, after: 120 },
            border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000' } },
            children: [],
        }),
    ];
}

// ── Info Table (Key-Value pairs) ──
export function buildInfoTable(entries) {
    return new Table({
        rows: entries.map(([label, value]) =>
            new TableRow({
                children: [
                    noBorderCell(label, { bold: true, width: 2800, size: SZ.sm }),
                    noBorderCell(':', { width: 300, size: SZ.sm }),
                    noBorderCell(String(value || ''), { width: 5900, size: SZ.sm }),
                ],
            })
        ),
        width: { size: 9000, type: WidthType.DXA },
    });
}

// ── Signing Block (Two columns: left + right) ──
export function buildSigningBlock(villageInfo, opts = {}) {
    const {
        leftTitle = 'Menyetujui,',
        leftRole = 'KEPALA DESA ' + (villageInfo.nama_desa || '').toUpperCase(),
        leftName = villageInfo.kepala_desa || '( .................... )',
        rightTitle = 'Dibuat Oleh,',
        rightRole = 'PELAKSANA KEGIATAN ANGGARAN',
        rightName = '( .................... )',
        date = `${villageInfo.nama_desa || '......'}, ........................ ${villageInfo.tahun_anggaran || '20XX'}`,
    } = opts;

    return [
        ...emptyLine(1),
        pRight(date, { size: SZ.sm }),
        ...emptyLine(1),
        new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
                new TableRow({
                    children: [
                        noBorderCell(leftTitle, { bold: true, width: 4500, alignment: AlignmentType.CENTER, size: SZ.sm }),
                        noBorderCell(rightTitle, { bold: true, width: 4500, alignment: AlignmentType.CENTER, size: SZ.sm }),
                    ],
                }),
                new TableRow({
                    children: [
                        noBorderCell(leftRole, { bold: true, width: 4500, alignment: AlignmentType.CENTER, size: SZ.sm }),
                        noBorderCell(rightRole, { bold: true, width: 4500, alignment: AlignmentType.CENTER, size: SZ.sm }),
                    ],
                }),
                // Spacing for signature
                ...Array.from({ length: 3 }, () => new TableRow({
                    children: [
                        noBorderCell('', { width: 4500 }),
                        noBorderCell('', { width: 4500 }),
                    ],
                })),
                new TableRow({
                    children: [
                        noBorderCell(leftName, { bold: true, underline: true, width: 4500, alignment: AlignmentType.CENTER, size: SZ.sm }),
                        noBorderCell(rightName, { bold: true, underline: true, width: 4500, alignment: AlignmentType.CENTER, size: SZ.sm }),
                    ],
                }),
            ],
        }),
    ];
}

// ── TPK Signing Block (3 members) ──
export function buildTPKSigningBlock(villageInfo, opts = {}) {
    const {
        members = [
            { nama: '..............................', jabatan: 'Ketua' },
            { nama: '..............................', jabatan: 'Sekretaris' },
            { nama: '..............................', jabatan: 'Anggota' },
        ],
    } = opts;

    const rows = [
        new TableRow({
            children: [
                headerCell('No', 600),
                headerCell('N A M A', 3000),
                headerCell('Jabatan Dalam Tim', 2400),
                headerCell('Tanda Tangan', 2400),
            ],
        }),
    ];
    members.forEach((m, i) => {
        rows.push(new TableRow({
            children: [
                cell(String(i + 1), { alignment: AlignmentType.CENTER, width: 600 }),
                cell(m.nama, { bold: true, width: 3000 }),
                cell(m.jabatan, { width: 2400 }),
                cell('', { width: 2400 }),
            ],
        }));
    });

    return new Table({ rows, width: { size: 8400, type: WidthType.DXA } });
}

// ── Section Factory ──
export function makeSection(children) {
    return {
        properties: { page: { margin: PAGE_MARGINS } },
        children,
    };
}

// ── Placeholder date string ──
export function placeholderDate(villageInfo) {
    return `${villageInfo.nama_desa || '......'}, ........................ ${villageInfo.tahun_anggaran || '20XX'}`;
}

// ── Auto Nomor Surat ──
const BULAN_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function generateNomorSurat(type, activity, villageInfo) {
    // type: 'SK-TPK', 'SP-DOK', 'BA-EVL', 'BA-KLR', 'SP', 'BA-PMR', 'BAST-TPK', 'BAST-KDS'
    const urutan = String(activity.id || 1).slice(-4).padStart(4, '0');
    const kodeDesa = (villageInfo.nama_desa || 'DSA').substring(0, 3).toUpperCase();
    const now = activity.mulai ? new Date(activity.mulai) : new Date();
    const bulan = BULAN_ROMAWI[now.getMonth()] || 'I';
    const tahun = villageInfo.tahun_anggaran || now.getFullYear();
    return `045/${urutan}/${type}/${kodeDesa}/${bulan}/${tahun}`;
}

// ── Calculate Duration (calendar days) ──
export function calcDuration(activity) {
    if (activity.mulai && activity.selesai) {
        const ms = new Date(activity.selesai) - new Date(activity.mulai);
        if (isNaN(ms)) return activity.waktu_pelaksanaan || '........ Hari Kalender';
        const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
        return `${days} Hari Kalender`;
    }
    return activity.waktu_pelaksanaan || '........ Hari Kalender';
}

// ── Fallback Lokasi ──
export function fallbackLokasi(activity, villageInfo) {
    return activity.lokasi || `Desa ${villageInfo.nama_desa || '....'}, Kec. ${villageInfo.kecamatan || '....'}`;
}
