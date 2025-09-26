"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "sonner";
import { Clock, Calendar, MapPin, Users, ArrowLeft, History, Filter, Camera, Upload, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import QrScanner from 'qr-scanner';

interface ScheduleData {
  id: string;
  subjectCode: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
  dayName: string;
  department?: string;
  year?: string;
  section?: string;
  academicYear?: string;
  academicYearId?: string;
  semester?: string;
  semesterId?: string;
  // Override information
  hasOverride?: boolean;
  overrideType?: string | null;
  overrideReason?: string | null;
  overrideAdminNotes?: string | null;
  originalStartTime?: string;
  originalEndTime?: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  timeIn: string;
  timeOut?: string;
  isLate: boolean;
  lateMinutes: number;
  status: 'present' | 'late' | 'absent';
}

interface AttendanceHistory {
  id: string;
  studentId: string;
  studentName: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  status: string;
  isLate: boolean;
  lateMinutes: number;
}

export default function AttendanceScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [scannedData, setScannedData] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Function to refresh current date and clear attendance records
  const refreshCurrentDate = () => {
    const newDate = new Date();
    setCurrentDate(newDate);
    // Clear attendance records when date changes
    setAttendanceRecords([]);
    toast.info(`Date refreshed to ${newDate.toLocaleDateString()}`);
  };
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<QrScanner.Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<QrScanner.Camera | null>(null);
  const [qrDetected, setQrDetected] = useState(false);
  const [scanningDisabled, setScanningDisabled] = useState(false);
  const [disableCountdown, setDisableCountdown] = useState(0);
  const [isTodaySchedule, setIsTodaySchedule] = useState(true);

  // Function to check if today matches the schedule day
  const checkScheduleDay = (scheduleData: any) => {
    if (!scheduleData || scheduleData.dayOfWeek === undefined) return true;
    
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const scheduleDay = parseInt(scheduleData.dayOfWeek);
    
    return today === scheduleDay;
  };

  // Load schedule data from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scheduleParam = urlParams.get('schedule');
    
    if (scheduleParam) {
      try {
        const data = JSON.parse(decodeURIComponent(scheduleParam));
        setScheduleData(data);
        setIsTodaySchedule(checkScheduleDay(data));
        console.log("Schedule data loaded:", data);
        console.log("Is today's schedule:", checkScheduleDay(data));
      } catch (error) {
        console.error("Error parsing schedule data:", error);
        toast.error("Invalid schedule data");
      }
    }
  }, []);


  // Initialize camera detection
  useEffect(() => {
    const initializeCameras = async () => {
      try {
        // Get available cameras using native browser API
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log("Available video devices:", videoDevices);
        
        // Convert to camera objects for compatibility
        const cameras = videoDevices.map((device, index) => ({
          id: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
          kind: device.kind
        }));
        
        setAvailableCameras(cameras);
        
        if (cameras.length > 0) {
          // Prefer back camera for mobile devices
          const backCamera = cameras.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
          );
          const defaultCamera = backCamera || cameras[0];
          setSelectedCamera(defaultCamera);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
        toast.error("Could not access camera");
      }
    };

    initializeCameras();
  }, []);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) {
      toast.error("Video element not ready");
      return;
    }

    try {
      console.log("Starting QR scanner...");
      setScanStatus('scanning');
      setScanMessage("Initializing camera...");

      // Stop any existing scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      // Create new QR scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          // Check if scanning is disabled
          if (scanningDisabled) {
            console.log("Scanning disabled, ignoring QR code");
            return;
          }
          
          console.log("QR Code detected:", result.data);
          
          try {
            const qrData = JSON.parse(result.data);
            setScannedData(qrData);
            setScanStatus('success');
            setScanMessage("QR Code detected!");
            setQrDetected(true);
            
            // Disable scanning for 5 seconds
            setScanningDisabled(true);
            setDisableCountdown(5);
            
            setTimeout(() => {
              submitAttendance(qrData);
              setQrDetected(false);
            }, 500);
            
          } catch (error) {
            console.error("Error parsing QR data:", error);
            setScanStatus('error');
            setScanMessage("Invalid QR code format");
            setTimeout(() => {
              setScanStatus('scanning');
              setScanMessage("Scanning for QR codes...");
              setQrDetected(false);
            }, 2000);
          }
        },
        {
          highlightScanRegion: false,
          highlightCodeOutline: false,
          maxScansPerSecond: 3,
          preferredCamera: selectedCamera?.id || 'environment'
        }
      );
      
      setIsScanning(true);
      setScanStatus('scanning');
      setScanMessage("Scanning for QR codes...");
      
      // Start scanning
      await qrScannerRef.current.start();
      toast.success("QR scanner started - Point QR code at camera");

    } catch (error) {
      console.error("Error starting QR scanner:", error);
      setScanStatus('error');
      setScanMessage("Failed to start scanner");
      toast.error("Failed to start scanner: " + (error as Error).message);
    }
  }, [selectedCamera, scanningDisabled]);

  // Countdown timer for disabling scanning
  useEffect(() => {
    if (scanningDisabled && disableCountdown > 0) {
      const timer = setTimeout(() => {
        setDisableCountdown(prev => {
          if (prev <= 1) {
            setScanningDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [scanningDisabled, disableCountdown]);

  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setScanStatus('idle');
    setScanMessage("");
    setQrDetected(false);
    console.log("QR scanner stopped");
  }, []);

  const resetScan = useCallback(() => {
    stopScanning();
    setScannedData(null);
    setUploadedImage(null);
    setScanStatus('idle');
    setScanMessage("");
    setQrDetected(false);
  }, [stopScanning]);

  const submitAttendance = useCallback(async (qrData?: any) => {
    if (!scheduleData) {
      toast.error("No schedule data available");
      return;
    }

    const dataToUse = qrData || scannedData;
    if (!dataToUse || !dataToUse.studentId) {
      toast.error("Invalid QR code data");
      return;
    }

    try {
      setScanStatus('scanning');
      setScanMessage("Processing attendance...");

      const now = currentDate; // Use the current date state
      const timeIn = now.toTimeString().slice(0, 8);
      const customDate = now.toISOString(); // Send current client date/time

      const response = await fetch('/api/teacher/simple-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: dataToUse.studentId,
          scheduleId: scheduleData.id,
          timeIn: timeIn,
          customDate: customDate, // Include custom date for testing
        }),
      });

      const result = await response.json();
      console.log("Attendance submission result:", result);

      if (response.ok && result.ok) {
        toast.success(`${result.action === 'time_in' ? 'Time In' : 'Time Out'} recorded for ${result.studentName}`);
        
        // Update attendance records
        if (result.action === 'time_in') {
          setAttendanceRecords(prev => [...prev, {
            id: result.attendanceId,
            studentId: dataToUse.studentId,
            studentName: result.studentName,
            timeIn: result.timeIn,
            isLate: result.isLate,
            lateMinutes: result.lateMinutes,
            status: result.isLate ? 'late' : 'present'
          }]);
        } else {
          setAttendanceRecords(prev => prev.map(record => 
            record.studentId === dataToUse.studentId 
              ? { ...record, timeOut: result.timeOut }
              : record
          ));
        }

        setScanStatus('success');
        setScanMessage(`${result.action === 'time_in' ? 'Time In' : 'Time Out'} recorded!`);
        
        // Reset after successful scan
        setTimeout(() => {
          setScanStatus('scanning');
          setScanMessage("Scanning for QR codes...");
          setScannedData(null);
          // Note: scanningDisabled will be reset by the countdown timer
        }, 2000);

      } else {
        toast.error(result.error || "Failed to record attendance");
        setScanStatus('error');
        setScanMessage(result.error || "Failed to record attendance");
        
        setTimeout(() => {
          setScanStatus('scanning');
          setScanMessage("Scanning for QR codes...");
        }, 3000);
      }

    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Network error");
      setScanStatus('error');
      setScanMessage("Network error");
      
      setTimeout(() => {
        setScanStatus('scanning');
        setScanMessage("Scanning for QR codes...");
      }, 3000);
    }
  }, [scheduleData, scannedData, scanningDisabled]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if scanning is disabled
    if (scanningDisabled) {
      toast.warning("Scanning is disabled. Please wait for the countdown to finish.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        setUploadedImage(imageDataUrl);
        
        try {
          setScanStatus('scanning');
          setScanMessage("Scanning uploaded image...");
          
          // Use QrScanner to scan the uploaded image
          const result = await QrScanner.scanImage(file);
          console.log("QR Code detected from upload:", result);
          const qrData = JSON.parse(result);
          
          setScannedData(qrData);
          setScanStatus('success');
          setScanMessage("QR Code detected from uploaded image!");
          
          setTimeout(() => {
            submitAttendance(qrData);
          }, 500);
          
        } catch (error) {
          console.error("QR scan from upload failed:", error);
          setScanStatus('error');
          setScanMessage("No QR code found in uploaded image");
          setTimeout(() => {
            setScanStatus('idle');
            setScanMessage("");
          }, 3000);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload image");
    }
  }, [submitAttendance]);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!scheduleData) return;

    try {
      const response = await fetch(`/api/teacher/attendance-history?scheduleId=${scheduleData.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setAttendanceHistory(data.history || []);
      } else {
        toast.error("Failed to fetch attendance history");
      }
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      toast.error("Network error");
    }
  }, [scheduleData]);

  const fetchTodaysAttendance = useCallback(async () => {
    if (!scheduleData) return;

    try {
      const response = await fetch(`/api/teacher/attendance-history?scheduleId=${scheduleData.id}&todayOnly=true`);
      const data = await response.json();
      
      if (response.ok) {
        // Convert history format to attendance records format
        const todaysRecords = (data.history || []).map((record: any) => ({
          id: record.id,
          studentId: record.studentId,
          studentName: record.studentName,
          timeIn: record.timeIn,
          timeOut: record.timeOut,
          isLate: record.isLate,
          lateMinutes: record.lateMinutes,
          status: record.isLate ? 'late' : 'present'
        }));
        setAttendanceRecords(todaysRecords);
      } else {
        console.error("Failed to fetch today's attendance");
      }
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
    }
  }, [scheduleData]);

  // Fetch today's attendance when schedule data is loaded
  useEffect(() => {
    if (scheduleData) {
      fetchTodaysAttendance();
    }
  }, [scheduleData, fetchTodaysAttendance]);

  const formatTime = useCallback((timeString: string) => {
    if (!timeString) return "N/A";
    try {
      // The API already sends formatted times (e.g., "6:20 PM")
      // Check if it's already in 12-hour format
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString; // Already formatted, return as is
      }
      
      // Handle 24-hour format for backward compatibility
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  }, []);

  const generateQRCode = useCallback(async () => {
    if (!scannedData?.studentId) {
      toast.error("No student data available");
      return;
    }

    try {
      const QRCode = require('qrcode');
      const qrDataURL = await QRCode.toDataURL(JSON.stringify(scannedData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `qr-code-${scannedData.studentId}.png`;
      link.href = qrDataURL;
      link.click();
      
      toast.success("QR code downloaded!");
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    }
  }, [scannedData]);

  // Video element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log("Video metadata loaded");
      video.play().catch(console.error);
    };

    const handleCanPlay = () => {
      console.log("Video can play");
      video.play().catch(console.error);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  if (!scheduleData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Schedule Data</CardTitle>
              <CardDescription>
                Please start attendance from the schedule page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/teacher/schedule')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attendance Scanner</h1>
            <p className="text-muted-foreground">
              Scan QR codes to record attendance for {scheduleData.subject}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/teacher/schedule')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Schedule
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Point camera at QR code to automatically scan and record attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera Selection */}
                {availableCameras.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Camera</Label>
                    <select
                      value={selectedCamera?.id || ''}
                      onChange={(e) => {
                        const camera = availableCameras.find(c => c.id === e.target.value);
                        setSelectedCamera(camera || null);
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      {availableCameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Video Element */}
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-red-100 rounded-lg border-2 border-red-500"
                    playsInline
                    muted
                    autoPlay
                    style={{ backgroundColor: '#fef2f2' }}
                  />
                  
                  
                  {/* Custom Scan Region Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* No dark overlay - let video show through */}
                      
                      {/* Scan region - smaller centered box */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className={`w-48 h-48 border-2 border-dashed rounded-lg bg-transparent transition-all duration-300 ${
                          qrDetected 
                            ? 'border-green-400 border-solid bg-green-400 bg-opacity-10' 
                            : 'border-white'
                        }`}>
                          {/* Corner indicators */}
                          <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-300 ${
                            qrDetected ? 'border-green-400' : 'border-white'
                          }`}></div>
                          <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-300 ${
                            qrDetected ? 'border-green-400' : 'border-white'
                          }`}></div>
                          <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-300 ${
                            qrDetected ? 'border-green-400' : 'border-white'
                          }`}></div>
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors duration-300 ${
                            qrDetected ? 'border-green-400' : 'border-white'
                          }`}></div>
                          
                          {/* Success indicator */}
                          {qrDetected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-white">
                        <p className="text-sm font-medium">Position QR code within the frame</p>
                        <p className="text-xs opacity-75">Keep steady for best results</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Overlay */}
                  {scanStatus !== 'idle' && (
                    <div className="absolute top-2 right-2">
                      <Badge variant={scanStatus === 'success' ? 'default' : scanStatus === 'error' ? 'destructive' : 'secondary'}>
                        {scanMessage}
                      </Badge>
                    </div>
                  )}
                  
                  
                  {scanningDisabled && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        🔒 Scanning Disabled: {disableCountdown}s
                      </Badge>
                    </div>
                  )}
                </div>


                {/* Camera Controls */}
                <div className="text-center space-y-2">
                  {!isScanning ? (
                    <Button onClick={startScanning} className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={stopScanning} variant="outline" className="w-full">
                        Stop Camera
                      </Button>
                      <Button onClick={resetScan} variant="outline" className="w-full">
                        Reset
                      </Button>
                    </div>
                  )}
                  
                  
                  {scanningDisabled && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                      🔒 Scanning disabled for {disableCountdown} second(s) after successful scan
                    </div>
                  )}
                </div>

                {/* File Upload Section */}
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground mb-2">Or upload QR code image:</div>
                  <div className="text-xs text-muted-foreground mb-2">💡 Tip: For phone photos, ensure QR code is clear, well-lit, and straight</div>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                      disabled={scanningDisabled}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                  
                  {uploadedImage && (
                    <div className="mt-2">
                      <img
                        src={uploadedImage}
                        alt="Uploaded QR code"
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scanned Information */}
            {scannedData && (
              <Card>
                <CardHeader>
                  <CardTitle>Scanned Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Student ID</Label>
                      <p className="font-mono">{scannedData.studentId}</p>
                    </div>
                    <div>
                      <Label>Student Name</Label>
                      <p>{scannedData.studentName || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <p>{scannedData.department || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Year Level</Label>
                      <p>{scannedData.yearLevel || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Section</Label>
                      <p>{scannedData.section || 'N/A'}</p>
                    </div>
                    <div>
                      <Label>Generated</Label>
                      <p>{scannedData.timestamp ? new Date(scannedData.timestamp).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                  
                  <Button onClick={generateQRCode} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Schedule Info & Attendance Records */}
          <div className="space-y-4">
            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshCurrentDate}
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    Refresh Date
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span>{formatTime(scheduleData.startTime)} - {formatTime(scheduleData.endTime)}</span>
                    {scheduleData.hasOverride && scheduleData.overrideType === 'time-change' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        Modified
                      </Badge>
                    )}
                    {scheduleData.hasOverride && scheduleData.overrideType === 'cancel' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                        Cancelled
                      </Badge>
                    )}
                  </div>
                </div>
                {scheduleData.hasOverride && scheduleData.overrideReason && (
                  <div className="text-xs text-muted-foreground ml-6">
                    Override: {scheduleData.overrideReason}
                  </div>
                )}
                {scheduleData.hasOverride && scheduleData.originalStartTime && scheduleData.originalEndTime && (
                  <div className="text-xs text-muted-foreground ml-6">
                    Original: {formatTime(scheduleData.originalStartTime)} - {formatTime(scheduleData.originalEndTime)}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{scheduleData.room}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{scheduleData.subjectCode} - {scheduleData.subject}</span>
                </div>
                
                {/* Schedule Criteria */}
                {(scheduleData.department || scheduleData.year || scheduleData.section) && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">Student Criteria:</div>
                    <div className="space-y-1">
                      {scheduleData.department && (
                        <Badge variant="outline" className="text-xs">Dept: {scheduleData.department}</Badge>
                      )}
                      {scheduleData.year && (
                        <Badge variant="outline" className="text-xs">Year: {scheduleData.year}</Badge>
                      )}
                      {scheduleData.section && (
                        <Badge variant="outline" className="text-xs">Section: {scheduleData.section}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Day Warning */}
            {!isTodaySchedule && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-orange-800">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="text-sm font-medium">
                      ⚠️ This schedule is for {scheduleData.dayName}, not today
                    </div>
                  </div>
                  <div className="text-xs text-orange-700 mt-1">
                    Today is {new Date().toLocaleDateString('en-US', { weekday: 'long' })}. 
                    Students may not be able to scan QR codes for this schedule.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Attendance Records */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>
                  {attendanceRecords.length} students recorded for {currentDate.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No attendance recorded yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {attendanceRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div>
                          <div className="font-medium">{record.studentName}</div>
                          <div className="text-muted-foreground">
                            {formatTime(record.timeIn)}
                            {record.timeOut && ` - ${formatTime(record.timeOut)}`}
                          </div>
                        </div>
                        <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                          {record.status}
                          {record.isLate && ` (${record.lateMinutes}m late)`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance History */}
            {showHistory && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>
                    Recent attendance records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={fetchAttendanceHistory}
                    variant="outline"
                    className="w-full mb-4"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Load History
                  </Button>
                  
                  {attendanceHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No history available</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {attendanceHistory.map((record) => (
                        <div key={record.id} className="p-2 bg-muted rounded text-sm">
                          <div className="font-medium">{record.studentName}</div>
                          <div className="text-muted-foreground text-xs">
                            {record.date} • {formatTime(record.timeIn)}
                            {record.timeOut && ` - ${formatTime(record.timeOut)}`}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {record.status}
                            {record.isLate && ` (${record.lateMinutes}m late)`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}