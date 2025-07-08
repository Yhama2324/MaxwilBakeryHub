import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Home, 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Clock,
  Trophy,
  Package,
  FileText,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { Order, Product } from "@shared/schema";

type TimePeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
type ExportFormat = "pdf" | "csv" | "excel";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#87d068'];

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `₱${numPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const completedOrders = orders.filter(order => order.status === "delivered");

  // Date range calculation
  const getDateRange = (period: TimePeriod) => {
    const now = new Date();
    switch (period) {
      case "daily":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "weekly":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "monthly":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarterly":
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case "yearly":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start: periodStart, end: periodEnd } = getDateRange(timePeriod);

  // Filter orders by time period
  const periodOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= periodStart && orderDate <= periodEnd;
  });

  // Sales analytics
  const totalRevenue = periodOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const totalOrders = periodOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Product performance analytics
  const productSales = useMemo(() => {
    const salesMap = new Map<number, { product: Product; quantity: number; revenue: number }>();
    
    periodOrders.forEach(order => {
      try {
        const items = JSON.parse(order.items);
        items.forEach((item: any) => {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const existing = salesMap.get(product.id) || { product, quantity: 0, revenue: 0 };
            existing.quantity += item.quantity || 1;
            existing.revenue += parseFloat(product.price) * (item.quantity || 1);
            salesMap.set(product.id, existing);
          }
        });
      } catch (e) {
        // Handle parsing errors gracefully
      }
    });

    return Array.from(salesMap.values())
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodOrders, products]);

  // Hourly sales analysis
  const hourlySales = useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      orders: 0,
      revenue: 0
    }));

    periodOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyData[hour].orders += 1;
      hourlyData[hour].revenue += parseFloat(order.totalAmount);
    });

    return hourlyData;
  }, [periodOrders]);

  // Daily sales for the period
  const dailySales = useMemo(() => {
    const days = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const dailyData = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOrders = periodOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });

      dailyData.push({
        date: format(date, 'MMM dd'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0)
      });
    }

    return dailyData;
  }, [periodOrders, periodStart, periodEnd]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, { orders: number; revenue: number }>();

    periodOrders.forEach(order => {
      try {
        const items = JSON.parse(order.items);
        items.forEach((item: any) => {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const category = product.category === "fastfood" ? "Fast Food" : 
                           ["bread", "pastries", "cakes", "cookies"].includes(product.category) ? "Bakery" : 
                           product.category;
            
            const existing = categoryMap.get(category) || { orders: 0, revenue: 0 };
            existing.orders += item.quantity || 1;
            existing.revenue += parseFloat(product.price) * (item.quantity || 1);
            categoryMap.set(category, existing);
          }
        });
      } catch (e) {
        // Handle parsing errors gracefully
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }, [periodOrders, products]);

  const handleExport = () => {
    const reportData = {
      period: timePeriod,
      dateRange: `${format(periodStart, 'MMM dd, yyyy')} - ${format(periodEnd, 'MMM dd, yyyy')}`,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue
      },
      topProducts: productSales.slice(0, 10),
      hourlySales,
      dailySales,
      categoryBreakdown
    };

    if (exportFormat === "pdf") {
      // For PDF, we'll create a printable version
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>MAXWIL' Analytics Report - ${timePeriod.toUpperCase()}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
                .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                .metric { font-size: 24px; font-weight: bold; color: #d97706; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>MAXWIL' Bakery</h1>
                <h2>Analytics Report - ${timePeriod.toUpperCase()}</h2>
                <p>${format(periodStart, 'MMM dd, yyyy')} - ${format(periodEnd, 'MMM dd, yyyy')}</p>
              </div>
              
              <div class="section">
                <h3>Summary</h3>
                <div class="grid">
                  <div class="card">
                    <h4>Total Revenue</h4>
                    <div class="metric">${formatPrice(totalRevenue)}</div>
                  </div>
                  <div class="card">
                    <h4>Total Orders</h4>
                    <div class="metric">${totalOrders}</div>
                  </div>
                  <div class="card">
                    <h4>Average Order Value</h4>
                    <div class="metric">${formatPrice(averageOrderValue)}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h3>Top Products</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Quantity Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productSales.slice(0, 10).map((item, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${item.product.name}</td>
                        <td>${item.product.category}</td>
                        <td>${item.quantity}</td>
                        <td>${formatPrice(item.revenue)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="section">
                <h3>Category Performance</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${categoryBreakdown.map(category => `
                      <tr>
                        <td>${category.name}</td>
                        <td>${category.orders}</td>
                        <td>${formatPrice(category.revenue)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } else {
      // For CSV/Excel, create downloadable file
      const csvContent = [
        ['MAXWIL\' Analytics Report'],
        ['Period', timePeriod],
        ['Date Range', `${format(periodStart, 'MMM dd, yyyy')} - ${format(periodEnd, 'MMM dd, yyyy')}`],
        [''],
        ['Summary'],
        ['Total Revenue', formatPrice(totalRevenue)],
        ['Total Orders', totalOrders.toString()],
        ['Average Order Value', formatPrice(averageOrderValue)],
        [''],
        ['Top Products'],
        ['Rank', 'Product', 'Category', 'Quantity Sold', 'Revenue'],
        ...productSales.slice(0, 10).map((item, index) => [
          (index + 1).toString(),
          item.product.name,
          item.product.category,
          item.quantity.toString(),
          formatPrice(item.revenue)
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAXWIL_Analytics_${timePeriod}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const peakSalesHour = hourlySales.reduce((max, hour) => 
    hour.revenue > max.revenue ? hour : max, hourlySales[0]
  );

  const lowSalesHour = hourlySales.reduce((min, hour) => 
    hour.revenue < min.revenue ? hour : min, hourlySales[0]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 hover:bg-slate-100 transition-all duration-200 shadow-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Analytics & Reports
                </h1>
                <p className="text-sm text-slate-500 mt-1">Advanced business intelligence dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card className="mb-8 bg-white/70 backdrop-blur-sm border-0 shadow-xl ring-1 ring-gray-200/50">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-3 text-xl font-semibold text-slate-800">
                  <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-slate-700" />
                  </div>
                  Report Settings
                </CardTitle>
                <p className="text-sm text-slate-500 mt-2">Configure your analytics dashboard parameters</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-3 bg-slate-50 rounded-xl p-3">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                    <SelectTrigger className="w-36 border-0 bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-3 bg-slate-50 rounded-xl p-3">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                    <SelectTrigger className="w-28 border-0 bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleExport} 
                  className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg transition-all duration-200 px-6 py-2.5"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Badge variant="outline" className="w-fit text-slate-700 border-slate-300 bg-white/70 font-medium px-3 py-1">
                  {timePeriod.toUpperCase()} REPORT
                </Badge>
                <div className="text-sm text-slate-600 font-medium">
                  {format(periodStart, 'MMM dd, yyyy')} - {format(periodEnd, 'MMM dd, yyyy')}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-yellow-100 rounded-lg">
                    <Trophy className="h-3.5 w-3.5 text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Peak: {peakSalesHour?.hour}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Low: {lowSalesHour?.hour}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg ring-1 ring-green-200/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Total Revenue</p>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{formatPrice(totalRevenue)}</p>
                  <p className="text-xs text-green-600 font-medium">{totalOrders} completed orders</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg ring-1 ring-blue-200/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Total Orders</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{totalOrders}</p>
                  <p className="text-xs text-blue-600 font-medium">completed this period</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-0 shadow-lg ring-1 ring-orange-200/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Average Order</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-700">{formatPrice(averageOrderValue)}</p>
                  <p className="text-xs text-orange-600 font-medium">per completed order</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-lg ring-1 ring-purple-200/50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Peak Hour</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-700">{peakSalesHour?.hour}</p>
                  <p className="text-xs text-purple-600 font-medium">{formatPrice(peakSalesHour?.revenue || 0)} revenue</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Sales Chart */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl ring-1 ring-gray-200/50">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Sales Trend Analysis</CardTitle>
                  <p className="text-sm text-slate-500">Revenue and order patterns over time</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatPrice(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="revenue"
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="orders"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Sales Chart */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl ring-1 ring-gray-200/50">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Hourly Sales Pattern</CardTitle>
                  <p className="text-sm text-slate-500">Revenue distribution throughout the day</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value, name) => [
                        name === 'revenue' ? formatPrice(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="revenue"
                      radius={[4, 4, 0, 0]}
                    >
                      {hourlySales.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`rgba(139, 92, 246, ${0.3 + (entry.revenue / Math.max(...hourlySales.map(h => h.revenue))) * 0.7})`} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Performance and Category Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Top Products */}
          <div className="xl:col-span-2">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl ring-1 ring-gray-200/50">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">Top Performing Products</CardTitle>
                    <p className="text-sm text-slate-500">Best-selling items ranked by revenue</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-3">
                  {productSales.slice(0, 10).map((item, index) => (
                    <div 
                      key={item.product.id} 
                      className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-slate-500 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' :
                          'bg-gradient-to-br from-slate-200 to-gray-300 text-slate-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 truncate group-hover:text-slate-900 transition-colors">
                            {item.product.name}
                          </p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-slate-600 font-medium">{item.quantity} units</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-2 py-0.5 ${item.product.category === "fastfood" 
                                ? "border-orange-300 text-orange-700 bg-orange-50" 
                                : "border-slate-300 text-slate-700 bg-slate-50"
                              }`}
                            >
                              {item.product.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-slate-800">{formatPrice(item.revenue)}</p>
                        <p className="text-xs text-slate-500">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div className="xl:col-span-1">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl ring-1 ring-gray-200/50">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">Category Performance</CardTitle>
                    <p className="text-sm text-slate-500">Revenue by product category</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="revenue"
                        paddingAngle={2}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => formatPrice(value as number)} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Category Legend */}
                <div className="mt-4 space-y-2">
                  {categoryBreakdown.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-medium text-slate-700">{category.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{formatPrice(category.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Footer Space */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}