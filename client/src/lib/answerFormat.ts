/**
 * Parsing for I-Assist answers, which arrive as plain text containing fenced code
 * blocks. The desktop overlay renders the same shapes in session-window.html; that
 * page has no bundler and cannot import from here, so the two implementations are
 * kept deliberately parallel — change one, change the other.
 */

export interface CodeBlock {
  lang: string;
  code: string;
}

export type AnswerSegment =
  | { type: 'prose'; text: string }
  | { type: 'code'; block: CodeBlock };

/**
 * Splits an answer into an ordered list of prose and code segments, so it can be
 * rebuilt with each snippet where the model put it. A trailing fence with no closing
 * ``` is treated as an open code segment rather than discarded — answers are streamed
 * on the desktop, and a stored answer can be truncated if a session ended mid-stream.
 */
export function splitAnswerSegments(text: string): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  let i = 0;

  const pushProse = (raw: string) => {
    // Removing a block leaves the blank lines that surrounded it behind.
    const prose = raw.replace(/\n{3,}/g, '\n\n').trim();
    if (prose) segments.push({ type: 'prose', text: prose });
  };

  while (i < text.length) {
    const start = text.indexOf('```', i);
    if (start === -1) {
      pushProse(text.slice(i));
      break;
    }
    pushProse(text.slice(i, start));

    const nl = text.indexOf('\n', start + 3);
    const lang = (nl === -1 ? text.slice(start + 3) : text.slice(start + 3, nl)).trim();
    const bodyStart = nl === -1 ? text.length : nl + 1;
    const end = text.indexOf('```', bodyStart);

    if (end === -1) {
      segments.push({ type: 'code', block: { lang, code: text.slice(bodyStart) } });
      break;
    }
    segments.push({
      type: 'code',
      block: { lang, code: text.slice(bodyStart, end).replace(/\n$/, '') },
    });
    i = end + 3;
  }

  return segments;
}

const KEYWORDS: Record<string, string> = {
  javascript: 'await async break case catch class const continue default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield true false null undefined',
  typescript: 'any as await async boolean break case catch class const continue default delete do else enum export extends finally for from function if implements import in instanceof interface let new number of private protected public readonly return static string super switch this throw try type typeof var void while yield true false null undefined',
  python: 'and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None self',
  java: 'abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws try void volatile while true false null var',
  csharp: 'abstract as base bool break byte case catch char class const continue decimal default do double else enum event explicit extern finally float for foreach if implicit int interface internal is lock long namespace new null object out override params private protected public readonly ref return sealed short sizeof static string struct switch this throw try typeof uint ulong using var virtual void while true false',
  cpp: 'auto bool break case catch char class const constexpr continue default delete do double else enum explicit extern false float for friend goto if inline int long namespace new nullptr operator private protected public return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void volatile while',
  go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var nil true false',
  sql: 'select from where insert update delete into values set join left right inner outer on group by order having limit offset as and or not null distinct count sum avg min max create table alter drop primary key foreign references index union all case when then else end',
  rust: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self static struct super trait true type unsafe use where while',
};

KEYWORDS.js = KEYWORDS.javascript;
KEYWORDS.ts = KEYWORDS.typescript;
KEYWORDS.jsx = KEYWORDS.javascript;
KEYWORDS.tsx = KEYWORDS.typescript;
KEYWORDS.py = KEYWORDS.python;
KEYWORDS['c++'] = KEYWORDS.cpp;
KEYWORDS.c = KEYWORDS.cpp;
KEYWORDS.cs = KEYWORDS.csharp;
KEYWORDS.rs = KEYWORDS.rust;
KEYWORDS.kotlin = KEYWORDS.java;
KEYWORDS.kt = KEYWORDS.java;

/** Fences the model uses for ASCII diagrams and plain output — never tokenised. */
const PLAIN_FENCES = new Set(['text', 'txt', 'plain', 'plaintext', 'ascii', 'diagram', 'output', 'console']);

/**
 * The model does not always tag the fence, and an unlabelled block still has to say
 * what it is. Cheap shape checks beat labelling every snippet "code".
 */
export function guessLanguage(code: string): string {
  if (/^\s*(def|class)\s+\w+.*:/m.test(code) || /^\s*(import|from)\s+\w+/m.test(code)) return 'python';
  if (/\b(public|private|protected)\s+(static\s+)?(class|void|int|String)\b/.test(code)) return 'java';
  if (/\bfunc\s+\w+\s*\(/.test(code) || /\bpackage\s+main\b/.test(code)) return 'go';
  if (/\bfn\s+\w+\s*\(/.test(code) || /\blet\s+mut\b/.test(code)) return 'rust';
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE)\b/im.test(code)) return 'sql';
  if (/#include\b/.test(code) || /\bstd::/.test(code)) return 'cpp';
  if (/\b(const|let|var|function|=>)\b/.test(code)) return 'javascript';
  return '';
}

export type TokenType = 'plain' | 'comment' | 'string' | 'number' | 'keyword' | 'function';

export interface Token {
  type: TokenType;
  value: string;
}

/**
 * Comment syntax is language-specific and guessing wrong is worse than not
 * highlighting: a shared `--` rule greys out `i--` in C, and a shared `#` rule greys
 * out `#include`. Languages not listed get the C-style set.
 */
function commentPatterns(lang: string): string[] {
  if (lang === 'python') return ['#[^\\n]*'];
  if (lang === 'sql') return ['--[^\\n]*', '\\/\\*[\\s\\S]*?(?:\\*\\/|$)'];
  return ['\\/\\/[^\\n]*', '\\/\\*[\\s\\S]*?(?:\\*\\/|$)'];
}

/**
 * Single-pass tokenizer. Comments and strings come first in the alternation, so a
 * keyword inside either is never recoloured. Returns tokens rather than markup so
 * callers can render real elements instead of setting innerHTML.
 */
export function tokenizeCode(code: string, lang: string): Token[] {
  const key = (lang || '').toLowerCase();
  if (PLAIN_FENCES.has(key)) return [{ type: 'plain', value: code }];

  const keywords = new Set((KEYWORDS[key] || '').split(' ').filter(Boolean));
  const re = new RegExp([
    `(${commentPatterns(key).join('|')})`,
    '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)',
    '(\\b\\d[\\w.]*\\b)',
    '([A-Za-z_]\\w*)',
  ].join('|'), 'g');

  const tokens: Token[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  const pushPlain = (value: string) => {
    if (value) tokens.push({ type: 'plain', value });
  };

  while ((match = re.exec(code)) !== null) {
    const [full, comment, str, num, word] = match;
    pushPlain(code.slice(last, match.index));
    last = match.index + full.length;

    if (comment) tokens.push({ type: 'comment', value: comment });
    else if (str) tokens.push({ type: 'string', value: str });
    else if (num) tokens.push({ type: 'number', value: num });
    else if (word) {
      if (keywords.has(word)) tokens.push({ type: 'keyword', value: word });
      // Call sites are detected here rather than in a second pass, which would also
      // match identifiers sitting inside string tokens.
      else if (/^\s*\(/.test(code.slice(last))) tokens.push({ type: 'function', value: word });
      else pushPlain(word);
    } else pushPlain(full);
  }

  pushPlain(code.slice(last));
  return tokens;
}
