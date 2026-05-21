import re

css = open('dark-mode.css', 'r', encoding='utf-8').read()

replacements = {
    '#0d1117': 'var(--bg-main)',
    '#161b22': 'var(--bg-card)',
    '#21262d': 'var(--bg-hover)',
    '#30363d': 'var(--border-main)',
    '#c9d1d9': 'var(--text-main)',
    '#8b949e': 'var(--text-muted)',
    '#58a6ff': 'var(--accent-main)',
    '#79c0ff': 'var(--accent-hover)',
    '#e6edf3': 'var(--text-heading)'
}

for old, new in replacements.items():
    css = re.sub(old, new, css, flags=re.IGNORECASE)

root_vars = """
:root {
    --bg-main: #0d1117;
    --bg-card: #161b22;
    --bg-hover: #21262d;
    --border-main: #30363d;
    --text-main: #c9d1d9;
    --text-muted: #8b949e;
    --text-heading: #e6edf3;
    --accent-main: #58a6ff;
    --accent-hover: #79c0ff;
    
    --brand-grad: linear-gradient(0deg, var(--bg-hover), var(--bg-hover)) !important;
    --brand-grad-hover: linear-gradient(0deg, var(--border-main), var(--border-main)) !important;
}

/* ================= THEMES ================= */

/* 1. GitHub Dark (Default) */
[data-theme="dark"] {
    /* Same as root */
}

/* 2. Navy Blue (Deep Blue) */
[data-theme="navy"] {
    --bg-main: #0a1128;
    --bg-card: #121e3f;
    --bg-hover: #1c2b59;
    --border-main: #2b407a;
    --text-main: #d1d9e6;
    --text-muted: #94a3b8;
    --text-heading: #f1f5f9;
    --accent-main: #3b82f6;
    --accent-hover: #60a5fa;
}

/* 3. Warm Sepia (Coffee) */
[data-theme="sepia"] {
    --bg-main: #2c2520;
    --bg-card: #3a322c;
    --bg-hover: #4d443c;
    --border-main: #61574d;
    --text-main: #e8dbce;
    --text-muted: #bdae9f;
    --text-heading: #fdf6ec;
    --accent-main: #d97736;
    --accent-hover: #f39c63;
}

/* 4. OLED Black */
[data-theme="oled"] {
    --bg-main: #000000;
    --bg-card: #090909;
    --bg-hover: #141414;
    --border-main: #222222;
    --text-main: #dcdcdc;
    --text-muted: #888888;
    --text-heading: #ffffff;
    --accent-main: #ff4757;
    --accent-hover: #ff6b81;
}
"""

css = re.sub(r':root\s*\{[^}]+\}', root_vars, css)
open('dark-mode.css', 'w', encoding='utf-8').write(css)
print("Done refactoring CSS.")
