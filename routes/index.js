const express = require('express');
const router = express.Router();
const { SolarDate, LunarDate } = require('@nghiavuive/lunar_date_vi');

// Danh sách các ngày lễ âm lịch
const LUNAR_FESTIVALS = [
  { name: 'Tết Nguyên Đán', month: 1, day: 1, duration: 3, type: 'major' },
  { name: 'Tết Hàn Thực', month: 3, day: 3, duration: 1, type: 'normal' },
  { name: 'Tết Đoan Ngọ', month: 5, day: 5, duration: 1, type: 'normal' },
  { name: 'Lễ Vu Lan', month: 7, day: 15, duration: 1, type: 'normal' },
  { name: 'Tết Trung Thu', month: 8, day: 15, duration: 1, type: 'normal' },
  { name: 'Tết Thượng Nguyên', month: 1, day: 15, duration: 1, type: 'normal' },
  { name: 'Tết Trung Nguyên', month: 7, day: 15, duration: 1, type: 'normal' },
  { name: 'Tết Hạ Nguyên', month: 10, day: 15, duration: 1, type: 'normal' }
];

function getUpcomingFestivals(currentLunarDate) {
  const today = new SolarDate(new Date());
  const todayJd = today.jd;
  const upcomingFestivals = [];

  // Tính cho năm hiện tại và năm sau
  for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
    const year = currentLunarDate.year + yearOffset;
    
    for (const festival of LUNAR_FESTIVALS) {
      const festivalDate = new LunarDate({
        year: year,
        month: festival.month,
        day: festival.day
      });
      festivalDate.init();
      const solarDate = festivalDate.toSolarDate();
      
      if (solarDate.jd >= todayJd) {
        const daysUntil = solarDate.jd - todayJd;
        upcomingFestivals.push({
          name: festival.name,
          lunarDate: {
            day: festival.day,
            month: festival.month,
            year: year
          },
          solarDate: solarDate.toDate(),
          daysUntil,
          type: festival.type,
          duration: festival.duration
        });
      }
    }
  }

  // Sắp xếp theo ngày gần nhất
  return upcomingFestivals
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5); // Chỉ lấy 5 ngày lễ gần nhất
}

