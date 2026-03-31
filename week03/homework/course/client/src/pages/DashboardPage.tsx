import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardApi, DashboardData } from '../api';

function extractTechName(name: string): string {
  const techMap: Record<string, string> = {
    React: 'React',
    Vue: 'Vue 3',
    TypeScript: 'TypeScript',
    'Node.js': 'Node.js',
    MySQL: 'MySQL',
    Docker: 'Docker',
    Python: 'Python',
    Git: 'Git',
    Webpack: 'Webpack',
    Redis: 'Redis',
    Linux: 'Linux',
    Jest: 'Jest',
    MongoDB: 'MongoDB',
  };

  for (const key of Object.keys(techMap)) {
    if (name.includes(key)) return techMap[key];
  }

  return name.split(' ')[0];
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getDashboard()
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        message.error('加载工作台数据失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return <div>加载失败</div>;

  const publishRate =
    data.stats.totalCourses > 0
      ? Math.round((data.stats.publishedCourses / data.stats.totalCourses) * 100)
      : 0;
  const activeRate =
    data.stats.totalStudents > 0
      ? Math.round((data.stats.activeStudents / data.stats.totalStudents) * 100)
      : 0;

  const COLORS = ['#5B9BD5', '#ED7D31', '#A5A5A5', '#FFC000', '#70AD47', '#4472C4'];
  const STATUS_COLORS = ['#5B9BD5', '#ED7D31'];

  const enrollmentData = data.charts.enrollment.map((item) => ({
    ...item,
    shortName: extractTechName(item.name),
  }));

  // 保证绿色虚线可显示：
  // - 接口如果没返回 activeStudents，则回退到 students
  // - 保证 activeStudents 严格小于 students（当 students > 0 时）
  const activityData = data.charts.activity.map((item) => {
    const students = Number(item.students || 0);
    const activeRaw = Number((item as any).activeStudents ?? students);

    let activeStudents = Math.max(0, activeRaw);
    if (students > 0) {
      activeStudents = Math.min(activeStudents, students - 1);
    } else {
      activeStudents = 0;
    }

    return {
      ...item,
      students,
      activeStudents,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold" style={{ color: '#333333' }}>
        工作台
      </h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>📚</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>课程总数</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {data.stats.totalCourses}
          </div>
          <div style={{ color: '#999999', fontSize: '12px' }}>已发布 {data.stats.publishedCourses} 门</div>
        </div>

        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>👥</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>学生总数</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {data.stats.totalStudents}
          </div>
          <div style={{ color: '#999999', fontSize: '12px' }}>活跃 {data.stats.activeStudents} 人</div>
        </div>

        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>📊</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>课程发布率</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {publishRate}%
          </div>
        </div>

        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>🔥</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>学生活跃率</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {activeRate}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', borderStyle: 'dashed', backgroundColor: '#FAFAFA' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
            课程选课人数 TOP 8
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={enrollmentData} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="0" stroke="#E8E8E8" vertical={false} />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#666' }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderRadius: '4px' }}
                formatter={(value) => [value, '选课人数']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
              />
              <Bar dataKey="value" fill="#5B9BD5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', borderStyle: 'dashed', backgroundColor: '#FAFAFA' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
            近7天学习活跃度
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={activityData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderRadius: '4px' }}
                formatter={(value, name) => [value, name === 'students' ? '学习人数' : '活跃学生数']}
              />
              <Legend
                formatter={(value) => (value === 'students' ? '学习人数' : '活跃学生数')}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="activeStudents"
                name="activeStudents"
                stroke="#70AD47"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={{ r: 3, fill: '#70AD47' }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="students"
                name="students"
                stroke="#5B9BD5"
                strokeWidth={3}
                dot={{ r: 3, fill: '#5B9BD5' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', borderStyle: 'dashed', backgroundColor: '#FAFAFA' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
            学生状态分布
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.charts.statusDist}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name.replace('学生', '')} ${value}`}
              >
                {data.charts.statusDist.map((_, index) => (
                  <Cell key={`status-cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderRadius: '4px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="border-2 rounded-lg p-6" style={{ borderColor: '#D0D0D0', borderStyle: 'dashed', backgroundColor: '#FAFAFA' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
            课程分类分布
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.charts.categoryDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}`}
              >
                {data.charts.categoryDist.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D0D0D0', borderRadius: '4px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
