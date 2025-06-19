import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@shared/schema";
import { MapPin, Store } from "lucide-react";

interface MapComponentProps {
  orders: Order[];
}

export default function MapComponent({ orders }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Since we can't use real map libraries without additional setup,
  // we'll create a visual representation of the delivery locations
  const bakeryLocation = {
    name: "MAXWIL' Bakery",
    address: "Main Store Location",
    type: "bakery"
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

  return (
    <div className="space-y-4">
      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-6">
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center relative">
            <div className="text-center text-gray-500">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-bakery-primary" />
              <h3 className="text-lg font-medium text-bakery-dark mb-2">Delivery Map</h3>
              <p className="text-sm">Interactive map integration would display here</p>
              <p className="text-xs mt-2">
                Showing delivery locations and routes for order tracking
              </p>
            </div>
            
            {/* Simulated map pins */}
            <div className="absolute top-4 left-4 bg-bakery-primary text-white p-2 rounded-full shadow-lg">
              <Store className="h-4 w-4" />
            </div>
            
            {orders.slice(0, 3).map((order, index) => (
              <div
                key={order.id}
                className="absolute bg-red-500 text-white p-1 rounded-full shadow-lg text-xs"
                style={{
                  top: `${20 + index * 15}%`,
                  left: `${30 + index * 20}%`,
                }}
              >
                {order.id}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location List */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-bakery-dark mb-4">Locations</h4>
          
          {/* Bakery Location */}
          <div className="flex items-center justify-between p-3 bg-bakery-cream rounded-lg mb-3">
            <div className="flex items-center space-x-3">
              <Store className="h-5 w-5 text-bakery-primary" />
              <div>
                <p className="font-medium text-bakery-dark">{bakeryLocation.name}</p>
                <p className="text-sm text-gray-600">{bakeryLocation.address}</p>
              </div>
            </div>
            <Badge className="bg-bakery-primary text-white">Main Store</Badge>
          </div>

          {/* Customer Locations */}
          <div className="space-y-2">
            <h5 className="font-medium text-gray-700 text-sm">Delivery Addresses</h5>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No delivery addresses yet
              </p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3 flex-1">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-600 break-words">
                        {order.deliveryAddress}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-bakery-primary font-medium">
                          {formatPrice(order.totalAmount)}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {order.customerPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      #{order.id}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Instructions */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-bakery-dark mb-2">Map Features</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-bakery-primary" />
              <span>Bakery main location</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>Customer delivery addresses</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>Optimal delivery routes</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            💡 In a full implementation, this would integrate with Google Maps or Leaflet 
            to show real-time locations, routing, and delivery tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
