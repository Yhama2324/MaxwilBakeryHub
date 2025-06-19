import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Phone, Clock, Package } from "lucide-react";
import type { Order } from "@shared/schema";

interface LeafletDeliveryMapProps {
  orders: Order[];
  onStatusUpdate?: (orderId: number, status: string) => void;
}

export default function LeafletDeliveryMap({ orders, onStatusUpdate }: LeafletDeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => {
          setIsMapLoaded(true);
          initializeMap();
        };
        document.head.appendChild(script);
      } else {
        setIsMapLoaded(true);
        initializeMap();
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (map && isMapLoaded) {
      updateMapMarkers();
    }
  }, [orders, map, isMapLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return;

    // Default center to Manila, Philippines
    const defaultCenter = [14.5995, 120.9842];
    
    const mapInstance = window.L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles (free)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    setMap(mapInstance);
  };

  const updateMapMarkers = () => {
    if (!map || !window.L) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    
    const newMarkers: any[] = [];
    const group = window.L.featureGroup();

    orders.forEach((order) => {
      if (!order.deliveryLatitude || !order.deliveryLongitude) return;

      const position = [
        parseFloat(order.deliveryLatitude),
        parseFloat(order.deliveryLongitude)
      ];

      const statusColors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        preparing: '#8b5cf6',
        'out-for-delivery': '#10b981',
        delivered: '#6b7280',
        cancelled: '#ef4444'
      };

      const color = statusColors[order.status as keyof typeof statusColors] || '#6b7280';

      // Create custom marker
      const marker = window.L.circleMarker(position, {
        radius: 12,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      });

      // Add number label
      const divIcon = window.L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${order.id}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const labelMarker = window.L.marker(position, { icon: divIcon });

      marker.on('click', () => setSelectedOrder(order));
      labelMarker.on('click', () => setSelectedOrder(order));

      marker.addTo(map);
      labelMarker.addTo(map);
      group.addLayer(marker);

      newMarkers.push(marker, labelMarker);
    });

    if (newMarkers.length > 0) {
      map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }

    setMarkers(newMarkers);
  };

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