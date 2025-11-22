"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import {
  createCourseCompletion,
  debugAuthState,
  getPersonalizedGreeting,
  getPublicData,
  getUserProfile,
  updateUserSettings,
} from "~/app/actions/example";

export default function TestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const addResult = (message: string) => {
    setResults((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev,
    ]);
  };

  const handleAction = async (name: string, action: () => Promise<unknown>) => {
    setLoading(name);
    try {
      const result = await action();
      addResult(`${name}: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addResult(
        `${name} ERROR: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Auth Actions Test Page</h1>

      {/* Debug Auth State */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Auth State</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            variant="destructive"
            disabled={loading === "debugAuthState"}
            onClick={() => handleAction("debugAuthState", debugAuthState)}
          >
            {loading === "debugAuthState" ? "Loading..." : "Check Auth State"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Public Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Public Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              disabled={loading === "getPublicData"}
              onClick={() => handleAction("getPublicData", getPublicData)}
            >
              {loading === "getPublicData" ? "Loading..." : "Get Public Data"}
            </Button>

            <Button
              className="w-full"
              variant="outline"
              disabled={loading === "getPersonalizedGreeting"}
              onClick={() =>
                handleAction("getPersonalizedGreeting", getPersonalizedGreeting)
              }
            >
              {loading === "getPersonalizedGreeting"
                ? "Loading..."
                : "Get Personalized Greeting"}
            </Button>
          </CardContent>
        </Card>

        {/* Protected Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Protected Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              disabled={loading === "getUserProfile"}
              onClick={() => handleAction("getUserProfile", getUserProfile)}
            >
              {loading === "getUserProfile" ? "Loading..." : "Get User Profile"}
            </Button>

            <Button
              className="w-full"
              disabled={loading === "updateUserSettings"}
              onClick={() =>
                handleAction("updateUserSettings", () =>
                  updateUserSettings({
                    notifications: true,
                    theme: "dark",
                  }),
                )
              }
            >
              {loading === "updateUserSettings"
                ? "Loading..."
                : "Update Settings"}
            </Button>

            <Button
              className="w-full"
              disabled={loading === "createCourseCompletion"}
              onClick={() =>
                handleAction("createCourseCompletion", () =>
                  createCourseCompletion({
                    courseId: "test-course-123",
                    score: 95,
                  }),
                )
              }
            >
              {loading === "createCourseCompletion"
                ? "Loading..."
                : "Create Course Completion"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Results</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResults([])}
            disabled={results.length === 0}
          >
            Clear
          </Button>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Click a button to test an action...
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((result, i) => (
                <pre
                  key={i}
                  className="bg-muted overflow-x-auto rounded p-3 text-xs"
                >
                  {result}
                </pre>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
