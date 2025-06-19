import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Product } from "@shared/schema";
import ProductGrid from "@/components/product-grid";
import ShoppingCart from "@/components/shopping-cart";
import CheckoutModal from "@/components/checkout-modal";
import { ShoppingCart as CartIcon, ShieldX, Wheat, MapPin, Phone } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateCartQuantity = (productId: number, change: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wheat className="h-8 w-8 text-bakery-primary" />
              <span className="text-xl font-bold text-bakery-dark">MAXWIL'</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 button-press hover-lift"
                onClick={() => setIsCartOpen(true)}
              >
                <CartIcon className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600 animate-scale-in">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => user?.role === "admin" ? setLocation("/admin") : setLocation("/auth")}
              >
                <ShieldX className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')"
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">MAXWIL' Bakery</h1>
            <p className="text-lg opacity-90">Fresh Baked Daily with Love</p>
            <div className="mt-4">
              <Badge className="bg-green-500 text-white">
                🕕 Open 6AM - 8PM
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`p-4 h-auto flex-col space-y-2 transition-all duration-200 transform hover:scale-105 button-press hover-lift ${
                selectedCategory === category.id 
                  ? "bg-bakery-primary hover:bg-bakery-secondary border-bakery-primary animate-scale-in" 
                  : "border-2 hover:border-bakery-primary"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-md mx-auto px-4 pb-4">
        <h2 className="text-xl font-bold text-bakery-dark mb-4">Our Fresh Products</h2>
        <ProductGrid 
          products={filteredProducts}
          isLoading={isLoading}
          onAddToCart={addToCart}
        />
      </div>

      {/* Footer */}
      <footer className="bg-bakery-dark text-white mt-12">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Wheat className="h-8 w-8 text-bakery-primary" />
              <span className="text-2xl font-bold">MAXWIL'</span>
            </div>
            <p className="text-gray-300 text-sm">
              Fresh baked goods delivered with love since 2024
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-center text-sm">
            <div>
              <h4 className="font-semibold text-bakery-primary mb-2">Contact Us</h4>
              <div className="space-y-1 text-gray-300">
                <p className="flex items-center justify-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+63 XXX XXX XXXX</span>
                </p>
                <p className="flex items-center justify-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Your Neighborhood Bakery</span>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-bakery-primary mb-2">Operating Hours</h4>
              <div className="space-y-1 text-gray-300 text-xs">
                <p>Monday - Saturday: 6:00 AM - 8:00 PM</p>
                <p>Sunday: 7:00 AM - 6:00 PM</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-bakery-primary mb-2">Payment Methods</h4>
              <div className="flex justify-center space-x-4 text-gray-300">
                <span>💵 Cash</span>
                <span>📱 GCash</span>
                <span>🏦 Bank</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 mt-6 pt-4 text-center text-xs text-gray-400">
            <p>&copy; 2024 MAXWIL' Bakery. All rights reserved.</p>
            <p className="mt-1">Made with ❤️ for fresh bread lovers</p>
          </div>
        </div>
      </footer>

      {/* Contact FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-lg animate-float button-press hover-lift"
          onClick={() => window.open("https://wa.me/63", "_blank")}
        >
          <Phone className="h-6 w-6" />
        </Button>
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
          setCartItems([]);
          setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
}
