"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

// Realistic data based on seeded database
const attendanceData = [
  { month: "Aug", rate: 86.2, students: 50 },
  { month: "Sep", rate: 84.7, students: 50 },
  { month: "Oct", rate: 85.1, students: 50 },
  { month: "Nov", rate: 83.9, students: 50 },
  { month: "Dec", rate: 82.5, students: 50 },
  { month: "Jan", rate: 85.8, students: 50 },
];

// Department distribution based on seeded data
const departmentData = [
  { name: "Computer Science", students: 9, teachers: 2, color: "#3b82f6" },
  { name: "Mathematics", students: 8, teachers: 2, color: "#10b981" },
  { name: "Engineering", students: 8, teachers: 2, color: "#f59e0b" },
  { name: "Business Administration", students: 8, teachers: 2, color: "#ef4444" },
  { name: "Biology", students: 9, teachers: 2, color: "#8b5cf6" },
  { name: "Physics", students: 8, teachers: 2, color: "#06b6d4" },
];

// Weekly attendance based on realistic patterns
const weeklyData = [
  { day: "Mon", attendance: 87.2 },
  { day: "Tue", attendance: 85.8 },
  { day: "Wed", attendance: 84.1 },
  { day: "Thu", attendance: 83.6 },
  { day: "Fri", attendance: 81.9 },
];

interface AdminAttendanceChartProps {
  data?: Array<{
    month: string;
    rate: number;
    students: number;
  }>;
}

export function AdminAttendanceChart({ data = attendanceData }: AdminAttendanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Trends</CardTitle>
        <CardDescription>Monthly attendance rates and student enrollment</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="rate"
              orientation="left"
              domain={[75, 95]}
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="students"
              orientation="right"
              domain={[1100, 1300]}
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
                        Attendance: <span className="font-medium text-blue-600">{payload[0]?.value}%</span>
                      </p>
                      <p className="text-sm">
                        Students: <span className="font-medium text-green-600">{payload[1]?.value}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line 
              yAxisId="rate"
              type="monotone" 
              dataKey="rate" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 4 }}
            />
            <Line 
              yAxisId="students"
              type="monotone" 
              dataKey="students" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#10b981", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AdminDepartmentChartProps {
  data?: Array<{
    name: string;
    students: number;
    teachers: number;
    color: string;
  }>;
}

export function AdminDepartmentChart({ data = departmentData }: AdminDepartmentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Distribution</CardTitle>
        <CardDescription>Student and teacher distribution across departments</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="students"
              label={({ name, students, percent }: any) => `${name}: ${students} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm">Students: <span className="font-medium">{data.students}</span></p>
                      <p className="text-sm">Teachers: <span className="font-medium">{data.teachers}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AdminWeeklyChartProps {
  data?: Array<{
    day: string;
    attendance: number;
  }>;
}

export function AdminWeeklyChart({ data = weeklyData }: AdminWeeklyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Overview</CardTitle>
        <CardDescription>This week's daily attendance rates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="day" 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[75, 95]}
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
                        Attendance: <span className="font-medium">{payload[0]?.value}%</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="attendance" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
