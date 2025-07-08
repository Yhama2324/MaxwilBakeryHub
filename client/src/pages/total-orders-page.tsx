import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Order } from "@shared/schema";
import { Link } from "wouter";
import { 
  ShoppingBag, 
  Check,
  X,
  Clock,
  Home,
  ArrowLeft,
  MapPin,
  Calendar,
  TrendingUp
} from "lucide-react";

export default function TotalOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleUpdateOrderStatus = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-purple-100 text-purple-800";
      case "ready": return "bg-green-100 text-green-800";
      case "delivered": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric'
    }) + ' PHT';
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(numPrice);
  };

  // Order categories
  const activeOrders = orders.filter(order => 
    ["pending", "accepted", "preparing", "ready"].includes(order.status)
  );
  const completedOrders = orders.filter(order => order.status === "delivered");
  const cancelledOrders = orders.filter(order => order.status === "cancelled");
  const historyOrders = orders.filter(order => 
    ["delivered", "cancelled"].includes(order.status)
  );

  // Calculate stats
  const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

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
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="text-[12px] bg-[#f4c7d7]">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Orders</p>
                  <p className="text-lg font-bold text-blue-600">{orders.length}</p>
                </div>
                <ShoppingBag className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active</p>
                  <p className="text-lg font-bold text-orange-600">{activeOrders.length}</p>
                </div>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-green-600">{completedOrders.length}</p>
                </div>
                <Check className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Cancelled</p>
                  <p className="text-lg font-bold text-red-600">{cancelledOrders.length}</p>
                </div>
                <X className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Avg Order</p>
                  <p className="text-lg font-bold text-purple-600">{formatPrice(averageOrderValue)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-blue-500" />
              <span>Order Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
                <TabsTrigger value="all" className="font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">All Orders ({orders.length})</TabsTrigger>
                <TabsTrigger value="active" className="font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm">Active ({activeOrders.length})</TabsTrigger>
                <TabsTrigger value="completed" className="font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm">Completed ({completedOrders.length})</TabsTrigger>
                <TabsTrigger value="cancelled" className="font-semibold text-gray-700 data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm">Cancelled ({cancelledOrders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {ordersLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No orders found</div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">Order #{order.id}</h4>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                            <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getStatusColor(order.status)} mb-2`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <p className="text-lg font-bold text-bakery-primary">
                              {formatPrice(order.totalAmount)}
                            </p>
                          </div>
                        </div>

                        {order.deliveryAddress && (
                          <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{order.deliveryAddress}</span>
                          </div>
                        )}

                        {["pending", "accepted", "preparing", "ready"].includes(order.status) && (
                          <div className="flex flex-wrap gap-2">
                            {order.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "accepted")}
                                  disabled={updateOrderStatusMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                  disabled={updateOrderStatusMutation.isPending}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            
                            {order.status === "accepted" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                                disabled={updateOrderStatusMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Start Preparing
                              </Button>
                            )}
                            
                            {order.status === "preparing" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                                disabled={updateOrderStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Ready
                              </Button>
                            )}
                            
                            {order.status === "ready" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                                disabled={updateOrderStatusMutation.isPending}
                                className="bg-gray-600 hover:bg-gray-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Delivered
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-4">
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getStatusColor(order.status)} mb-2`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <p className="text-lg font-bold text-bakery-primary">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                      </div>

                      {order.deliveryAddress && (
                        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{order.deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                <div className="space-y-4">
                  {completedOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800 mb-2">Delivered</Badge>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="cancelled" className="mt-4">
                <div className="space-y-4">
                  {cancelledOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">Order #{order.id}</h4>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-red-100 text-red-800 mb-2">Cancelled</Badge>
                          <p className="text-lg font-bold text-red-600">
                            {formatPrice(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}