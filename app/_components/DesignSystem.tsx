'use client';

import { useState } from 'react';

const COLORS = [
    { name: 'Brand', hsl: '250 75% 55%', var: '--brand' },
    { name: 'Success', hsl: '156 100% 39%', var: '--success' },
    { name: 'Warning', hsl: '45 100% 50%', var: '--warning' },
    { name: 'Danger', hsl: '0 84% 60%', var: '--danger' },
    { name: 'Info', hsl: '210 100% 50%', var: '--info' },
];

export function DesignSystem() {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                {COLORS.map((color) => (
                    <div
                        key={color.var}
                        className="group relative flex flex-col gap-2 p-3 rounded-2xl bg-white border border-gray-100 transition-all hover:shadow-lg"
                    >
                        <div
                            className="w-full aspect-square rounded-xl shadow-inner border border-black/5"
                            style={{ backgroundColor: `hsl(var(${color.var}))` }}
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{color.name}</span>
                            <span className="text-[10px] font-medium text-gray-400 font-mono uppercase tracking-tight">
                                {color.hsl}
                            </span>
                        </div>

                        {/* Hover Clipboard Button */}
                        <button
                            onClick={() => copyToClipboard(color.hsl, color.var)}
                            className="absolute top-4 right-4 p-1.5 bg-white/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            title="Copy HSL to clipboard"
                        >
                            {copiedId === color.var ? (
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
