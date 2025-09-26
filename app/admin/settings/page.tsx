"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Save, Shield, Database, Key } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    institutionName: "AttendanceFlow University",
    institutionCode: "AFU",
    timezone: "UTC",
    dateFormat: "DD/MM/YYYY",
    
    // Security Settings
    qrSecret: "change-me-please-32chars-long-secret",
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });

  const handleSave = async (section: string) => {
    setIsLoading(true);
    // Mock save operation
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`${section} settings saved successfully!`);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground">
              Configure system-wide settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure basic institutional information and system preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="institutionName">Institution Name</Label>
                    <Input
                      id="institutionName"
                      value={settings.institutionName}
                      onChange={(e) => setSettings(prev => ({ ...prev, institutionName: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="institutionCode">Institution Code</Label>
                    <Input
                      id="institutionCode"
                      value={settings.institutionCode}
                      onChange={(e) => setSettings(prev => ({ ...prev, institutionCode: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                        <SelectItem value="CST">Central Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={settings.dateFormat} onValueChange={(value) => setSettings(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => handleSave("General")} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security policies, QR secrets, and session management.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="qrSecret">QR Code Secret Key</Label>
                    <Input
                      id="qrSecret"
                      type="password"
                      value={settings.qrSecret}
                      onChange={(e) => setSettings(prev => ({ ...prev, qrSecret: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for HMAC signing of QR codes. Change carefully as it will invalidate existing QR codes.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="480"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={() => handleSave("Security")} disabled={isLoading}>
                  <Shield className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
