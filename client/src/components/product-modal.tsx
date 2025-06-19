import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { Save, Upload, X } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  defaultCategory?: string;
  onSave: () => void;
}

export default function ProductModal({
  isOpen,
  onClose,
  product,
  defaultCategory = "bread",
  onSave
}: ProductModalProps) {
  const { toast } = useToast();
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "bread",
    imageUrl: "",
    available: true
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || "",
        available: product.available
      });
      setSelectedFile(null);
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category: defaultCategory,
        imageUrl: "",
        available: true
      });
      setSelectedFile(null);
    }
  }, [product, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit && (!product || !product.id)) {
        throw new Error("Product ID is missing for update operation");
      }
      const endpoint = isEdit ? `/api/products/${product?.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      console.log(`${method} request to:`, endpoint, "with data:", data);
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Product ${isEdit ? "updated" : "created"} successfully`,
      });
      onSave();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEdit ? "update" : "create"} product`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Product description is required",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive"
      });
      return;
    }

    // Sanitize and prepare data
    const sanitizedData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: price.toFixed(2),
      category: formData.category,
      imageUrl: formData.imageUrl.trim() || null,
      available: formData.available
    };

    saveMutation.mutate(sanitizedData);
  };

  const handleFileUpload = (file: File) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setFormData(prev => ({ ...prev, imageUrl: previewUrl }));
  };

  const categories = [
    { value: "bread", label: "Bread" },
    { value: "pastries", label: "Pastries" },
    { value: "cakes", label: "Cakes" },
    { value: "cookies", label: "Cookies" },
    { value: "beverages", label: "Beverages" },
    { value: "meal", label: "Meal" },
    { value: "fastfood", label: "Fast Food" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>{isEdit ? "Edit Product" : "Add New Product"}</span>
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update product information" : "Create a new product for your bakery"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product-name">Product Name *</Label>
            <Input
              id="product-name"
              type="text"
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              maxLength={100}
              required
            />
          </div>

          <div>
            <Label htmlFor="product-description">Description *</Label>
            <Textarea
              id="product-description"
              placeholder="Enter product description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div>
            <Label htmlFor="product-price">Price (₱) *</Label>
            <Input
              id="product-price"
              type="number"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="product-category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product-image" className="flex items-center space-x-1">
              <Upload className="h-4 w-4" />
              <span>Product Image</span>
            </Label>
            <div className="mt-2">
              <Input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Browse your computer to select an image (JPG, PNG, GIF, etc.)
              </p>
            </div>
            {(formData.imageUrl || selectedFile) && (
              <div className="mt-2">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = "block";
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Image preview</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="product-available" className="text-sm font-medium">
              Available for sale
            </Label>
            <Switch
              id="product-available"
              checked={formData.available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-bakery-primary hover:bg-bakery-secondary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Update Product" : "Create Product"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
