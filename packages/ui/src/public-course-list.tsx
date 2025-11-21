"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./card";
import { Button } from "./button";

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
      <div className="text-center p-12">
        <h3 className="text-lg font-semibold">No courses available yet</h3>
        <p className="text-muted-foreground">Check back later for new certifications.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
          <div className="aspect-video w-full overflow-hidden relative bg-muted">
            <img 
              src={course.imageUri} 
              alt={course.courseName}
              className="object-cover w-full h-full"
            />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl mb-1">{course.courseName}</CardTitle>
                <CardDescription className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                  {course.courseCode}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {course.description || "No description available."}
            </p>
          </CardContent>
          <CardFooter className="border-t pt-4 bg-muted/5">
            <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
              <span className="font-mono truncate max-w-[150px]" title={course.contractAddress}>
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
