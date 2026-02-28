/**
 * KOREK badge component — professional monospace pill style
 */
export default function NorekBadge({ norek, size = 'md', color }) {
    if (!norek) return null;
    const sizes = {
        lg: { padding: '4px 14px', fontSize: '0.92rem' },
        md: { padding: '3px 10px', fontSize: '0.78rem' },
        sm: { padding: '2px 8px', fontSize: '0.7rem' },
    };
    return (
        <span style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontWeight: 700,
            letterSpacing: '0.5px',
            background: color ? `${color}15` : 'var(--bg-tertiary)',
            color: color || 'var(--primary-500)',
            borderRadius: '6px',
            border: `1px solid ${color ? `${color}30` : 'var(--border-secondary)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            ...sizes[size],
        }}>
            {norek}
        </span>
    );
}
