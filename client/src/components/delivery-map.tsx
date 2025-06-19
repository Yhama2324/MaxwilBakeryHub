import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Clock, Package } from "lucide-react";
import type { Order } from "@shared/schema";

interface DeliveryMapProps {
  orders: Order[];
  onStatusUpdate?: (orderId: number, status: string) => void;
}

declare global {
  interface Window {
    google: any;
    initDeliveryMap: () => void;
  }
}

export default function DeliveryMap({ orders, onStatusUpdate }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        setApiKey(config.GOOGLE_MAPS_API_KEY);
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initDeliveryMap`;
      script.async = true;
      script.defer = true;

      window.initDeliveryMap = () => {
        setIsMapLoaded(true);
        initializeMap();
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, [apiKey]);

  useEffect(() => {
    if (map && isMapLoaded) {
      updateMapMarkers();
    }
  }, [orders, map, isMapLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Default center to Manila, Philippines
    const defaultCenter = { lat: 14.5995, lng: 120.9842 };
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: defaultCenter,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(mapInstance);
  };

  const updateMapMarkers = () => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: any[] = [];
    const bounds = new window.google.maps.LatLngBounds();

    orders.forEach((order, index) => {
      if (!order.deliveryLatitude || !order.deliveryLongitude) return;

      const position = {
        lat: parseFloat(order.deliveryLatitude),
        lng: parseFloat(order.deliveryLongitude)
      };

      const statusColors = {
        pending: '#f59e0b', // yellow
        confirmed: '#3b82f6', // blue
        preparing: '#8b5cf6', // purple
        'out-for-delivery': '#10b981', // green
        delivered: '#6b7280', // gray
        cancelled: '#ef4444' // red
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: `Order #${order.id} - ${order.customerName}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: statusColors[order.status as keyof typeof statusColors] || '#6b7280',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: {
          text: order.id.toString(),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        }
      });

      marker.addListener('click', () => {
        setSelectedOrder(order);
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
      if (newMarkers.length === 1) {
        map.setZoom(16);
      }
    }

    setMarkers(newMarkers);
  };

  const openInGoogleMaps = (order: Order) => {
    if (order.deliveryLatitude && order.deliveryLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}&travelmode=driving`;
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
      {/* Map */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Delivery Locations</span>
              <Badge variant="secondary">{pendingOrders.length} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-80px)]">
            <div ref={mapRef} className="w-full h-full rounded-b-lg" />
            {!isMapLoaded && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Loading map...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Sidebar */}
      <div className="space-y-4 overflow-y-auto">
        {selectedOrder ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order #{selectedOrder.id}</span>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-bakery-dark">{selectedOrder.customerName}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
              </div>

              <div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-1 text-bakery-primary" />
                  <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Total: {formatPrice(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => openInGoogleMaps(selectedOrder)}
                  className="w-full bg-bakery-primary hover:bg-bakery-secondary"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate to Location
                </Button>

                {onStatusUpdate && selectedOrder.status !== 'delivered' && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrder.status === 'pending' && (
                      <Button
                        variant="outline"
                        onClick={() => onStatusUpdate(selectedOrder.id, 'confirmed')}
                        className="text-xs"
                      >
                        Confirm
                      </Button>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        onClick={() => onStatusUpdate(selectedOrder.id, 'preparing')}
                        className="text-xs"
                      >
                        Preparing
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
                        className="text-xs bg-green-50 text-green-700"
                      >
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Click on a marker to view order details</p>
            </CardContent>
          </Card>
        )}

        {/* Active Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">#{order.id}</span>
                  <Badge className={getStatusColor(order.status)} variant="secondary">
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 truncate">{order.customerName}</p>
                <p className="text-sm font-medium text-bakery-primary">
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-gray-500 text-center py-4">No active deliveries</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}