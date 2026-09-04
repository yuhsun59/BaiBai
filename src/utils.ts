import { Lunar, Solar } from 'lunar-javascript';
import { FestivalDef } from './data';

export interface CalculatedDate {
  solarDate: Date;
  lunarStr: string;
  isWeekend: boolean;
  suggestedDate: Date | null;
  daysLeft: number;
}

export function calculateFestivalDate(year: number, def: FestivalDef): CalculatedDate {
  let solarObj: Solar | null = null;
  let lunarStr = '';

  if (def.type === 'lunar') {
    if (def.day === 0 && def.month === 1) {
      // Eve of Lunar New Year
      const newYearLunar = Lunar.fromYmd(year, 1, 1);
      solarObj = newYearLunar.getSolar().next(-1);
      const eveLunar = solarObj.getLunar();
      lunarStr = `農曆十二月${eveLunar.getDayInChinese()}`;
    } else {
      const lunarObj = Lunar.fromYmd(year, def.month!, def.day!);
      solarObj = lunarObj.getSolar();
      lunarStr = `農曆${lunarObj.getMonthInChinese()}月${lunarObj.getDayInChinese()}`;
    }
  } else if (def.type === 'solar_term' && def.term) {
    // Find the solar term in the given year
    // Qingming is in April (month 4)
    // Dongzhi is in December (month 12)
    const monthToCheck = def.term === '清明' ? 4 : 12;
    for (let i = 1; i <= 31; i++) {
      try {
        const d = Solar.fromYmd(year, monthToCheck, i);
        if (d.getLunar().getJieQi() === def.term) {
          solarObj = d;
          lunarStr = `國曆 ${monthToCheck}/${i} (${def.term})`;
          break;
        }
      } catch (e) {
        // ignore invalid dates like April 31
      }
    }
  }

  if (!solarObj) {
    // Fallback if something goes wrong
    solarObj = Solar.fromYmd(year, 1, 1);
  }

  const jsDate = new Date(solarObj.getYear(), solarObj.getMonth() - 1, solarObj.getDay());
  
  const week = jsDate.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = week === 0 || week === 6;
  
  let suggestedDate: Date | null = null;
  if (!def.mustOnDay && !isWeekend) {
    // Find the previous Saturday
    const diff = -(week + 1); // If Monday (1), diff is -2 (Saturday)
    const suggestedSolar = solarObj.next(diff);
    suggestedDate = new Date(suggestedSolar.getYear(), suggestedSolar.getMonth() - 1, suggestedSolar.getDay());
  }

  // Calculate days left relative to today
  const targetDateToCompare = suggestedDate || jsDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateToCompare);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    solarDate: jsDate,
    lunarStr,
    isWeekend,
    suggestedDate,
    daysLeft
  };
}

export function formatDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  return `${m}/${d} (${week})`;
}

export const escapeICS = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

export function generateICS(title: string, description: string, date: Date, isWeekendRange: boolean) {
  const formatForIcs = (d: Date) => {
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${MM}${dd}`;
  };

  const dtstart = formatForIcs(date);
  
  const nextD = new Date(date);
  if (isWeekendRange) {
    nextD.setDate(date.getDate() + 2); // Sat to Mon (exclusive end)
  } else {
    nextD.setDate(date.getDate() + 1); // 1 day event
  }
  const dtend = formatForIcs(nextD);

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Yilan BaiBai Helper//TW
BEGIN:VEVENT
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
SUMMARY:${escapeICS(title)}
DESCRIPTION:${escapeICS(description)}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
