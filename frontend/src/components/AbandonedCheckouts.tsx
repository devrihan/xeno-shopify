import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface Checkout {
  id: string | number;
  created_at: string;
  customer_email: string | null;
  total_price: number;
  abandoned_url: string;
}

interface AbandonedCheckoutsProps {
  checkouts: Checkout[];
}

export const AbandonedCheckouts = ({ checkouts }: AbandonedCheckoutsProps) => {
  if (checkouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Abandoned Checkouts
          </CardTitle>
          <CardDescription>Track and recover incomplete purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No abandoned carts found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Abandoned Checkouts
        </CardTitle>
        <CardDescription>Track and recover incomplete purchases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkouts.map((checkout) => (
                <TableRow key={checkout.id}>
                  <TableCell className="font-medium">
                    {new Date(checkout.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>{checkout.customer_email || 'Unknown'}</TableCell>
                  <TableCell>₹{checkout.total_price.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="gap-2"
                    >
                      <a href={checkout.abandoned_url} target="_blank" rel="noreferrer">
                        Recover
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
