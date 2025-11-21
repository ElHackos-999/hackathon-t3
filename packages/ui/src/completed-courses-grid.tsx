"use client";

import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./card";

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
      <div className="text-center p-8 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">You haven't completed any courses yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {completions.map((completion) => (
        <Card key={completion.id} className="overflow-hidden">
          <div className="aspect-video w-full overflow-hidden relative">
            <img 
              src={completion.imageUri} 
              alt={completion.courseName}
              className="object-cover w-full h-full transition-transform hover:scale-105"
            />
          </div>
          <CardHeader>
            <CardTitle className="line-clamp-1">{completion.courseName}</CardTitle>
            <CardDescription>{completion.courseCode}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
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
              {isGenerating === completion.id ? "Generating..." : "Generate Proof"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
