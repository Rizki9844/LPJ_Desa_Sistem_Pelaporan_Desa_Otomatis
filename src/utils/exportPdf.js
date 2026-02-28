/**
 * ================================================================
 * Export PDF — LPJ Desa
 * ================================================================
 * Uses jsPDF + jspdf-autotable for professional PDF generation
 * with tables, kop surat, and signing blocks.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from '../data/sampleData';

// ── Sort by norek (kode rekening) ──
const sortByNorek = (a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true });

// ── Config ──
const MARGIN = { top: 28, left: 30, right: 20, bottom: 20 };
const FONT_SIZE = { xs: 8, sm: 9, md: 10, lg: 12, xl: 14, xxl: 16 };
const PAGE_W = 210; // A4 width mm

// ── Helpers ──
function addKopSurat(doc, villageInfo, y) {
    const vi = villageInfo;
    const centerX = PAGE_W / 2;

    doc.setFontSize(FONT_SIZE.lg);
    doc.setFont('helvetica', 'bold');
    doc.text(`PEMERINTAH KABUPATEN ${(vi.kabupaten || '').toUpperCase()}`, centerX, y, { align: 'center' });
    y += 6;
    doc.text(`KECAMATAN ${(vi.kecamatan || '').toUpperCase()}`, centerX, y, { align: 'center' });
    y += 6;
    doc.setFontSize(FONT_SIZE.xl);
    doc.text(`DESA ${(vi.nama_desa || '').toUpperCase()}`, centerX, y, { align: 'center' });
    y += 5;
    doc.setFontSize(FONT_SIZE.xs);
    doc.setFont('helvetica', 'italic');
    doc.text(`Alamat: ${vi.alamat || '-'} Kp: ${vi.kode_pos || '-'}`, centerX, y, { align: 'center' });
    y += 3;

    // Horizontal line
    doc.setLineWidth(0.8);
    doc.line(MARGIN.left, y, PAGE_W - MARGIN.right, y);
    y += 1;
    doc.setLineWidth(0.3);
    doc.line(MARGIN.left, y, PAGE_W - MARGIN.right, y);
    y += 6;

    return y;
}

function addTitle(doc, title, y) {
    const centerX = PAGE_W / 2;
    doc.setFontSize(FONT_SIZE.xl);
    doc.setFont('helvetica', 'bold');
    doc.text(title, centerX, y, { align: 'center' });
    return y + 8;
}

function addSubtitle(doc, text, y) {
    const centerX = PAGE_W / 2;
    doc.setFontSize(FONT_SIZE.md);
    doc.setFont('helvetica', 'bold');
    doc.text(text, centerX, y, { align: 'center' });
    return y + 6;
}

function addInfoTable(doc, entries, y) {
    doc.setFontSize(FONT_SIZE.sm);
    doc.setFont('helvetica', 'normal');
    entries.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, MARGIN.left, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`: ${value || '-'}`, MARGIN.left + 45, y);
        y += 5;
    });
    return y + 2;
}

function addSigningBlock(doc, y, opts = {}) {
    const {
        leftTitle = 'Menyetujui,',
        leftRole = 'KEPALA DESA',
        leftName = '( .................... )',
        rightTitle = 'Dibuat Oleh,',
        rightRole = 'PELAKSANA KEGIATAN',
        rightName = '( .................... )',
        date = '......, ........................ 20XX',
    } = opts;

    // Check if we need a new page
    if (y > 250) {
        doc.addPage();
        y = MARGIN.top;
    }

    doc.setFontSize(FONT_SIZE.sm);
    const rightX = PAGE_W - MARGIN.right - 50;

    // Date
    doc.setFont('helvetica', 'normal');
    doc.text(date, rightX, y);
    y += 8;

    // Titles
    doc.setFont('helvetica', 'bold');
    doc.text(leftTitle, MARGIN.left + 15, y);
    doc.text(rightTitle, rightX, y);
    y += 5;

    // Roles
    doc.text(leftRole, MARGIN.left + 10, y);
    doc.text(rightRole, rightX - 5, y);
    y += 25;

    // Names with underline
    doc.text(leftName, MARGIN.left + 10, y);
    doc.text(rightName, rightX - 5, y);

    return y + 10;
}

// ── Export Single Activity to PDF ──
export async function exportActivityToPdf(activity, villageInfo, attachments = []) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const vi = villageInfo;
    const act = activity;
    const jenis = act.jenis_lpj || 'fisik';

    let y = MARGIN.top;

    // Kop surat
    y = addKopSurat(doc, vi, y);

    // Title
    y = addTitle(doc, 'LAPORAN PERTANGGUNGJAWABAN KEGIATAN', y);
    y = addSubtitle(doc, `(LPJ ${jenis === 'fisik' ? 'FISIK' : 'NON-FISIK'})`, y);
    y = addSubtitle(doc, `TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, y);
    y += 4;

    // Activity info table
    y = addInfoTable(doc, [
        ['Kode Rekening', act.norek || '-'],
        ['Nama Kegiatan', act.nama],
        ['Bidang', act.bidang],
        ['Sub Bidang', act.sub_bidang],
        ['Jenis LPJ', jenis === 'fisik' ? 'Fisik (Infrastruktur)' : 'Non-Fisik (Program/Pelayanan)'],
        ['Status', (act.status || '').charAt(0).toUpperCase() + (act.status || '').slice(1)],
        ['Progres', `${act.progres || 0}%`],
        ['Pelaksana', act.pelaksana || '-'],
    ], y);

    y += 4;

    // Budget table
    doc.setFontSize(FONT_SIZE.md);
    doc.setFont('helvetica', 'bold');
    doc.text('REALISASI ANGGARAN', MARGIN.left, y);
    y += 4;

    const anggaran = Number(act.anggaran || 0);
    const realisasi = Number(act.realisasi || 0);
    const sisa = anggaran - realisasi;
    const pct = anggaran > 0 ? ((realisasi / anggaran) * 100).toFixed(1) : '0.0';

    autoTable(doc, {
        startY: y,
        margin: { left: MARGIN.left, right: MARGIN.right },
        head: [['Uraian', 'Jumlah (Rp)']],
        body: [
            ['Anggaran', formatRupiah(anggaran)],
            ['Realisasi', formatRupiah(realisasi)],
            ['Sisa Anggaran', formatRupiah(sisa)],
            ['Persentase Realisasi', `${pct}%`],
        ],
        styles: { font: 'helvetica', fontSize: FONT_SIZE.sm, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold' },
            1: { cellWidth: 70, halign: 'right' },
        },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Penutup
    doc.setFontSize(FONT_SIZE.sm);
    doc.setFont('helvetica', 'normal');
    const penutup = `Demikian Laporan Pertanggungjawaban kegiatan "${act.nama || '...'}" pada ${act.bidang || '...'} — ${act.sub_bidang || '...'}, ${vi.nama_desa || '...'}, Tahun Anggaran ${vi.tahun_anggaran || '...'}.`;
    const splitText = doc.splitTextToSize(penutup, PAGE_W - MARGIN.left - MARGIN.right);
    doc.text(splitText, MARGIN.left, y);
    y += splitText.length * 5 + 4;

    // Signing block
    addSigningBlock(doc, y, {
        leftTitle: '',
        leftRole: '',
        leftName: '',
        rightTitle: `Kepala Desa ${vi.nama_desa || '......'},`,
        rightRole: '',
        rightName: vi.kepala_desa || '( .................... )',
        date: `${vi.nama_desa || '......'}, ........................ ${vi.tahun_anggaran || '20XX'}`,
    });

    // ── Daftar Bukti Lampiran (jika ada) ──
    if (attachments.length > 0) {
        doc.addPage();
        y = MARGIN.top;
        y = addKopSurat(doc, vi, y);
        y = addTitle(doc, 'DAFTAR BUKTI LAMPIRAN', y);
        y += 2;

        doc.setFontSize(FONT_SIZE.sm);
        doc.setFont('helvetica', 'normal');
        doc.text(`Kegiatan: ${act.nama || '-'}`, MARGIN.left, y);
        y += 5;
        doc.text(`Berikut adalah daftar ${attachments.length} dokumen bukti yang telah diunggah:`, MARGIN.left, y);
        y += 4;

        autoTable(doc, {
            startY: y,
            margin: { left: MARGIN.left, right: MARGIN.right },
            head: [['No', 'Nama Dokumen', 'Nama File']],
            body: attachments.map((att, idx) => [
                idx + 1,
                att.keterangan || att.file_name,
                att.file_name,
            ]),
            styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
            headStyles: { fillColor: [75, 85, 99], textColor: 255 },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 90 },
                2: { cellWidth: 60 },
            },
        });

        y = doc.lastAutoTable.finalY + 6;

        // Hyperlinks
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZE.sm);
        doc.text('Link Dokumen Digital:', MARGIN.left, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE.xs);
        attachments.forEach((att, idx) => {
            if (y > 280) { doc.addPage(); y = MARGIN.top; }
            const label = `${idx + 1}. ${att.keterangan || att.file_name}`;
            if (att.file_url) {
                doc.setTextColor(17, 85, 204);
                doc.textWithLink(label, MARGIN.left + 5, y, { url: att.file_url });
                const textWidth = doc.getTextWidth(label);
                doc.setDrawColor(17, 85, 204);
                doc.setLineWidth(0.2);
                doc.line(MARGIN.left + 5, y + 0.5, MARGIN.left + 5 + textWidth, y + 0.5);
                doc.setTextColor(0, 0, 0);
            } else {
                doc.text(label, MARGIN.left + 5, y);
            }
            y += 3.5;
        });
    }

    // Save
    const safeName = (act.nama || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    doc.save(`LPJ_${jenis === 'fisik' ? 'Fisik' : 'NonFisik'}_${safeName}.pdf`);

    return `LPJ_${jenis === 'fisik' ? 'Fisik' : 'NonFisik'}_${safeName}.pdf`;
}

// ── Export Full LPJ (All activities) to PDF ──
export async function exportAllToPdf(state, attachData = { kegiatan: {}, belanja: {}, belanjaTotal: 0 }) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const vi = state.villageInfo;
    const activities = state.activities || [];
    const incomes = state.incomes || [];
    const expenses = state.expenses || [];

    const totalIncome = incomes.reduce((s, i) => s + Number(i.jumlah || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.jumlah || 0), 0);

    // ── Cover Page ──
    let y = 60;
    doc.setFontSize(FONT_SIZE.xxl);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN PERTANGGUNGJAWABAN', PAGE_W / 2, y, { align: 'center' });
    y += 9;
    doc.text('REALISASI PELAKSANAAN APBDesa', PAGE_W / 2, y, { align: 'center' });
    y += 9;
    doc.setFontSize(FONT_SIZE.xl);
    doc.text((vi.periode || '').toUpperCase(), PAGE_W / 2, y, { align: 'center' });
    y += 20;
    doc.setFontSize(FONT_SIZE.lg);
    doc.text((vi.nama_desa || '').toUpperCase(), PAGE_W / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text((vi.kecamatan || '').toUpperCase(), PAGE_W / 2, y, { align: 'center' });
    y += 7;
    doc.text((vi.kabupaten || '').toUpperCase(), PAGE_W / 2, y, { align: 'center' });
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, PAGE_W / 2, y, { align: 'center' });

    // ── Pendapatan ──
    doc.addPage();
    y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, 'PENDAPATAN DESA', y);
    y += 2;

    if (incomes.length > 0) {
        autoTable(doc, {
            startY: y,
            margin: { left: MARGIN.left, right: MARGIN.right },
            head: [['Kode Rek', 'Sumber Pendapatan', 'Kategori', 'Jumlah (Rp)']],
            body: [
                ...[...incomes].sort(sortByNorek).map((item) => [item.norek || '-', item.sumber, item.kategori, formatRupiah(item.jumlah)]),
                ['', '', 'TOTAL', formatRupiah(totalIncome)],
            ],
            styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 2 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255 },
            columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 3: { halign: 'right' } },
        });
    }

    // ── Belanja ──
    doc.addPage();
    y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, 'BELANJA DESA', y);
    y += 2;

    if (expenses.length > 0) {
        autoTable(doc, {
            startY: y,
            margin: { left: MARGIN.left, right: MARGIN.right },
            head: [['Kode Rek', 'Uraian Belanja', 'Kategori', 'Jumlah (Rp)']],
            body: [
                ...[...expenses].sort(sortByNorek).map((item) => [item.norek || '-', item.uraian, item.kategori, formatRupiah(item.jumlah)]),
                ['', '', 'TOTAL', formatRupiah(totalExpense)],
            ],
            styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 2 },
            headStyles: { fillColor: [239, 68, 68], textColor: 255 },
            columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 3: { halign: 'right' } },
        });
    }

    // ── Kegiatan ──
    doc.addPage();
    y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, 'PELAKSANAAN KEGIATAN', y);
    y += 2;

    if (activities.length > 0) {
        autoTable(doc, {
            startY: y,
            margin: { left: MARGIN.left, right: MARGIN.right },
            head: [['Kode Rek', 'Kegiatan', 'Bidang', 'Jenis', 'Status', 'Anggaran', 'Realisasi']],
            body: [...activities].sort(sortByNorek).map((a) => [
                a.norek || '-',
                a.nama,
                a.bidang,
                (a.jenis_lpj || 'fisik') === 'fisik' ? 'Fisik' : 'Non-Fisik',
                (a.status || '').charAt(0).toUpperCase() + (a.status || '').slice(1),
                formatRupiah(a.anggaran),
                formatRupiah(a.realisasi),
            ]),
            styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                5: { halign: 'right' },
                6: { halign: 'right' },
            },
        });
    }

    // ── Daftar Lampiran ──
    doc.addPage();
    y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, 'DAFTAR LAMPIRAN', y);
    y += 4;

    doc.setFontSize(FONT_SIZE.sm);
    doc.setFont('helvetica', 'normal');
    const lampiranDesc = 'Berikut adalah daftar dokumen lampiran yang menjadi bagian tidak terpisahkan dari Laporan Pertanggungjawaban ini:';
    const descLines = doc.splitTextToSize(lampiranDesc, PAGE_W - MARGIN.left - MARGIN.right);
    doc.text(descLines, MARGIN.left, y);
    y += descLines.length * 4 + 4;

    // Keuangan
    const belanjaTotal = attachData.belanjaTotal || 0;
    doc.setFont('helvetica', 'bold');
    doc.text('A. Lampiran Keuangan:', MARGIN.left, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const keuanganItems = [
        '1. Rincian Pendapatan Desa',
        belanjaTotal > 0
            ? `2. Rincian Belanja Desa (dilengkapi ${belanjaTotal} dokumen bukti nota/kuitansi)`
            : '2. Rincian Belanja Desa',
        '3. Laporan Realisasi APBDesa (Ringkasan per Bidang)',
    ];
    keuanganItems.forEach(item => {
        doc.text(item, MARGIN.left + 5, y);
        y += 4;
    });
    y += 4;

    // Kegiatan table
    doc.setFont('helvetica', 'bold');
    doc.text('B. Lampiran Dokumen per Kegiatan:', MARGIN.left, y);
    y += 2;

    autoTable(doc, {
        startY: y,
        margin: { left: MARGIN.left, right: MARGIN.right },
        head: [['No', 'Nama Kegiatan', 'Bidang', 'Jenis LPJ', 'Jumlah Dok', 'Bukti']],
        body: activities.map((a, i) => [
            i + 1,
            a.nama,
            a.bidang,
            (a.jenis_lpj || 'fisik') === 'fisik' ? 'Fisik' : 'Non-Fisik',
            (a.jenis_lpj || 'fisik') === 'fisik' ? '15 Dok' : '7 Dok',
            (attachData.kegiatan?.[a.id] || []).length > 0 ? `${attachData.kegiatan[a.id].length} file` : '-',
        ]),
        styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
        headStyles: { fillColor: [75, 85, 99], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
        },
    });

    y = doc.lastAutoTable.finalY + 6;
    const totalFisik = activities.filter(a => (a.jenis_lpj || 'fisik') !== 'non_fisik').length;
    const totalNonFisik = activities.filter(a => a.jenis_lpj === 'non_fisik').length;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONT_SIZE.sm);
    doc.text(`Total: ${activities.length} kegiatan (${totalFisik} Fisik, ${totalNonFisik} Non-Fisik)`, MARGIN.left, y);

    // ── C. Rincian Dokumen Bukti per Kegiatan ──
    const activitiesWithAttach = activities.filter(act => (attachData.kegiatan?.[act.id] || []).length > 0);
    if (activitiesWithAttach.length > 0) {
        y += 8;
        // Check if we need a new page
        if (y > 250) { doc.addPage(); y = MARGIN.top; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONT_SIZE.sm);
        doc.text('C. Rincian Dokumen Bukti per Kegiatan:', MARGIN.left, y);
        y += 5;

        activitiesWithAttach.forEach(act => {
            const docs = attachData.kegiatan[act.id];
            if (y > 270) { doc.addPage(); y = MARGIN.top; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(FONT_SIZE.xs);
            doc.text(`► ${act.nama}`, MARGIN.left + 3, y);
            y += 4;
            doc.setFont('helvetica', 'normal');
            docs.forEach((d, idx) => {
                if (y > 280) { doc.addPage(); y = MARGIN.top; }
                const label = `${idx + 1}. ${d.keterangan}`;
                if (d.file_url) {
                    doc.setTextColor(17, 85, 204); // Google blue
                    doc.textWithLink(label, MARGIN.left + 10, y, { url: d.file_url });
                    // Underline the link text
                    const textWidth = doc.getTextWidth(label);
                    doc.setDrawColor(17, 85, 204);
                    doc.setLineWidth(0.2);
                    doc.line(MARGIN.left + 10, y + 0.5, MARGIN.left + 10 + textWidth, y + 0.5);
                    doc.setTextColor(0, 0, 0); // Reset to black
                } else {
                    doc.text(label, MARGIN.left + 10, y);
                }
                y += 3.5;
            });
            y += 2;
        });
    }

    // ── Penutup ──
    doc.addPage();
    y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, 'PENUTUP', y);
    y += 4;

    doc.setFontSize(FONT_SIZE.sm);
    doc.setFont('helvetica', 'normal');
    const closing = `Demikian Laporan Pertanggungjawaban Realisasi Pelaksanaan APBDesa ${vi.nama_desa || '...'} ${vi.periode || '...'} Tahun Anggaran ${vi.tahun_anggaran || '...'}. Laporan ini disusun dengan sebenar-benarnya.`;
    const lines = doc.splitTextToSize(closing, PAGE_W - MARGIN.left - MARGIN.right);
    doc.text(lines, MARGIN.left, y);
    y += lines.length * 5 + 4;

    y = addInfoTable(doc, [
        ['Total Pendapatan', formatRupiah(totalIncome)],
        ['Total Belanja', formatRupiah(totalExpense)],
        ['Sisa Anggaran', formatRupiah(totalIncome - totalExpense)],
    ], y);

    addSigningBlock(doc, y + 8, {
        rightTitle: `Kepala Desa ${vi.nama_desa || '......'},`,
        rightRole: '',
        rightName: vi.kepala_desa || '( .................... )',
        date: `${vi.nama_desa || '......'}, ........................ ${vi.tahun_anggaran || '20XX'}`,
    });

    // Save
    const fileName = `LPJ_APBDesa_${(vi.nama_desa || 'Desa').replace(/\s+/g, '_')}_${vi.tahun_anggaran || '20XX'}.pdf`;
    doc.save(fileName);
    return fileName;
}

// ── Export Bidang to PDF ──
export async function exportBidangToPdf(bidang, activities, villageInfo) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const vi = villageInfo;
    const isAll = bidang === 'Semua Bidang';
    const items = isAll ? activities : activities.filter(a => a.bidang === bidang);
    const totalAnggaran = items.reduce((s, a) => s + Number(a.anggaran || 0), 0);
    const totalRealisasi = items.reduce((s, a) => s + Number(a.realisasi || 0), 0);
    const pct = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : '0.0';

    let y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, `LAPORAN KEGIATAN PER BIDANG`, y);
    y = addSubtitle(doc, bidang.toUpperCase(), y);
    y = addSubtitle(doc, `TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, y);
    y += 2;

    y = addInfoTable(doc, [
        ['Desa', vi.nama_desa],
        ['Bidang', bidang],
        ['Total Kegiatan', String(items.length)],
        ['Penyerapan', `${pct}%`],
    ], y);
    y += 2;

    // Summary table
    doc.setFontSize(FONT_SIZE.md);
    doc.setFont('helvetica', 'bold');
    doc.text(isAll ? 'RINGKASAN PER BIDANG' : 'RINGKASAN PER SUB BIDANG', MARGIN.left, y);
    y += 4;

    if (isAll) {
        // Group by bidang for "Semua Bidang"
        const bidangMap = {};
        items.forEach(a => {
            const b = a.bidang || 'Lainnya';
            if (!bidangMap[b]) bidangMap[b] = { count: 0, anggaran: 0, realisasi: 0 };
            bidangMap[b].count++;
            bidangMap[b].anggaran += Number(a.anggaran || 0);
            bidangMap[b].realisasi += Number(a.realisasi || 0);
        });
        const bidangRows = Object.entries(bidangMap).map(([b, info], i) => [
            String(i + 1), b, String(info.count),
            formatRupiah(info.anggaran), formatRupiah(info.realisasi),
            formatRupiah(info.anggaran - info.realisasi),
            info.anggaran > 0 ? `${((info.realisasi / info.anggaran) * 100).toFixed(1)}%` : '0%',
        ]);
        bidangRows.push(['', 'TOTAL', String(items.length), formatRupiah(totalAnggaran), formatRupiah(totalRealisasi), formatRupiah(totalAnggaran - totalRealisasi), `${pct}%`]);
        autoTable(doc, {
            startY: y,
            margin: { left: MARGIN.left, right: MARGIN.right },
            head: [['No', 'Bidang', 'Jml', 'Anggaran', 'Realisasi', 'Sisa', '%']],
            body: bidangRows,
            styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 10, halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { cellWidth: 14, halign: 'center' } },
        });
    } else {
        const sbMap = {};
        items.forEach(a => {
            if (!sbMap[a.sub_bidang]) sbMap[a.sub_bidang] = { count: 0, anggaran: 0, realisasi: 0 };
            sbMap[a.sub_bidang].count++;
            sbMap[a.sub_bidang].anggaran += Number(a.anggaran || 0);
            sbMap[a.sub_bidang].realisasi += Number(a.realisasi || 0);
        });
        const sbRows = Object.entries(sbMap).map(([sb, info], i) => [
            String(i + 1), sb, String(info.count),
            formatRupiah(info.anggaran), formatRupiah(info.realisasi),
            formatRupiah(info.anggaran - info.realisasi),
            info.anggaran > 0 ? `${((info.realisasi / info.anggaran) * 100).toFixed(1)}%` : '0%',
        ]);
        sbRows.push(['', 'TOTAL', String(items.length), formatRupiah(totalAnggaran), formatRupiah(totalRealisasi), formatRupiah(totalAnggaran - totalRealisasi), `${pct}%`]);
        autoTable(doc, {
            startY: y,
            margin: { left: MARGIN.left, right: MARGIN.right },
            head: [['No', 'Sub Bidang', 'Jml', 'Anggaran', 'Realisasi', 'Sisa', '%']],
            body: sbRows,
            styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
            columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 10, halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { cellWidth: 14, halign: 'center' } },
        });
    }

    // Detail table — all activities grouped by bidang
    doc.addPage();
    y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, `RINCIAN KEGIATAN — ${bidang.toUpperCase()}`, y);
    y += 2;

    autoTable(doc, {
        startY: y,
        margin: { left: MARGIN.left, right: MARGIN.right },
        head: [['Kode Rek', 'Kegiatan', isAll ? 'Bidang' : 'Sub Bidang', 'Jenis', 'Status', 'Anggaran', 'Realisasi']],
        body: [...items].sort(sortByNorek).map((a) => [
            a.norek || '-', a.nama, isAll ? a.bidang : a.sub_bidang,
            (a.jenis_lpj || 'fisik') === 'fisik' ? 'Fisik' : 'Non-Fisik',
            (a.status || '').charAt(0).toUpperCase() + (a.status || '').slice(1),
            formatRupiah(a.anggaran), formatRupiah(a.realisasi),
        ]),
        styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
    });

    y = doc.lastAutoTable.finalY + 10;
    addSigningBlock(doc, y, {
        rightTitle: `Kepala Desa ${vi.nama_desa || '......'},`,
        rightRole: '',
        rightName: vi.kepala_desa || '( .................... )',
        date: `${vi.nama_desa || '......'}, ........................ ${vi.tahun_anggaran || '20XX'}`,
    });

    const safeName = bidang.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    const fileName = `LPJ_Bidang_${safeName}.pdf`;
    doc.save(fileName);
    return fileName;
}

// ── Export Sub Bidang to PDF ──
export async function exportSubBidangToPdf(bidang, subBidang, activities, villageInfo) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const vi = villageInfo;
    const items = activities.filter(a => a.bidang === bidang && a.sub_bidang === subBidang);
    const totalAnggaran = items.reduce((s, a) => s + Number(a.anggaran || 0), 0);
    const totalRealisasi = items.reduce((s, a) => s + Number(a.realisasi || 0), 0);
    const pct = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) : '0.0';

    let y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, 'LAPORAN KEGIATAN PER SUB BIDANG', y);
    y = addSubtitle(doc, subBidang.toUpperCase(), y);
    y = addSubtitle(doc, `TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, y);
    y += 2;

    y = addInfoTable(doc, [
        ['Desa', vi.nama_desa],
        ['Bidang', bidang],
        ['Sub Bidang', subBidang],
        ['Total Kegiatan', String(items.length)],
        ['Total Anggaran', formatRupiah(totalAnggaran)],
        ['Total Realisasi', formatRupiah(totalRealisasi)],
        ['Penyerapan', `${pct}%`],
    ], y);
    y += 4;

    autoTable(doc, {
        startY: y,
        margin: { left: MARGIN.left, right: MARGIN.right },
        head: [['Kode Rek', 'Nama Kegiatan', 'Jenis', 'Status', 'Progres', 'Anggaran', 'Realisasi', 'Sisa']],
        body: [
            ...[...items].sort(sortByNorek).map((a) => [
                a.norek || '-', a.nama,
                (a.jenis_lpj || 'fisik') === 'fisik' ? 'Fisik' : 'Non-Fisik',
                (a.status || '').charAt(0).toUpperCase() + (a.status || '').slice(1),
                `${a.progres || 0}%`,
                formatRupiah(a.anggaran), formatRupiah(a.realisasi),
                formatRupiah(Number(a.anggaran || 0) - Number(a.realisasi || 0)),
            ]),
            ['', 'TOTAL', '', '', '', formatRupiah(totalAnggaran), formatRupiah(totalRealisasi), formatRupiah(totalAnggaran - totalRealisasi)],
        ],
        styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 4: { cellWidth: 14, halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
    });

    y = doc.lastAutoTable.finalY + 10;
    addSigningBlock(doc, y, {
        rightTitle: `Kepala Desa ${vi.nama_desa || '......'},`,
        rightRole: '',
        rightName: vi.kepala_desa || '( .................... )',
        date: `${vi.nama_desa || '......'}, ........................ ${vi.tahun_anggaran || '20XX'}`,
    });

    const safeName = subBidang.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    const fileName = `LPJ_SubBidang_${safeName}.pdf`;
    doc.save(fileName);
    return fileName;
}

// ── Export Financial Data to PDF (Pendapatan / Belanja / Pembiayaan) ──
export async function exportFinancialToPdf(type, data, villageInfo) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const vi = villageInfo;

    const configs = {
        pendapatan: {
            title: 'LAPORAN PENDAPATAN DESA',
            head: ['Kode Rek', 'Sumber Pendapatan', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Keterangan'],
            row: (item) => [item.norek || '-', item.sumber, item.kategori, formatRupiah(item.jumlah), item.tanggal || '-', item.keterangan || '-'],
            color: [16, 185, 129],
        },
        belanja: {
            title: 'LAPORAN BELANJA DESA',
            head: ['Kode Rek', 'Uraian Belanja', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Penerima'],
            row: (item) => [item.norek || '-', item.uraian, item.kategori, formatRupiah(item.jumlah), item.tanggal || '-', item.penerima || '-'],
            color: [239, 68, 68],
        },
        pembiayaan: {
            title: 'LAPORAN PEMBIAYAAN DESA',
            head: ['Kode Rek', 'Uraian Pembiayaan', 'Kategori', 'Sub Kategori', 'Jumlah (Rp)', 'Keterangan'],
            row: (item) => [item.norek || '-', item.uraian, item.kategori, item.sub_kategori || '-', formatRupiah(item.jumlah), item.keterangan || '-'],
            color: [99, 102, 241],
        },
    };

    const cfg = configs[type];
    if (!cfg) return null;

    const total = data.reduce((s, item) => s + Number(item.jumlah || 0), 0);

    let y = MARGIN.top;
    y = addKopSurat(doc, vi, y);
    y = addTitle(doc, cfg.title, y);
    y = addSubtitle(doc, `TAHUN ANGGARAN ${vi.tahun_anggaran || '20XX'}`, y);
    y += 2;

    y = addInfoTable(doc, [
        ['Desa', vi.nama_desa],
        ['Kecamatan', vi.kecamatan],
        ['Kabupaten', vi.kabupaten],
        ['Total Item', String(data.length)],
        ['Total Jumlah', formatRupiah(total)],
    ], y);
    y += 4;

    const rows = [...data].sort(sortByNorek).map(cfg.row);
    // Add total row
    const totalRow = new Array(cfg.head.length).fill('');
    totalRow[0] = '';
    totalRow[1] = 'TOTAL';
    const jumlahIdx = cfg.head.indexOf('Jumlah (Rp)');
    totalRow[jumlahIdx] = formatRupiah(total);
    rows.push(totalRow);

    autoTable(doc, {
        startY: y,
        margin: { left: MARGIN.left, right: MARGIN.right },
        head: [cfg.head],
        body: rows,
        styles: { font: 'helvetica', fontSize: FONT_SIZE.xs, cellPadding: 1.5 },
        headStyles: { fillColor: cfg.color, textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: { 0: { cellWidth: 15, halign: 'center' }, [jumlahIdx]: { halign: 'right' } },
    });

    y = doc.lastAutoTable.finalY + 10;
    addSigningBlock(doc, y, {
        rightTitle: `Kepala Desa ${vi.nama_desa || '......'},`,
        rightRole: '',
        rightName: vi.kepala_desa || '( .................... )',
        date: `${vi.nama_desa || '......'}, ........................ ${vi.tahun_anggaran || '20XX'}`,
    });

    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const fileName = `Laporan_${typeLabel}_${(vi.nama_desa || 'Desa').replace(/\s+/g, '_')}_${vi.tahun_anggaran || '20XX'}.pdf`;
    doc.save(fileName);
    return fileName;
}
