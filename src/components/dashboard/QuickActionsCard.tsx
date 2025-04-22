import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Assuming Shadcn Card exists
import { Button } from "@/components/ui/button"; // Assuming Shadcn Button exists
import Link from 'next/link'; // Use Next.js Link for navigation

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Start a new task or view history.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col space-y-3">
        <Button asChild>
          <Link href="/configure">Start New Part Configuration</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/library">Browse Parametric Library</Link>
        </Button> { /* Assuming /library route */}
        <Button variant="outline" asChild>
           <Link href="/orders">View Full Order History</Link>
        </Button> { /* Assuming /orders route */}
      </CardContent>
    </Card>
  );
} 