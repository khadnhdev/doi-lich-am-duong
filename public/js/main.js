let currentLanguage = localStorage.getItem('language') || 'vi';
let currentTheme = localStorage.getItem('theme') || 'light';
let currentMonth = new Date();

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = darkModeToggle.querySelector('i');
    if (icon) {
        icon.className = currentTheme === 'dark' 
            ? 'fas fa-sun text-yellow-400' 
            : 'fas fa-moon text-gray-600';
    }
}

// Language toggle
const languageToggle = document.getElementById('languageToggle');
if (languageToggle) {
    languageToggle.addEventListener('click', toggleLanguage);
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'vi' ? 'en' : 'vi';
    localStorage.setItem('language', currentLanguage);
    updateUI();
}

function updateUI() {
    const lang = LANGUAGES[currentLanguage];
    
    // Update all text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const text = key.split('.').reduce((obj, i) => obj[i], lang);
        if (text) element.textContent = text;
    });
}

// Format functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatLunarDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseLunarDate(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) {
        throw new Error('Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng YYYY-MM-DD');
    }
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        throw new Error('Ngày tháng không hợp lệ');
    }
    
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error('Ngày tháng không hợp lệ');
    }
    
    return { year, month, day };
}

async function convertToLunar() {
    const solarDate = document.getElementById('solarDate').value;
    
    try {
        const response = await fetch('/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: solarDate,
                type: 'solar-to-lunar'
            })
        });
        
        const result = await response.json();
        if (result.error) {
            showNotification(result.error, 'error');
            return;
        }
        
        // Format lunar date
        document.getElementById('lunarDate').value = formatLunarDate(result.year, result.month, result.day);
        
        // Update year info
        const yearInfo = document.getElementById('yearInfo');
        if (yearInfo) {
            yearInfo.textContent = result.yearName;
        }
        
        showNotification('Chuyển đổi thành công!', 'success');
    } catch (error) {
        console.error('Lỗi chuyển đổi:', error);
        showNotification('Có lỗi xảy ra khi chuyển đổi!', 'error');
    }
}

async function convertToSolar() {
    const lunarDateInput = document.getElementById('lunarDate').value;
    
    try {
        // Validate and parse lunar date
        const lunarDate = parseLunarDate(lunarDateInput);
        
        const response = await fetch('/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: formatLunarDate(lunarDate.year, lunarDate.month, lunarDate.day),
                type: 'lunar-to-solar'
            })
        });
        
        const result = await response.json();
        if (result.error) {
            showNotification(result.error, 'error');
            return;
        }
        
        document.getElementById('solarDate').value = formatDate(new Date(result));
        showNotification('Chuyển đổi thành công!', 'success');
    } catch (error) {
        console.error('Lỗi chuyển đổi:', error);
        showNotification(error.message || 'Có lỗi xảy ra khi chuyển đổi!', 'error');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `
        fixed top-4 right-4 p-4 rounded-lg shadow-lg
        ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}
        text-white
        transform transition-all duration-300
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon();
    updateUI();
    
    // Check for saved preferences
    if (currentTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Tự động chuyển đổi ngày hôm nay
    convertToLunar();
});

function updateCalendar(date) {
  fetch(`/calendar?date=${date.toISOString()}`)
    .then(response => response.json())
    .then(data => {
      // Update calendar grid
      const calendarGrid = document.getElementById('calendarGrid');
      // ... update calendar HTML ...
    });
}

document.querySelector('.prev-month').addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  updateCalendar(currentMonth);
});

document.querySelector('.next-month').addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  updateCalendar(currentMonth);
}); 