"use client";

import { FormEvent, useState } from "react";
import { Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/navigation/page-header";

export default function ProfilePage() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "KYFI Admin",
    email: "admin@kyfi.in",
    title: "Operations Lead",
    region: "Andhra Pradesh & Telangana",
    role: "Super Admin",
  });

  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setProfile({
      name: String(formData.get("name") ?? profile.name),
      email: String(formData.get("email") ?? profile.email),
      title: String(formData.get("title") ?? profile.title),
      region: String(formData.get("region") ?? profile.region),
      role: String(formData.get("role") ?? profile.role),
    });
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Admin account overview and operational permissions."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Edit profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Update admin account details shown in this panel.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={updateProfile}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    Name
                    <Input name="name" defaultValue={profile.name} />
                  </label>
                  <label className="space-y-2 text-sm">
                    Email
                    <Input name="email" type="email" defaultValue={profile.email} />
                  </label>
                  <label className="space-y-2 text-sm">
                    Title
                    <Input name="title" defaultValue={profile.title} />
                  </label>
                  <label className="space-y-2 text-sm">
                    Region
                    <Input name="region" defaultValue={profile.region} />
                  </label>
                  <label className="space-y-2 text-sm">
                    Role
                    <Input name="role" defaultValue={profile.role} />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="h-full">
          <CardContent className="flex h-full min-h-80 flex-col items-center justify-center p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white">
              <UserRound className="h-9 w-9" />
            </div>
            <h2 className="text-xl font-medium">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{profile.title}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Account details</CardTitle><CardDescription>Role, region, and operational permissions.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Info icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <Info icon={<MapPin className="h-4 w-4" />} label="Region" value={profile.region} />
            <Info icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={profile.role} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-muted">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-normal">{value}</p>
    </div>
  );
}
