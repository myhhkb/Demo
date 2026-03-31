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

  // 将 Markdown 中的相对图片路径重写为后端静态资源接口路径
  const defaultImageRender = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');
    if (srcIndex >= 0) {
      const src = token.attrs![srcIndex][1];
      if (src && !src.startsWith('http') && !src.startsWith('/')) {
        token.attrs![srcIndex][1] = `/api/static/${src}`;
      }
    }
    return defaultImageRender(tokens, idx, options, env, self);
  };

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
