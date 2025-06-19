import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Plus, ChefHat, Clock, Star, Cake, ShieldX, User, LogOut, Settings, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ShoppingCartModal from "@/components/shopping-cart";
import CheckoutModal from "@/components/checkout-modal";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

export default function FastFoodPage() {
  const { cart, addToCart, updateCartQuantity, removeFromCart, clearCart, cartTotal, cartItemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const fastfoodProducts = products.filter(product => product.category === 'fastfood');

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart(product, quantity);
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to your cart`,
    });
  };

  const handleOrderComplete = () => {
    clearCart();
    setIsCheckoutOpen(false);
    toast({
      title: "Order Placed Successfully!",
      description: "Your order has been received and will be prepared fresh.",
    });
  };

  // Map cart items to the format expected by components
  const cartItems = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl
  }));

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const formatPrice = (price: string | number) => {
    return `₱${parseFloat(price.toString()).toFixed(2)}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col overflow-hidden scrollbar-hide">
      {/* Top Header */}
      <div className="bg-white shadow-sm flex-shrink-0 z-50">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-orange-600 mr-2" />
            <span className="text-lg font-bold text-orange-700">MAXWIL' Fast Food</span>
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
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-1">
          <div className="mb-1">
            <h3 className="font-bold text-gray-900 mb-0.5 text-[17px] text-left pt-[2px] pb-[2px]">Today's Menu</h3>
            <p className="text-[13px] text-left text-[#e9530f] font-semibold">Delicious Filipino meals cooked fresh daily</p>
          </div>

          <div className="pb-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-12 w-full" />
                    <CardContent className="p-1.5">
                      <Skeleton className="h-2 w-3/4 mb-0.5" />
                      <Skeleton className="h-2 w-full mb-0.5" />
                      <Skeleton className="h-3 w-12" />
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 pb-1">
                {fastfoodProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative">
                      <img
                        src={product.imageUrl || '/placeholder-food.jpg'}
                        alt={product.name}
                        className="w-full h-12 object-cover group-hover:scale-105 transition-transform duration-300 mt-[8px] mb-[8px] pt-[-13px] pb-[-13px]"
                      />
                      <Badge 
                        className={`absolute top-0.5 right-0.5 text-xs px-0.5 py-0 ${
                          product.available 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {product.available ? 'OK' : 'Out'}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-1.5">
                      <h4 className="font-semibold text-xs text-gray-900 mb-0.5 leading-tight">{product.name}</h4>
                      <p className="text-gray-600 text-xs mb-1 line-clamp-1 leading-tight">{product.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-600">
                          {formatPrice(product.price)}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.available}
                          className="border-orange-600 text-orange-600 hover:bg-orange-50 text-xs px-1 py-0 h-4"
                        >
                          <Plus className="h-2 w-2" />
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
      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0 z-50">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-bakery-primary"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs font-medium">Bakery</span>
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 px-2 py-2 text-[#f24907]"
            >
              <ChefHat className="h-5 w-5" />
              <span className="text-xs font-medium">Fast Food</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-orange-600 relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs font-medium">Cart</span>
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs bg-red-500 text-white rounded-full">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-orange-600"
                >
                  <User className="h-5 w-5" />
                  <span className="text-xs font-medium">Profile</span>
                </Button>
                
                {showUserMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">Welcome back!</p>
                      </div>
                      
                      {user.role === "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLocation("/admin");
                            setShowUserMenu(false);
                          }}
                          className="w-full justify-start text-xs"
                        >
                          <ShieldX className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full justify-start text-xs"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          logoutMutation.mutate();
                          setShowUserMenu(false);
                        }}
                        className="w-full justify-start text-xs text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/auth")}
                className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-orange-600"
              >
                <User className="h-5 w-5" />
                <span className="text-xs font-medium">Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Shopping Cart Modal */}
      <ShoppingCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
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
        items={cartItems}
        total={cartTotal}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
}