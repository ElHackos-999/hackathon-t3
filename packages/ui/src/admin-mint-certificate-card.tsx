"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";

interface User {
  id: string;
  email: string;
  name: string;
}

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
}

interface AdminMintCertificateCardProps {
  users: User[];
  courses: Course[];
  onMint: (userEmail: string, courseCode: string) => Promise<void>;
  isLoading: boolean;
}

export function AdminMintCertificateCard({
  users,
  courses,
  onMint,
  isLoading,
}: AdminMintCertificateCardProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const handleMint = async () => {
    if (!selectedUser || !selectedCourse) return;
    await onMint(selectedUser, selectedCourse);
    setSelectedUser("");
    setSelectedCourse("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mint Course Certificate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select User</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.email}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Select Course</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.courseCode}>
                  {c.courseName} ({c.courseCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleMint} 
          disabled={isLoading || !selectedUser || !selectedCourse}
          className="w-full"
        >
          {isLoading ? "Minting..." : "Mint Certificate"}
        </Button>
      </CardContent>
    </Card>
  );
}
