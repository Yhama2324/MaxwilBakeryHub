import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Phone, MapPin, CheckCircle } from "lucide-react";
import GoogleMapsAddress from "./google-maps-address";

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onOrderComplete: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  total,
  onOrderComplete
}: CheckoutModalProps) {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    paymentMethod: "cod",
    coordinates: null as { lat: number; lng: number } | null
  });

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Order Placed!",
        description: "Your order has been successfully placed. We'll contact you soon!",
      });
    },
    onError: () => {
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive"
      });
      return;
    }

    // Sanitize phone number
    const cleanPhone = formData.customerPhone.replace(/[^\d+\s()-]/g, '').trim();
    if (cleanPhone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      customerName: formData.customerName.trim(),
      customerPhone: cleanPhone,
      deliveryAddress: formData.deliveryAddress.trim(),
      paymentMethod: formData.paymentMethod,
      totalAmount: total.toString(),
      items: JSON.stringify(items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })))
    };

    orderMutation.mutate(orderData);
  };

  const handleClose = () => {
    if (isSuccess) {
      onOrderComplete();
      setIsSuccess(false);
      setFormData({
        customerName: "",
        customerPhone: "",
        deliveryAddress: "",
        paymentMethod: "cod",
        coordinates: null
      });
    }
    onClose();
  };

  const formatPrice = (price: string | number) => {
    return `₱${parseFloat(price.toString()).toFixed(2)}`;
  };

  const paymentMethods = [
    {
      id: "cod",
      label: "Cash on Delivery",
      icon: "💵",
      description: "Pay when your order arrives"
    },
    {
      id: "gcash",
      label: "GCash",
      icon: "📱",
      description: "Digital wallet payment"
    },
    {
      id: "bank",
      label: "Bank Transfer",
      icon: "🏦",
      description: "Direct bank transfer"
    }
  ];

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-bakery-dark mb-2">Order Placed Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your order. We'll contact you shortly to confirm the details and delivery time.
            </p>
            <div className="bg-bakery-cream p-4 rounded-lg mb-4">
              <p className="text-sm font-medium text-bakery-dark">Order Total</p>
              <p className="text-2xl font-bold text-bakery-primary">{formatPrice(total)}</p>
            </div>
            <Button onClick={handleClose} className="w-full bg-bakery-primary hover:bg-bakery-secondary">
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Checkout</span>
          </DialogTitle>
          <DialogDescription>
            Complete your order information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-bakery-dark mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-bakery-primary font-medium">
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-3 flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-bakery-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Full Name *</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter your full name"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="customer-phone" className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Phone Number *</span>
              </Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="+63 9XX XXX XXXX"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="delivery-address" className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Delivery Address *</span>
              </Label>
              <Textarea
                id="delivery-address"
                placeholder="Enter your complete delivery address (Street, Barangay, City, Landmarks)"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                rows={3}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Please include street, barangay, city, and landmarks for accurate delivery
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-base font-medium mb-3 block">Payment Method</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              className="space-y-3"
            >
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:border-bakery-primary transition-colors">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <Label htmlFor={method.id} className="font-medium cursor-pointer">
                        {method.label}
                      </Label>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Instructions */}
          {formData.paymentMethod === "gcash" && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">GCash Payment Instructions</h5>
              <p className="text-sm text-blue-700">
                You'll receive GCash payment details after placing your order. Please send payment within 2 hours to confirm your order.
              </p>
            </div>
          )}

          {formData.paymentMethod === "bank" && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">Bank Transfer Instructions</h5>
              <p className="text-sm text-green-700">
                Bank details will be provided after order confirmation. Please complete the transfer within 24 hours.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 transform hover:scale-105 active:scale-95 transition-all duration-200"
            disabled={orderMutation.isPending}
            size="lg"
          >
            {orderMutation.isPending ? "Placing Order..." : `Place Order - ${formatPrice(total)}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
