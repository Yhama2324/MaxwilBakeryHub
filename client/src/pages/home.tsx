import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@shared/schema";
import ProductGrid from "@/components/product-grid";
import ShoppingCart from "@/components/shopping-cart";
import CheckoutModal from "@/components/checkout-modal";
import { ShoppingCart as CartIcon, ShieldX, Wheat, MapPin, Phone, ChefHat, User, LogOut, Settings, Home, Menu } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { cart, addToCart, updateCartQuantity, removeFromCart, clearCart, cartTotal, cartItemCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const categories = [
    { id: "all", name: "All", icon: "🍞" },
    { id: "bread", name: "Wheat", icon: "🍞" },
    { id: "pastries", name: "Pastries", icon: "🥐" },
    { id: "cakes", name: "Cakes", icon: "🎂" },
  ];

  const filteredProducts = selectedCategory === "all" 
    ? products.filter(product => product.category !== "fastfood")
    : products.filter(product => product.category === selectedCategory);

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

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden scrollbar-hide">
      {/* Top Header */}
      <div className="bg-white shadow-sm flex-shrink-0 z-50">
        <div className="max-w-md mx-auto px-4 py-2 pt-[11px] pb-[11px]">
          <div className="flex items-center justify-center">
            <Wheat className="h-6 w-6 text-bakery-primary mr-2" />
            <span className="text-lg font-bold text-bakery-dark">MAXWIL' Bakery</span>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <div 
        className="relative h-32 bg-cover bg-center flex-shrink-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')"
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4">
          <div className="animate-fade-in">
            <h1 className="text-xl font-bold mb-1">MAXWIL' Bakery</h1>
            <p className="text-sm opacity-90">Fresh Baked Daily with Love</p>
            <div className="mt-2">
              <Badge className="bg-green-500 text-white text-xs">
                🕕 Open 6AM - 8PM
              </Badge>
            </div>
          </div>
        </div>
      </div>
      {/* Category Filter */}
      <div className="max-w-md mx-auto px-4 py-2 flex-shrink-0">
        <div className="grid grid-cols-4 gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`p-2 h-auto flex-col space-y-1 transition-all duration-200 transform hover:scale-105 button-press hover-lift ${
                selectedCategory === category.id 
                  ? "bg-bakery-primary hover:bg-bakery-secondary border-bakery-primary animate-scale-in" 
                  : "border-2 hover:border-bakery-primary"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="text-xs font-medium">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>
      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-md mx-auto px-4 pb-2">
          <h2 className="text-lg font-bold text-bakery-dark mb-2">Our Fresh Products</h2>
          <ProductGrid 
            products={filteredProducts}
            isLoading={isLoading}
            onAddToCart={addToCart}
          />
        </div>
      </div>
      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0 z-50">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center space-y-1 px-2 py-2 text-bakery-primary"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Bakery</span>
            </Button>
            
            <Link href="/fastfood">
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-[#f24907]"
              >
                <ChefHat className="h-5 w-5" />
                <span className="text-xs font-medium">Fast Food</span>
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCartOpen(true)}
              className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-bakery-primary relative"
            >
              <CartIcon className="h-5 w-5" />
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
                  className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-bakery-primary"
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
                className="flex flex-col items-center space-y-1 px-2 py-2 text-gray-500 hover:text-bakery-primary"
              >
                <User className="h-5 w-5" />
                <span className="text-xs font-medium">Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Shopping Cart Modal */}
      <ShoppingCart
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
        onOrderComplete={() => {
          clearCart();
          setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
}