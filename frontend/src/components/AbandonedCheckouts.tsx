import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Send, Check, Loader2 } from "lucide-react";

interface Checkout {
  id: string | number;
  created_at: string;
  customer_email: string | null;
  total_price: number;
  abandoned_url: string;
}

interface AbandonedCheckoutsProps {
  checkouts: Checkout[];
  onRecover: (checkoutId: string | number, email: string) => Promise<void>;
}

export const AbandonedCheckouts = ({
  checkouts,
  onRecover,
}: AbandonedCheckoutsProps) => {
  const [sendingId, setSendingId] = useState<string | number | null>(null);
  const [sentIds, setSentIds] = useState<Set<string | number>>(new Set());

  const handleClick = async (id: string | number, email: string | null) => {
    if (!email) return;

    setSendingId(id);
    await onRecover(id, email);
    setSendingId(null);
    setSentIds((prev) => new Set(prev).add(id));
  };

  if (checkouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Abandoned Checkouts
          </CardTitle>
          <CardDescription>
            Track and recover incomplete purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No abandoned carts found
            </p>
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
        <CardDescription>
          Track and recover incomplete purchases
        </CardDescription>
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
                    {new Date(checkout.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    {checkout.customer_email || (
                      <span className="text-muted-foreground italic">
                        Unknown
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    ₹{checkout.total_price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {sentIds.has(checkout.id) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 gap-2 cursor-default hover:bg-transparent hover:text-green-600"
                      >
                        <Check className="h-4 w-4" />
                        Sent
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                        disabled={
                          sendingId === checkout.id || !checkout.customer_email
                        }
                        onClick={() =>
                          handleClick(checkout.id, checkout.customer_email)
                        }
                      >
                        {sendingId === checkout.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Recover
                      </Button>
                    )}
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
