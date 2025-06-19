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
      {/* Interactive Map Simulation */}
      <Card>
        <CardContent className="p-6">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg h-80 relative overflow-hidden border-2 border-gray-200">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-gray-300"></div>
                ))}
              </div>
            </div>
            
            {/* Bakery Location */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="bg-bakery-primary text-white p-3 rounded-full shadow-lg animate-pulse-soft">
                  <Store className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-medium border shadow-sm">
                  MAXWIL' Bakery
                </div>
                {/* Pulse rings */}
                <div className="absolute inset-0 bg-bakery-primary rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-bakery-primary rounded-full animate-ping opacity-10 animation-delay-300"></div>
              </div>
            </div>

            {/* Customer Delivery Points */}
            {orders.slice(0, 6).map((order, index) => {
              const positions = [
                { top: '20%', left: '25%' },
                { top: '75%', left: '20%' },
                { top: '30%', left: '75%' },
                { top: '80%', left: '70%' },
                { top: '15%', left: '60%' },
                { top: '65%', left: '45%' }
              ];
              
              const statusColors = {
                pending: 'bg-yellow-500',
                accepted: 'bg-blue-500',
                preparing: 'bg-orange-500',
                delivered: 'bg-green-500',
                cancelled: 'bg-red-500'
              };

              const position = positions[index] || { top: '50%', left: '50%' };
              
              return (
                <div
                  key={order.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-fade-in"
                  style={{ top: position.top, left: position.left }}
                >
                  <div className="relative group">
                    <div className={`${statusColors[order.status as keyof typeof statusColors]} text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    
                    {/* Delivery Route Line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ 
                      width: '200px', 
                      height: '200px',
                      top: '-100px',
                      left: '-100px'
                    }}>
                      <defs>
                        <pattern id="dash" patternUnits="userSpaceOnUse" width="8" height="8">
                          <path d="M0,4 l8,0" stroke="#10b981" strokeWidth="2" strokeDasharray="4,4" />
                        </pattern>
                      </defs>
                      {order.status !== 'cancelled' && (
                        <line 
                          x1="100" 
                          y1="100" 
                          x2={window.innerWidth > 768 ? "150" : "120"} 
                          y2={window.innerWidth > 768 ? "150" : "120"}
                          stroke="url(#dash)" 
                          strokeWidth="2" 
                          opacity="0.6"
                        />
                      )}
                    </svg>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        Order #{order.id} - {order.status}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 space-y-2">
              <div className="bg-white rounded-lg shadow p-2 text-center">
                <div className="text-xs font-medium text-gray-600">Live Orders</div>
                <div className="text-lg font-bold text-bakery-primary">{orders.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-2 text-center">
                <div className="text-xs font-medium text-gray-600">Active Deliveries</div>
                <div className="text-lg font-bold text-green-600">
                  {orders.filter(o => o.status === 'preparing').length}
                </div>
              </div>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-3 text-xs">
              <div className="font-medium text-gray-700 mb-2">Status Legend</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Accepted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Preparing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Delivered</span>
                </div>
              </div>
            </div>
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
