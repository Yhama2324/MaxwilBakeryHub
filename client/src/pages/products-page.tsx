import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import ProductModal from "@/components/product-modal";
import { Link } from "wouter";
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  ChefHat,
  Home,
  ArrowLeft
} from "lucide-react";

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");
  const [defaultCategory, setDefaultCategory] = useState<string>("bread");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setDefaultCategory("bread");
    setIsProductModalOpen(true);
  };

  const handleAddFastFood = () => {
    setSelectedProduct(null);
    setDefaultCategory("fastfood");
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(numPrice);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden scrollbar-hide">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="font-bold text-bakery-dark text-lg">Product Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Welcome, {user?.username}</span>
              <Link href="/">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-bakery-primary" />
                <CardTitle>Products ({products.length})</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleAddProduct}
                  className="bg-bakery-primary hover:bg-bakery-secondary text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
                <Button 
                  onClick={handleAddFastFood}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  Add Fast Food
                </Button>
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center flex-wrap gap-2 mt-4">
              <span className="text-xs font-semibold text-gray-800">Filter:</span>
              <Button 
                variant={productCategoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setProductCategoryFilter("all")}
                className="h-6 px-2 text-xs font-semibold"
              >
                All ({products.length})
              </Button>
              <Button 
                variant={productCategoryFilter === "bakery" ? "default" : "outline"}
                size="sm"
                onClick={() => setProductCategoryFilter("bakery")}
                className="h-6 px-2 text-xs font-semibold text-bakery-secondary border-bakery-secondary hover:bg-bakery-cream hover:text-bakery-dark"
              >
                Bakery ({products.filter(p => ["bread", "pastries", "cakes", "cookies"].includes(p.category)).length})
              </Button>
              <Button 
                variant={productCategoryFilter === "fastfood" ? "default" : "outline"}
                size="sm"
                onClick={() => setProductCategoryFilter("fastfood")}
                className="h-6 px-2 text-xs font-semibold text-orange-700 border-orange-700 hover:bg-orange-100 hover:text-orange-800"
              >
                Fast Food ({products.filter(p => p.category === "fastfood").length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No products found</div>
            ) : products.filter(product => {
              if (productCategoryFilter === "all") return true;
              if (productCategoryFilter === "bakery") {
                return ["bread", "pastries", "cakes", "cookies"].includes(product.category);
              }
              return product.category === productCategoryFilter;
            }).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {productCategoryFilter === "bakery" ? "bakery" : productCategoryFilter === "fastfood" ? "fast food" : ""} products found
              </div>
            ) : (
              <div className="space-y-2">
                {products
                  .filter(product => {
                    if (productCategoryFilter === "all") return true;
                    if (productCategoryFilter === "bakery") {
                      return ["bread", "pastries", "cakes", "cookies"].includes(product.category);
                    }
                    return product.category === productCategoryFilter;
                  })
                  .map((product) => (
                  <div key={product.id} className="rounded-lg p-3 bg-[#f0eee6f2] mt-[16px] mb-[16px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <img
                          src={product.imageUrl || "https://via.placeholder.com/60"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-sm text-bakery-dark truncate">{product.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-1 py-0 flex-shrink-0 ${product.category === "fastfood" 
                                ? "border-orange-500 text-orange-700 bg-orange-50" 
                                : "border-bakery-primary text-bakery-primary bg-bakery-cream/30"
                              }`}
                            >
                              {product.category === "fastfood" ? (
                                <><ChefHat className="h-2 w-2 mr-1" />FF</>
                              ) : (
                                <><Package className="h-2 w-2 mr-1" />B</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-1">{product.description}</p>
                          <span className="text-sm font-bold text-bakery-primary">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-7 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deleteProductMutation.isPending}
                          className="h-7 w-8 p-0 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        defaultCategory={defaultCategory}
        onSave={() => {
          setIsProductModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        }}
      />
    </div>
  );
}