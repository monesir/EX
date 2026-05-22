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

        // Attempt to auto-split halves if they are separated by a wide gap (tabs or multiple spaces)
        let processedText = initialText.replace(/\t/g, '\n').replace(/ {2,}/g, '\n');
        
        // Editor Panel
        const editorPanel = document.createElement('div');
        editorPanel.style.cssText = `
            background: var(--bg-card, #2f2824); padding: 20px; border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; gap: 15px;
            width: 350px; border: 1px solid var(--border-main, #3e3833);
            direction: rtl; font-family: Tahoma, Arial, sans-serif;
        `;
        
        editorPanel.innerHTML = `
            <h3 style="margin: 0; color: #fff; font-size: 18px; text-align: center; border-bottom: 1px solid #444; padding-bottom: 10px;">تعديل الاقتباس</h3>
            <textarea id="quote-text-input" rows="8" style="
                width: 100%; background: rgba(0,0,0,0.2); color: #fff; 
                border: 1px solid #555; border-radius: 8px; padding: 10px; 
                font-family: 'Arabic Poetry', serif; font-size: 18px; resize: vertical;
                box-sizing: border-box;
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
                <button id="quote-download-btn" style="flex: 1; padding: 12px; background: #d4af37; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.2s;">تحميل الصورة</button>
                <button id="quote-close-btn" style="flex: 1; padding: 12px; background: transparent; color: #fff; border: 1px solid #777; border-radius: 6px; cursor: pointer; font-size: 15px; transition: 0.2s;">إلغاء</button>
            </div>
        `;

        // Canvas Panel
        const canvasContainer = document.createElement('div');
        canvasContainer.style.cssText = `
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        `;

        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080; // Default square, but we will resize it dynamically based on content
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
        let fontSize = 65;
        let lineSpacing = 60; // Extra spacing between lines
        let padding = 100; // Padding around text

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

        document.getElementById('quote-download-btn').onmouseover = (e) => e.target.style.background = '#e5c158';
        document.getElementById('quote-download-btn').onmouseout = (e) => e.target.style.background = '#d4af37';

        document.getElementById('quote-close-btn').onclick = () => modal.remove();

        // Initial draw
        updateCanvas();
    }

    function drawQuote(canvas, text, fontSize, lineSpacing, padding) {
        const ctx = canvas.getContext('2d');
        
        // Split exact newlines entered by user
        let lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        // Calculate required height based on lines and font size
        let lineHeight = fontSize + lineSpacing;
        let totalTextHeight = lines.length * lineHeight;
        
        // Set canvas dimensions dynamically (minimum 1080x1080 for square look, but expand if needed)
        canvas.width = 1080;
        canvas.height = Math.max(1080, totalTextHeight + (padding * 2) + 150); // 150 for watermark/borders

        // Draw elegant dark background
        ctx.fillStyle = '#111317'; // Very dark, professional grey-blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw subtle pattern or gradient overlay
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, 'rgba(30, 35, 45, 0.5)'); 
        grad.addColorStop(1, 'rgba(10, 12, 15, 0.8)'); 
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw elegant double border
        ctx.strokeStyle = '#d4af37'; // Gold
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)'; // Faded Gold
        ctx.lineWidth = 1;
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

        // Configure text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.direction = 'rtl';
        ctx.font = \`\${fontSize}px "Arabic Poetry", serif\`;
        
        // Draw text vertically centered
        let startY = (canvas.height - totalTextHeight) / 2 + (lineHeight / 2) - 30;

        lines.forEach((line, index) => {
            // Shadow for text depth
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
            
            ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });

        // Reset shadow for watermark
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw watermark at bottom
        ctx.font = '28px Tahoma, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('aldiwan.net - موسوعة الديوان', canvas.width / 2, canvas.height - 75);
    }
})();
