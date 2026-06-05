import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div
      className="prose prose-invert prose-sm max-w-none
        prose-headings:text-foreground prose-headings:font-semibold
        prose-p:text-muted-foreground prose-p:leading-7
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-muted prose-pre:border prose-pre:border-border
        prose-blockquote:border-primary prose-blockquote:text-muted-foreground
        prose-hr:border-border
        prose-thead:text-foreground
        prose-td:text-muted-foreground
        prose-li:text-muted-foreground"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
