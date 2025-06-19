import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, ChefHat, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ShoppingCart as ShoppingCartModal from "@/components/shopping-cart";
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MAXWIL' Fast Food</h1>
                <p className="text-sm text-gray-600">Daily Cooked Meals & Filipino Favorites</p>
              </div>
            </div>

            <Button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-orange-600 hover:bg-orange-700"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-5 rounded-full text-xs flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Fresh Daily Cooked Meals</h2>
          <p className="text-xl mb-6">Authentic Filipino dishes prepared with love every day</p>
          <div className="flex items-center justify-center space-x-6 text-orange-100">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Fresh Daily</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Authentic Taste</span>
            </div>
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5" />
              <span>Home-Style Cooking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Today's Menu</h3>
          <p className="text-gray-600">Delicious Filipino meals cooked fresh daily</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-4" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : fastfoodProducts.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Fast Food Items Available</h3>
            <p className="text-gray-500">Check back later for today's fresh meals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fastfoodProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  <img
                    src={product.imageUrl || '/placeholder-food.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge 
                    className={`absolute top-2 right-2 ${
                      product.available 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {product.available ? 'Available' : 'Sold Out'}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">{product.name}</h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatPrice(product.price)}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(product)}
                        disabled={!product.available}
                        className="border-orange-600 text-orange-600 hover:bg-orange-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Daily Specials Banner */}
      <div className="bg-orange-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-bold text-orange-800 mb-2">Daily Specials</h3>
          <p className="text-orange-700">Fresh meals cooked every morning • Available while supplies last</p>
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