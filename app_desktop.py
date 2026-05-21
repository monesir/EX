import os
import threading
import time
import urllib.parse
import re
import queue
import sys
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from tkinter.scrolledtext import ScrolledText
import cloudscraper
from bs4 import BeautifulSoup

def clean_filename(filename):
    if not filename:
        return ""
    # Remove invalid characters for Windows paths
    cleaned = re.sub(r'[\\/*?:"<>|]', "", filename).strip()
    # Replace multiple spaces with a single space
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # Truncate to prevent path length issues
    return cleaned[:100]

def extract_metadata(soup):
    poet_name = "غير محدد"
    poem_title = "غير محدد"
    era_name = "غير محدد"
    
    # Try finding the breadcrumb h2 inside m-section-2 or general container
    h2 = None
    m_section_2 = soup.find(class_='m-section-2') or soup.find('div', class_='col-12 relative')
    if m_section_2:
        h2 = m_section_2.find('h2')
    
    if not h2:
        h2 = soup.find('h2', class_='h3')
        
    if h2:
        parts = []
        for child in h2.children:
            if child.name == 'a':
                parts.append(child.get_text().strip())
            elif isinstance(child, str) or getattr(child, 'name', None) is None:
                t = str(child).strip()
                t = t.replace('»', '').replace('&raquo;', '').strip()
                if t:
                    parts.append(t)
            elif child.name == 'span':
                t = child.get_text().strip()
                t = t.replace('»', '').replace('&raquo;', '').strip()
                if t:
                    parts.append(t)
        
        parts = [p for p in parts if p]
        
        if len(parts) >= 4:
            # e.g. ['الديوان', 'عمان', 'أبو مسلم البهلاني', 'أزل جهل نفسي يا عليم وزكها']
            era_name = parts[1]
            poet_name = parts[2]
            poem_title = parts[3]
        elif len(parts) == 3:
            poet_name = parts[1]
            poem_title = parts[2]
        elif len(parts) == 2:
            poem_title = parts[1]
            
    # Fallbacks if metadata is missing from breadcrumbs
    if poet_name == "غير محدد" or poem_title == "غير محدد":
        meta_author = soup.find('meta', attrs={'name': 'author'})
        if meta_author:
            poet_name = meta_author.get('content', poet_name).strip()
            
        title_tag = soup.find('title')
        if title_tag:
            title_text = title_tag.get_text().strip()
            title_parts = title_text.split(' - ')
            if len(title_parts) >= 2:
                if poem_title == "غير محدد":
                    poem_title = title_parts[0].strip()
                if poet_name == "غير محدد":
                    poet_name = title_parts[1].strip()
                    
    return era_name, poet_name, poem_title

def extract_poem_text(soup):
    poem_div = soup.find(id="poem_content") or soup.find(class_="poem-content")
    
    if poem_div:
        # Try getting h3 and h4 tags first
        verses = poem_div.find_all(['h3', 'h4'])
        if verses:
            return [v.get_text().strip() for v in verses if v.get_text().strip()]
        
        # Fallback 1: get elements with class bet-1 and bet-2 inside the div
        bets = poem_div.find_all(class_=re.compile(r'bet-[12]'))
        if bets:
            lines = []
            for bet in bets:
                t = bet.get_text().strip()
                if t and t not in lines:
                    lines.append(t)
            return lines
            
        # Fallback 2: get direct child text nodes
        raw_text = poem_div.get_text('\n')
        lines = []
        for line in raw_text.split('\n'):
            line = line.strip()
            if line and line not in lines:
                lines.append(line)
        return lines
    
    # Fallback 3: if poem_div is not found, search the whole page for bet-1, bet-2
    bets = soup.find_all(class_=re.compile(r'bet-[12]'))
    if bets:
        lines = []
        for bet in bets:
            t = bet.get_text().strip()
            if t and t not in lines:
                lines.append(t)
        return lines
        
    return []

class AlDiwanScraperGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("مؤرشف موقع الديوان - النسخة المكتبية")
        self.root.geometry("850x650")
        self.root.configure(bg="#0f172a")
        
        # Handle close event safely
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # RTL support and fonts
        self.font_family = "Segoe UI"
        self.root.option_add("*Font", (self.font_family, 10))
        
        # State variables
        self.status = "idle"  # idle, running, paused
        self.downloaded_count = 0
        self.current_poet = "غير محدد"
        self.current_poem = "غير محدد"
        self.log_file_path = None
        
        # Queue for thread-safe GUI updates
        self.gui_queue = queue.Queue()
        
        # Threading flags
        self.stop_event = threading.Event()
        self.pause_event = threading.Event()
        self.pause_event.set()
        
        self.setup_ui()
        self.root.after(100, self.process_queue)
        
    def setup_ui(self):
        # Configure styles
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Custom styles
        self.style.configure("TFrame", background="#0f172a")
        self.style.configure("Card.TFrame", background="#1e293b", borderwidth=1, relief="solid")
        self.style.configure("TLabel", background="#0f172a", foreground="#f8fafc")
        self.style.configure("Card.TLabel", background="#1e293b", foreground="#f8fafc")
        self.style.configure("Title.TLabel", background="#0f172a", foreground="#818cf8", font=(self.font_family, 20, "bold"))
        self.style.configure("Header.TLabel", background="#1e293b", foreground="#c084fc", font=(self.font_family, 11, "bold"))
        self.style.configure("TProgressbar", thickness=8, troughcolor="#1e293b", background="#6366f1")

        # Main container
        main_frame = ttk.Frame(self.root, padding=25, style="TFrame")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Header
        header_lbl = ttk.Label(main_frame, text="مؤرشف الديوان الذكي", style="Title.TLabel")
        header_lbl.pack(pady=(0, 5))
        
        subtitle_lbl = ttk.Label(main_frame, text="أداة تحميل وأرشفة قصائد الشعراء تلقائياً وتنظيمها في مجلدات بقرص D", foreground="#94a3b8", font=(self.font_family, 10))
        subtitle_lbl.pack(pady=(0, 20))

        # Path Selection Frame
        path_frame = ttk.Frame(main_frame, style="TFrame")
        path_frame.pack(fill=tk.X, pady=(0, 20))
        
        path_lbl = ttk.Label(path_frame, text="مسار الحفظ:")
        path_lbl.pack(side=tk.RIGHT, padx=(10, 0))
        
        self.path_entry = tk.Entry(path_frame, font=(self.font_family, 10), bg="#1e293b", fg="#f8fafc",
                                   insertbackground="#ffffff", bd=1, relief="solid", highlightthickness=0)
        self.path_entry.insert(0, r"D:\aldiwan\Poets")
        self.path_entry.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=10, ipady=4)
        
        # Premium flat browse button
        self.browse_btn = self.create_premium_button(path_frame, "تصفح...", "#334155", "#475569", self.browse_directory)
        self.browse_btn.pack(side=tk.RIGHT)

        # Stats Grid Frame
        stats_frame = ttk.Frame(main_frame, style="TFrame")
        stats_frame.pack(fill=tk.X, pady=(0, 20))
        
        stats_frame.columnconfigure(0, weight=1)
        stats_frame.columnconfigure(1, weight=1)
        stats_frame.columnconfigure(2, weight=1)
        
        # Card 1: Status
        card1 = ttk.Frame(stats_frame, style="Card.TFrame", padding=15)
        card1.grid(row=0, column=2, padx=5, sticky="nsew")
        ttk.Label(card1, text="الحالة الحالية", style="Header.TLabel").pack()
        self.status_lbl = ttk.Label(card1, text="خامل", style="Card.TLabel", font=(self.font_family, 12, "bold"), foreground="#94a3b8")
        self.status_lbl.pack(pady=5)
        
        # Card 2: Current Poet / Poem
        card2 = ttk.Frame(stats_frame, style="Card.TFrame", padding=15)
        card2.grid(row=0, column=1, padx=5, sticky="nsew")
        ttk.Label(card2, text="الشاعر / القصيدة", style="Header.TLabel").pack()
        self.poet_lbl = ttk.Label(card2, text="غير محدد", style="Card.TLabel", font=(self.font_family, 10))
        self.poet_lbl.pack(pady=2)
        self.poem_lbl = ttk.Label(card2, text="غير محدد", style="Card.TLabel", font=(self.font_family, 9), foreground="#cbd5e1")
        self.poem_lbl.pack(pady=2)

        # Card 3: Downloaded Count
        card3 = ttk.Frame(stats_frame, style="Card.TFrame", padding=15)
        card3.grid(row=0, column=0, padx=5, sticky="nsew")
        ttk.Label(card3, text="القصائد المحملة", style="Header.TLabel").pack()
        self.count_lbl = ttk.Label(card3, text="0", style="Card.TLabel", font=(self.font_family, 14, "bold"), foreground="#10b981")
        self.count_lbl.pack(pady=5)

        # Progress Bar Frame
        self.progress_frame = ttk.Frame(main_frame, style="TFrame")
        self.progress_frame.pack(fill=tk.X, pady=(0, 15))
        self.progress_bar = ttk.Progressbar(self.progress_frame, mode='indeterminate', style="TProgressbar")
        self.progress_bar.pack(fill=tk.X)
        self.progress_frame.pack_forget() # Hidden initially

        # Controls Frame
        self.controls_frame = ttk.Frame(main_frame, style="TFrame")
        self.controls_frame.pack(pady=(0, 20))
        
        self.start_btn = self.create_premium_button(self.controls_frame, "بدء الأرشفة", "#6366f1", "#4f46e5", self.start_scraping)
        self.start_btn.pack(side=tk.RIGHT, padx=5)
        
        self.pause_btn = self.create_premium_button(self.controls_frame, "إيقاف مؤقت", "#475569", "#64748b", self.toggle_pause)
        self.pause_btn.pack(side=tk.RIGHT, padx=5)
        self.pause_btn.pack_forget() # Hidden initially
        
        self.stop_btn = self.create_premium_button(self.controls_frame, "إيقاف نهائي", "#ef4444", "#dc2626", self.stop_scraping)
        self.stop_btn.pack(side=tk.RIGHT, padx=5)
        self.stop_btn.pack_forget() # Hidden initially

        # Console Frame
        console_frame = ttk.LabelFrame(main_frame, text=" سجل المراقبة الفوري ", style="TFrame", labelanchor="ne")
        console_frame.pack(fill=tk.BOTH, expand=True)
        
        self.log_widget = ScrolledText(console_frame, bg="#020617", fg="#cbd5e1", insertbackground="white", 
                                       font=("Consolas", 10), wrap=tk.WORD, state=tk.DISABLED)
        self.log_widget.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.log("بانتظار بدء العملية...")

    def create_premium_button(self, parent, text, bg_color, hover_color, command):
        btn = tk.Button(parent, text=text, bg=bg_color, fg="#ffffff", activebackground=hover_color, 
                        activeforeground="#ffffff", bd=0, font=(self.font_family, 10, "bold"), 
                        padx=18, pady=8, cursor="hand2", command=command)
        btn.bind("<Enter>", lambda e: btn.config(bg=hover_color) if btn['state'] != 'disabled' else None)
        btn.bind("<Leave>", lambda e: btn.config(bg=bg_color) if btn['state'] != 'disabled' else None)
        return btn

    def browse_directory(self):
        dir_path = filedialog.askdirectory(initialdir="D:\\")
        if dir_path:
            self.path_entry.delete(0, tk.END)
            self.path_entry.insert(0, os.path.normpath(dir_path))

    def log(self, message):
        # Console output
        self.log_widget.config(state=tk.NORMAL)
        self.log_widget.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] {message}\n")
        self.log_widget.see(tk.END)
        self.log_widget.config(state=tk.DISABLED)
        
        # File logging
        if self.log_file_path:
            try:
                with open(self.log_file_path, "a", encoding="utf-8") as lf:
                    lf.write(f"[{time.strftime('%H:%M:%S')}] {message}\n")
            except Exception:
                pass

    def start_scraping(self):
        save_dir = self.path_entry.get().strip()
        if not save_dir:
            messagebox.showerror("خطأ", "الرجاء تحديد مسار الحفظ أولاً.")
            return
            
        self.status = "running"
        self.status_lbl.config(text="جاري العمل", foreground="#10b981")
        self.path_entry.config(state=tk.DISABLED)
        self.browse_btn.config(state=tk.DISABLED, bg="#1e293b", cursor="arrow")
        
        self.start_btn.pack_forget()
        self.pause_btn.pack(side=tk.RIGHT, padx=5)
        self.pause_btn.config(text="إيقاف مؤقت", bg="#475569")
        self.stop_btn.pack(side=tk.RIGHT, padx=5)
        
        self.progress_frame.pack(fill=tk.X, pady=(0, 15))
        self.progress_bar.start(10)
        
        self.downloaded_count = 0
        self.count_lbl.config(text="0")
        
        self.stop_event.clear()
        self.pause_event.set()
        
        # Initialize log file
        os.makedirs(save_dir, exist_ok=True)
        self.log_file_path = os.path.join(save_dir, "archive_log.txt")
        try:
            with open(self.log_file_path, "a", encoding="utf-8") as lf:
                lf.write(f"\n--- SCRAPING SESSION STARTED AT {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
        except Exception as e:
            self.log(f"تنبيه: فشل إنشاء ملف السجل المحلي: {e}")
            
        self.log(f"تم بدء عملية الأرشفة. مسار الحفظ: {save_dir}")
        
        # Start crawler thread
        threading.Thread(target=self.crawler_job, args=(save_dir,), daemon=True).start()

    def toggle_pause(self):
        if self.status == "running":
            self.status = "paused"
            self.status_lbl.config(text="موقوف مؤقتاً", foreground="#f59e0b")
            self.pause_btn.config(text="استئناف", bg="#10b981")
            self.pause_event.clear()
            self.progress_bar.stop()
            self.log("تم إيقاف الأرشفة مؤقتاً.")
        elif self.status == "paused":
            self.status = "running"
            self.status_lbl.config(text="جاري العمل", foreground="#10b981")
            self.pause_btn.config(text="إيقاف مؤقت", bg="#475569")
            self.pause_event.set()
            self.progress_bar.start(10)
            self.log("تم استئناف الأرشفة.")

    def stop_scraping(self):
        self.status = "idle"
        self.stop_event.set()
        self.pause_event.set() # Unblock if paused so thread can exit
        self.status_lbl.config(text="خامل", foreground="#94a3b8")
        self.path_entry.config(state=tk.NORMAL)
        self.browse_btn.config(state=tk.NORMAL, bg="#334155", cursor="hand2")
        
        self.progress_bar.stop()
        self.progress_frame.pack_forget()
        
        self.pause_btn.pack_forget()
        self.stop_btn.pack_forget()
        self.start_btn.pack(side=tk.RIGHT, padx=5)
        self.log("جاري إيقاف الأرشفة...")

    def on_close(self):
        if self.status == "running" or self.status == "paused":
            if messagebox.askokcancel("خروج", "العملية ما زالت مستمرة. هل تريد إيقاف الأرشفة وإغلاق البرنامج؟"):
                self.status = "idle"
                self.stop_event.set()
                self.pause_event.set()
                self.root.destroy()
        else:
            self.root.destroy()

    def process_queue(self):
        try:
            while True:
                msg_type, data = self.gui_queue.get_nowait()
                if msg_type == "log":
                    self.log(data)
                elif msg_type == "stat":
                    self.current_poet = data.get("poet", self.current_poet)
                    self.current_poem = data.get("poem", self.current_poem)
                    self.downloaded_count = data.get("count", self.downloaded_count)
                    
                    self.poet_lbl.config(text=self.current_poet)
                    self.poem_lbl.config(text=self.current_poem)
                    self.count_lbl.config(text=str(self.downloaded_count))
                elif msg_type == "done":
                    self.status = "idle"
                    self.status_lbl.config(text="مكتمل", foreground="#6366f1")
                    self.path_entry.config(state=tk.NORMAL)
                    self.browse_btn.config(state=tk.NORMAL, bg="#334155", cursor="hand2")
                    self.progress_bar.stop()
                    self.progress_frame.pack_forget()
                    self.pause_btn.pack_forget()
                    self.stop_btn.pack_forget()
                    self.start_btn.pack(side=tk.RIGHT, padx=5)
                    self.log("تم اكتمال أرشفة الموقع بالكامل!")
                    messagebox.showinfo("نجاح", "تمت أرشفة الموقع بالكامل بنجاح!")
                elif msg_type == "error":
                    self.status = "idle"
                    self.status_lbl.config(text="خطأ", foreground="#ef4444")
                    self.path_entry.config(state=tk.NORMAL)
                    self.browse_btn.config(state=tk.NORMAL, bg="#334155", cursor="hand2")
                    self.progress_bar.stop()
                    self.progress_frame.pack_forget()
                    self.pause_btn.pack_forget()
                    self.stop_btn.pack_forget()
                    self.start_btn.pack(side=tk.RIGHT, padx=5)
                    messagebox.showerror("خطأ", f"حدث خطأ أثناء الأرشفة: {data}")
        except queue.Empty:
            pass
        self.root.after(100, self.process_queue)
 
    def crawler_job(self, save_dir):
        BASE_URL = "https://www.aldiwan.net"
        scraper = cloudscraper.create_scraper()
        
        def get_soup(url, max_retries=3):
            while not self.pause_event.is_set():
                if self.stop_event.is_set():
                    return None
                time.sleep(0.5)
                
            if self.stop_event.is_set():
                return None
                
            retries = 0
            backoff = 2.0
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
                'Referer': 'https://www.aldiwan.net/'
            }
            
            while retries < max_retries:
                if self.stop_event.is_set():
                    return None
                try:
                    response = scraper.get(url, headers=headers, timeout=20)
                    if response.status_code == 200:
                        return BeautifulSoup(response.text, 'html.parser')
                    elif response.status_code == 429:
                        self.gui_queue.put(("log", f"تنبيه: تم تلقي خطأ 429 (طلب زائد). الانتظار لـ {backoff * 2} ثوانٍ..."))
                        time.sleep(backoff * 2)
                    else:
                        self.gui_queue.put(("log", f"كود خطأ في الاتصال {response.status_code} لـ {url}. محاولة {retries + 1}/{max_retries}..."))
                except Exception as e:
                    self.gui_queue.put(("log", f"خطأ في الاتصال {url}: {e}. محاولة {retries + 1}/{max_retries}..."))
                
                retries += 1
                if retries < max_retries:
                    time.sleep(backoff)
                    backoff *= 2
                    
            self.gui_queue.put(("log", f"فشل تحميل الصفحة: {url}"))
            return None

        # Start scraping
        soup = get_soup(BASE_URL)
        if not soup:
            self.gui_queue.put(("error", "فشل الاتصال بالصفحة الرئيسية لموقع الديوان."))
            return
            
        cat_links = []
        for a in soup.find_all('a', href=True):
            if 'cat-poets-' in a['href'] and a['href'] not in cat_links:
                cat_links.append(a['href'])
                
        self.gui_queue.put(("log", f"تم العثور على {len(cat_links)} قسم رئيسي للشعراء."))
        
        visited_poets = set()
        visited_poems = set()
        count = 0
        
        for cat_link in cat_links:
            if self.stop_event.is_set():
                break
                
            cat_url = urllib.parse.urljoin(BASE_URL, cat_link)
            self.gui_queue.put(("log", f"فحص القسم: {cat_link}"))
            cat_soup = get_soup(cat_url)
            if not cat_soup:
                continue
                
            poet_dict = {}
            for a in cat_soup.find_all('a', href=True):
                href = a['href']
                if 'cat-poet-' in href and 'cat-poets-' not in href:
                    name = a.get_text().strip()
                    if name:
                        poet_dict[href] = name
                        
            for poet_href, poet_name in poet_dict.items():
                if self.stop_event.is_set():
                    break
                    
                if poet_href in visited_poets:
                    continue
                visited_poets.add(poet_href)
                
                poet_name_clean = clean_filename(poet_name)
                if not poet_name_clean:
                    continue
                    
                self.gui_queue.put(("stat", {"poet": poet_name_clean, "poem": "جاري الفحص..."}))
                
                page_num = 1
                poet_dir = None
                while True:
                    if self.stop_event.is_set():
                        break
                        
                    poet_page_url = urllib.parse.urljoin(BASE_URL, f"{poet_href}?page={page_num}") if page_num > 1 else urllib.parse.urljoin(BASE_URL, poet_href)
                    p_soup = get_soup(poet_page_url)
                    if not p_soup:
                        break
                        
                    if not poet_dir:
                        era_name = "مجهول"
                        h2 = p_soup.find('h2')
                        if h2:
                            parts = [p.strip() for p in h2.get_text().split('»')]
                            if len(parts) >= 2 and parts[1]:
                                era_name = clean_filename(parts[1])
                                if not era_name:
                                    era_name = "مجهول"
                        poet_dir = os.path.join(save_dir, era_name, poet_name_clean)
                        os.makedirs(poet_dir, exist_ok=True)
                        
                        bio_div = p_soup.find('div', class_='info-container') or p_soup.find('div', class_='s-menu1')
                        if bio_div:
                            bio_text = bio_div.get_text(separator='\n', strip=True)
                            if bio_text:
                                try:
                                    with open(os.path.join(poet_dir, "نبذة عن الشاعر.txt"), "w", encoding="utf-8") as bf:
                                        bf.write(f"الشاعر: {poet_name_clean}\n")
                                        bf.write("-" * 40 + "\n\n")
                                        bf.write(bio_text)
                                except Exception:
                                    pass
                        
                    poems_on_page = []
                    for a in p_soup.find_all('a', href=True):
                        # Match things like poem1234.html or /poem1234.html or https://www.aldiwan.net/poem1234.html
                        href = a['href']
                        if re.search(r'poem\d+', href):
                            poems_on_page.append((href, a.text.strip()))
                            
                    if not poems_on_page:
                        break
                        
                    for poem_href, poem_title in poems_on_page:
                        if self.stop_event.is_set():
                            break
                            
                        if poem_href in visited_poems:
                            continue
                        visited_poems.add(poem_href)
                        
                        poem_title_clean = clean_filename(poem_title)
                        if not poem_title_clean:
                            # Parse digit from href for uniqueness
                            digit_match = re.search(r'poem(\d+)', poem_href)
                            poem_title_clean = f"poem_{digit_match.group(1)}" if digit_match else "unnamed_poem"
                            
                        self.gui_queue.put(("stat", {"poet": poet_name_clean, "poem": poem_title_clean}))
                        
                        poem_path = os.path.join(poet_dir, f"{poem_title_clean}.txt")
                        # Skip only if file exists, is not empty (size > 10 bytes)
                        if os.path.exists(poem_path) and os.path.getsize(poem_path) > 10:
                            count += 1
                            self.gui_queue.put(("stat", {"count": count}))
                            continue
                            
                        poem_url = urllib.parse.urljoin(BASE_URL, poem_href)
                        poem_soup = get_soup(poem_url)
                        if not poem_soup:
                            continue
                            
                        era_name, parsed_poet_name, parsed_poem_title = extract_metadata(poem_soup)
                        lines = extract_poem_text(poem_soup)
                        
                        if lines:
                            # Detect classical vs free/prose
                            is_classical = False
                            for tag in poem_soup.find_all('a', href=True):
                                href = tag['href']
                                if 'Type-عموديه' in href or 'Type-عمودية' in href or 'sea-' in href or 'بحر ' in tag.get_text():
                                    is_classical = True
                                    break
                            
                            formatted_lines = []
                            if is_classical and len(lines) >= 2:
                                i = 0
                                while i < len(lines):
                                    if i + 1 < len(lines):
                                        formatted_lines.append(f"{lines[i]} * {lines[i+1]}")
                                        i += 2
                                    else:
                                        formatted_lines.append(lines[i])
                                        i += 1
                            else:
                                formatted_lines = lines
                                
                            # Save with clean metadata header
                            output = []
                            output.append(f"القصيدة: {parsed_poem_title}")
                            output.append(f"الشاعر: {parsed_poet_name}")
                            if era_name and era_name != "غير محدد":
                                output.append(f"العصر/القسم: {era_name}")
                            output.append("-" * 40)
                            output.append("")
                            output.extend(formatted_lines)
                            
                            try:
                                with open(poem_path, 'w', encoding='utf-8') as f:
                                    f.write('\n'.join(output))
                                self.gui_queue.put(("log", f"تم حفظ: {poem_title_clean} ({poet_name_clean})"))
                            except Exception as e:
                                self.gui_queue.put(("log", f"خطأ في كتابة ملف القصيدة: {e}"))
                                
                            count += 1
                            self.gui_queue.put(("stat", {"count": count}))
                            
                        time.sleep(0.1)
                        
                    # Locate next pagination page
                    next_page_link = p_soup.find('a', rel='next')
                    if not next_page_link:
                        # Fallbacks
                        next_page_link = p_soup.find('a', href=lambda h: h and f'page={page_num + 1}' in h)
                    if not next_page_link:
                        pagination_links = p_soup.select('.pagination a, ul.pagination a, .pages a')
                        for link in pagination_links:
                            if f'page={page_num + 1}' in link.get('href', ''):
                                next_page_link = link
                                break
                                
                    if not next_page_link:
                        break
                    page_num += 1
 
        if not self.stop_event.is_set():
            self.gui_queue.put(("done", None))
        else:
            self.gui_queue.put(("log", "تم إيقاف الأرشفة بطلب من المستخدم."))
 
if __name__ == "__main__":
    root = tk.Tk()
    app = AlDiwanScraperGUI(root)
    root.mainloop()
