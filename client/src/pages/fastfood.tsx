import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Plus, ChefHat, Clock, Star, Cake, ShieldX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ShoppingCartModal from "@/components/shopping-cart";
import CheckoutModal from "@/components/checkout-modal";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string;
}

export default function FastFoodPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Filter for fast food items only
  const fastfoodProducts = products.filter(product => product.category === 'fastfood');

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl || undefined
      }];
    });

    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to your cart`,
    });
  };

  const updateCartQuantity = (productId: number, change: number) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);

  const formatPrice = (price: string | number) => {
    return `₱${parseFloat(price.toString()).toFixed(2)}`;
  };

  const handleOrderComplete = () => {
    setCart([]);
    setIsCheckoutOpen(false);
    toast({
      title: "Order Placed Successfully!",
      description: "Thank you for your order. We'll contact you shortly.",
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[-7px] pb-[-7px] mt-[14px] mb-[14px]">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-center text-[19px] font-extrabold text-[#e9530f]">Fast Food</h1>
                <p className="text-gray-600 text-center text-[12px] font-bold">Daily Cooked Meals</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:bg-orange-50 text-xs px-2"
                >
                  <Cake className="h-4 w-4 mr-1" />
                  Bakery
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => user?.role === "admin" ? setLocation("/admin") : setLocation("/auth")}
                className="text-orange-600 hover:bg-orange-50 text-xs px-2"
              >
                <ShieldX className="h-4 w-4 mr-1" />
                Admin
              </Button>

              <Button 
                onClick={() => setIsCartOpen(true)}
                className="relative bg-orange-600 hover:bg-orange-700 text-xs px-2 py-1"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Cart
                {cart.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[16px] h-4 rounded-full text-xs flex items-center justify-center p-0">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-1 flex-shrink-0 pt-[3px] pb-[3px] mt-[8px] mb-[8px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-[-6px] pb-[-6px] mt-[12px] mb-[12px]">
          <h2 className="text-lg font-bold mb-1">Fresh Daily Cooked Meals</h2>
          <div className="flex items-center justify-center space-x-4 text-orange-100 text-xs">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Fresh Daily</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3" />
              <span>Authentic Taste</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChefHat className="h-3 w-3" />
              <span>Home-Style</span>
            </div>
          </div>
        </div>
      </div>
      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          <div className="mb-1">
            <h3 className="text-base font-bold text-gray-900 mb-1">Today's Menu</h3>
            <p className="text-gray-600 text-xs">Delicious Filipino meals cooked fresh daily</p>
          </div>

          <div className="pb-2">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-16 w-full" />
                    <CardContent className="p-2">
                      <Skeleton className="h-2 w-3/4 mb-1" />
                      <Skeleton className="h-2 w-full mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : fastfoodProducts.length === 0 ? (
              <div className="text-center py-8">
                <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-700 mb-1">No Fast Food Items Available</h3>
                <p className="text-gray-500 text-sm">Check back later for today's fresh meals!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pb-3">
                {fastfoodProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative">
                      <img
                        src={product.imageUrl || '/placeholder-food.jpg'}
                        alt={product.name}
                        className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge 
                        className={`absolute top-1 right-1 text-xs px-1 py-0 ${
                          product.available 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {product.available ? 'Available' : 'Sold Out'}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-2">
                      <h4 className="font-semibold text-xs text-gray-900 mb-1">{product.name}</h4>
                      <p className="text-gray-600 text-xs mb-1 line-clamp-1">{product.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-orange-600">
                          {formatPrice(product.price)}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(product)}
                          disabled={!product.available}
                          className="border-orange-600 text-orange-600 hover:bg-orange-50 text-xs px-1 py-0 h-5"
                        >
                          <Plus className="h-2 w-2 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Daily Specials Banner */}
      <div className="bg-orange-100 py-0.5 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-orange-700 text-xs mt-[12px] mb-[12px] font-bold">Fresh meals cooked every morning • Available while supplies last</p>
        </div>
      </div>
      {/* Shopping Cart Modal */}
      <ShoppingCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        total={cartTotal}
      />
      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        total={cartTotal}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
}