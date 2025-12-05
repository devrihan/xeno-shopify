import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal } from 'lucide-react';

interface Customer {
  name: string;
  total_spent: number;
}

interface TopCustomersProps {
  customers: Customer[];
}

export const TopCustomers = ({ customers }: TopCustomersProps) => {
  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top Spenders
        </CardTitle>
        <CardDescription>Your most valuable customers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((customer, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="mb-2">{getIcon(index)}</div>
              <h4 className="font-semibold text-sm text-center mb-1">{customer.name}</h4>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                ₹{customer.total_spent.toLocaleString()}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
