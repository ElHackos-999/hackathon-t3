"use client";

import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

interface CompletedCourse {
  id: string;
  courseName: string;
  courseCode: string;
  completionDate: Date;
  imageUri: string;
  tokenId: number;
}

interface CompletedCoursesGridProps {
  completions: CompletedCourse[];
  onGenerateProof: (completionId: string) => Promise<void>;
  isGenerating: string | null; // completionId being generated
}

export function CompletedCoursesGrid({
  completions,
  onGenerateProof,
  isGenerating,
}: CompletedCoursesGridProps) {
  if (completions.length === 0) {
    return (
      <div className="bg-muted/10 rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          You haven't completed any courses yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {completions.map((completion) => (
        <Card key={completion.id} className="overflow-hidden">
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={completion.imageUri}
              alt={completion.courseName}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardHeader>
            <CardTitle className="line-clamp-1">
              {completion.courseName}
            </CardTitle>
            <CardDescription>{completion.courseCode}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              <p>Completed: {completion.completionDate.toLocaleDateString()}</p>
              <p>Token ID: {completion.tokenId}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => onGenerateProof(completion.id)}
              disabled={!!isGenerating}
            >
              {isGenerating === completion.id
                ? "Generating..."
                : "Generate Proof"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
