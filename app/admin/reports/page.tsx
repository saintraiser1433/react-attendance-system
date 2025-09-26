"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Download, FileText, BarChart3, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const recentReports = [
    { id: "1", name: "Daily Attendance - CS101", type: "CSV", date: "2025-09-19", size: "2.3 KB", status: "Completed" },
    { id: "2", name: "Monthly Summary - September", type: "PDF", date: "2025-09-18", size: "156 KB", status: "Completed" },
    { id: "3", name: "Student Attendance Report", type: "CSV", date: "2025-09-17", size: "45 KB", status: "Completed" },
  ];

  const handleGenerateReport = async () => {
    if (!reportType || !dateFrom || !dateTo) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("Report generated successfully!");
    }, 2000);
  };

  const downloadReport = (reportId: string, reportName: string) => {
    toast.success(`Preparing ${reportName} for download...`);
    
    // Mock CSV data based on report type
    const csvData = generateMockCSV(reportName);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setTimeout(() => {
      toast.success(`${reportName} downloaded successfully!`);
    }, 500);
  };

  const generateMockCSV = (reportName: string): string => {
    if (reportName.includes("Attendance")) {
      return `Student ID,Student Name,Department,Subject,Date,Status,Time Marked
S001,Jane Student,Computer Science,CS101,2025-09-19,Present,09:15
S002,John Doe,Computer Science,CS101,2025-09-19,Present,09:12
S003,Alice Smith,Computer Science,CS101,2025-09-19,Absent,-
S004,Bob Johnson,Computer Science,CS101,2025-09-19,Present,09:18`;
    } else if (reportName.includes("Monthly")) {
      return `Month,Total Classes,Classes Held,Average Attendance,Department
September,120,118,87.2%,Computer Science
September,96,95,89.1%,Mathematics
September,108,106,85.3%,Engineering`;
    } else {
      return `Report Type,Generated Date,Total Records,Status
Daily Attendance,2025-09-19,45,Complete
Weekly Summary,2025-09-18,156,Complete
Monthly Report,2025-09-17,234,Complete`;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate and download attendance reports
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Generated this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87.2%</div>
              <p className="text-xs text-muted-foreground">
                Average this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                Out of 180 students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Generate Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>
              Create custom attendance reports with specific filters and date ranges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Attendance</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="student">Student Report</SelectItem>
                    <SelectItem value="class">Class Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Your recently generated reports and downloads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{String(report.type || "")}</Badge>
                    </TableCell>
                    <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                    <TableCell>{report.size}</TableCell>
                    <TableCell>
                      <Badge variant="default">{String(report.status || "")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadReport(report.id, report.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
