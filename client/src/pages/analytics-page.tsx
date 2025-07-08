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
    <div className="min-h-screen bg-gradient-to-br from-bakery-cream via-white to-bakery-cream/30">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-bakery-cream/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-bakery-primary border-bakery-primary hover:bg-bakery-cream">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-bakery-dark">Analytics & Reports</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-bakery-primary" />
                Report Settings
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                    <SelectTrigger className="w-32">
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
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleExport} className="bg-bakery-primary hover:bg-bakery-secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-bakery-primary border-bakery-primary">
                  {timePeriod.toUpperCase()}
                </Badge>
                <span>Period: {format(periodStart, 'MMM dd, yyyy')} - {format(periodEnd, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Peak Hour: {peakSalesHour?.hour}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Low Hour: {lowSalesHour?.hour}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
                  <p className="text-xs text-gray-500">{totalOrders} completed orders</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
                  <p className="text-xs text-gray-500">completed this period</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Order</p>
                  <p className="text-2xl font-bold text-orange-600">{formatPrice(averageOrderValue)}</p>
                  <p className="text-xs text-gray-500">per completed order</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Peak Hour</p>
                  <p className="text-2xl font-bold text-purple-600">{peakSalesHour?.hour}</p>
                  <p className="text-xs text-gray-500">{formatPrice(peakSalesHour?.revenue || 0)} revenue</p>
                </div>
                <Trophy className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatPrice(value as number) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="revenue" />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatPrice(value as number) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Product Performance and Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productSales.slice(0, 10).map((item, index) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">{item.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-bakery-primary">{formatPrice(item.revenue)}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${item.product.category === "fastfood" 
                          ? "border-orange-500 text-orange-700" 
                          : "border-bakery-primary text-bakery-primary"
                        }`}
                      >
                        {item.product.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                    label={({ name, value }) => `${name}: ${formatPrice(value)}`}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatPrice(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}