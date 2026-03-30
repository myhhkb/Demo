import React, { useEffect, useState } from 'react';
import { Card, Spin, message, Empty } from 'antd';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { summaryApi } from '../api';

const SummaryPage: React.FC = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await summaryApi.getSummary();
      setContent(res.data.content);
    } catch (error: any) {
      message.error(error.msg || '加载学习总结失败');
    } finally {
      setLoading(false);
    }
  };

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }
      return '';
    },
  });

  const renderMarkdown = (markdown: string) => {
    const html = md.render(markdown);
    return (
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!content) {
    return (
      <Card>
        <Empty description="暂无学习总结" />
      </Card>
    );
  }

  return (
    <Card className="prose prose-sm max-w-none">
      {renderMarkdown(content)}
    </Card>
  );
};

export default SummaryPage;
