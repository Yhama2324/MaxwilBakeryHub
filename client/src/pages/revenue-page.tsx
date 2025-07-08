import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@shared/schema";
import { Link } from "wouter";
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Home,
  ArrowLeft,
  ShoppingBag,
  Target,
  CreditCard
} from "lucide-react";

export default function RevenuePage() {
  const { user } = useAuth();

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(numPrice);
  };

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' PHT';
  };

  // Revenue calculations
  const completedOrders = orders.filter(order => order.status === "delivered");
  const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  
  // Daily revenue (today)
  const today = new Date();
  const todayOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  // Weekly revenue (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= weekAgo;
  });
  const weekRevenue = weekOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  // Monthly revenue (last 30 days)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= monthAgo;
  });
  const monthRevenue = monthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  // Sort orders by revenue (highest first)
  const topOrders = [...completedOrders]
    .sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount))
    .slice(0, 10);

  // Revenue trend (compare with previous period)
  const previousWeekStart = new Date();
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);
  const previousWeekEnd = new Date();
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
  
  const previousWeekOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= previousWeekStart && orderDate < previousWeekEnd;
  });
  const previousWeekRevenue = previousWeekOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  
  const weeklyGrowth = previousWeekRevenue > 0 
    ? ((weekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden scrollbar-hide">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="font-bold text-lg text-center text-bakery-dark">Revenue Analytics</h1>
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
      {/* Revenue Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
                  <p className="text-xs text-gray-500">{completedOrders.length} completed orders</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(todayRevenue)}</p>
                  <p className="text-xs text-gray-500">{todayOrders.length} orders today</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Weekly Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">{formatPrice(weekRevenue)}</p>
                  <div className="flex items-center space-x-1">
                    {weeklyGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <p className={`text-xs ${weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {weeklyGrowth.toFixed(1)}% vs last week
                    </p>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Order</p>
                  <p className="text-2xl font-bold text-orange-600">{formatPrice(averageOrderValue)}</p>
                  <p className="text-xs text-gray-500">Per completed order</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Period Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Revenue by Period</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Monthly (30 days)</p>
                    <p className="text-sm text-green-600">{monthOrders.length} orders</p>
                  </div>
                  <p className="text-lg font-bold text-green-700">{formatPrice(monthRevenue)}</p>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">Weekly (7 days)</p>
                    <p className="text-sm text-blue-600">{weekOrders.length} orders</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">{formatPrice(weekRevenue)}</p>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-orange-800">Today</p>
                    <p className="text-sm text-orange-600">{todayOrders.length} orders</p>
                  </div>
                  <p className="text-lg font-bold text-orange-700">{formatPrice(todayRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Revenue Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Highest Value Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : topOrders.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No completed orders</div>
              ) : (
                <div className="space-y-3">
                  {topOrders.slice(0, 5).map((order, index) => (
                    <div key={order.id} className="flex items-center justify-between p-2 rounded bg-[#f7eddac4] font-extrabold text-[#0a0a0a]">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">Order #{order.id}</p>
                          <p className="text-xs text-gray-600">{order.customerName}</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">{formatPrice(order.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Revenue Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Recent Completed Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : completedOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No completed orders</div>
            ) : (
              <div className="space-y-3">
                {completedOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                    <div>
                      <h4 className="font-semibold">Order #{order.id}</h4>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800 mb-1">Delivered</Badge>
                      <p className="text-lg font-bold text-green-600">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}