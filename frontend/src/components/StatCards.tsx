import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';

interface Stats {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
}

interface StatCardsProps {
  stats: Stats;
  aov: string | number;
  lostRevenue: number;
}

export const StatCards = ({ stats, aov, lostRevenue }: StatCardsProps) => {
  const cards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.total_revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Average Order Value',
      value: `₹${aov}`,
      icon: TrendingUp,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Lost Revenue',
      value: `₹${lostRevenue.toLocaleString()}`,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Total Orders',
      value: stats.total_orders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
