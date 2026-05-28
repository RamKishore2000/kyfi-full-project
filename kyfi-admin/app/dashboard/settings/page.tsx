"use client";

import { useTheme } from "next-themes";
import { Globe2, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/navigation/page-header";

export default function SettingsPage() {
  const { setTheme } = useTheme();

  return (
    <>
      <PageHeader title="Settings" description="Manage admin panel theme and language preferences." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Moon className="h-5 w-5" />Theme settings</CardTitle>
            <CardDescription>Choose how the admin panel appears.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setTheme("light")}>Light</Button>
            <Button variant="outline" onClick={() => setTheme("dark")}>Dark</Button>
            <Button variant="outline" onClick={() => setTheme("system")}>System</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5" />Language settings</CardTitle>
            <CardDescription>Frontend-only language selector.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select defaultValue="English">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Telugu</SelectItem>
                <SelectItem value="Marathi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
