// PLACEHOLDER: file pakasir.js asli tidak ada di zip yang diupload.
// Selama placeholder ini dipakai, pembayaran QRIS Pakasir dinonaktifkan.
// Ganti dengan pakasir.js asli dari backup untuk mengaktifkan pembayaran.

const NOT_READY = 'Pakasir belum dikonfigurasi (file src/lib/pakasir.js asli belum dipasang).'

const pakasir = {
    apiKey: '',
    slug: '',
    isEnabled: () => false,
    getConfig: () => ({ apiKey: '', slug: '' }),
    generateOrderId: () => `ORD${Date.now()}`,
    createTransaction: async () => { throw new Error(NOT_READY) },
    cancelTransaction: async () => { throw new Error(NOT_READY) },
    simulatePayment: async () => { throw new Error(NOT_READY) }
}

module.exports = pakasir
