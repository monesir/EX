(function() {
    // List of Arabic fonts
    const fonts = [
        { family: "", name: "الخط الافتراضي", baseSize: 1.25 },
        { family: "'Arabic Poetry', serif", name: "عام الشعر العربي", baseSize: 2.5 },
        { family: "'Aref Ruqaa', serif", name: "خط الرقعه", baseSize: 1.4 }
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
            sizeRule = `font-size: ${finalSize}rem !important;`;
            lhRule = `line-height: ${finalSize * 1.6}rem !important;`;
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
})();
