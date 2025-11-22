"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

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

interface Course {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  imageUrl: string;
  cost: number;
  avgCompletionMinutes: number;
  validityMonths: number;
  tags: string[];
  tokenId: number;
}

interface AdminCourseListProps {
  courses: Course[];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatValidity(months: number): string {
  if (months === 12) return "1 year";
  if (months === 24) return "2 years";
  if (months === 36) return "3 years";
  return `${months} months`;
}

function CourseCard({ course, index }: { course: Course; index: number }) {
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
        <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
          <div className="bg-muted relative aspect-video w-full overflow-hidden">
            <img
              src={course.imageUrl}
              alt={course.name}
              className="h-full w-full object-cover"
            />
          </div>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="mb-1 text-xl">{course.name}</CardTitle>
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
                    <p className="text-muted-foreground text-sm">
                      {course.description}
                    </p>
                    <div className="text-muted-foreground space-y-1 text-xs">
                      <div>
                        Duration: {formatDuration(course.avgCompletionMinutes)}
                      </div>
                      <div>Valid: {formatValidity(course.validityMonths)}</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {course.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
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
              View More
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
            <DialogTitle className="text-2xl">{course.name}</DialogTitle>
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
                src={course.imageUrl}
                alt={course.name}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              {course.description}
            </p>
            <div className="text-muted-foreground flex gap-4 text-sm">
              <span>
                Duration: {formatDuration(course.avgCompletionMinutes)}
              </span>
              <span>Valid: {formatValidity(course.validityMonths)}</span>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-wrap gap-1"
            >
              {course.tags.map((tag, tagIndex) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.3 + tagIndex * 0.05 }}
                >
                  <Badge variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminCourseList({ courses }: AdminCourseListProps) {
  if (courses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-12 text-center"
      >
        <h3 className="text-lg font-semibold">No courses available yet</h3>
        <p className="text-muted-foreground">
          Check back later for new certifications.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, index) => (
        <CourseCard key={course.id} course={course} index={index} />
      ))}
    </div>
  );
}

// Keep backward compatibility
export { AdminCourseList as PublicCourseList };
export type { AdminCourseListProps as PublicCourseListProps };
