"use client";

import { ReactNode } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface CourseFormCardProps {
  initialCourse?: {
    id?: string;
    courseCode: string;
    courseName: string;
    description?: string;
    imageUri: string;
    defaultExpiryDays: number;
    tokenId: number;
    contractAddress: string;
  };
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
}

export function CourseFormCard({
  initialCourse,
  onSubmit,
  isSubmitting,
  submitLabel = "Create Course",
}: CourseFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialCourse ? "Edit Course" : "Create New Course"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await onSubmit(Object.fromEntries(formData));
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="courseCode">Course Code *</Label>
            <Input
              id="courseCode"
              name="courseCode"
              defaultValue={initialCourse?.courseCode}
              required
              placeholder="BC101"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name *</Label>
            <Input
              id="courseName"
              name="courseName"
              defaultValue={initialCourse?.courseName}
              required
              placeholder="Introduction to Blockchain"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialCourse?.description}
              placeholder="Brief description of the course..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUri">NFT Image URL *</Label>
            <Input
              id="imageUri"
              name="imageUri"
              type="url"
              defaultValue={initialCourse?.imageUri}
              required
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultExpiryDays">Default Expiry (days) *</Label>
            <Input
              id="defaultExpiryDays"
              name="defaultExpiryDays"
              type="number"
              defaultValue={initialCourse?.defaultExpiryDays ?? 0}
              min="0"
              required
            />
            <p className="text-xs text-muted-foreground">0 = no expiry</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tokenId">ERC-1155 Token ID *</Label>
            <Input
              id="tokenId"
              name="tokenId"
              type="number"
              defaultValue={initialCourse?.tokenId}
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractAddress">Contract Address *</Label>
            <Input
              id="contractAddress"
              name="contractAddress"
              defaultValue={initialCourse?.contractAddress}
              required
              placeholder="0x..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
            <Button type="button" variant="outline">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
