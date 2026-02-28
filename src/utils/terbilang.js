/**
 * ================================================================
 * Terbilang — Konversi Angka ke Kata (Bahasa Indonesia)
 * ================================================================
 * Mengubah angka numerik menjadi representasi kata Indonesia.
 * Contoh: 2500000 → "Dua Juta Lima Ratus Ribu Rupiah"
 *
 * Pure function, tanpa dependency eksternal.
 */

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

/**
 * Internal recursive function for number → words conversion.
 * @param {number} n - Non-negative integer
 * @returns {string}
 */
function terbilangCore(n) {
    if (n < 0) return 'Minus ' + terbilangCore(Math.abs(n));
    if (n === 0) return '';
    if (n < 12) return SATUAN[n];
    if (n < 20) return terbilangCore(n - 10) + ' Belas';
    if (n < 100) return terbilangCore(Math.floor(n / 10)) + ' Puluh' + (n % 10 > 0 ? ' ' + terbilangCore(n % 10) : '');
    if (n < 200) return 'Seratus' + (n % 100 > 0 ? ' ' + terbilangCore(n % 100) : '');
    if (n < 1000) return terbilangCore(Math.floor(n / 100)) + ' Ratus' + (n % 100 > 0 ? ' ' + terbilangCore(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n % 1000 > 0 ? ' ' + terbilangCore(n % 1000) : '');
    if (n < 1000000) return terbilangCore(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 > 0 ? ' ' + terbilangCore(n % 1000) : '');
    if (n < 1000000000) return terbilangCore(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 > 0 ? ' ' + terbilangCore(n % 1000000) : '');
    if (n < 1000000000000) return terbilangCore(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 > 0 ? ' ' + terbilangCore(n % 1000000000) : '');
    if (n < 1000000000000000) return terbilangCore(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 > 0 ? ' ' + terbilangCore(n % 1000000000000) : '');
    return 'Angka terlalu besar';
}

/**
 * Konversi angka ke terbilang dengan suffix "Rupiah".
 * @param {number} angka - Angka yang akan dikonversi (bisa desimal, akan dibulatkan)
 * @returns {string} String terbilang dengan suffix "Rupiah"
 *
 * @example
 * angkaKeTerbilang(2500000) // "Dua Juta Lima Ratus Ribu Rupiah"
 * angkaKeTerbilang(0)       // "Nol Rupiah"
 * angkaKeTerbilang(1000)    // "Seribu Rupiah"
 */
export function angkaKeTerbilang(angka) {
    if (angka === null || angka === undefined || isNaN(angka)) return 'Nol Rupiah';
    const rounded = Math.round(Math.abs(Number(angka)));
    if (rounded === 0) return 'Nol Rupiah';
    const prefix = Number(angka) < 0 ? 'Minus ' : '';
    return prefix + terbilangCore(rounded).trim() + ' Rupiah';
}

/**
 * Konversi angka ke terbilang tanpa suffix "Rupiah".
 * @param {number} angka
 * @returns {string}
 */
export function angkaKeTerbilangPolos(angka) {
    if (angka === null || angka === undefined || isNaN(angka)) return 'Nol';
    const rounded = Math.round(Math.abs(Number(angka)));
    if (rounded === 0) return 'Nol';
    const prefix = Number(angka) < 0 ? 'Minus ' : '';
    return prefix + terbilangCore(rounded).trim();
}
