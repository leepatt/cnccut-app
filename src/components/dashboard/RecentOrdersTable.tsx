import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming Shadcn Table exists
import { Badge } from "@/components/ui/badge"; // Assuming Shadcn Badge exists

// Mock data - replace with actual data fetching later
const mockOrders = [
  {
    id: "ORD7381",
    date: "2024-07-20",
    status: "Processing",
    total: 145.50,
  },
  {
    id: "ORD6923",
    date: "2024-07-18",
    status: "Shipped",
    total: 89.99,
  },
  {
    id: "ORD6855",
    date: "2024-07-15",
    status: "Delivered",
    total: 312.00,
  },
  {
    id: "ORD6790",
    date: "2024-07-12",
    status: "Delivered",
    total: 55.75,
  },
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case 'processing':
      return 'secondary';
    case 'shipped':
      return 'default'; // Or another color like blue if available
    case 'delivered':
      return 'outline'; // Using outline for completed
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function RecentOrdersTable() {
  return (
    <Table>
      <TableCaption>A list of your recent orders.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Order ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mockOrders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{order.date}</TableCell>
            <TableCell>
                <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
            </TableCell>
            <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 