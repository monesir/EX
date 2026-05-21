(function() {
    // List of Arabic fonts
    const fonts = [
        "Amiri, serif",
        "Tajawal, sans-serif",
        "Cairo, sans-serif",
        "Tahoma, sans-serif",
        "Arial, sans-serif"
    ];
    let currentFontIndex = 0;

    // Default font size (rem)
    let currentFontSize = 1.3; 
    
    function injectButtons() {
        const actionContainer = document.querySelector('.poem-actions');
        if (!actionContainer) return; // Only inject if we are on a poem page
        
        // Button: Change Font Family
        const fontFamBtn = document.createElement('a');
        fontFamBtn.className = 'poem-control pill action';
        fontFamBtn.href = 'javascript:void(0)';
        fontFamBtn.title = 'تغيير نوع الخط';
        fontFamBtn.innerHTML = '<i class="fa fa-font"></i><span class="label">نوع الخط</span>';
        
        // Button: Increase Font Size
        const fontIncBtn = document.createElement('a');
        fontIncBtn.className = 'poem-control icon-round action';
        fontIncBtn.href = 'javascript:void(0)';
        fontIncBtn.title = 'تكبير الخط';
        fontIncBtn.innerHTML = '<i class="fa fa-search-plus"></i>';

        // Button: Decrease Font Size
        const fontDecBtn = document.createElement('a');
        fontDecBtn.className = 'poem-control icon-round action';
        fontDecBtn.href = 'javascript:void(0)';
        fontDecBtn.title = 'تصغير الخط';
        fontDecBtn.innerHTML = '<i class="fa fa-search-minus"></i>';

        // Add buttons to the action bar
        actionContainer.appendChild(fontFamBtn);
        actionContainer.appendChild(fontIncBtn);
        actionContainer.appendChild(fontDecBtn);

        // Event Listeners
        fontFamBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentFontIndex = (currentFontIndex + 1) % fonts.length;
            updatePoemStyle();
        });

        fontIncBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentFontSize += 0.1;
            updatePoemStyle();
        });

        fontDecBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentFontSize -= 0.1;
            if (currentFontSize < 0.5) currentFontSize = 0.5;
            updatePoemStyle();
        });
    }

    function updatePoemStyle() {
        const poemContent = document.getElementById('poem_content');
        if (poemContent) {
            const verses = poemContent.querySelectorAll('h3');
            verses.forEach(v => {
                v.style.fontFamily = fonts[currentFontIndex];
                v.style.fontSize = currentFontSize + 'rem';
                // Adjust line height
                v.style.lineHeight = (currentFontSize * 1.6) + 'rem';
                v.style.height = 'auto'; // Override predefined inline height
            });
        }
    }

    // Add Google Fonts for Cairo and Tajawal to make them work better
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Tajawal:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Wait slightly to ensure page loads its components
    setTimeout(injectButtons, 1000);
})();
