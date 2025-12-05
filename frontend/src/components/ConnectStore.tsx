import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Store, Key, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const ConnectStore = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    shop_domain: "",
    access_token: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    try {
      await axios.post(`${API_URL}/api/register`, formData);
      toast.success("Store connected! Please login.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to connect store");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Connect Your Shopify Store
          </CardTitle>
          <CardDescription>
            Enter your store details to start analyzing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email (For Login)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="border-t my-4"></div>

            <div className="space-y-2">
              <Label htmlFor="shop_domain">Shopify Domain</Label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="shop_domain"
                  placeholder="example.myshopify.com"
                  className="pl-10"
                  required
                  onChange={handleChange}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Ex: my-store.myshopify.com (No https://)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Admin API Access Token</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="access_token"
                  type="password"
                  placeholder="shpat_..."
                  className="pl-10"
                  required
                  onChange={handleChange}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Found in Shopify Admin {">"} Apps {">"} App development
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connecting..." : "Connect Store"}
            </Button>

            <div className="text-center mt-4">
              <a href="/" className="text-sm text-primary hover:underline">
                Already connected? Back to Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
