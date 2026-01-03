import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings';

// 延迟加载 mermaid 库
let mermaidPromise: Promise<typeof import('mermaid')> | null = null;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid');
  }
  return mermaidPromise;
}

interface MermaidRendererProps {
  code: string;
  className?: string;
}

export function MermaidRenderer({ code, className }: MermaidRendererProps) {
  const theme = useSettingsStore((s) => s.theme);
  const uniqueId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 解析实际主题（与 CodeBlock 逻辑一致）
  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme === 'dark' || theme === 'sync-terminal'
        ? 'dark'
        : 'light';

  // Mermaid 主题映射
  const mermaidTheme = resolvedTheme === 'dark' ? 'dark' : 'default';

  useEffect(() => {
    let cancelled = false;
    // 生成唯一 ID 避免冲突（移除 React useId 的冒号）
    const elementId = `mermaid-${uniqueId.replace(/:/g, '-')}`;

    // 清理 Mermaid 在 body 中创建的临时元素
    function cleanupMermaidElements() {
      // Mermaid 会在 body 中创建带有 id 的临时 SVG 元素
      const tempElement = document.getElementById(elementId);
      if (tempElement) {
        tempElement.remove();
      }
      // 清理可能残留的错误容器（Mermaid 错误时创建的 d 属性元素）
      const errorElements = document.querySelectorAll(`[id^="${elementId}"]`);
      errorElements.forEach((el) => {
        el.remove();
      });
    }

    async function renderDiagram() {
      if (!code.trim()) {
        setSvg(null);
        setError(null);
        return;
      }

      try {
        const mermaid = (await getMermaid()).default;

        // 每次渲染前重新初始化以应用主题
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          securityLevel: 'strict',
          fontFamily: 'inherit',
          // 抑制错误渲染到 DOM
          suppressErrorRendering: true,
        });

        const { svg: renderedSvg } = await mermaid.render(elementId, code);

        // 渲染成功后清理临时元素
        cleanupMermaidElements();

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        // 渲染失败时也要清理临时元素
        cleanupMermaidElements();

        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Mermaid render failed');
          setSvg(null);
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
      // 组件卸载时清理
      cleanupMermaidElements();
    };
  }, [code, mermaidTheme, uniqueId]);

  // 错误降级：显示源代码
  if (error) {
    return (
      <div className={cn('overflow-x-auto rounded-lg border border-destructive/50', className)}>
        <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span>Mermaid 渲染错误</span>
        </div>
        <pre className="p-4 text-sm">
          <code className="block font-mono leading-relaxed text-muted-foreground">{code}</code>
        </pre>
        <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {error}
        </div>
      </div>
    );
  }

  // 加载中状态
  if (!svg) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-muted/30 p-8',
          className
        )}
      >
        <div className="text-sm text-muted-foreground">加载 Mermaid 图表...</div>
      </div>
    );
  }

  // 成功渲染
  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-x-auto rounded-lg border border-border bg-muted/30 p-4',
        '[&_svg]:mx-auto [&_svg]:max-w-full',
        className
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid SVG output
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
