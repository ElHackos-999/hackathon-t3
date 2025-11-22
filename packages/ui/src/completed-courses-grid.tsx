"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface CompletedCourse {
  id: string;
  courseName: string;
  courseCode: string;
  completionDate: Date;
  imageUri: string;
  tokenId: number;
  expiryDate?: Date;
  isValid?: boolean;
}

interface CompletedCoursesGridProps {
  completions: CompletedCourse[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function CourseCard({
  course,
  index,
}: {
  course: CompletedCourse;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          ease: "easeOut",
        }}
      >
        <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={course.imageUri}
              alt={course.courseName}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
            {course.isValid === false && (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              </div>
            )}
            {course.isValid === true && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="bg-green-600 text-xs">
                  Valid
                </Badge>
              </div>
            )}
          </div>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-1 line-clamp-1 text-xl">
                  {course.courseName}
                </CardTitle>
                <CardDescription className="bg-muted inline-block rounded px-2 py-1 font-mono text-xs">
                  {course.courseCode}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile expanded content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden md:hidden"
                >
                  <div className="space-y-3 border-t p-3">
                    <div className="text-muted-foreground space-y-1 text-xs">
                      <div>Completed: {formatDate(course.completionDate)}</div>
                      {course.expiryDate && (
                        <div>Expires: {formatDate(course.expiryDate)}</div>
                      )}
                      <div>Token ID: {course.tokenId}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="bg-muted/5 border-t pt-4">
            {/* Desktop: Open modal */}
            <Button
              className="hidden w-full md:flex"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
            >
              View Details
            </Button>

            {/* Mobile: Expand/collapse */}
            <Button
              className="flex w-full md:hidden"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  View Less
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </motion.div>
                </>
              ) : (
                <>
                  View More
                  <motion.div
                    initial={{ rotate: 180 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </motion.div>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Desktop modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{course.courseName}</DialogTitle>
            <DialogDescription className="bg-muted inline-block w-fit rounded px-2 py-1 font-mono text-xs">
              {course.courseCode}
            </DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={course.imageUri}
                alt={course.courseName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <span>Completed: {formatDate(course.completionDate)}</span>
              {course.expiryDate && (
                <span>Expires: {formatDate(course.expiryDate)}</span>
              )}
              <span>Token ID: {course.tokenId}</span>
            </div>
            {course.isValid !== undefined && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Badge
                  variant={course.isValid ? "default" : "destructive"}
                  className={course.isValid ? "bg-green-600" : ""}
                >
                  {course.isValid ? "Certificate Valid" : "Certificate Expired"}
                </Badge>
              </motion.div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CompletedCoursesGrid({
  completions,
}: CompletedCoursesGridProps) {
  if (completions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-muted/10 flex min-h-96 flex-col items-center justify-center space-y-4 rounded-lg border p-12 text-center"
      >
        <h3 className="text-lg font-semibold">No completed courses yet</h3>
        <p className="text-muted-foreground">
          Complete a course to see your certificates here.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {completions.map((completion, index) => (
        <CourseCard key={completion.id} course={completion} index={index} />
      ))}
    </div>
  );
}