function getMonthCalendar(solarDate) {
  const firstDay = new Date(solarDate.year, solarDate.month - 1, 1);
  const lastDay = new Date(solarDate.year, solarDate.month, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Lùi về ngày CN đầu tiên

  const calendar = [];
  const currentDate = new Date(startDate);

  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(currentDate);
      const solar = new SolarDate(date);
      const lunar = solar.toLunarDate();
      lunar.init();

      weekDays.push({
        solar: {
          date: date,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          isCurrentMonth: date.getMonth() === solarDate.month - 1
        },
        lunar: {
          day: lunar.day,
          month: lunar.month,
          isFirstDay: lunar.day === 1
        },
        isToday: date.toDateString() === new Date().toDateString()
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    calendar.push(weekDays);
  }

  return calendar;
}

// Thêm hàm tính ngày tốt
function getGoodDays(solarDate) {
  const firstDay = new Date(solarDate.year, solarDate.month - 1, 1);
  const lastDay = new Date(solarDate.year, solarDate.month, 0);
  const goodDays = [];

  // Duyệt qua từng ngày trong tháng
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(solarDate.year, solarDate.month - 1, d);
    const solar = new SolarDate(date);
    const lunar = solar.toLunarDate();
    lunar.init();

    // Kiểm tra các yếu tố để xác định ngày tốt
    const isGoodDay = checkGoodDay(lunar);
    if (isGoodDay.isGood) {
      goodDays.push({
        solar: {
          date: date,
          day: d,
          month: solarDate.month,
          year: solarDate.year
        },
        lunar: {
          day: lunar.day,
          month: lunar.month,
          year: lunar.year,
          dayName: lunar.getDayName(),
          monthName: lunar.getMonthName()
        },
        activities: isGoodDay.activities,
        reasons: isGoodDay.reasons
      });
    }
  }
  return goodDays;
}

function checkGoodDay(lunarDate) {
  // Danh sách các ngày hoàng đạo theo can chi
  const hoangDao = {
    'Tý': ['Bính Dần', 'Bính Thân', 'Đinh Dậu', 'Giáp Thìn', 'Giáp Tuất', 'Kỷ Sửu', 'Kỷ Mùi'],
    'Sửu': ['Ất Mão', 'Ất Dậu', 'Bính Tuất', 'Giáp Thân', 'Mậu Dần', 'Mậu Thân'],
    'Dần': ['Ất Tỵ', 'Ất Hợi', 'Bính Tý', 'Đinh Sửu', 'Mậu Tuất', 'Quý Mùi'],
    'Mão': ['Bính Dần', 'Canh Thân', 'Đinh Mão', 'Đinh Dậu', 'Giáp Tý', 'Mậu Ngọ'],
    'Thìn': ['Ất Sửu', 'Đinh Mùi', 'Giáp Dần', 'Giáp Thân', 'Kỷ Mão', 'Kỷ Dậu'],
    'Tỵ': ['Bính Thìn', 'Bính Tuất', 'Đinh Hợi', 'Giáp Ngọ', 'Mậu Tý', 'Quý Mùi'],
    'Ngọ': ['Ất Tỵ', 'Bính Ngọ', 'Canh Tý', 'Đinh Mùi', 'Giáp Dần', 'Mậu Thân'],
    'Mùi': ['Bính Thân', 'Canh Dần', 'Đinh Dậu', 'Giáp Thìn', 'Kỷ Tỵ', 'Kỷ Hợi'],
    'Thân': ['Ất Dậu', 'Đinh Hợi', 'Giáp Ngọ', 'Kỷ Sửu', 'Mậu Thìn', 'Mậu Tuất'],
    'Dậu': ['Ất Hợi', 'Bính Tý', 'Canh Ngọ', 'Đinh Sửu', 'Giáp Thân', 'Mậu Dần'],
    'Tuất': ['Bính Dần', 'Canh Thân', 'Đinh Mão', 'Kỷ Tỵ', 'Mậu Ngọ', 'Quý Sửu'],
    'Hợi': ['Ất Mão', 'Canh Tuất', 'Đinh Tỵ', 'Giáp Tuất', 'Kỷ Sửu', 'Mậu Thân']
  };

  // Các hoạt động phù hợp với từng chi
  const activities = {
    'Tý': ['Khai trương', 'Xuất hành', 'Cầu tài', 'Nhập trạch'],
    'Sửu': ['Xây dựng', 'Sửa chữa', 'Động thổ', 'An táng'],
    'Dần': ['Cưới hỏi', 'Khai trương', 'Nhập trạch', 'Xuất hành'],
    'Mão': ['Cầu tài', 'Khai trương', 'Xuất hành', 'Gieo trồng'],
    'Thìn': ['Xây dựng', 'Động thổ', 'Nhập trạch', 'An táng'],
    'Tỵ': ['Cưới hỏi', 'Khai trương', 'Xuất hành', 'Cầu phúc'],
    'Ngọ': ['Khai trương', 'Xuất hành', 'Gieo trồng', 'Cầu tài'],
    'Mùi': ['Xây dựng', 'Sửa chữa', 'An táng', 'Động thổ'],
    'Thân': ['Cưới hỏi', 'Khai trương', 'Nhập trạch', 'Cầu tài'],
    'Dậu': ['Xuất hành', 'Gieo trồng', 'Cầu phúc', 'Khai trương'],
    'Tuất': ['Xây dựng', 'Động thổ', 'An táng', 'Sửa chữa'],
    'Hợi': ['Cưới hỏi', 'Khai trương', 'Nhập trạch', 'Cầu tài']
  };

  const dayName = lunarDate.getDayName(); // Ví dụ: "Giáp Tý"
  const [can, chi] = dayName.split(' '); // Tách can chi

  // Kiểm tra xem ngày có phải hoàng đạo không
  const isHoangDao = hoangDao[chi]?.includes(dayName);
  
  if (isHoangDao) {
    return {
      isGood: true,
      activities: activities[chi] || [],
      reasons: [
        'Ngày hoàng đạo',
        `Ngày ${dayName}`,
        'Phù hợp cho các hoạt động quan trọng'
      ]
    };
  }

  return { isGood: false };
}

router.get('/', (req, res) => {
  const today = new Date();
  const solarDate = new SolarDate(today);
  const lunarDate = solarDate.toLunarDate();
  lunarDate.init();
  
  const lunarYear = lunarDate.year;
  const upcomingFestivals = getUpcomingFestivals(lunarDate);
  const calendar = getMonthCalendar(solarDate);
  
  // Thêm danh sách ngày tốt
  const goodDays = getGoodDays(solarDate);
  
  res.render('index', {
    solar: today,
    solarDate,
    lunar: {
      date: lunarDate,
      year: lunarYear,
      month: lunarDate.month,
      day: lunarDate.day,
      leap: lunarDate.leap_month,
      yearName: lunarDate.getYearName(),
      monthName: lunarDate.getMonthName(),
      dayName: lunarDate.getDayName(),
      hourName: lunarDate.getHourName(),
      dayOfWeek: lunarDate.getDayOfWeek(),
      solarTerm: lunarDate.getSolarTerm(),
      luckyHours: lunarDate.getLuckyHours()
    },
    festivals: upcomingFestivals,
    calendar: calendar,
    goodDays: goodDays,
    title: 'Lịch Âm Dương'
  });
});

router.post('/convert', (req, res) => {
  const { date, type } = req.body;
  let result;
  
  try {
    if (type === 'solar-to-lunar') {
      const [year, month, day] = date.split('-').map(Number);
      const solarDate = new SolarDate({ year, month, day });
      const lunarDate = solarDate.toLunarDate();
      lunarDate.init();
      
      // Đảm bảo năm âm lịch được tính đúng
      const lunarYear = lunarDate.year;
      
      result = {
        year: lunarYear,
        month: lunarDate.month,
        day: lunarDate.day,
        leap: lunarDate.leap_month,
        yearName: lunarDate.getYearName(),
        monthName: lunarDate.getMonthName(),
        dayName: lunarDate.getDayName(),
        hourName: lunarDate.getHourName(),
        solarTerm: lunarDate.getSolarTerm(),
        luckyHours: lunarDate.getLuckyHours()
      };
    } else {
      const [year, month, day] = date.split('-').map(Number);
      const lunarDate = new LunarDate({ 
        year: year,
        month: month,
        day: day,
        leap_month: false // Mặc định không phải tháng nhuận
      });
      lunarDate.init();
      const solarDate = lunarDate.toSolarDate();
      result = solarDate.toDate();
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 