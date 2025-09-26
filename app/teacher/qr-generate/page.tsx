"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function QRGeneratePage() {
  const [studentId, setStudentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQR = async () => {
    if (!studentId || !academicYearId || !semesterId) {
      toast.error("Please fill all fields");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, academicYearId, semesterId }),
      });

      if (response.ok) {
        const qrPayload = await response.json();
        const qrString = JSON.stringify(qrPayload);
        const qrDataUrl = await QRCode.toDataURL(qrString, {
          width: 300,
          margin: 2,
        });
        setQrCodeUrl(qrDataUrl);
        toast.success("QR Code generated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate QR code");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.download = `qr-${studentId}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate QR Codes</h1>
            <p className="text-muted-foreground">
              Create QR codes for student attendance
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Enter student details to generate QR code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID"
              />
            </div>
            
            <div>
              <Label htmlFor="academicYearId">Academic Year ID</Label>
              <Input
                id="academicYearId"
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                placeholder="Enter academic year ID"
              />
            </div>
            
            <div>
              <Label htmlFor="semesterId">Semester ID</Label>
              <Input
                id="semesterId"
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                placeholder="Enter semester ID"
              />
            </div>
            
            <Button 
              onClick={generateQR} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate QR Code"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated QR Code</CardTitle>
            <CardDescription>QR code for student attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCodeUrl ? (
              <div className="text-center space-y-4">
                <img 
                  src={qrCodeUrl} 
                  alt="Student QR Code" 
                  className="mx-auto border rounded-lg"
                />
                <Button onClick={downloadQR} className="w-full">
                  Download QR Code
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">QR code will appear here after generation</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
