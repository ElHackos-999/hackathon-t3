"use server";

import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { Course } from "@acme/db/schema";

export async function getCourses() {
  const courses = await db.select().from(Course).orderBy(Course.tokenId);

  return courses.map((course) => ({
    ...course,
    cost: parseFloat(course.cost),
  }));
}

export async function getCourseByCode(courseCode: string) {
  const courses = await db
    .select()
    .from(Course)
    .where(eq(Course.courseCode, courseCode))
    .limit(1);

  const course = courses[0];
  if (!course) return null;

  return {
    ...course,
    cost: parseFloat(course.cost),
  };
}

export async function getCourseByTokenId(tokenId: number) {
  const courses = await db
    .select()
    .from(Course)
    .where(eq(Course.tokenId, tokenId))
    .limit(1);

  const course = courses[0];
  if (!course) return null;

  return {
    ...course,
    cost: parseFloat(course.cost),
  };
}
