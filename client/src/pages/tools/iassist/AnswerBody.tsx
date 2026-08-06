import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { splitAnswerSegments, tokenizeCode, guessLanguage, type Token } from '../../../lib/answerFormat';

const TOKEN_STYLES: Record<Token['type'], string> = {
  plain: '',
  comment: 'text-text-muted italic',
  string: 'text-emerald-400',
  number: 'text-amber-400',
  keyword: 'text-purple-400',
  function: 'text-blue-400',
};

function renderMarkdownBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-strong font-semibold">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

const CodeBlock = ({ lang, code }: { lang: string; code: string }) => {
  const [copied, setCopied] = useState(false);
  const label = lang || guessLanguage(code) || 'code';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by permissions policy; the code is still
      // selectable, so failing silently beats an error the user cannot act on.
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-line bg-bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line-subtle bg-elevate px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-accent">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-[10px] text-text-muted transition-colors hover:text-strong"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* Wide snippets scroll inside the block rather than widening the page. */}
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        {tokenizeCode(code, lang || guessLanguage(code)).map((tok, i) => (
          <span key={i} className={TOKEN_STYLES[tok.type]}>{tok.value}</span>
        ))}
      </pre>
    </div>
  );
};

/**
 * Renders a stored answer the way the desktop overlay does: prose as text, fenced
 * blocks as real code blocks. Without this the transcript showed raw ``` markers and
 * reflowed the snippet into the prose column, losing its indentation.
 */
const AnswerBody = ({ text }: { text: string }) => (
  <div className="text-sm leading-relaxed text-text-muted">
    {splitAnswerSegments(text).map((seg, i) =>
      seg.type === 'code'
        ? <CodeBlock key={i} lang={seg.block.lang} code={seg.block.code} />
        : <p key={i} className="whitespace-pre-line">{renderMarkdownBold(seg.text)}</p>
    )}
  </div>
);

export default AnswerBody;
