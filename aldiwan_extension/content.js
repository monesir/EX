(function() {
    // List of Arabic fonts
    const fonts = [
        { family: "", name: "الخط الافتراضي", baseSize: 1.25, lhMult: 1.6, margin: "" },
        { family: "'Arabic Poetry', serif", name: "عام الشعر العربي", baseSize: 2.5, lhMult: 1.15, margin: "margin: 0.9rem 0 !important;" },
        { family: "'Aref Ruqaa', serif", name: "خط الرقعه", baseSize: 1.4, lhMult: 1.6, margin: "" }
    ];
    let currentFontIndex = 0; // Default to site default
    
    // User zoom offset
    let userFontSizeOffset = 0; 
    
    function injectButtons() {
        const actionContainer = document.querySelector('.poem-actions');
        if (!actionContainer) return; // Only inject if we are on a poem page
        
        // Unified Font Control Group
        const fontGroup = document.createElement('div');
        fontGroup.className = 'font-control-group';
        fontGroup.style.display = 'inline-flex';
        fontGroup.style.alignItems = 'center';
        fontGroup.style.background = 'var(--bg-card)';
        fontGroup.style.border = '1px solid var(--border-main)';
        fontGroup.style.borderRadius = '50px';
        fontGroup.style.margin = '3px';

        const btnStyle = 'padding: 8px 15px; color: var(--text-main); text-decoration: none; cursor: pointer; display: flex; align-items: center; justify-content: center;';

        // Button: Increase Font Size
        const fontIncBtn = document.createElement('a');
        fontIncBtn.href = 'javascript:void(0)';
        fontIncBtn.title = 'تكبير الخط';
        fontIncBtn.innerHTML = '<i class="fa fa-search-plus"></i>';
        fontIncBtn.style.cssText = btnStyle;
        fontIncBtn.style.borderRadius = '0 50px 50px 0'; // Round right side
        // Container for Font Fam
        const famContainer = document.createElement('div');
        famContainer.style.position = 'relative';

        famContainer.style.display = 'inline-flex';
        famContainer.style.alignItems = 'center';

        // Button: Change Font Family
        const fontFamBtn = document.createElement('a');
        fontFamBtn.href = 'javascript:void(0)';
        fontFamBtn.title = 'تغيير نوع الخط';
        fontFamBtn.innerHTML = '<i class="fas fa-pen-nib"></i><span class="label" style="margin-right: 5px;">الخط</span>';
        fontFamBtn.style.cssText = btnStyle + 'border-right: 1px solid var(--border-main); border-left: 1px solid var(--border-main);';

        const fontDropdown = document.createElement('div');
        fontDropdown.className = 'theme-dropdown-menu'; // reuse the theme dropdown style!
        fontDropdown.style.top = 'calc(100% + 5px)';
        fontDropdown.style.left = '50%';
        fontDropdown.style.right = 'auto';
        fontDropdown.style.transform = 'translateX(-50%)'; // center under the button

        fonts.forEach((f, idx) => {
            const opt = document.createElement('div');
            opt.className = 'theme-option';
            opt.style.fontFamily = f.family;
            opt.style.justifyContent = 'center';
            opt.innerHTML = `<span>${f.name}</span>`;
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                currentFontIndex = idx;
                updatePoemStyle();
                fontDropdown.classList.remove('show');
            });
            fontDropdown.appendChild(opt);
        });

        famContainer.appendChild(fontFamBtn);
        famContainer.appendChild(fontDropdown);

        // Button: Decrease Font Size
        const fontDecBtn = document.createElement('a');
        fontDecBtn.href = 'javascript:void(0)';
        fontDecBtn.title = 'تصغير الخط';
        fontDecBtn.innerHTML = '<i class="fa fa-search-minus"></i>';
        fontDecBtn.style.cssText = btnStyle;
        fontDecBtn.style.borderRadius = '50px 0 0 50px'; // Round left side

        // Add to group
        fontGroup.appendChild(fontIncBtn);
        fontGroup.appendChild(famContainer);
        fontGroup.appendChild(fontDecBtn);

        // Add group to the action bar
        actionContainer.appendChild(fontGroup);

        // Event Listeners
        fontFamBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fontDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            fontDropdown.classList.remove('show');
        });

        fontIncBtn.addEventListener('click', (e) => {
            e.preventDefault();
            userFontSizeOffset += 0.1;
            updatePoemStyle();
        });

        fontDecBtn.addEventListener('click', (e) => {
            e.preventDefault();
            userFontSizeOffset -= 0.1;
            updatePoemStyle();
        });
    }

    function updatePoemStyle() {
        let dynamicStyle = document.getElementById('aldiwan-dynamic-style');
        if (!dynamicStyle) {
            dynamicStyle = document.createElement('style');
            dynamicStyle.id = 'aldiwan-dynamic-style';
            document.head.appendChild(dynamicStyle);
        }

        let fontRule = '';
        if (fonts[currentFontIndex].family) {
            fontRule = `font-family: ${fonts[currentFontIndex].family} !important; font-weight: normal !important;`;
        }

        let sizeRule = '';
        let lhRule = '';
        
        if (currentFontIndex !== 0 || userFontSizeOffset !== 0) {
            let finalSize = fonts[currentFontIndex].baseSize + userFontSizeOffset;
            let lhMult = fonts[currentFontIndex].lhMult || 1.6;
            sizeRule = `font-size: ${finalSize}rem !important;`;
            lhRule = `line-height: ${finalSize * lhMult}rem !important;`;
        }

        dynamicStyle.textContent = `
            #poem_content h3, 
            #poem_content h3 *,
            #poem_content h3 .mosahma_highlight {
                ${fontRule}
                ${sizeRule}
                ${lhRule}
            }
            #poem_content h3 {
                height: auto !important;
                ${fonts[currentFontIndex].margin || ''}
            }
        `;
    }

    // Load the local custom OTF font and the Google Font for Ruqaa
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
        @font-face {
            font-family: 'Arabic Poetry';
            src: url('${chrome.runtime.getURL("arabic-poetry.otf")}') format('opentype');
        }
        @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap');
    `;
    document.head.appendChild(fontStyle);

    // Wait slightly to ensure page loads its components
    setTimeout(() => {
        injectButtons();
        injectThemeButton();
    }, 1000);

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('aldiwan_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    function injectThemeButton() {
        const headers = document.querySelectorAll('header, nav.fixed-top');
        
        headers.forEach(header => {
            if (header.querySelector('.theme-dropdown-container')) return;

            const registerBtn = header.querySelector('a[href*="/register"]');
            if (!registerBtn) return;

            // Container for button + dropdown
            const container = document.createElement('div');
            container.className = 'theme-dropdown-container';
            
            // Transfer float-left to container if present so layout doesn't break
            if (registerBtn.classList.contains('float-left')) {
                container.classList.add('float-left');
            }
            container.style.marginLeft = '5px';
            container.style.marginRight = '5px';

            const btn = document.createElement('a');
            btn.href = 'javascript:void(0)';
            btn.innerHTML = '<i class="fas fa-palette"></i> الثيمات';
            btn.title = 'تغيير الثيم';
            // Copy classes from register btn but strip float-left (handled by container)
            btn.className = registerBtn.className.replace('float-left', '').trim() + ' theme-switcher-btn';
            
            // Adjust padding to make it a neat button
            btn.style.paddingLeft = '15px';
            btn.style.paddingRight = '15px';

            const dropdown = document.createElement('div');
            dropdown.className = 'theme-dropdown-menu';
            
            const themes = [
                { id: 'dark', name: 'الافتراضي', color: '#0d1117' },
                { id: 'navy', name: 'أزرق ليلي', color: '#0a1128' },
                { id: 'sepia', name: 'قهوة دافئة', color: '#2c2520' },
                { id: 'gold', name: 'ذهبي وأسود', color: '#ffd700' }
            ];

            themes.forEach(t => {
                const opt = document.createElement('div');
                opt.className = 'theme-option';
                opt.innerHTML = `<div class="theme-circle" style="background-color: ${t.color}"></div><span>${t.name}</span>`;
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.documentElement.setAttribute('data-theme', t.id);
                    localStorage.setItem('aldiwan_theme', t.id);
                    dropdown.classList.remove('show');
                });
                dropdown.appendChild(opt);
            });

            container.appendChild(btn);
            container.appendChild(dropdown);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Close other dropdowns
                document.querySelectorAll('.theme-dropdown-menu').forEach(m => {
                    if (m !== dropdown) m.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });

            if (header.tagName.toLowerCase() === 'nav' || header.classList.contains('fixed-top')) {
                registerBtn.parentNode.insertBefore(container, registerBtn.nextSibling);
            } else {
                registerBtn.parentNode.insertBefore(container, registerBtn);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.theme-dropdown-menu').forEach(m => m.classList.remove('show'));
        });
    }

    // --- Custom Context Menu for Quote Image ---
    let customMenu = null;

    document.addEventListener('contextmenu', (e) => {
        const poemContent = document.getElementById('poem_content');
        if (!poemContent) return; // Not on a poem page
        
        const selection = window.getSelection().toString().trim();
        const h3 = e.target.closest('#poem_content h3');
        
        // If clicking on a verse, or having text selected inside the poem content
        const isSelectionInsidePoem = selection.length > 0 && poemContent.contains(window.getSelection().anchorNode);
        
        if (h3 || isSelectionInsidePoem) {
            e.preventDefault();
            showContextMenu(e.pageX, e.pageY, selection || (h3 ? h3.innerText : ''));
        }
    });
    
    document.addEventListener('click', () => {
        if (customMenu) {
            customMenu.remove();
            customMenu = null;
        }
    });

    function showContextMenu(x, y, text) {
        if (customMenu) customMenu.remove();
        
        customMenu = document.createElement('div');
        customMenu.style.cssText = `
            position: absolute; top: ${y}px; left: ${x}px;
            background: var(--bg-card, #2f2824); border: 1px solid var(--border-main, #3e3833);
            border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 999999; padding: 5px 0; min-width: 180px;
            font-family: inherit; direction: rtl;
        `;

        // Quote Option
        const quoteItem = document.createElement('div');
        quoteItem.innerHTML = '<i class="fas fa-image" style="margin-left: 8px;"></i> تصميم اقتباس';
        quoteItem.style.cssText = `
            padding: 10px 15px; cursor: pointer; color: var(--text-main, #fff);
            display: flex; align-items: center; transition: background 0.2s;
        `;
        quoteItem.onmouseover = () => quoteItem.style.background = 'var(--bg-hover, #3e3833)';
        quoteItem.onmouseout = () => quoteItem.style.background = 'transparent';
        quoteItem.onclick = (e) => {
            e.stopPropagation();
            customMenu.remove();
            showQuoteModal(text);
        };

        // Copy Option
        const copyItem = document.createElement('div');
        copyItem.innerHTML = '<i class="fas fa-copy" style="margin-left: 8px;"></i> نسخ النص';
        copyItem.style.cssText = quoteItem.style.cssText;
        copyItem.onmouseover = () => copyItem.style.background = 'var(--bg-hover, #3e3833)';
        copyItem.onmouseout = () => copyItem.style.background = 'transparent';
        copyItem.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text);
            customMenu.remove();
        };

        customMenu.appendChild(quoteItem);
        customMenu.appendChild(copyItem);
        document.body.appendChild(customMenu);
    }

    async function showQuoteModal(initialText) {
        const existing = document.getElementById('diwan-quote-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'diwan-quote-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 999999;
            display: flex; flex-direction: row; align-items: center; justify-content: center;
            gap: 30px; padding: 20px; box-sizing: border-box;
            backdrop-filter: blur(5px);
        `;

        // Smart Poetry Parser: Automatically detect verses and half-lines
        let processedText = '';
        let rawLines = initialText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // If the selection has multiple lines, check if they are already verses (separated by tabs/large spaces)
        let isAlreadyVerses = rawLines.some(line => /\t| {2,}/.test(line));
        
        if (isAlreadyVerses) {
            rawLines.forEach((line, index) => {
                let parts = line.split(/\t| {2,}/).map(p => p.trim()).filter(p => p.length > 0);
                processedText += parts.join('\n') + '\n';
                if (index !== rawLines.length - 1) {
                    processedText += '\n'; // Elegant empty line between verses
                }
            });
        } else {
            // If they are just single lines without large spaces, group every 2 lines as a verse
            rawLines.forEach((line, index) => {
                processedText += line + '\n';
                if (index % 2 === 1 && index !== rawLines.length - 1) {
                    processedText += '\n'; // Elegant empty line between verses
                }
            });
        }
        processedText = processedText.trim();
        
        // Editor Panel
        const editorPanel = document.createElement('div');
        editorPanel.style.cssText = `
            background: var(--bg-card, #2f2824); padding: 20px; border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; gap: 15px;
            width: 380px; border: 1px solid var(--border-main, #3e3833);
            direction: rtl; font-family: Tahoma, Arial, sans-serif;
        `;
        
        editorPanel.innerHTML = `
            <h3 style="margin: 0; color: #fff; font-size: 18px; text-align: center; border-bottom: 1px solid #444; padding-bottom: 10px;">تنسيق اللوحة الشعرية</h3>
            <p style="color: #aaa; font-size: 13px; margin: 0; line-height: 1.5; text-align: center;">
                يمكنك تعديل النص وتنسيقه كما سيظهر في اللوحة الفنية.
            </p>
            <textarea id="quote-text-input" rows="10" style="
                width: 100%; background: rgba(0,0,0,0.2); color: #fff; 
                border: 1px solid #555; border-radius: 8px; padding: 10px; 
                font-family: 'Arabic Poetry', serif; font-size: 18px; resize: vertical;
                box-sizing: border-box; text-align: center; white-space: pre-wrap;
            "></textarea>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                <span style="color: #ccc; font-size: 14px;">حجم الخط</span>
                <div style="display: flex; gap: 10px;">
                    <button id="quote-font-minus" style="padding: 5px 15px; border-radius: 5px; border: none; background: #444; color: #fff; cursor: pointer; font-weight: bold;">-</button>
                    <button id="quote-font-plus" style="padding: 5px 15px; border-radius: 5px; border: none; background: #444; color: #fff; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                <span style="color: #ccc; font-size: 14px;">تباعد الأسطر</span>
                <div style="display: flex; gap: 10px;">
                    <button id="quote-lh-minus" style="padding: 5px 15px; border-radius: 5px; border: none; background: #444; color: #fff; cursor: pointer; font-weight: bold;">-</button>
                    <button id="quote-lh-plus" style="padding: 5px 15px; border-radius: 5px; border: none; background: #444; color: #fff; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button id="quote-download-btn" style="flex: 1; padding: 12px; background: #dcb98a; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.2s;">تحميل الصورة</button>
                <button id="quote-close-btn" style="flex: 1; padding: 12px; background: transparent; color: #fff; border: 1px solid #777; border-radius: 6px; cursor: pointer; font-size: 15px; transition: 0.2s;">إلغاء</button>
            </div>
        `;

        // Canvas Panel
        const canvasContainer = document.createElement('div');
        canvasContainer.style.cssText = `
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        `;

        const canvas = document.createElement('canvas');
        canvas.style.maxWidth = 'min(500px, 90vw)';
        canvas.style.maxHeight = '90vh';
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = '0 10px 40px rgba(0,0,0,0.6)';
        
        await document.fonts.load('60px "Arabic Poetry"');
        
        canvasContainer.appendChild(canvas);
        modal.appendChild(editorPanel);
        modal.appendChild(canvasContainer);
        document.body.appendChild(modal);

        // State
        let currentText = processedText;
        let fontSize = 125;
        let lineSpacing = -30; 
        let padding = 150; 

        const textarea = document.getElementById('quote-text-input');
        textarea.value = currentText;

        function updateCanvas() {
            currentText = textarea.value;
            drawQuote(canvas, currentText, fontSize, lineSpacing, padding);
        }

        textarea.addEventListener('input', updateCanvas);
        
        document.getElementById('quote-font-plus').onclick = () => { fontSize += 5; updateCanvas(); };
        document.getElementById('quote-font-minus').onclick = () => { fontSize -= 5; updateCanvas(); };
        document.getElementById('quote-lh-plus').onclick = () => { lineSpacing += 10; updateCanvas(); };
        document.getElementById('quote-lh-minus').onclick = () => { lineSpacing -= 10; updateCanvas(); };

        document.getElementById('quote-download-btn').onclick = () => {
            const link = document.createElement('a');
            link.download = 'اقتباس-الديوان.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        document.getElementById('quote-download-btn').onmouseover = (e) => e.target.style.background = '#eaddb8';
        document.getElementById('quote-download-btn').onmouseout = (e) => e.target.style.background = '#dcb98a';

        document.getElementById('quote-close-btn').onclick = () => modal.remove();

        // Initial draw
        updateCanvas();
    }

    function drawQuote(canvas, text, fontSize, lineSpacing, padding) {
        const ctx = canvas.getContext('2d');
        
        // Preserve empty lines by not filtering them out entirely, but splitting by \n
        let lines = text.split('\n').map(l => l.trim());
        
        // 1. Initial font setup to measure text width
        ctx.font = `${fontSize}px "Arabic Poetry", serif`;
        
        let maxLineWidth = 0;
        let totalTextHeight = 0;
        let lineHeight = fontSize + lineSpacing;
        let verseGap = 50; // Elegant, moderate gap between verses
        
        lines.forEach(line => {
            if (line === '') {
                totalTextHeight += verseGap;
            } else {
                let w = ctx.measureText(line).width;
                if (w > maxLineWidth) maxLineWidth = w;
                totalTextHeight += lineHeight;
            }
        });
        
        // 2. Set dynamic canvas dimensions
        // Elegant proportions wrapping exactly the text
        canvas.width = maxLineWidth + 300; // 150px margin on each side
        canvas.height = totalTextHeight + 380; // Tighter vertical padding since watermark is removed

        // 3. Re-apply context styles after changing dimensions
        ctx.font = `${fontSize}px "Arabic Poetry", serif`;
        ctx.direction = 'rtl';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Draw background (Solid dark warm gray)
        ctx.fillStyle = '#161514';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw elegant thin border
        ctx.strokeStyle = '#3d362e';
        ctx.lineWidth = 2;
        
        // Manual rounded rect (for broader compatibility or use standard if available)
        const margin = 40;
        const radius = 20;
        const w = canvas.width - (margin * 2);
        const h = canvas.height - (margin * 2);
        
        ctx.beginPath();
        ctx.moveTo(margin + radius, margin);
        ctx.lineTo(margin + w - radius, margin);
        ctx.quadraticCurveTo(margin + w, margin, margin + w, margin + radius);
        ctx.lineTo(margin + w, margin + h - radius);
        ctx.quadraticCurveTo(margin + w, margin + h, margin + w - radius, margin + h);
        ctx.lineTo(margin + radius, margin + h);
        ctx.quadraticCurveTo(margin, margin + h, margin, margin + h - radius);
        ctx.lineTo(margin, margin + radius);
        ctx.quadraticCurveTo(margin, margin, margin + radius, margin);
        ctx.closePath();
        ctx.stroke();

        // Setup Text Gradient for Soft Gold
        const textGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        textGrad.addColorStop(0, '#ebd197');
        textGrad.addColorStop(1, '#c49c66');
        ctx.fillStyle = textGrad;

        // Draw Ornaments
        const ornament = '❈ ❖ ❈';
        ctx.font = '48px Arial, sans-serif';
        
        // Position ornaments elegantly near the top and bottom borders, away from text
        ctx.fillText(ornament, canvas.width / 2, 120);
        ctx.fillText(ornament, canvas.width / 2, canvas.height - 120);

        // Draw Poetry Text
        ctx.font = `${fontSize}px "Arabic Poetry", serif`;
        
        // We subtract 50px to compensate for the font's massive internal top padding
        // This visually balances the top and bottom gaps
        let startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2) - 50;
        let currentY = startY;
        
        lines.forEach((line) => {
            if (line === '') {
                currentY += verseGap;
            } else {
                // Subtle shadow
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                
                ctx.fillText(line, canvas.width / 2, currentY);
                currentY += lineHeight;
            }
        });

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
})();
