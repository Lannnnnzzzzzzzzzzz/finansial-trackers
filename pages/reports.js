import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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

  // Filter transactions for selected month
  const filteredTransactions = transactions.filter(transaction => {
    if (reportType === 'monthly') {
      const transactionDate = new Date(transaction.date);
      const selectedDate = new Date(selectedMonth);
      return (
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getFullYear() === selectedDate.getFullYear()
      );
    }
    return true;
  });

  // Calculate summary data
  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expense;

  // Prepare category data for pie chart
  const categoryMap = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (categoryMap[t.category]) {
        categoryMap[t.category] += t.amount;
      } else {
        categoryMap[t.category] = t.amount;
      }
    });
  
  const categoryData = Object.keys(categoryMap).map(category => ({
    name: category,
    value: categoryMap[category]
  }));

  // Prepare monthly trend data
  const monthlyMap = {};
  transactions.forEach(t => {
    const month = format(new Date(t.date), 'yyyy-MM');
    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }
    
    if (t.type === 'income') {
      monthlyMap[month].income += t.amount;
    } else {
      monthlyMap[month].expense += t.amount;
    }
  });
  
  const monthlyData = Object.keys(monthlyMap).map(month => {
    const date = new Date(month);
    return {
      month: format(date, 'MMM yyyy', { locale: id }),
      income: monthlyMap[month].income,
      expense: monthlyMap[month].expense,
      balance: monthlyMap[month].income - monthlyMap[month].expense
    };
  }).sort((a, b) => new Date(a.month) - new Date(b.month));

  // Prepare daily data for selected month
  const dailyMap = {};
  filteredTransactions.forEach(t => {
    const day = format(new Date(t.date), 'yyyy-MM-dd');
    if (!dailyMap[day]) {
      dailyMap[day] = { income: 0, expense: 0 };
    }
    
    if (t.type === 'income') {
      dailyMap[day].income += t.amount;
    } else {
      dailyMap[day].expense += t.amount;
    }
  });
  
  const dailyData = Object.keys(dailyMap).map(day => {
    const date = new Date(day);
    return {
      day: format(date, 'dd', { locale: id }),
      date: format(date, 'dd MMM', { locale: id }),
      income: dailyMap[day].income,
      expense: dailyMap[day].expense,
      balance: dailyMap[day].income - dailyMap[day].expense
    };
  }).sort((a, b) => new Date(a.day) - new Date(b.day));

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  const exportReport = () => {
    let csvContent;
    
    if (reportType === 'monthly') {
      const headers = ['Tanggal', 'Kategori', 'Pemasukan', 'Pengeluaran', 'Saldo'];
      const rows = dailyData.map(d => [
        d.date,
        '',
        d.income,
        d.expense,
        d.balance
      ]);
      
      csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    } else {
      const headers = ['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo'];
      const rows = monthlyData.map(m => [
        m.month,
        m.income,
        m.expense,
        m.balance
      ]);
      
      csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-${reportType}-${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Laporan</h1>
        <button
          onClick={exportReport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm md:text-base"
        >
          Ekspor Laporan
        </button>
      </div>

      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block mb-2">Jenis Laporan</label>
            <select
              value={reportType}
              onChange={handleReportTypeChange}
              className="p-2 rounded bg-gray-700 border border-gray-600"
            >
              <option value="monthly">Bulanan</option>
              <option value="trend">Tren</option>
            </select>
          </div>
          
          {reportType === 'monthly' && (
            <div>
              <label className="block mb-2">Pilih Bulan</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="p-2 rounded bg-gray-700 border border-gray-600"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gray-700 p-4 md:p-6 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-2">Total Pemasukan</h2>
            <p className="text-2xl md:text-3xl text-green-400">Rp {income.toLocaleString('id-ID')}</p>
          </div>
          
          <div className="bg-gray-700 p-4 md:p-6 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-2">Total Pengeluaran</h2>
            <p className="text-2xl md:text-3xl text-red-400">Rp {expense.toLocaleString('id-ID')}</p>
          </div>
          
          <div className="bg-gray-700 p-4 md:p-6 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-2">Saldo</h2>
            <p className={`text-2xl md:text-3xl ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Rp {balance.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {reportType === 'monthly' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-gray-700 p-4 md:p-6 rounded-lg">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Pengeluaran per Kategori</h2>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Jumlah']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 md:p-6 rounded-lg">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Tren Harian</h2>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#00C49F" name="Pemasukan" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="expense" stroke="#FF8042" name="Pengeluaran" />
                    <Line type="monotone" dataKey="balance" stroke="#0088FE" name="Saldo" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-700 p-4 md:p-6 rounded-lg">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Tren Bulanan</h2>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, '']} />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#00C49F" />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
