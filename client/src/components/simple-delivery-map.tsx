import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Clock, Package, ExternalLink } from "lucide-react";
import type { Order } from "@shared/schema";

interface SimpleDeliveryMapProps {
  orders: Order[];
  onStatusUpdate?: (orderId: number, status: string) => void;
}

export default function SimpleDeliveryMap({ orders, onStatusUpdate }: SimpleDeliveryMapProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const openInGoogleMaps = (order: Order) => {
    if (order.deliveryLatitude && order.deliveryLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      // Fallback to address search
      const url = `https://www.google.com/maps/search/${encodeURIComponent(order.deliveryAddress)}`;
      window.open(url, '_blank');
    }
  };

  const openInWaze = (order: Order) => {
    if (order.deliveryLatitude && order.deliveryLongitude) {
      const url = `https://waze.com/ul?ll=${order.deliveryLatitude},${order.deliveryLongitude}&navigate=yes`;
      window.open(url, '_blank');
    } else {
      const url = `https://waze.com/ul?q=${encodeURIComponent(order.deliveryAddress)}`;
      window.open(url, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      'out-for-delivery': 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price: string | number) => {
    return `₱${parseFloat(price.toString()).toFixed(2)}`;
  };

  const pendingOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'confirmed' || 
    order.status === 'preparing' || order.status === 'out-for-delivery'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Orders List */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Active Deliveries</span>
              <Badge variant="secondary">{pendingOrders.length} orders</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active deliveries</p>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder?.id === order.id ? 'border-bakery-primary bg-bakery-cream/20' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-lg">Order #{order.id}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{order.customerName}</p>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{order.customerPhone}</span>
                    </div>
                    <div className="flex items-start space-x-2 text-gray-600">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{order.deliveryAddress}</span>
                    </div>
                    {order.deliveryLatitude && order.deliveryLongitude && (
                      <div className="flex items-center space-x-2 text-green-600 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>GPS: {parseFloat(order.deliveryLatitude).toFixed(4)}, {parseFloat(order.deliveryLongitude).toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-semibold text-bakery-primary">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details */}
      <div className="space-y-4">
        {selectedOrder ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order #{selectedOrder.id} Details</span>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-bakery-dark mb-2">Customer Information</h4>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <p className="text-xs text-gray-500">Payment: {selectedOrder.paymentMethod}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-bakery-dark mb-2">Delivery Address</h4>
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="h-4 w-4 mt-1 text-bakery-primary flex-shrink-0" />
                  <p>{selectedOrder.deliveryAddress}</p>
                </div>
                {selectedOrder.deliveryLatitude && selectedOrder.deliveryLongitude && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                    <span className="text-green-700 font-medium">GPS Coordinates:</span><br />
                    <span className="text-green-600">
                      {parseFloat(selectedOrder.deliveryLatitude).toFixed(6)}, {parseFloat(selectedOrder.deliveryLongitude).toFixed(6)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-bakery-dark mb-2">Order Items</h4>
                <div className="space-y-1 text-sm">
                  {JSON.parse(selectedOrder.items).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-bakery-primary">
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-bakery-primary">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-bakery-dark">Navigation</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => openInGoogleMaps(selectedOrder)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Google Maps
                  </Button>
                  <Button
                    onClick={() => openInWaze(selectedOrder)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    size="sm"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Waze
                  </Button>
                </div>
              </div>

              {onStatusUpdate && selectedOrder.status !== 'delivered' && (
                <div className="space-y-2">
                  <h4 className="font-medium text-bakery-dark">Update Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrder.status === 'pending' && (
                      <Button
                        variant="outline"
                        onClick={() => onStatusUpdate(selectedOrder.id, 'confirmed')}
                        className="text-xs"
                      >
                        Confirm Order
                      </Button>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        onClick={() => onStatusUpdate(selectedOrder.id, 'preparing')}
                        className="text-xs"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {selectedOrder.status === 'preparing' && (
                      <Button
                        variant="outline"
                        onClick={() => onStatusUpdate(selectedOrder.id, 'out-for-delivery')}
                        className="text-xs"
                      >
                        Out for Delivery
                      </Button>
                    )}
                    {selectedOrder.status === 'out-for-delivery' && (
                      <Button
                        variant="outline"
                        onClick={() => onStatusUpdate(selectedOrder.id, 'delivered')}
                        className="text-xs bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Select an Order</h3>
              <p className="text-gray-500">Click on an order from the list to view details and navigation options</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}