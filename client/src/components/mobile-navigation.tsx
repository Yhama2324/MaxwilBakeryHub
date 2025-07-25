
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, UtensilsCrossed, User, ShoppingCart } from 'lucide-react';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useCapacitor } from '@/hooks/use-capacitor';

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { cart } = useCart();
  const { isNative } = useCapacitor();

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: UtensilsCrossed, label: 'Fast Food', path: '/fastfood' },
    { icon: User, label: 'Account', path: '/auth' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  if (!isNative) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {navigationItems.map((item) => (
          <Button
            key={item.path}
            variant={location === item.path ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleNavigate(item.path)}
            className="flex flex-col items-center gap-1 h-12 w-16"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-12 w-16 relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Cart</span>
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <div className="mt-6">
              {/* Cart content will be rendered here */}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
