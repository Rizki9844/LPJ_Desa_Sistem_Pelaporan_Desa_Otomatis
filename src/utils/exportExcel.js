import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatRupiah } from '../data/sampleData';

// ── Sort by norek (kode rekening) ──
const sortByNorek = (a, b) => (a.norek || '').localeCompare(b.norek || '', undefined, { numeric: true });

// Export LPJ for a single kegiatan (activity)
export function exportActivityToExcel(activity, villageInfo, attachments = []) {
    const wb = XLSX.utils.book_new();
    const pct = activity.anggaran > 0 ? ((activity.realisasi / activity.anggaran) * 100).toFixed(1) : '0.0';
    const sisa = activity.anggaran - activity.realisasi;

    // Sheet 1: Detail Kegiatan
    const detailData = [
        ['LAPORAN PERTANGGUNGJAWABAN KEGIATAN'],
        [`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`],
        [],
        ['INFORMASI KEGIATAN'],
        [],
        ['Kode Rekening', activity.norek || '-'],
        ['Nama Kegiatan', activity.nama],
        ['Bidang', activity.bidang],
        ['Sub Bidang', activity.sub_bidang],
        ['Jenis LPJ', (activity.jenis_lpj || 'fisik') === 'fisik' ? 'Fisik (Infrastruktur)' : 'Non-Fisik (Program/Pelayanan)'],
        ['Status', (activity.status || 'direncanakan').charAt(0).toUpperCase() + (activity.status || 'direncanakan').slice(1)],
        ['Progres', `${activity.progres ?? 0}%`],
        ['Pelaksana', activity.pelaksana],
        ['Tanggal Mulai', activity.mulai],
        ['Tanggal Selesai', activity.selesai],
        [],
        ['REALISASI ANGGARAN'],
        [],
        ['Uraian', 'Jumlah (Rp)'],
        ['Anggaran', activity.anggaran],
        ['Realisasi', activity.realisasi],
        ['Sisa Anggaran', sisa],
        ['Persentase Realisasi', `${pct}%`],
        [],
        ['INFORMASI DESA'],
        [],
        ['Nama Desa', villageInfo.nama_desa],
        ['Kecamatan', villageInfo.kecamatan],
        ['Kabupaten', villageInfo.kabupaten],
        ['Provinsi', villageInfo.provinsi],
        ['Kepala Desa', villageInfo.kepala_desa],
        ['Sekretaris Desa', villageInfo.sekretaris_desa],
        ['Bendahara', villageInfo.bendahara],
    ];

    const ws = XLSX.utils.aoa_to_sheet(detailData);
    ws['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'LPJ Kegiatan');

    // Sheet 2: Lampiran
    if (attachments.length > 0) {
        const lampiranData = [
            ['DAFTAR LAMPIRAN BUKTI DOKUMEN'],
            [`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`],
            [],
            ['Kegiatan:', activity.nama],
            [],
            ['No', 'Nama File', 'Keterangan', 'Link File']
        ];
        attachments.forEach((att, i) => {
            lampiranData.push([i + 1, att.file_name, att.keterangan || '-', att.file_url || '']);
        });
        const wsLampiran = XLSX.utils.aoa_to_sheet(lampiranData);
        wsLampiran['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 40 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsLampiran, 'Lampiran Bukti');
    }

    const safeName = (activity.nama || 'Kegiatan').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = `LPJ_Kegiatan_${safeName}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    return fileName;
}

// Export all activities to Excel (full LPJ)
export function exportToExcel(state, attachData = { kegiatan: {}, belanja: {}, belanjaTotal: 0 }) {
    const { villageInfo, incomes, expenses, activities } = state;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Informasi Desa
    const infoData = [
        ['INFORMASI DESA'],
        [],
        ['Nama Desa', villageInfo.nama_desa],
        ['Kecamatan', villageInfo.kecamatan],
        ['Kabupaten', villageInfo.kabupaten],
        ['Provinsi', villageInfo.provinsi],
        ['Kode Desa', villageInfo.kode_desa],
        ['Kepala Desa', villageInfo.kepala_desa],
        ['Sekretaris Desa', villageInfo.sekretaris_desa],
        ['Bendahara', villageInfo.bendahara],
        ['Tahun Anggaran', villageInfo.tahun_anggaran],
        ['Periode', villageInfo.periode],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informasi Desa');

    // Sheet 2: Pendapatan
    const incomeHeader = ['Kode Rek', 'Sumber Pendapatan', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Keterangan'];
    const incomeRows = [...incomes].sort(sortByNorek).map((item) => [
        item.norek || '-', item.sumber, item.kategori, item.jumlah, item.tanggal, item.keterangan,
    ]);
    const totalIncome = incomes.reduce((sum, i) => sum + (Number(i.jumlah) || 0), 0);
    incomeRows.push(['', '', 'TOTAL', totalIncome, '', '']);

    const wsIncome = XLSX.utils.aoa_to_sheet([
        ['LAPORAN PENDAPATAN DESA'],
        [`Tahun Anggaran: ${villageInfo.tahun_anggaran}`],
        [],
        incomeHeader,
        ...incomeRows,
    ]);
    wsIncome['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Pendapatan');

    // Sheet 3: Belanja
    const expenseHeader = ['Kode Rek', 'Uraian Belanja', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Penerima'];
    const expenseRows = [...expenses].sort(sortByNorek).map((item) => [
        item.norek || '-', item.uraian, item.kategori, item.jumlah, item.tanggal, item.penerima,
    ]);
    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.jumlah) || 0), 0);
    expenseRows.push(['', '', 'TOTAL', totalExpense, '', '']);

    const wsExpense = XLSX.utils.aoa_to_sheet([
        ['LAPORAN BELANJA DESA'],
        [`Tahun Anggaran: ${villageInfo.tahun_anggaran}`],
        [],
        expenseHeader,
        ...expenseRows,
    ]);
    wsExpense['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsExpense, 'Belanja');

    // Sheet 4: Kegiatan (with jenis_lpj)
    const activityHeader = ['Kode Rek', 'Nama Kegiatan', 'Bidang', 'Sub Bidang', 'Jenis LPJ', 'Status', 'Progres (%)', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Sisa (Rp)', 'Pelaksana', 'Mulai', 'Selesai'];
    const activityRows = [...activities].sort(sortByNorek).map((a) => [
        a.norek || '-', a.nama, a.bidang, a.sub_bidang,
        (a.jenis_lpj || 'fisik') === 'fisik' ? 'Fisik' : 'Non-Fisik',
        a.status, a.progres, a.anggaran, a.realisasi,
        Number(a.anggaran || 0) - Number(a.realisasi || 0),
        a.pelaksana, a.mulai, a.selesai,
    ]);
    const totalAktAnggaran = activities.reduce((s, a) => s + Number(a.anggaran || 0), 0);
    const totalAktRealisasi = activities.reduce((s, a) => s + Number(a.realisasi || 0), 0);
    activityRows.push(['', 'TOTAL', '', '', '', '', '', totalAktAnggaran, totalAktRealisasi, totalAktAnggaran - totalAktRealisasi, '', '', '']);

    const wsActivities = XLSX.utils.aoa_to_sheet([
        ['DAFTAR KEGIATAN & PROGRAM'],
        [`Tahun Anggaran: ${villageInfo.tahun_anggaran}`],
        [],
        activityHeader,
        ...activityRows,
    ]);
    wsActivities['!cols'] = [
        { wch: 5 }, { wch: 35 }, { wch: 28 }, { wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsActivities, 'Kegiatan');

    // Sheet 5: Laporan Realisasi (summary per bidang)
    const realisasiData = [
        ['LAPORAN REALISASI PELAKSANAAN APBDesa'],
        [`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`],
        [],
        ['NO', 'BIDANG', 'JUMLAH KEGIATAN', 'ANGGARAN (Rp)', 'REALISASI (Rp)', 'SISA (Rp)', 'PENYERAPAN (%)'],
    ];
    const bidangMap = {};
    activities.forEach(a => {
        if (!bidangMap[a.bidang]) bidangMap[a.bidang] = { count: 0, anggaran: 0, realisasi: 0 };
        bidangMap[a.bidang].count++;
        bidangMap[a.bidang].anggaran += Number(a.anggaran || 0);
        bidangMap[a.bidang].realisasi += Number(a.realisasi || 0);
    });
    let bidangIdx = 0;
    Object.entries(bidangMap).forEach(([bidang, info]) => {
        bidangIdx++;
        const sisa = info.anggaran - info.realisasi;
        const pctVal = info.anggaran > 0 ? ((info.realisasi / info.anggaran) * 100).toFixed(1) : '0.0';
        realisasiData.push([bidangIdx, bidang, info.count, info.anggaran, info.realisasi, sisa, `${pctVal}%`]);
    });
    realisasiData.push(['', 'TOTAL', activities.length, totalAktAnggaran, totalAktRealisasi, totalAktAnggaran - totalAktRealisasi,
        totalAktAnggaran > 0 ? `${((totalAktRealisasi / totalAktAnggaran) * 100).toFixed(1)}%` : '0%']);
    realisasiData.push([]);
    realisasiData.push(['Total Pendapatan', totalIncome]);
    realisasiData.push(['Total Belanja', totalExpense]);
    realisasiData.push(['Surplus / Defisit', totalIncome - totalExpense]);

    const wsRealisasi = XLSX.utils.aoa_to_sheet(realisasiData);
    wsRealisasi['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsRealisasi, 'Laporan Realisasi');

    // Sheet 6: Daftar Lampiran
    const lampiranData = [
        ['DAFTAR SEMUA LAMPIRAN BUKTI TRANSAKSI'],
        [`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`],
        [],
        ['No', 'Jenis', 'Terkait', 'Nama File', 'Keterangan', 'Link File']
    ];
    let attNo = 1;

    // Kegiatan Attachments
    const activitiesWithAttach = activities.filter(act => (attachData.kegiatan?.[act.id] || []).length > 0);
    activitiesWithAttach.forEach(act => {
        const docs = attachData.kegiatan[act.id];
        docs.forEach(doc => {
            lampiranData.push([attNo++, 'Kegiatan', act.nama, doc.file_name, doc.keterangan || '-', doc.file_url || '']);
        });
    });

    // Belanja Attachments
    const expensesWithAttach = expenses.filter(exp => (attachData.belanja?.[exp.id] || []).length > 0);
    expensesWithAttach.forEach(exp => {
        const docs = attachData.belanja[exp.id];
        docs.forEach(doc => {
            lampiranData.push([attNo++, 'Belanja', exp.uraian, doc.file_name, doc.keterangan || '-', doc.file_url || '']);
        });
    });

    if (attNo > 1) {
        const wsLampiranAll = XLSX.utils.aoa_to_sheet(lampiranData);
        wsLampiranAll['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 35 }, { wch: 30 }, { wch: 40 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsLampiranAll, 'Daftar Lampiran');
    }

    // Generate file
    const fileName = `LPJ_${(villageInfo.nama_desa || 'Desa').replace(/\s+/g, '_')}_${villageInfo.tahun_anggaran}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

    return fileName;
}

// ── Export activities by Bidang ──
export function exportBidangToExcel(bidang, activities, villageInfo) {
    const wb = XLSX.utils.book_new();
    const isAll = bidang === 'Semua Bidang';
    const items = isAll ? activities : activities.filter(a => a.bidang === bidang);
    const totalAnggaran = items.reduce((s, a) => s + Number(a.anggaran || 0), 0);
    const totalRealisasi = items.reduce((s, a) => s + Number(a.realisasi || 0), 0);

    // Sheet 1: Summary
    const summaryData = [
        [`LAPORAN KEGIATAN — ${bidang.toUpperCase()}`],
        [`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`],
        [],
        ['Total Kegiatan', items.length],
        ['Total Anggaran', totalAnggaran],
        ['Total Realisasi', totalRealisasi],
        ['Sisa Anggaran', totalAnggaran - totalRealisasi],
        ['Penyerapan', totalAnggaran > 0 ? `${((totalRealisasi / totalAnggaran) * 100).toFixed(1)}%` : '0%'],
    ];

    if (isAll) {
        // Per-bidang summary when exporting all
        summaryData.push([], ['RINCIAN PER BIDANG'], [], ['Bidang', 'Jumlah Kegiatan', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Sisa (Rp)']);
        const bidangMap = {};
        items.forEach(a => {
            const b = a.bidang || 'Lainnya';
            if (!bidangMap[b]) bidangMap[b] = [];
            bidangMap[b].push(a);
        });
        Object.entries(bidangMap).forEach(([b, acts]) => {
            const bAnggaran = acts.reduce((s, a) => s + Number(a.anggaran || 0), 0);
            const bRealisasi = acts.reduce((s, a) => s + Number(a.realisasi || 0), 0);
            summaryData.push([b, acts.length, bAnggaran, bRealisasi, bAnggaran - bRealisasi]);
        });
    } else {
        // Per-sub-bidang summary for single bidang
        summaryData.push([], ['RINCIAN PER SUB BIDANG'], [], ['Sub Bidang', 'Jumlah Kegiatan', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Sisa (Rp)']);
        const subBidangMap = {};
        items.forEach(a => {
            if (!subBidangMap[a.sub_bidang]) subBidangMap[a.sub_bidang] = [];
            subBidangMap[a.sub_bidang].push(a);
        });
        Object.entries(subBidangMap).forEach(([sb, acts]) => {
            const sbAnggaran = acts.reduce((s, a) => s + Number(a.anggaran || 0), 0);
            const sbRealisasi = acts.reduce((s, a) => s + Number(a.realisasi || 0), 0);
            summaryData.push([sb, acts.length, sbAnggaran, sbRealisasi, sbAnggaran - sbRealisasi]);
        });
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

    // Sheet 2: Detail kegiatan
    const header = isAll
        ? ['Kode Rek', 'Nama Kegiatan', 'Bidang', 'Sub Bidang', 'Status', 'Progres (%)', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Pelaksana', 'Mulai', 'Selesai']
        : ['Kode Rek', 'Nama Kegiatan', 'Sub Bidang', 'Status', 'Progres (%)', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Pelaksana', 'Mulai', 'Selesai'];
    const rows = [...items].sort(sortByNorek).map((a) => isAll
        ? [a.norek || '-', a.nama, a.bidang, a.sub_bidang, a.status, a.progres, a.anggaran, a.realisasi, a.pelaksana, a.mulai, a.selesai]
        : [a.norek || '-', a.nama, a.sub_bidang, a.status, a.progres, a.anggaran, a.realisasi, a.pelaksana, a.mulai, a.selesai]
    );

    const wsDetail = XLSX.utils.aoa_to_sheet([
        [`DAFTAR KEGIATAN — ${bidang}`],
        [`Tahun Anggaran: ${villageInfo.tahun_anggaran}`],
        [],
        header,
        ...rows,
    ]);
    wsDetail['!cols'] = isAll
        ? [{ wch: 5 }, { wch: 35 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }]
        : [{ wch: 5 }, { wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Kegiatan');

    const safeName = bidang.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    const fileName = `LPJ_Bidang_${safeName}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
    return fileName;
}

// ── Export activities by Sub Bidang ──
export function exportSubBidangToExcel(bidang, subBidang, activities, villageInfo) {
    const wb = XLSX.utils.book_new();
    const items = activities.filter(a => a.bidang === bidang && a.sub_bidang === subBidang);
    const totalAnggaran = items.reduce((s, a) => s + Number(a.anggaran || 0), 0);
    const totalRealisasi = items.reduce((s, a) => s + Number(a.realisasi || 0), 0);

    const header = ['Kode Rek', 'Nama Kegiatan', 'Status', 'Progres (%)', 'Anggaran (Rp)', 'Realisasi (Rp)', 'Sisa (Rp)', 'Pelaksana', 'Mulai', 'Selesai'];
    const rows = [...items].sort(sortByNorek).map((a) => [
        a.norek || '-', a.nama, a.status, a.progres, a.anggaran, a.realisasi, a.anggaran - a.realisasi, a.pelaksana, a.mulai, a.selesai,
    ]);
    rows.push(['', 'TOTAL', '', '', totalAnggaran, totalRealisasi, totalAnggaran - totalRealisasi, '', '', '']);

    const ws = XLSX.utils.aoa_to_sheet([
        [`LAPORAN KEGIATAN — ${subBidang.toUpperCase()}`],
        [`Bidang: ${bidang}`],
        [`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`],
        [],
        header,
        ...rows,
    ]);
    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Kegiatan');

    const safeName = subBidang.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    const fileName = `LPJ_SubBidang_${safeName}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
    return fileName;
}

// ── Export financial page data (Pendapatan / Belanja / Pembiayaan) ──
export function exportFinancialToExcel(type, data, villageInfo) {
    const wb = XLSX.utils.book_new();

    const configs = {
        pendapatan: {
            title: 'LAPORAN PENDAPATAN DESA',
            sheet: 'Pendapatan',
            header: ['Kode Rek', 'Sumber Pendapatan', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Keterangan'],
            row: (item) => [item.norek || '-', item.sumber, item.kategori, item.jumlah, item.tanggal, item.keterangan],
            cols: [{ wch: 10 }, { wch: 35 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 40 }],
        },
        belanja: {
            title: 'LAPORAN BELANJA DESA',
            sheet: 'Belanja',
            header: ['Kode Rek', 'Uraian Belanja', 'Kategori', 'Jumlah (Rp)', 'Tanggal', 'Penerima'],
            row: (item) => [item.norek || '-', item.uraian, item.kategori, item.jumlah, item.tanggal, item.penerima],
            cols: [{ wch: 10 }, { wch: 40 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 25 }],
        },
        pembiayaan: {
            title: 'LAPORAN PEMBIAYAAN DESA',
            sheet: 'Pembiayaan',
            header: ['Kode Rek', 'Uraian Pembiayaan', 'Kategori', 'Sub Kategori', 'Jumlah (Rp)', 'Tanggal', 'Keterangan'],
            row: (item) => [item.norek || '-', item.uraian, item.kategori, item.sub_kategori, item.jumlah, item.tanggal, item.keterangan],
            cols: [{ wch: 10 }, { wch: 35 }, { wch: 28 }, { wch: 28 }, { wch: 20 }, { wch: 15 }, { wch: 30 }],
        },
    };

    const cfg = configs[type];
    if (!cfg) return null;

    const rows = [...data].sort(sortByNorek).map(cfg.row);
    const total = data.reduce((s, item) => s + Number(item.jumlah || 0), 0);
    rows.push(new Array(cfg.header.length).fill(''));
    rows[rows.length - 1][0] = '';
    rows[rows.length - 1][cfg.header.indexOf('Jumlah (Rp)')] = total;
    rows[rows.length - 1][cfg.header.indexOf('Jumlah (Rp)') - 1] = 'TOTAL';

    const ws = XLSX.utils.aoa_to_sheet([
        [cfg.title],
        [`${villageInfo.nama_desa} — Tahun Anggaran ${villageInfo.tahun_anggaran}`],
        [],
        cfg.header,
        ...rows,
    ]);
    ws['!cols'] = cfg.cols;
    XLSX.utils.book_append_sheet(wb, ws, cfg.sheet);

    const fileName = `Laporan_${cfg.sheet}_${(villageInfo.nama_desa || 'Desa').replace(/\s+/g, '_')}_${villageInfo.tahun_anggaran}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
    return fileName;
}
