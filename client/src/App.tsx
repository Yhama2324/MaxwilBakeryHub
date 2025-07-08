import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import HomePage from "@/pages/home";
import FastFoodPage from "@/pages/fastfood";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import ProductsPage from "@/pages/products-page";
import ActiveOrdersPage from "@/pages/active-orders-page";
import TotalOrdersPage from "@/pages/total-orders-page";
import RevenuePage from "@/pages/revenue-page";
import AnalyticsPage from "@/pages/analytics-page";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/fastfood" component={FastFoodPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly={true} />
      <ProtectedRoute path="/admin/products" component={ProductsPage} adminOnly={true} />
      <ProtectedRoute path="/admin/active-orders" component={ActiveOrdersPage} adminOnly={true} />
      <ProtectedRoute path="/admin/total-orders" component={TotalOrdersPage} adminOnly={true} />
      <ProtectedRoute path="/admin/revenue" component={RevenuePage} adminOnly={true} />
      <ProtectedRoute path="/admin/analytics" component={AnalyticsPage} adminOnly={true} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
