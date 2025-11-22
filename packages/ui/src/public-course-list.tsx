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

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  description: string | null;
  imageUri: string;
  contractAddress: string;
}

interface PublicCourseListProps {
  courses: Course[];
}

export function PublicCourseList({ courses }: PublicCourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-semibold">No courses available yet</h3>
        <p className="text-muted-foreground">
          Check back later for new certifications.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card
          key={course.id}
          className="flex h-full flex-col transition-shadow hover:shadow-lg"
        >
          <div className="bg-muted relative aspect-video w-full overflow-hidden">
            <img
              src={course.imageUri}
              alt={course.courseName}
              className="h-full w-full object-cover"
            />
          </div>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="mb-1 text-xl">
                  {course.courseName}
                </CardTitle>
                <CardDescription className="bg-muted inline-block rounded px-2 py-1 font-mono text-xs">
                  {course.courseCode}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground line-clamp-3 text-sm">
              {course.description || "No description available."}
            </p>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t pt-4">
            <div className="text-muted-foreground flex w-full items-center justify-between text-xs">
              <span
                className="max-w-[150px] truncate font-mono"
                title={course.contractAddress}
              >
                {course.contractAddress}
              </span>
              <Button variant="secondary" size="sm" asChild>
                <a href={`/courses/${course.courseCode}`}>View Details</a>
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
