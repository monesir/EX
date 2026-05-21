import cloudscraper
from bs4 import BeautifulSoup
import os
import sys
import time
import urllib.parse
import re
import io

# Reconfigure stdout/stderr to support Arabic UTF-8 on Windows terminal
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

BASE_URL = "https://www.aldiwan.net"
SAVE_DIR = r"D:\aldiwan\Poets"

os.makedirs(SAVE_DIR, exist_ok=True)
scraper = cloudscraper.create_scraper()
log_file_path = os.path.join(SAVE_DIR, "archive_log.txt")

def log(message):
    timestamp = time.strftime('%H:%M:%S')
    formatted = f"[{timestamp}] {message}"
    print(formatted)
    try:
        with open(log_file_path, "a", encoding="utf-8") as lf:
            lf.write(formatted + "\n")
    except Exception:
        pass

def get_soup(url, max_retries=3):
    retries = 0
    backoff = 2.0
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
        'Referer': 'https://www.aldiwan.net/'
    }
    
    while retries < max_retries:
        try:
            response = scraper.get(url, headers=headers, timeout=20)
            if response.status_code == 200:
                return BeautifulSoup(response.text, 'html.parser')
            elif response.status_code == 429:
                log(f"تنبيه: تم تلقي خطأ 429 (طلب زائد). الانتظار لـ {backoff * 2} ثوانٍ...")
                time.sleep(backoff * 2)
            else:
                log(f"كود خطأ في الاتصال {response.status_code} لـ {url}. محاولة {retries + 1}/{max_retries}...")
        except Exception as e:
            log(f"خطأ في الاتصال {url}: {e}. محاولة {retries + 1}/{max_retries}...")
        
        retries += 1
        if retries < max_retries:
            time.sleep(backoff)
            backoff *= 2
            
    log(f"فشل تحميل الصفحة: {url}")
    return None

def clean_filename(filename):
    if not filename:
        return ""
    # Remove invalid characters for Windows paths
    cleaned = re.sub(r'[\\/*?:"<>|]', "", filename).strip()
    cleaned = re.sub(r'\s+', ' ', cleaned)
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
        verses = poem_div.find_all(['h3', 'h4'])
        if verses:
            return [v.get_text().strip() for v in verses if v.get_text().strip()]
        
        bets = poem_div.find_all(class_=re.compile(r'bet-[12]'))
        if bets:
            lines = []
            for bet in bets:
                t = bet.get_text().strip()
                if t and t not in lines:
                    lines.append(t)
            return lines
            
        raw_text = poem_div.get_text('\n')
        lines = []
        for line in raw_text.split('\n'):
            line = line.strip()
            if line and line not in lines:
                lines.append(line)
        return lines
    
    bets = soup.find_all(class_=re.compile(r'bet-[12]'))
    if bets:
        lines = []
        for bet in bets:
            t = bet.get_text().strip()
            if t and t not in lines:
                lines.append(t)
        return lines
        
    return []

def main():
    try:
        with open(log_file_path, "a", encoding="utf-8") as lf:
            lf.write(f"\n--- CLI CRAWLER SESSION STARTED AT {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
    except Exception:
        pass

    log("بدء مؤرشف الديوان الذكي (نسخة سطر الأوامر CLI)...")
    visited_poets = set()
    visited_poems = set()
    count = 0
    
    soup = get_soup(BASE_URL)
    if not soup:
        log("خطأ: فشل الوصول إلى الصفحة الرئيسية لموقع الديوان.")
        return
        
    cat_links = []
    for a in soup.find_all('a', href=True):
        if 'cat-poets-' in a['href'] and a['href'] not in cat_links:
            cat_links.append(a['href'])
            
    log(f"تم العثور على {len(cat_links)} قسم رئيسي للشعراء.")
    
    for cat_link in cat_links:
        cat_url = urllib.parse.urljoin(BASE_URL, cat_link)
        log(f"فحص القسم: {cat_link}")
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
            if poet_href in visited_poets:
                continue
            visited_poets.add(poet_href)
            
            poet_name_clean = clean_filename(poet_name)
            if not poet_name_clean:
                continue
                
            log(f"فحص الشاعر: {poet_name_clean}...")
            
            page_num = 1
            poet_dir = None
            while True:
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
                    poet_dir = os.path.join(SAVE_DIR, era_name, poet_name_clean)
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
                    href = a['href']
                    if re.search(r'poem\d+', href):
                        poems_on_page.append((href, a.text.strip()))
                        
                if not poems_on_page:
                    break
                    
                for poem_href, poem_title in poems_on_page:
                    if poem_href in visited_poems:
                        continue
                    visited_poems.add(poem_href)
                    
                    poem_title_clean = clean_filename(poem_title)
                    if not poem_title_clean:
                        digit_match = re.search(r'poem(\d+)', poem_href)
                        poem_title_clean = f"poem_{digit_match.group(1)}" if digit_match else "unnamed_poem"
                        
                    poem_path = os.path.join(poet_dir, f"{poem_title_clean}.txt")
                    if os.path.exists(poem_path) and os.path.getsize(poem_path) > 10:
                        count += 1
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
                            log(f"تم حفظ: {poem_title_clean} للشاعر ({poet_name_clean})")
                        except Exception as e:
                            log(f"خطأ في كتابة ملف القصيدة: {e}")
                            
                        count += 1
                        
                    time.sleep(0.1)
                    
                # Locate next pagination page
                next_page_link = p_soup.find('a', rel='next')
                if not next_page_link:
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

if __name__ == "__main__":
    try:
        main()
        log("تم الانتهاء من عملية الأرشفة بنجاح!")
    except KeyboardInterrupt:
        log("تم إيقاف الأرشفة بواسطة المستخدم (Ctrl+C).")
    except Exception as e:
        log(f"خطأ غير متوقع: {e}")
