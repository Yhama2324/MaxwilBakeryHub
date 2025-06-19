import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@shared/schema";
import { Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductGrid({ products, isLoading, onAddToCart }: ProductGridProps) {
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    onAddToCart(product, 1);
    
    // Show success feedback
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  const formatPrice = (price: string | number) => {
    return `₱${parseFloat(price.toString()).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="flex">
              <Skeleton className="w-24 h-24" />
              <div className="flex-1 p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500">No products available in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="overflow-hidden hover:shadow-md transition-all duration-300 animate-fade-in hover-lift"
        >
          <div className="flex">
            <img
              src={product.imageUrl || "https://via.placeholder.com/96x96?text=No+Image"}
              alt={product.name}
              className="w-24 h-24 object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/96x96?text=No+Image";
              }}
            />
            <CardContent className="flex-1 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-bakery-dark mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-bakery-primary">
                    {formatPrice(product.price)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleAddToCart(product)}
                  disabled={addingToCart === product.id || !product.available}
                  className={`button-press hover-lift transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    addingToCart === product.id 
                      ? "bg-green-500 hover:bg-green-600 animate-scale-in" 
                      : "bg-bakery-primary hover:bg-bakery-secondary"
                  }`}
                >
                  {addingToCart === product.id ? (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Added!
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
              
              {!product.available && (
                <Badge variant="destructive" className="mt-2">
                  Out of Stock
                </Badge>
              )}
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}
