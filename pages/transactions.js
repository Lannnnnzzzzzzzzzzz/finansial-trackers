import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState({ type: '', category: '' });
  const [autoCommand, setAutoCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: ''
  });

  const categories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Hiburan',
    'Kesehatan',
    'Pendidikan',
    'Tagihan',
    'Lainnya'
  ];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTransaction) {
        // Update existing transaction
        await axios.put(`/api/transactions/${editingTransaction._id}`, formData);
        setEditingTransaction(null);
      } else {
        // Add new transaction
        await axios.post('/api/transactions', formData);
      }
      
      // Reset form and refresh transactions
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: ''
      });
      setShowAddForm(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      note: transaction.note
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await axios.delete(`/api/transactions/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    return (
      (filter.type === '' || transaction.type === filter.type) &&
      (filter.category === '' || transaction.category === filter.category)
    );
  });

  const exportToCSV = () => {
    const headers = ['Tipe', 'Jumlah', 'Kategori', 'Tanggal', 'Catatan'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        t.amount,
        `"${t.category}"`,
        format(new Date(t.date), 'dd/MM/yyyy'),
        `"${t.note}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaksi.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAutoCommand = async (e) => {
    e.preventDefault();
    
    if (!autoCommand.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const response = await axios.post('/api/transactions/auto', {
        command: autoCommand
      });
      
      if (response.data.success) {
        // Reset command input
        setAutoCommand('');
        // Refresh transactions
        fetchTransactions();
        // Show success message
        alert('Transaksi berhasil ditambahkan!');
      } else {
        alert('Gagal menambahkan transaksi: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error with auto command:', error);
      alert('Terjadi kesalahan: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleCommands = [
    "nabung 30rb",
    "beli makanan 25000",
    "bayar tagihan listrik 150000",
    "kasih orang tua 500000",
    "isi pulsa 30000"
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Transaksi</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingTransaction(null);
              setFormData({
                type: 'expense',
                amount: '',
                category: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                note: ''
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm md:text-base"
          >
            {showAddForm ? 'Batal' : 'Tambah Transaksi'}
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm md:text-base"
          >
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Auto Transaction Section */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Tambah Transaksi Cepat dengan AI</h2>
        <p className="text-gray-400 mb-4">Ketik perintah seperti "nabung 30rb" atau "beli makanan 25000" untuk menambah transaksi secara otomatis</p>
        
        <form onSubmit={handleAutoCommand} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={autoCommand}
              onChange={(e) => setAutoCommand(e.target.value)}
              placeholder="Contoh: nabung 30rb"
              className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? 'Memproses...' : 'Tambah Otomatis'}
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Contoh Perintah:</h3>
          <div className="flex flex-wrap gap-2">
            {exampleCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => setAutoCommand(cmd)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Tipe</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  required
                >
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-2">Jumlah (Rp)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  required
                  min="0"
                  step="100"
                />
              </div>
              
              <div>
                <label className="block mb-2">Kategori</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-2">Tanggal</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2">Catatan</label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  placeholder="Tambahkan catatan (opsional)"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {editingTransaction ? 'Update Transaksi' : 'Tambah Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block mb-2">Filter Tipe</label>
            <select
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
              className="p-2 rounded bg-gray-700 border border-gray-600"
            >
              <option value="">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-2">Filter Kategori</label>
            <select
              name="category"
              value={filter.category}
              onChange={handleFilterChange}
              className="p-2 rounded bg-gray-700 border border-gray-600"
            >
              <option value="">Semua</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Memuat data transaksi...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipe</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kategori</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Jumlah</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Catatan</th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredTransactions.map(transaction => (
                  <tr key={transaction._id}>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      {format(new Date(transaction.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-800 text-green-100' 
                          : 'bg-red-800 text-red-100'
                      }`}>
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      {transaction.category}
                    </td>
                    <td className={`px-4 md:px-6 py-4 whitespace-nowrap ${
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      {transaction.note}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Tidak ada transaksi yang ditemukan
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
