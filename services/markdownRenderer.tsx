import React from 'react';

/**
 * Lightweight Markdown renderer for AI responses.
 * Handles: headings, bold, italic, code, lists, tables, line breaks.
 */

const escapeHtml = (str: string): string =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Pattern: **bold**, *italic*, `code`, [link](url)
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        // Text before match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[2]) {
            // **bold**
            parts.push(<strong key={key++} className="font-semibold text-white">{match[2]}</strong>);
        } else if (match[3]) {
            // *italic*
            parts.push(<em key={key++} className="italic text-zinc-300">{match[3]}</em>);
        } else if (match[4]) {
            // `code`
            parts.push(
                <code key={key++} className="px-1.5 py-0.5 bg-zinc-800 text-emerald-400 rounded text-xs font-mono">
                    {match[4]}
                </code>
            );
        } else if (match[5] && match[6]) {
            // [link](url)
            parts.push(
                <a key={key++} href={match[6]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 transition-colors">
                    {match[5]}
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

const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Code block
        if (line.trim().startsWith('```')) {
            const lang = line.trim().slice(3).trim();
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            elements.push(
                <pre key={key++} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto my-3">
                    <code className="text-sm font-mono text-emerald-400 leading-relaxed">
                        {codeLines.join('\n')}
                    </code>
                </pre>
            );
            continue;
        }

        // Headings
        if (line.startsWith('#### ')) {
            elements.push(<h4 key={key++} className="text-sm font-bold text-white mt-4 mb-1">{renderInline(line.slice(5))}</h4>);
            i++;
            continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={key++} className="text-base font-bold text-white mt-4 mb-2">{renderInline(line.slice(4))}</h3>);
            i++;
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={key++} className="text-lg font-bold text-white mt-5 mb-2">{renderInline(line.slice(3))}</h2>);
            i++;
            continue;
        }
        if (line.startsWith('# ')) {
            elements.push(<h1 key={key++} className="text-xl font-bold text-white mt-5 mb-3">{renderInline(line.slice(2))}</h1>);
            i++;
            continue;
        }

        // Table
        if (line.includes('|') && line.trim().startsWith('|')) {
            const tableRows: string[][] = [];
            let isHeader = true;
            while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
                const row = lines[i].trim();
                // Skip separator row (|---|---|)
                if (/^\|[\s-:|]+\|$/.test(row)) {
                    i++;
                    continue;
                }
                const cells = row.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                tableRows.push(cells);
                i++;
            }
            if (tableRows.length > 0) {
                elements.push(
                    <div key={key++} className="overflow-x-auto my-3">
                        <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-zinc-800/50">
                                    {tableRows[0].map((cell, ci) => (
                                        <th key={ci} className="px-3 py-2 text-left text-zinc-300 font-semibold border-b border-zinc-700">
                                            {renderInline(cell)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.slice(1).map((row, ri) => (
                                    <tr key={ri} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-3 py-2 text-zinc-400">
                                                {renderInline(cell)}
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

        // Unordered list
        if (/^\s*[-*•]\s/.test(line)) {
            const listItems: React.ReactNode[] = [];
            while (i < lines.length && /^\s*[-*•]\s/.test(lines[i])) {
                const itemText = lines[i].replace(/^\s*[-*•]\s/, '');
                listItems.push(
                    <li key={key++} className="flex items-start gap-2 text-zinc-300 leading-relaxed">
                        <span className="text-primary mt-1.5 shrink-0">•</span>
                        <span>{renderInline(itemText)}</span>
                    </li>
                );
                i++;
            }
            elements.push(
                <ul key={key++} className="space-y-1.5 my-2 ml-1">
                    {listItems}
                </ul>
            );
            continue;
        }

        // Numbered list
        if (/^\s*\d+[\.\)]\s/.test(line)) {
            const listItems: React.ReactNode[] = [];
            let num = 1;
            while (i < lines.length && /^\s*\d+[\.\)]\s/.test(lines[i])) {
                const itemText = lines[i].replace(/^\s*\d+[\.\)]\s/, '');
                listItems.push(
                    <li key={key++} className="flex items-start gap-2 text-zinc-300 leading-relaxed">
                        <span className="text-primary font-semibold min-w-[1.2em] shrink-0">{num}.</span>
                        <span>{renderInline(itemText)}</span>
                    </li>
                );
                num++;
                i++;
            }
            elements.push(
                <ol key={key++} className="space-y-1.5 my-2 ml-1">
                    {listItems}
                </ol>
            );
            continue;
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
            elements.push(<hr key={key++} className="border-zinc-800 my-4" />);
            i++;
            continue;
        }

        // Empty line
        if (line.trim() === '') {
            i++;
            continue;
        }

        // Regular paragraph
        elements.push(
            <p key={key++} className="text-zinc-300 leading-relaxed my-1.5">
                {renderInline(line)}
            </p>
        );
        i++;
    }

    return (
        <div className={`markdown-content ${className}`}>
            {elements}
        </div>
    );
};

export { MarkdownRenderer };
export default MarkdownRenderer;
