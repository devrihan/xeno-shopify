import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { LoginPage } from "@/components/LoginPage";
import { StatCards } from "@/components/StatCards";
import { SalesTrendChart } from "@/components/SalesTrendChart";
import { CustomerSegmentsChart } from "@/components/CustomerSegmentsChart";
import { TopCustomers } from "@/components/TopCustomers";
import { AbandonedCheckouts } from "@/components/AbandonedCheckouts";
import { DashboardActions } from "@/components/DashboardActions";
import { BarChart3, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
  const [currentShop, setCurrentShop] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });
      if (res.data.success) {
        setIsLoggedIn(true);
        setCurrentShop(res.data.shop_domain);
        setLoginError("");
        toast.success(`Welcome! Loaded data for ${res.data.shop_domain}`);
      }
    } catch (err) {
      setLoginError("Invalid email or password");
      toast.error("Login failed. Check your credentials.");
    }
  };

  const fetchData = async () => {
    if (!currentShop) return;

    setLoading(true);

    const config = {
      headers: { "x-shop-domain": currentShop },
      params: { startDate, endDate },
    };

    try {
      const [statsRes, topRes, chartRes, checkoutsRes, advRes] =
        await Promise.all([
          axios.get("http://localhost:5000/api/stats", config),
          axios.get("http://localhost:5000/api/customers/top", config),
          axios.get("http://localhost:5000/api/orders/trend", config),
          axios.get("http://localhost:5000/api/checkouts/abandoned", config),
          axios.get("http://localhost:5000/api/stats/advanced", config),
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
      toast.error("Failed to fetch data. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && currentShop) {
      const timer = setTimeout(() => {
        fetchData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, currentShop, startDate, endDate]);

  const handleExport = () => {
    if (chartData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const headers = ["Date", "Orders", "Revenue"];

    const rows = chartData.map(
      (item) => `${item.date},${item.count},${item.revenue}`
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sales_report_${currentShop}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRecoverEmail = async (
    checkoutId: string | number,
    email: string
  ) => {
    try {
      await axios.post(
        "http://localhost:5000/api/checkouts/recover",
        { checkoutId, email },
        { headers: { "x-shop-domain": currentShop } }
      );

      toast.success(`Recovery email sent to ${email}`);
    } catch (error) {
      toast.error("Failed to send recovery email");
      console.error(error);
    }
  };

  const aov =
    stats.total_orders > 0
      ? (stats.total_revenue / stats.total_orders).toFixed(2)
      : "0";

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Xeno Store Insights</h1>
              <p className="text-sm text-muted-foreground">
                Analytics for:{" "}
                <span className="font-semibold text-primary">
                  {currentShop}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              title="Force Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentShop("");
                setChartData([]);
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <DashboardActions onExport={handleExport} />

        <StatCards stats={stats} aov={aov} lostRevenue={lostRevenue} />

        <div className="grid gap-6 lg:grid-cols-3">
          <SalesTrendChart
            data={chartData}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <CustomerSegmentsChart data={customerSegments} />
        </div>

        <TopCustomers customers={topCustomers} />
        <AbandonedCheckouts
          checkouts={checkouts}
          onRecover={handleRecoverEmail}
        />
      </main>
    </div>
  );
};

export default Index;
