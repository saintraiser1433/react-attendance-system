"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar } from "recharts";

// Mock data for teacher's class attendance trends
const classAttendanceData = [
  { day: "Mon", attendance: 92 },
  { day: "Tue", attendance: 88 },
  { day: "Wed", attendance: 85 },
  { day: "Thu", attendance: 89 },
  { day: "Fri", attendance: 91 },
];

// Mock data for student performance overview
const studentPerformanceData = [
  { subject: "CS101", excellent: 15, good: 18, average: 8, poor: 4, attendanceRate: 92 },
  { subject: "CS201", excellent: 12, good: 15, average: 7, poor: 4, attendanceRate: 88 },
  { subject: "CS301", excellent: 10, good: 14, average: 6, poor: 2, attendanceRate: 85 },
];

// Mock data for daily class summary
const dailyClassData = [
  { time: "8:00", attendance: 85, subject: "CS101" },
  { time: "10:00", attendance: 92, subject: "CS201" },
  { time: "14:00", attendance: 88, subject: "CS301" },
  { time: "16:00", attendance: 90, subject: "CS101" },
];

// Mock data for overall performance
const performanceData = [
  { name: "Attendance Rate", value: 89, fill: "#3b82f6" },
  { name: "Assignment Completion", value: 85, fill: "#10b981" },
  { name: "Module Progress", value: 78, fill: "#f59e0b" },
];

interface TeacherAttendanceChartProps {
  data?: Array<{
    day: string;
    attendance: number;
  }>;
}

export function TeacherAttendanceChart({ data = classAttendanceData }: TeacherAttendanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Attendance Trends</CardTitle>
        <CardDescription>Weekly attendance rates across your subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="day" 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[80, 100]}
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm">
                          {entry.dataKey}: <span className="font-medium" style={{ color: entry.color }}>{entry.value}%</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="attendance" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              name="Attendance"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface TeacherPerformanceChartProps {
  data?: Array<{
    subject: string;
    excellent: number;
    good: number;
    average: number;
    poor: number;
    attendanceRate: number;
  }>;
}

export function TeacherPerformanceChart({ data = studentPerformanceData }: TeacherPerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Performance Distribution</CardTitle>
        <CardDescription>Performance breakdown across your subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="subject" 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm">
                          {entry.dataKey}: <span className="font-medium" style={{ color: entry.color }}>{entry.value}</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="excellent" stackId="a" fill="#10b981" name="Excellent" />
            <Bar dataKey="good" stackId="a" fill="#3b82f6" name="Good" />
            <Bar dataKey="average" stackId="a" fill="#f59e0b" name="Average" />
            <Bar dataKey="poor" stackId="a" fill="#ef4444" name="Poor" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface TeacherDailyChartProps {
  data?: Array<{
    time: string;
    attendance: number;
    subject: string;
  }>;
}

export function TeacherDailyChart({ data = dailyClassData }: TeacherDailyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Classes</CardTitle>
        <CardDescription>Attendance for today's scheduled classes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[75, 100]}
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm">
                        Subject: <span className="font-medium">{payload[0]?.payload?.subject}</span>
                      </p>
                      <p className="text-sm">
                        Attendance: <span className="font-medium">{payload[0]?.value}%</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="attendance" 
              stroke="#3b82f6" 
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface TeacherOverallChartProps {
  data?: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export function TeacherOverallChart({ data = performanceData }: TeacherOverallChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Performance</CardTitle>
        <CardDescription>Key performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="20%" 
            outerRadius="80%" 
            data={data}
          >
            <RadialBar 
              dataKey="value" 
              cornerRadius={10} 
              fill="#8884d8"
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{payload[0]?.payload?.name}</p>
                      <p className="text-sm">Value: <span className="font-medium">{payload[0]?.value}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
