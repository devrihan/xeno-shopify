import { useState, useEffect } from "react";
import axios from "axios"; // Import Axios
import { Button } from "@/components/ui/button";
import { LoginPage } from "@/components/LoginPage";
import { StatCards } from "@/components/StatCards";
import { SalesTrendChart } from "@/components/SalesTrendChart";
import { CustomerSegmentsChart } from "@/components/CustomerSegmentsChart";
import { TopCustomers } from "@/components/TopCustomers";
import { AbandonedCheckouts } from "@/components/AbandonedCheckouts";
import { BarChart3, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner"; // For nice notifications

// --- Interfaces (Matched to your Backend) ---
interface Stats {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
}

interface ChartDataItem {
  date: string;
  revenue: number;
  count: number;
}

interface Customer {
  name: string;
  total_spent: number;
}

interface Checkout {
  id: string | number;
  created_at: string;
  customer_email: string | null;
  total_price: number;
  abandoned_url: string;
}

interface SegmentData {
  name: string;
  value: number;
}

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Data States
  const [stats, setStats] = useState<Stats>({
    total_customers: 0,
    total_orders: 0,
    total_revenue: 0,
  });
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [customerSegments, setCustomerSegments] = useState<SegmentData[]>([]);
  const [lostRevenue, setLostRevenue] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 1. Handle Login via Backend API
  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });
      if (res.data.success) {
        setIsLoggedIn(true);
        setLoginError("");
        toast.success("Login successful!");
      }
    } catch (err) {
      setLoginError("Invalid email or password");
      toast.error("Login failed. Check your credentials.");
    }
  };

  // 2. Fetch Dashboard Data from Backend
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel requests for faster loading
      const [statsRes, topRes, chartRes, checkoutsRes, advRes] =
        await Promise.all([
          axios.get("http://localhost:5000/api/stats"),
          axios.get("http://localhost:5000/api/customers/top"),
          axios.get("http://localhost:5000/api/orders/trend"),
          axios.get("http://localhost:5000/api/checkouts/abandoned"),
          axios.get("http://localhost:5000/api/stats/advanced"),
        ]);

      setStats(statsRes.data);
      setTopCustomers(topRes.data);
      setChartData(chartRes.data);
      setCheckouts(checkoutsRes.data);
      setCustomerSegments(advRes.data.segments);
      setLostRevenue(advRes.data.lostRevenue);

      toast.success("Dashboard data updated");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data from backend");
    } finally {
      setLoading(false);
    }
  };

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // 3. Filter Logic (Frontend Side)
  const filteredChartData = chartData.filter((item) => {
    const itemDate = new Date(item.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;
    return true;
  });

  const aov =
    stats.total_orders > 0
      ? (stats.total_revenue / stats.total_orders).toFixed(2)
      : "0";

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Xeno Store Insights</h1>
              <p className="text-sm text-muted-foreground">
                Analytics Dashboard
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              title="Refresh Data"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsLoggedIn(false)}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <StatCards stats={stats} aov={aov} lostRevenue={lostRevenue} />

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SalesTrendChart
            data={filteredChartData}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <CustomerSegmentsChart data={customerSegments} />
        </div>

        {/* Top Customers */}
        <TopCustomers customers={topCustomers} />

        {/* Abandoned Checkouts */}
        <AbandonedCheckouts checkouts={checkouts} />
      </main>
    </div>
  );
};

export default Index;
