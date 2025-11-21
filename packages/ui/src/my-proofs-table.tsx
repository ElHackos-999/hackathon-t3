"use client";

import { Button } from "./button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface Proof {
  id: string;
  proofHash: string;
  courseName: string;
  createdAt: Date;
  expiresAt: Date | null;
  isRevoked: boolean;
  proofUrl: string;
}

interface MyProofsTableProps {
  proofs: Proof[];
  onRevoke: (proofId: string) => Promise<void>;
  isRevoking: string | null;
}

export function MyProofsTable({
  proofs,
  onRevoke,
  isRevoking,
}: MyProofsTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, we'd show a toast here
    alert("Copied to clipboard!");
  };

  if (proofs.length === 0) {
    return (
      <div className="bg-muted/10 rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          You haven't generated any proofs yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proofs.map((proof) => (
            <TableRow key={proof.id}>
              <TableCell className="font-medium">{proof.courseName}</TableCell>
              <TableCell>{proof.createdAt.toLocaleDateString()}</TableCell>
              <TableCell>
                {proof.isRevoked ? (
                  <span className="text-destructive">Revoked</span>
                ) : proof.expiresAt && proof.expiresAt < new Date() ? (
                  <span className="text-yellow-600">Expired</span>
                ) : (
                  <span className="text-green-600">Active</span>
                )}
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(proof.proofUrl)}
                  disabled={proof.isRevoked}
                >
                  Copy Link
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRevoke(proof.id)}
                  disabled={proof.isRevoked || !!isRevoking}
                >
                  {isRevoking === proof.id ? "Revoking..." : "Revoke"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
