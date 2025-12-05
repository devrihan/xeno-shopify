import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";

interface SegmentData {
  name: string;
  value: number;
}

interface CustomerSegmentsChartProps {
  data: SegmentData[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const textAnchor = x > cx ? "start" : "end";

  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={textAnchor}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      <tspan x={x} dy="-0.5em">
        {name}
      </tspan>
      <tspan x={x} dy="1.2em" className="fill-muted-foreground">
        {(percent * 100).toFixed(0)}%
      </tspan>
    </text>
  );
};

export const CustomerSegmentsChart = ({ data }: CustomerSegmentsChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Customer Segments
        </CardTitle>
        <CardDescription>Distribution by customer type</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              label={renderCustomizedLabel}
              labelLine={true}
              outerRadius={80}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
