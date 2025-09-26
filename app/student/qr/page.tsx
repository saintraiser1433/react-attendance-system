"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function StudentQRPage() {
  const { data: session } = useSession();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchStudentQR();
    }
  }, [session]);

  // Auto-refresh every 30 seconds to check for active academic period changes
  useEffect(() => {
    if (!session?.user) return;
    
    const interval = setInterval(() => {
      fetchStudentQR();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [session]);

  const fetchStudentQR = async () => {
    try {
      const response = await fetch('/api/student/qr');
      const data = await response.json();
      
      console.log('Student QR API Response:', data); // Debug log
      
      if (response.ok) {
        setStudentData(data);
        setQrCodeUrl(data.qrCodeImage);
      } else {
        toast.error(data.error || "Failed to load QR code");
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast.error("Failed to load QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.download = `my-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My QR Code</h1>
            <p className="text-muted-foreground">
              Your personal attendance QR code
            </p>
          </div>
        </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance QR Code</CardTitle>
          <CardDescription>
            Show this QR code to your teacher to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCodeUrl && studentData ? (
            <div className="space-y-4">
              {/* Student Information */}
              <div className="bg-muted/50 p-4 rounded-lg border">
                <h3 className="font-medium mb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Name:</span> {studentData.studentName}</div>
                  <div><span className="font-medium">ID:</span> {studentData.studentId}</div>
                  <div><span className="font-medium">Department:</span> {studentData.department}</div>
                  <div><span className="font-medium">Section:</span> {studentData.section || 'N/A'}</div>
                  <div><span className="font-medium">Year Level:</span> {studentData.yearLevel}</div>
                  <div><span className="font-medium">Period:</span> {studentData.academicYear} - {studentData.semester}</div>
                </div>
              </div>

              {/* Enrollment Status */}
              {studentData.hasEnrollments ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-green-800">✓ Enrolled Subjects ({studentData.enrolledSubjects.length})</h3>
                  <div className="space-y-1 text-sm text-green-700">
                    {studentData.enrolledSubjects.map((subject: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{subject.subjectCode}</span>
                        <span className="text-green-600">{subject.subjectName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-yellow-800">⚠️ No Current Enrollments</h3>
                  <p className="text-sm text-yellow-700">
                    You are not currently enrolled in any subjects for {studentData.academicYear} - {studentData.semester}.
                    Contact your teacher or administrator for enrollment assistance.
                  </p>
                </div>
              )}

              {/* QR Code */}
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-blue-800">Your Personal QR Code</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    This QR code contains your student information and can be used for attendance tracking.
                    {!studentData.hasEnrollments && " You can still use it once you're enrolled in subjects."}
                  </p>
                </div>
                
                <img 
                  src={qrCodeUrl} 
                  alt="My QR Code" 
                  className="mx-auto border rounded-lg shadow-sm"
                />
                <Button onClick={downloadQR} className="w-full">
                  Download QR Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Failed to load QR code. Please try refreshing the page.
              </p>
              <Button onClick={fetchStudentQR} variant="outline">
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Show your QR code to your teacher during class for attendance</li>
            <li>• Keep your QR code private - don't share with other students</li>
            <li>• Your QR code is always available, even if not enrolled in subjects yet</li>
            <li>• If you lose access to your QR code, contact your teacher</li>
            <li>• The QR code contains your student information and is unique to you</li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
