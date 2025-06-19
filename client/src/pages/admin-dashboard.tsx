import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product, Order } from "@shared/schema";
import ProductModal from "@/components/product-modal";
import MapComponent from "@/components/map-component";
import SimpleDeliveryMap from "@/components/simple-delivery-map";
import { 
  Package, 
  ShoppingBag, 
  Map, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2,
  Check,
  X,
  Clock,
  DollarSign,
  ChefHat
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated",
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

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleAddFastFood = () => {
    setSelectedProduct({ 
      id: 0, 
      name: "", 
      description: "", 
      price: "", 
      category: "fastfood", 
      imageUrl: "" 
    } as Product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleUpdateOrderStatus = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: string | number) => {
    return `₱${parseFloat(price.toString()).toFixed(2)}`;
  };

  const formatDateTime = (dateString: any) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    };
    return date.toLocaleString('en-US', options) + ' PHT';
  };

  const totalRevenue = orders
    .filter(order => order.status === "delivered")
    .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const preparingOrders = orders.filter(order => order.status === "preparing").length;
  const activeOrders = pendingOrders + preparingOrders;

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden scrollbar-hide">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-bakery-dark">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Products</p>
                  <p className="text-lg font-bold text-bakery-dark">{products.length}</p>
                </div>
                <Package className="h-5 w-5 text-bakery-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active Orders</p>
                  <p className="text-lg font-bold text-orange-600">{activeOrders}</p>
                  <p className="text-xs text-gray-500">{pendingOrders}+{preparingOrders}</p>
                </div>
                <ShoppingBag className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-xs font-medium text-gray-600">Revenue</p>
                  <p className="text-lg font-bold text-green-600">{formatPrice(totalRevenue)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <Map className="h-4 w-4" />
              <span>Delivery Map</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Product Management</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button 
                        onClick={handleAddFastFood} 
                        size="sm" 
                        className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 text-xs"
                      >
                        <ChefHat className="h-3 w-3 mr-1" />
                        Fast Food
                      </Button>
                      <Button 
                        onClick={handleAddProduct} 
                        size="sm" 
                        className="bg-bakery-primary hover:bg-bakery-secondary px-2 py-1 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Bakery
                      </Button>
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-medium text-gray-600">Filter:</span>
                    <Button 
                      variant={productCategoryFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProductCategoryFilter("all")}
                      className="h-6 px-2 text-xs"
                    >
                      All ({products.length})
                    </Button>
                    <Button 
                      variant={productCategoryFilter === "bakery" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProductCategoryFilter("bakery")}
                      className="h-6 px-2 text-xs text-bakery-primary border-bakery-primary hover:bg-bakery-cream"
                    >
                      Bakery ({products.filter(p => p.category === "bakery").length})
                    </Button>
                    <Button 
                      variant={productCategoryFilter === "fastfood" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProductCategoryFilter("fastfood")}
                      className="h-6 px-2 text-xs text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      Fast Food ({products.filter(p => p.category === "fastfood").length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {productsLoading ? (
                  <div className="text-center py-4 text-sm">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">No products found</div>
                ) : products.filter(product => productCategoryFilter === "all" || product.category === productCategoryFilter).length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No {productCategoryFilter === "bakery" ? "bakery" : productCategoryFilter === "fastfood" ? "fast food" : ""} products found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products
                      .filter(product => productCategoryFilter === "all" || product.category === productCategoryFilter)
                      .map((product) => (
                      <div key={product.id} className="rounded-lg p-3 bg-[#f0eee6f2] mt-[16px] mb-[16px]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <img
                              src={product.imageUrl || "https://via.placeholder.com/60"}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-sm text-bakery-dark truncate">{product.name}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs px-1 py-0 flex-shrink-0 ${product.category === "fastfood" 
                                    ? "border-orange-500 text-orange-700 bg-orange-50" 
                                    : "border-bakery-primary text-bakery-primary bg-bakery-cream/30"
                                  }`}
                                >
                                  {product.category === "fastfood" ? (
                                    <><ChefHat className="h-2 w-2 mr-1" />FF</>
                                  ) : (
                                    <><Package className="h-2 w-2 mr-1" />B</>
                                  )}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 truncate mb-1">{product.description}</p>
                              <span className="text-sm font-bold text-bakery-primary">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-7 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deleteProductMutation.isPending}
                              className="h-7 w-8 p-0 text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No orders found</div>
                ) : (
                  <div className="space-y-4">
                    {orders.filter(order => order.status === "pending" || order.status === "preparing").map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-bakery-dark">Order #{order.id}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDateTime(order.createdAt)} • {order.customerName}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Items:</p>
                            <p className="text-sm">{JSON.parse(order.items).map((item: any) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total:</p>
                            <p className="text-lg font-bold text-bakery-primary">{formatPrice(order.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Phone:</p>
                            <p className="text-sm">{order.customerPhone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Payment:</p>
                            <p className="text-sm">{order.paymentMethod}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-600">Delivery Address:</p>
                          <p className="text-sm">{order.deliveryAddress}</p>
                        </div>

                        {order.status === "pending" && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, "accepted")}
                              disabled={updateOrderStatusMutation.isPending}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                              disabled={updateOrderStatusMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {order.status === "accepted" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                            disabled={updateOrderStatusMutation.isPending}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            Start Preparing
                          </Button>
                        )}

                        {order.status === "preparing" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                            disabled={updateOrderStatusMutation.isPending}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-6">
              {/* Delivered Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Delivered Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.filter(order => order.status === "delivered").length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No delivered orders</div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter(order => order.status === "delivered").map((order) => (
                        <div key={order.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800">Order #{order.id}</h4>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(order.createdAt)} • {order.customerName}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              Delivered
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Items:</p>
                              <p className="text-sm">{JSON.parse(order.items).map((item: any) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total:</p>
                              <p className="text-lg font-bold text-green-700">{formatPrice(order.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Phone:</p>
                              <p className="text-sm">{order.customerPhone}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Payment:</p>
                              <p className="text-sm">{order.paymentMethod}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-600">Delivery Address:</p>
                            <p className="text-sm">{order.deliveryAddress}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Canceled Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <X className="h-5 w-5 text-red-600" />
                    <span>Canceled Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.filter(order => order.status === "cancelled").length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No canceled orders</div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter(order => order.status === "cancelled").map((order) => (
                        <div key={order.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800">Order #{order.id}</h4>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(order.createdAt)} • {order.customerName}
                              </p>
                            </div>
                            <Badge className="bg-red-100 text-red-800 border-red-300">
                              Canceled
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Items:</p>
                              <p className="text-sm">{JSON.parse(order.items).map((item: any) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total:</p>
                              <p className="text-lg font-bold text-red-700">{formatPrice(order.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Phone:</p>
                              <p className="text-sm">{order.customerPhone}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Payment:</p>
                              <p className="text-sm">{order.paymentMethod}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-600">Delivery Address:</p>
                            <p className="text-sm">{order.deliveryAddress}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <SimpleDeliveryMap 
              orders={orders.filter(order => order.status !== "cancelled")} 
              onStatusUpdate={handleUpdateOrderStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onSave={() => {
          setIsProductModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        }}
      />
    </div>
  );
}
