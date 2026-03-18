import React from 'react';

/**
 * Complete Markdown renderer for AI responses & course content.
 * Supports: headings, bold, italic, strikethrough, code (inline + block),
 *           blockquotes, ordered/unordered/nested lists, tables, links, hr,
 *           paragraphs, and line breaks.
 */

const renderInline = (text: string, keyOffset = 0): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Supports: **bold**, __bold__, *italic*, _italic_, ~~strikethrough~~, `code`, [link](url)
    const regex = /(\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\*(.+?)\*|_(.+?)_|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;
    let key = keyOffset;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        if (match[2] || match[3]) {
            // **bold** or __bold__
            parts.push(<strong key={key++} className="font-bold text-white">{match[2] || match[3]}</strong>);
        } else if (match[4]) {
            // ~~strikethrough~~
            parts.push(<del key={key++} className="line-through text-zinc-500">{match[4]}</del>);
        } else if (match[5] || match[6]) {
            // *italic* or _italic_
            parts.push(<em key={key++} className="italic text-zinc-300">{match[5] || match[6]}</em>);
        } else if (match[7]) {
            // `code`
            parts.push(
                <code key={key++} className="px-1.5 py-0.5 bg-zinc-800 text-emerald-400 rounded text-[0.85em] font-mono border border-zinc-700/60">
                    {match[7]}
                </code>
            );
        } else if (match[8] && match[9]) {
            // [link](url)
            parts.push(
                <a key={key++} href={match[9]} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors">
                    {match[8]}
                </a>
            );
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : [text];
};

// Parse a list block recursively
const parseListItems = (lines: string[], startIndex: number, baseIndent: number, keyRef: { k: number }): [React.ReactNode[], number] => {
    const items: React.ReactNode[] = [];
    let i = startIndex;

    while (i < lines.length) {
        const line = lines[i];
        const match = line.match(/^(\s*)(?:[-*•]|\d+[.)]) (.*)/);
        if (!match) break;

        const indent = match[1].length;
        if (indent < baseIndent) break;
        if (indent > baseIndent) {
            // This is a sub-item — handled by the recursive call below
            i++;
            continue;
        }

        const itemText = match[2];
        // Check if next line is a nested list
        let nested: React.ReactNode | null = null;
        if (i + 1 < lines.length) {
            const nextMatch = lines[i + 1].match(/^(\s*)(?:[-*•]|\d+[.)]) /);
            if (nextMatch && nextMatch[1].length > indent) {
                const isOrdered = /^\s*\d+[.)]/.test(lines[i + 1]);
                const [nestedItems, consumed] = parseListItems(lines, i + 1, nextMatch[1].length, keyRef);
                if (isOrdered) {
                    nested = <ol key={keyRef.k++} className="mt-1.5 ml-4 space-y-1 list-none">{nestedItems}</ol>;
                } else {
                    nested = <ul key={keyRef.k++} className="mt-1.5 ml-4 space-y-1 list-none">{nestedItems}</ul>;
                }
                i = consumed;
            }
        }

        const isOrdered = /^\s*\d+[.)] /.test(line);
        items.push(
            <li key={keyRef.k++} className="flex items-start gap-2 text-zinc-300 leading-relaxed">
                <span className={`shrink-0 mt-1 ${isOrdered ? 'text-primary font-bold text-xs min-w-[1.4em]' : 'text-primary'}`}>
                    {isOrdered ? '' : '•'}
                </span>
                <span className="flex-1">{renderInline(itemText, keyRef.k)}{nested}</span>
            </li>
        );
        i++;
    }
    return [items, i];
};

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // ── Fenced Code Block ──────────────────────────────────
        if (trimmed.startsWith('```')) {
            const lang = trimmed.slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            elements.push(
                <div key={key++} className="relative group my-4">
                    {lang && (
                        <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-800 rounded-bl-lg rounded-tr-xl border-l border-b border-zinc-700">
                            {lang}
                        </div>
                    )}
                    <pre className="bg-zinc-900/80 border border-zinc-700/60 rounded-xl p-4 overflow-x-auto text-sm font-mono text-emerald-300 leading-relaxed">
                        <code>{codeLines.join('\n')}</code>
                    </pre>
                </div>
            );
            continue;
        }

        // ── Headings ───────────────────────────────────────────
        if (trimmed.startsWith('#### ')) {
            elements.push(<h4 key={key++} className="text-sm font-bold text-white mt-4 mb-1.5 tracking-tight">{renderInline(trimmed.slice(5), key)}</h4>);
            i++; continue;
        }
        if (trimmed.startsWith('### ')) {
            elements.push(<h3 key={key++} className="text-base font-bold text-white mt-5 mb-2 tracking-tight">{renderInline(trimmed.slice(4), key)}</h3>);
            i++; continue;
        }
        if (trimmed.startsWith('## ')) {
            elements.push(
                <h2 key={key++} className="text-xl font-black text-white mt-6 mb-3 pb-2 border-b border-zinc-800 tracking-tight">
                    {renderInline(trimmed.slice(3), key)}
                </h2>
            );
            i++; continue;
        }
        if (trimmed.startsWith('# ')) {
            elements.push(
                <h1 key={key++} className="text-2xl font-black text-white mt-6 mb-4 pb-3 border-b border-primary/30 tracking-tight">
                    {renderInline(trimmed.slice(2), key)}
                </h1>
            );
            i++; continue;
        }

        // ── Blockquote ─────────────────────────────────────────
        if (trimmed.startsWith('> ')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('>')) {
                quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
                i++;
            }
            elements.push(
                <blockquote key={key++} className="my-3 pl-4 border-l-4 border-primary/60 bg-primary/5 py-2 pr-3 rounded-r-lg">
                    {quoteLines.map((ql, qi) => (
                        <p key={qi} className="text-zinc-300 italic text-sm leading-relaxed">{renderInline(ql, key + qi)}</p>
                    ))}
                </blockquote>
            );
            continue;
        }

        // ── Table ──────────────────────────────────────────────
        if (trimmed.includes('|') && trimmed.startsWith('|')) {
            const tableRows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                const row = lines[i].trim();
                if (/^\|[\s\-:|]+\|$/.test(row)) { i++; continue; } // skip separator
                const cells = row.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                tableRows.push(cells);
                i++;
            }
            if (tableRows.length > 0) {
                elements.push(
                    <div key={key++} className="overflow-x-auto my-4 rounded-xl border border-zinc-700/60">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-zinc-800/80 border-b border-zinc-700">
                                    {tableRows[0].map((cell, ci) => (
                                        <th key={ci} className="px-4 py-3 text-left text-zinc-200 font-bold text-xs uppercase tracking-wider">
                                            {renderInline(cell, key + ci)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.slice(1).map((row, ri) => (
                                    <tr key={ri} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-4 py-3 text-zinc-300">
                                                {renderInline(cell, key + ri * 10 + ci)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            continue;
        }

        // ── Unordered List ─────────────────────────────────────
        if (/^\s*[-*•]\s/.test(line)) {
            const listItems: React.ReactNode[] = [];
            const keyRef = { k: key };
            while (i < lines.length && /^\s*[-*•]\s/.test(lines[i])) {
                const itemLine = lines[i];
                const indent = itemLine.match(/^(\s*)/)?.[1].length ?? 0;
                const itemText = itemLine.replace(/^\s*[-*•]\s/, '');
                let nested: React.ReactNode | null = null;
                if (i + 1 < lines.length) {
                    const nextIndent = lines[i + 1].match(/^(\s*)/)?.[1].length ?? 0;
                    if (/^\s*[-*•]\s/.test(lines[i + 1]) && nextIndent > indent) {
                        const [nestedItems, consumed] = parseListItems(lines, i + 1, nextIndent, keyRef);
                        nested = <ul key={keyRef.k++} className="mt-1.5 ml-5 space-y-1 list-none">{nestedItems}</ul>;
                        i = consumed - 1;
                    }
                }
                listItems.push(
                    <li key={keyRef.k++} className="flex items-start gap-2.5 text-zinc-300 leading-relaxed">
                        <span className="text-primary mt-[0.3em] shrink-0 text-base">•</span>
                        <span className="flex-1">{renderInline(itemText, keyRef.k)}{nested}</span>
                    </li>
                );
                i++;
            }
            key = keyRef.k;
            elements.push(<ul key={key++} className="space-y-2 my-3 ml-1 list-none">{listItems}</ul>);
            continue;
        }

        // ── Ordered List ───────────────────────────────────────
        if (/^\s*\d+[.)]\s/.test(line)) {
            const listItems: React.ReactNode[] = [];
            let num = 1;
            while (i < lines.length && /^\s*\d+[.)]\s/.test(lines[i])) {
                const itemText = lines[i].replace(/^\s*\d+[.)]\s/, '');
                listItems.push(
                    <li key={key++} className="flex items-start gap-2.5 text-zinc-300 leading-relaxed">
                        <span className="text-primary font-bold shrink-0 min-w-[1.6em] text-sm mt-[0.15em]">{num}.</span>
                        <span className="flex-1">{renderInline(itemText, key)}</span>
                    </li>
                );
                num++;
                i++;
            }
            elements.push(<ol key={key++} className="space-y-2 my-3 ml-1 list-none">{listItems}</ol>);
            continue;
        }

        // ── Horizontal Rule ────────────────────────────────────
        if (/^[-*_]{3,}$/.test(trimmed)) {
            elements.push(<hr key={key++} className="border-zinc-700/60 my-5" />);
            i++; continue;
        }

        // ── Empty line ─────────────────────────────────────────
        if (trimmed === '') {
            i++; continue;
        }

        // ── Paragraph ──────────────────────────────────────────
        elements.push(
            <p key={key++} className="text-zinc-300 leading-relaxed my-2">
                {renderInline(line, key)}
            </p>
        );
        i++;
    }

    return (
        <div className={`markdown-body ${className}`}>
            {elements}
        </div>
    );
};

export { MarkdownRenderer };
export default MarkdownRenderer;
