"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface VerificationResult {
  valid: boolean;
  reason?: string;
  userName?: string;
  courseName?: string;
  courseCode?: string;
  tokenId?: number;
  createdAt?: Date;
  expiresAt?: Date | null;
}

interface ProofVerificationCardProps {
  result: VerificationResult;
  isLoading: boolean;
}

export function ProofVerificationCard({ result, isLoading }: ProofVerificationCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 bg-muted rounded-full mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result.valid) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-2" />
          <CardTitle className="text-destructive">Invalid Proof</CardTitle>
          <CardDescription>
            This proof cannot be verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="font-medium">{result.reason || "Unknown error"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-green-500/50 bg-green-500/5">
      <CardHeader className="text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-2" />
        <CardTitle className="text-green-700">Verified Certificate</CardTitle>
        <CardDescription>
          This proof is valid and authentic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-center border-b pb-4">
          <p className="text-sm text-muted-foreground">Issued To</p>
          <p className="font-semibold text-lg">{result.userName}</p>
        </div>
        
        <div className="space-y-1 text-center border-b pb-4">
          <p className="text-sm text-muted-foreground">Course</p>
          <p className="font-semibold">{result.courseName}</p>
          <p className="text-xs font-mono text-muted-foreground">{result.courseCode}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Issued Date</p>
            <p className="font-medium text-sm">
              {result.createdAt?.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Token ID</p>
            <p className="font-medium text-sm font-mono">#{result.tokenId}</p>
          </div>
        </div>

        {result.expiresAt && (
          <div className="text-center pt-2">
             <p className="text-xs text-muted-foreground">Expires On</p>
             <p className="text-sm">{result.expiresAt.toLocaleDateString()}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground">
        Verified by Course Completion Platform
      </CardFooter>
    </Card>
  );
}
