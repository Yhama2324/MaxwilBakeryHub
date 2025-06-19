import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wheat, ShieldX, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    securityCode: ""
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    securityCode: ""
  });

  // Redirect if already logged in
  if (user) {
    setLocation(user.role === "admin" ? "/admin" : "/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // For admin login, require security code
    if (loginForm.username === "admin" && !loginForm.securityCode) {
      toast({
        title: "Security Code Required",
        description: "Admin login requires a security code",
        variant: "destructive"
      });
      return;
    }

    // For admin login, validate security code format
    if (loginForm.username === "admin" && loginForm.securityCode !== "BAKERY123") {
      toast({
        title: "Invalid Security Code",
        description: "Please enter the correct security code",
        variant: "destructive"
      });
      return;
    }

    try {
      await loginMutation.mutateAsync({
        username: loginForm.username,
        password: loginForm.password
      });
      
      setLocation(loginForm.username === "admin" ? "/admin" : "/");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (registerForm.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({
        username: registerForm.username,
        password: registerForm.password,
        role: "customer",
        securityCode: registerForm.securityCode || undefined
      });
      
      toast({
        title: "Registration Successful!",
        description: "Welcome to MAXWIL' Bakery. You're now logged in and ready to shop.",
        variant: "default"
      });
      
      setLocation("/");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Wheat className="h-8 w-8 text-bakery-primary" />
              <span className="text-2xl font-bold text-bakery-dark">MAXWIL'</span>
            </div>
            <h1 className="text-2xl font-bold text-bakery-dark">Welcome to MAXWIL' Bakery</h1>
            <p className="text-gray-600 mt-2">Fresh baked goods delivered to your door</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Login</span>
                  </CardTitle>
                  <CardDescription>
                    Sign in to your account or use admin credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Enter your username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    {loginForm.username === "admin" && (
                      <div className="space-y-2">
                        <Label htmlFor="login-security-code" className="flex items-center space-x-1">
                          <Lock className="h-4 w-4" />
                          <span>Security Code</span>
                        </Label>
                        <Input
                          id="login-security-code"
                          type="text"
                          placeholder="Enter admin security code"
                          value={loginForm.securityCode}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, securityCode: e.target.value }))}
                        />
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full bg-bakery-primary hover:bg-bakery-secondary"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm">
                    <p className="font-medium text-amber-800">Admin Access:</p>
                    <p className="text-amber-600">Contact bakery owner for admin credentials</p>
                    <p className="text-amber-600">Security code required for admin registration</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShieldX className="h-5 w-5" />
                    <span>Register</span>
                  </CardTitle>
                  <CardDescription>
                    Create a new customer account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password">Confirm Password</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-bakery-primary hover:bg-bakery-secondary"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden md:flex flex-1 relative">
        <div 
          className="w-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')"
          }}
        >
          <div className="absolute inset-0 bg-bakery-dark bg-opacity-60"></div>
          <div className="relative z-10 flex items-center justify-center h-full text-center text-white p-8">
            <div>
              <h2 className="text-4xl font-bold mb-4">Fresh Baked Daily</h2>
              <p className="text-xl mb-6 opacity-90">
                Experience the finest traditional and modern baked goods, 
                made with love and delivered fresh to your doorstep.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <p className="font-semibold">📞 Call for Orders</p>
                  <p>Quick phone orders</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <p className="font-semibold">🚚 Home Delivery</p>
                  <p>Fresh to your door</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <p className="font-semibold">💰 Fair Prices</p>
                  <p>Quality & affordability</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-3">
                  <p className="font-semibold">⭐ Fresh Daily</p>
                  <p>Baked every morning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
