import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi, DashboardData } from '../api';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getDashboard()
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

  if (!data) {
    return <div>加载失败</div>;
  }

  // 计算发布率和活跃率
  const publishRate = data.stats.totalCourses > 0 
    ? Math.round((data.stats.publishedCourses / data.stats.totalCourses) * 100)
    : 0;
  const activeRate = data.stats.totalStudents > 0
    ? Math.round((data.stats.activeStudents / data.stats.totalStudents) * 100)
    : 0;

  const COLORS = ['#5B9BD5', '#ED7D31', '#A5A5A5', '#FFC000', '#70AD47', '#4472C4'];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <h1 className="text-3xl font-bold" style={{ color: '#333333' }}>
        工作台
      </h1>

      {/* 指标卡片 - 4列 */}
      <div className="grid grid-cols-4 gap-4">
        {/* 课程总数 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>📚</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>课程总数</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {data.stats.totalCourses}
          </div>
          <div style={{ color: '#999999', fontSize: '12px' }}>
            / 已发布 {data.stats.publishedCourses}
          </div>
        </div>

        {/* 学生总数 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>👥</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>学生总数</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {data.stats.totalStudents}
          </div>
          <div style={{ color: '#999999', fontSize: '12px' }}>
            / 活跃 {data.stats.activeStudents}
          </div>
        </div>

        {/* 课程发布率 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>📊</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>课程发布率</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {publishRate}%
          </div>
          <div style={{ color: '#999999', fontSize: '12px' }}>
            / 已发布 {data.stats.publishedCourses}
          </div>
        </div>

        {/* 学生活跃率 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div style={{ fontSize: '20px' }}>🔥</div>
            <span style={{ color: '#666666', fontSize: '14px' }}>学生活跃率</span>
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333333', marginBottom: '8px' }}>
            {activeRate}%
          </div>
          <div style={{ color: '#999999', fontSize: '12px' }}>
            / 活跃 {data.stats.activeStudents}
          </div>
        </div>
      </div>

      {/* 图表容器 - 2x2 网格 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 课程选课人数 TOP 8 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            borderStyle: 'dashed',
            backgroundColor: '#FAFAFA',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
            课程选课人数 TOP 8
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.charts.enrollment} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="0" stroke="#E8E8E8" vertical={false} />
              <XAxis dataKey="name" hide={true} />
              <YAxis hide={true} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D0D0D0',
                  borderRadius: '4px',
                }}
                formatter={(value) => [value, '选课人数']}
              />
              <Bar dataKey="value" fill="#5B9BD5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 近7天学习活跃度 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            borderStyle: 'dashed',
            backgroundColor: '#FAFAFA',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
            近7天学习活跃度
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.charts.activity} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" vertical={false} />
              <XAxis dataKey="label" hide={true} />
              <YAxis hide={true} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D0D0D0',
                  borderRadius: '4px',
                }}
              />
              <Line
                type="linear"
                dataKey="students"
                stroke="#5B9BD5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="linear"
                dataKey="duration"
                stroke="#70AD47"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 学生状态分布 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            borderStyle: 'dashed',
            backgroundColor: '#FAFAFA',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', marginBottom: '16px' }}>
            学生状态分布
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.charts.statusDist}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}`}
              >
                {data.charts.statusDist.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D0D0D0',
                  borderRadius: '4px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 课程分类分布 */}
        <div
          className="border-2 rounded-lg p-6"
          style={{
            borderColor: '#D0D0D0',
            borderStyle: 'dashed',
            backgroundColor: '#FAFAFA',
          }}
        >
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
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D0D0D0',
                  borderRadius: '4px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
