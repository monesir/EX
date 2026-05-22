(function() {
    // List of Arabic fonts
    const fonts = [
        { family: "", name: "الخط الافتراضي", baseSize: 1.25, lhMult: 1.6, margin: "" },
        { family: "'Arabic Poetry', serif", name: "عام الشعر العربي", baseSize: 2.5, lhMult: 1.15, margin: "margin: 0.9rem 0 !important;" },
        { family: "custom", name: "رابط مخصص...", baseSize: 1.4, lhMult: 1.6, margin: "" }
    ];
    let currentFontIndex = 0; // Default to site default
    let customFamilyStr = "";
    
    // User zoom offset
    let userFontSizeOffset = 0; 
    
    function injectButtons() {
        const actionContainer = document.querySelector('.poem-actions');
        if (!actionContainer) return; // Only inject if we are on a poem page
        
        // Unified Font Control Group
        const fontGroup = document.createElement('div');
        fontGroup.className = 'premium-font-group';

        // Button: Increase Font Size
        const fontIncBtn = document.createElement('a');
        fontIncBtn.href = 'javascript:void(0)';
        fontIncBtn.title = 'تكبير الخط';
        fontIncBtn.innerHTML = '<i class="fa fa-search-plus"></i>';
        fontIncBtn.className = 'premium-font-btn font-inc-btn';
        
        const div1 = document.createElement('div');
        div1.className = 'premium-divider';

        // Container for Font Fam
        const famContainer = document.createElement('div');
        famContainer.style.position = 'relative';
        famContainer.style.display = 'inline-flex';
        famContainer.style.alignItems = 'center';

        // Button: Change Font Family
        const fontFamBtn = document.createElement('a');
        fontFamBtn.href = 'javascript:void(0)';
        fontFamBtn.title = 'تغيير نوع الخط';
        fontFamBtn.innerHTML = '<i class="fas fa-pen-nib" style="margin-left: 5px;"></i><span class="label" style="font-weight: normal; font-size: 14px;">الخط</span>';
        fontFamBtn.className = 'premium-font-btn font-fam-btn';

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
                
                if (f.family === "custom") {
                    let url = prompt("الرجاء إدخال رابط Google Fonts\\nمثال:\\nhttps://fonts.googleapis.com/css2?family=Cairo&display=swap");
                    if (!url || !url.trim()) return; // Canceled
                    
                    let parsedName = null;
                    let match = url.match(/family=([^&:]+)/);
                    if (match && match[1]) {
                        parsedName = match[1].replace(/\+/g, ' ').split(':')[0];
                    }
                    if (!parsedName) {
                        alert("عذراً، الرابط غير صحيح. يجب أن يكون الرابط من موقع Google Fonts.");
                        return;
                    }
                    
                    if (!document.querySelector(`link[href="${url}"]`)) {
                        let link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = url;
                        document.head.appendChild(link);
                    }
                    
                    customFamilyStr = `'${parsedName}', sans-serif`;
                }

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
        fontDecBtn.className = 'premium-font-btn font-dec-btn';
        
        const div2 = document.createElement('div');
        div2.className = 'premium-divider';

        // Add to group
        fontGroup.appendChild(fontIncBtn);
        fontGroup.appendChild(div1);
        fontGroup.appendChild(famContainer);
        fontGroup.appendChild(div2);
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
        if (fonts[currentFontIndex].family === "custom" && customFamilyStr) {
            fontRule = `font-family: ${customFamilyStr} !important; font-weight: normal !important;`;
        } else if (fonts[currentFontIndex].family && fonts[currentFontIndex].family !== "custom") {
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

    // Load the local custom OTF font
    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
        /* Hide the original sun icon (day/night toggle) to clean up toolbar */
        .poem-actions a:has(.fa-sun),
        .poem-actions a:has(.fa-cog),
        .poem-actions .fa-sun,
        .poem-actions a[onclick*="darkMode"],
        .poem-actions a[href*="darkMode"] {
            display: none !important;
        }

        /* Native-matching Toolbar Styles */
        .premium-font-group {
            display: inline-flex;
            align-items: center;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 50px !important;
            margin: 0 5px;
            transition: all 0.2s ease;
        }
        .premium-font-group:hover {
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }
        .premium-font-btn {
            padding: 8px 15px !important;
            color: rgba(255, 255, 255, 0.7) !important;
            text-decoration: none !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            position: relative;
            background: transparent;
            line-height: 1;
        }
        .premium-font-btn:hover {
            color: #fff !important;
            background: rgba(255, 255, 255, 0.05);
        }
        .premium-font-btn:active {
            transform: scale(0.95);
        }
        .premium-font-btn i {
            font-size: 14px;
        }
        .font-inc-btn { border-radius: 0 50px 50px 0; }
        .font-dec-btn { border-radius: 50px 0 0 50px; }
        
        .premium-divider {
            width: 1px;
            height: 20px;
            background: rgba(255, 255, 255, 0.15);
        }

        @font-face {
            font-family: 'Arabic Poetry';
            src: url('${chrome.runtime.getURL("arabic-poetry.otf")}') format('opentype');
        }
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
            btn.innerHTML = '<i class="fas fa-palette"></i> السمات';
            btn.title = 'تغيير السمة';
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
            
            // Format poetry before copying using smart detection
            let lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
            let formattedLines = [];
            let bet1Nodes = document.querySelectorAll('.bet-1');
            
            if (bet1Nodes.length > 0) {
                let bet1Texts = Array.from(bet1Nodes).map(n => n.innerText.trim());
                let currentVerse = [];
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    
                    if (bet1Texts.includes(line)) {
                        if (currentVerse.length > 0) {
                            formattedLines.push(currentVerse.join("    \n"));
                            currentVerse = [];
                        }
                        currentVerse.push(line);
                    } else {
                        currentVerse.push(line);
                        // Force push if it reaches 2 parts
                        if (currentVerse.length === 2) {
                            formattedLines.push(currentVerse.join("    \n"));
                            currentVerse = [];
                        }
                    }
                }
                if (currentVerse.length > 0) {
                    formattedLines.push(currentVerse.join("    \n"));
                }
            } else {
                formattedLines = lines; // Free verse, just keep lines
            }
            
            navigator.clipboard.writeText(formattedLines.join('\n\n'));
            
            // Feedback
            copyItem.innerHTML = '<i class="fas fa-check" style="margin-left: 8px; color: #ebd197;"></i> تم النسخ بذكاء!';
            setTimeout(() => { customMenu.remove(); }, 1200);
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
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                <span style="color: #ccc; font-size: 14px;">لون الخط</span>
                <input type="color" id="quote-text-color" value="#ffffff" style="border: none; border-radius: 4px; width: 65px; height: 35px; cursor: pointer; background: transparent;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                <span style="color: #ccc; font-size: 14px;">إظهار الزخارف</span>
                <input type="checkbox" id="quote-show-ornaments" checked style="width: 20px; height: 20px; cursor: pointer;">
            </div>
            
            <div id="quote-image-controls" style="display: none; flex-direction: column; gap: 10px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                <div style="color: #dcb98a; font-size: 13px; text-align: center; margin-bottom: 5px; font-weight: bold;">إعدادات الصورة</div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span style="color: #aaa; font-size: 12px; width: 45px;">تعتيم</span>
                    <input type="range" id="quote-bg-dim" min="0" max="95" value="65" style="flex: 1;">
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span style="color: #aaa; font-size: 12px; width: 45px;">تغبيش</span>
                    <input type="range" id="quote-bg-blur" min="0" max="20" value="0" style="flex: 1;">
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span style="color: #ccc; font-size: 12px; width: 45px;">حجم</span>
                    <input type="range" id="quote-bg-zoom" min="100" max="300" value="100" style="flex: 1;">
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span style="color: #aaa; font-size: 12px; width: 45px;">أفقياً</span>
                    <input type="range" id="quote-bg-x" min="-1000" max="1000" value="0" style="flex: 1;">
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span style="color: #aaa; font-size: 12px; width: 45px;">عمودياً</span>
                    <input type="range" id="quote-bg-y" min="-1000" max="1000" value="0" style="flex: 1;">
                </div>
                <button id="quote-bg-remove" style="margin-top: 5px; padding: 5px; background: #6b2f2f; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">إزالة الصورة</button>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button id="quote-bg-btn" style="flex: 1; padding: 12px; background: transparent; color: #fff; border: 1px solid #777; border-radius: 6px; cursor: pointer; font-size: 15px; transition: 0.2s;">صورة خلفية</button>
                <input type="file" id="quote-bg-input" accept="image/*" style="display: none;">
                <button id="quote-download-btn" style="flex: 2; padding: 12px; background: #dcb98a; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.2s;">تحميل الصورة</button>
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
        let backgroundImage = null;
        let bgDim = 65;
        let bgBlur = 0;
        let bgZoom = 100;
        let bgPanX = 0;
        let bgPanY = 0;
        let textColor = '#ffffff';
        let showOrnaments = true;

        const textarea = document.getElementById('quote-text-input');
        textarea.value = currentText;

        function updateCanvas() {
            currentText = textarea.value;
            
            const controlsPanel = document.getElementById('quote-image-controls');
            if (backgroundImage) {
                controlsPanel.style.display = 'flex';
                document.getElementById('quote-bg-btn').style.display = 'none'; // hide the add background button
            } else {
                controlsPanel.style.display = 'none';
                document.getElementById('quote-bg-btn').style.display = 'block';
            }
            
            drawQuote(canvas, currentText, fontSize, lineSpacing, padding, backgroundImage, bgDim, bgBlur, bgZoom, bgPanX, bgPanY, textColor, showOrnaments);
        }

        textarea.addEventListener('input', updateCanvas);
        
        document.getElementById('quote-font-plus').onclick = () => { fontSize += 5; updateCanvas(); };
        document.getElementById('quote-font-minus').onclick = () => { fontSize -= 5; updateCanvas(); };
        document.getElementById('quote-lh-plus').onclick = () => { lineSpacing += 10; updateCanvas(); };
        document.getElementById('quote-lh-minus').onclick = () => { lineSpacing -= 10; updateCanvas(); };

        document.getElementById('quote-text-color').oninput = (e) => { textColor = e.target.value; updateCanvas(); };
        document.getElementById('quote-show-ornaments').onchange = (e) => { showOrnaments = e.target.checked; updateCanvas(); };

        // Image Controls events
        document.getElementById('quote-bg-dim').oninput = (e) => { bgDim = parseInt(e.target.value); updateCanvas(); };
        document.getElementById('quote-bg-blur').oninput = (e) => { bgBlur = parseInt(e.target.value); updateCanvas(); };
        document.getElementById('quote-bg-zoom').oninput = (e) => { bgZoom = parseInt(e.target.value); updateCanvas(); };
        document.getElementById('quote-bg-x').oninput = (e) => { bgPanX = parseInt(e.target.value); updateCanvas(); };
        document.getElementById('quote-bg-y').oninput = (e) => { bgPanY = parseInt(e.target.value); updateCanvas(); };
        
        document.getElementById('quote-bg-remove').onclick = () => { 
            backgroundImage = null; 
            bgDim = 65; bgBlur = 0; bgZoom = 100; bgPanX = 0; bgPanY = 0;
            document.getElementById('quote-bg-dim').value = bgDim;
            document.getElementById('quote-bg-blur').value = bgBlur;
            document.getElementById('quote-bg-zoom').value = bgZoom;
            document.getElementById('quote-bg-x').value = bgPanX;
            document.getElementById('quote-bg-y').value = bgPanY;
            document.getElementById('quote-bg-input').value = '';
            updateCanvas(); 
        };

        document.getElementById('quote-bg-btn').onclick = () => {
            document.getElementById('quote-bg-input').click();
        };

        document.getElementById('quote-bg-input').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    backgroundImage = img;
                    updateCanvas();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };

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

    function drawQuote(canvas, text, fontSize, lineSpacing, padding, backgroundImage, bgDim, bgBlur, bgZoom, bgPanX, bgPanY, textColor, showOrnaments) {
        const ctx = canvas.getContext('2d');
        
        // Clean canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let lines = text.split('\n').map(l => l.trim());
        
        // MUST set font BEFORE measuring text!
        ctx.font = `${fontSize}px "Arabic Poetry", serif`;
        
        let maxLineWidth = 0;
        let totalTextHeight = 0;
        let lineHeight = fontSize + lineSpacing;
        let verseGap = fontSize * 0.4; // Scales with font size
        
        lines.forEach(line => {
            if (line === '') {
                totalTextHeight += verseGap;
            } else {
                let w = ctx.measureText(line).width;
                if (w > maxLineWidth) maxLineWidth = w;
                totalTextHeight += lineHeight;
            }
        });
        
        // Exact Optical Centering & Majestic Layout Logic
        let visualOffset = fontSize * 0.4; // Font internal top padding
        let visualHeight = totalTextHeight - visualOffset;
        let ornamentGap = fontSize * 0.9; // Perfect elegant gap
        let m1 = 20; // Outer border margin
        let m2 = 28; // Inner border margin
        let visualTopEmptySpace = showOrnaments ? m1 + (ornamentGap * 2) : m1 + (ornamentGap * 1.5);

        // 2. Set dynamic canvas dimensions
        // Canvas width uses a perfect golden ratio padding (approx 4.5x font size total)
        canvas.width = maxLineWidth + (fontSize * 4.5); 
        canvas.height = visualHeight + (visualTopEmptySpace * 2);

        // 3. Re-apply context styles after changing dimensions
        ctx.font = `${fontSize}px "Arabic Poetry", serif`;
        ctx.direction = 'rtl';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Draw background (Solid dark warm gray)
        ctx.fillStyle = '#141311'; // Slightly darker for ultimate premium feel
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (backgroundImage) {
            let scale = Math.max(canvas.width / backgroundImage.width, canvas.height / backgroundImage.height) * (bgZoom / 100);
            let w = backgroundImage.width * scale;
            let h = backgroundImage.height * scale;
            
            // Calculate absolute maximum pan distances
            let maxPanX = Math.max(0, (w - canvas.width) / 2);
            let maxPanY = Math.max(0, (h - canvas.height) / 2);
            
            // Clamp the pan values so we never expose the canvas background
            let clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, bgPanX));
            let clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, bgPanY));
            
            // Update the UI sliders dynamically so they feel native and bounded
            const sliderX = document.getElementById('quote-bg-x');
            const sliderY = document.getElementById('quote-bg-y');
            if (sliderX && sliderY) {
                sliderX.min = -Math.ceil(maxPanX);
                sliderX.max = Math.ceil(maxPanX);
                sliderY.min = -Math.ceil(maxPanY);
                sliderY.max = Math.ceil(maxPanY);
            }
            
            let x = (canvas.width / 2) - (w / 2) + clampedPanX;
            let y = (canvas.height / 2) - (h / 2) + clampedPanY;
            
            if (bgBlur > 0) {
                ctx.filter = `blur(${bgBlur}px)`;
            }
            
            // Set opacity based on user dimension choice (100 - bgDim = alpha)
            ctx.globalAlpha = (100 - bgDim) / 100; 
            ctx.drawImage(backgroundImage, x, y, w, h);
            
            // Reset
            ctx.filter = 'none';
            ctx.globalAlpha = 1.0;
        }

        // Global Shadow for readability over textured background images
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;

        // Draw elegant double border only if there is NO background image
        if (!backgroundImage) {
            ctx.strokeStyle = '#3d362e';
            
            function drawRoundedRect(x, y, w, h, r) {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
                ctx.stroke();
            }

            // Outer thin border
            ctx.lineWidth = 1;
            drawRoundedRect(m1, m1, canvas.width - (m1 * 2), canvas.height - (m1 * 2), 15);
            
            // Inner thin border
            ctx.lineWidth = 1;
            drawRoundedRect(m2, m2, canvas.width - (m2 * 2), canvas.height - (m2 * 2), 11);
        }

        if (textColor === '#ebd197') {
            // Setup Text Gradient for Soft Gold if using default color
            const textGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            textGrad.addColorStop(0, '#ebd197');
            textGrad.addColorStop(1, '#c49c66');
            ctx.fillStyle = textGrad;
        } else {
            ctx.fillStyle = textColor;
        }

        // Calculate visual bounds
        let visualTop = visualTopEmptySpace;
        let visualBottom = visualTop + visualHeight;

        // Draw Ornaments
        if (showOrnaments) {
            const ornament = '❈ ❖ ❈';
            let ornamentFontSize = Math.max(24, fontSize * 0.4);
            ctx.font = `bold ${ornamentFontSize}px Arial, sans-serif`;
            
            // Position ornaments exactly symmetric relative to the visual text block
            ctx.fillText(ornament, canvas.width / 2, visualTop - ornamentGap);
            ctx.fillText(ornament, canvas.width / 2, visualBottom + ornamentGap);
        }

        // Draw Poetry Text
        ctx.font = `${fontSize}px "Arabic Poetry", serif`;
        
        // Mathematical top is adjusted by visualOffset to place the text ink at visualTop
        let mathTop = visualTop - visualOffset;
        let startY = mathTop + (lineHeight / 2);
        let currentY = startY;
        
        lines.forEach((line) => {
            if (line === '') {
                currentY += verseGap;
            } else {
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
