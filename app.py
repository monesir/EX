import os
import threading
import time
import urllib.parse
import re
import cloudscraper
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request, Response
import webbrowser

app = Flask(__name__)

# Global state for tracking progress
state = {
    "status": "idle",  # idle, running, paused, done, error
    "current_poet": "غير محدد",
    "current_poem": "غير محدد",
    "downloaded_count": 0,
    "logs": [],
    "save_dir": r"D:\aldiwan\Poets"
}
state_lock = threading.Lock()
stop_event = threading.Event()
pause_event = threading.Event()
pause_event.set()  # Initialized as not paused

def log_message(msg):
    with state_lock:
        print(msg)
        state["logs"].append(f"[{time.strftime('%H:%M:%S')}] {msg}")
        if len(state["logs"]) > 150:
            state["logs"].pop(0)

def clean_filename(filename):
    return re.sub(r'[\\/*?:"<>|]', "", filename).strip()

def crawler_thread():
    global state
    
    BASE_URL = "https://www.aldiwan.net"
    
    with state_lock:
        save_dir = state["save_dir"]
        
    os.makedirs(save_dir, exist_ok=True)
    scraper = cloudscraper.create_scraper()
    
    def get_soup(url):
        while not pause_event.is_set():
            if stop_event.is_set():
                return None
            time.sleep(0.5)
            
        if stop_event.is_set():
            return None
            
        try:
            response = scraper.get(url, timeout=15)
            if response.status_code == 200:
                return BeautifulSoup(response.text, 'html.parser')
            else:
                log_message(f"خطأ في الاتصال {url}: كود الاستجابة {response.status_code}")
        except Exception as e:
            log_message(f"خطأ في الاتصال {url}: {e}")
        return None

    log_message("بدء فحص موقع الديوان...")
    soup = get_soup(BASE_URL)
    if not soup:
        log_message("فشل الوصول إلى الصفحة الرئيسية.")
        with state_lock:
            state["status"] = "error"
        return
        
    cat_links = set()
    for a in soup.find_all('a', href=True):
        if 'cat-poets-' in a['href']:
            cat_links.add(a['href'])
            
    log_message(f"تم العثور على {len(cat_links)} قسم رئيسي.")
    
    visited_poets = set()
    visited_poems = set()
    
    for cat_link in cat_links:
        if stop_event.is_set():
            break
            
        cat_url = urllib.parse.urljoin(BASE_URL, cat_link)
        log_message(f"فحص القسم: {cat_link}")
        cat_soup = get_soup(cat_url)
        if not cat_soup:
            continue
            
        poet_links = []
        for a in cat_soup.find_all('a', href=True):
            if 'cat-poet-' in a['href'] and 'cat-poets-' not in a['href']:
                poet_links.append((a['href'], a.text.strip()))
                
        for poet_href, poet_name in poet_links:
            if stop_event.is_set():
                break
                
            if poet_href in visited_poets:
                continue
            visited_poets.add(poet_href)
            
            poet_name = clean_filename(poet_name)
            if not poet_name:
                continue
                
            with state_lock:
                state["current_poet"] = poet_name
                
            poet_dir = os.path.join(save_dir, poet_name)
            os.makedirs(poet_dir, exist_ok=True)
            
            page_num = 1
            while True:
                if stop_event.is_set():
                    break
                    
                poet_page_url = urllib.parse.urljoin(BASE_URL, f"{poet_href}?page={page_num}") if page_num > 1 else urllib.parse.urljoin(BASE_URL, poet_href)
                p_soup = get_soup(poet_page_url)
                if not p_soup:
                    break
                    
                poems_on_page = []
                for a in p_soup.find_all('a', href=True):
                    if a['href'].startswith('poem'):
                        poems_on_page.append((a['href'], a.text.strip()))
                        
                if not poems_on_page:
                    break
                    
                for poem_href, poem_title in poems_on_page:
                    if stop_event.is_set():
                        break
                        
                    if poem_href in visited_poems:
                        continue
                    visited_poems.add(poem_href)
                    
                    poem_title = clean_filename(poem_title)
                    if not poem_title:
                        poem_title = poem_href.replace('.html', '')
                        
                    with state_lock:
                        state["current_poem"] = poem_title
                        
                    poem_path = os.path.join(poet_dir, f"{poem_title}.txt")
                    if os.path.exists(poem_path):
                        with state_lock:
                            state["downloaded_count"] += 1
                        continue
                        
                    poem_url = urllib.parse.urljoin(BASE_URL, poem_href)
                    poem_soup = get_soup(poem_url)
                    if not poem_soup:
                        continue
                        
                    lines = []
                    for element in poem_soup.select('.bet-1, .bet-2, h2, h3, h4, p'):
                        text = element.text.strip()
                        if text:
                            lines.append(text)
                            
                    if lines:
                        with open(poem_path, 'w', encoding='utf-8') as f:
                            f.write('\n'.join(lines))
                        log_message(f"تم حفظ قصيدة: {poem_title} للشاعر {poet_name}")
                        with state_lock:
                            state["downloaded_count"] += 1
                            
                    time.sleep(0.1)
                    
                next_page_link = p_soup.find('a', rel='next')
                if not next_page_link:
                    break
                page_num += 1

    with state_lock:
        if not stop_event.is_set():
            state["status"] = "done"
            log_message("اكتملت أرشفة الموقع بالكامل!")
        else:
            state["status"] = "idle"
            log_message("تم إيقاف الأرشفة.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/status')
def get_status():
    with state_lock:
        return jsonify(state)

@app.route('/api/control', methods=['POST'])
def control():
    global state
    data = request.json
    action = data.get("action")
    
    with state_lock:
        current_status = state["status"]
        
    if action == "start":
        if current_status in ["idle", "error", "done"]:
            save_dir = data.get("save_dir", r"D:\aldiwan\Poets")
            with state_lock:
                state["status"] = "running"
                state["save_dir"] = save_dir
                state["logs"] = []
                state["downloaded_count"] = 0
                
            stop_event.clear()
            pause_event.set()
            threading.Thread(target=crawler_thread, daemon=True).start()
            log_message("تم تشغيل الأرشفة من الواجهة الرسومية.")
            
    elif action == "pause":
        if current_status == "running":
            pause_event.clear()
            with state_lock:
                state["status"] = "paused"
            log_message("تم إيقاف الأرشفة مؤقتاً.")
            
    elif action == "resume":
        if current_status == "paused":
            pause_event.set()
            with state_lock:
                state["status"] = "running"
            log_message("تم استئناف الأرشفة.")
            
    elif action == "stop":
        stop_event.set()
        pause_event.set()
        with state_lock:
            state["status"] = "idle"
        log_message("جاري إيقاف الأرشفة...")
        
    return jsonify({"success": True})

if __name__ == '__main__':
    # Try to open the browser automatically
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:5000")
        
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(port=5000, debug=False)
