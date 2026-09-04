export type Target = '神明' | '祖先' | '地基主' | '好兄弟' | '天官大帝';

export interface OfferingItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface FestivalTarget {
  target: Target;
  items: OfferingItem[];
}

export interface FestivalDef {
  id: string;
  name: string;
  type: 'lunar' | 'solar_term';
  month?: number;
  day?: number;
  term?: string;
  mustOnDay?: boolean;
  targets: FestivalTarget[];
}

const createItem = (name: string): OfferingItem => ({ 
  id: Math.random().toString(36).substring(2, 9), 
  name, 
  checked: false 
});

const items = (...names: string[]) => names.map(createItem);

export const DEFAULT_FESTIVALS: FestivalDef[] = [
  {
    id: 'cny_eve',
    name: '除夕 (春節)',
    type: 'lunar',
    month: 1, 
    day: 0, // 0 represents the day before Lunar 1/1
    mustOnDay: true,
    targets: [
      { target: '神明', items: items('湯圓', '發糕', '三牲', '四季水果 (忌番茄、芭樂)', '茶酒', '壽金、大百壽金') },
      { target: '祖先', items: items('日常飯菜', '湯圓', '發糕', '水果', '茶酒', '刈金、銀紙') }
    ]
  },
  {
    id: 'yuanxiao',
    name: '元宵節',
    type: 'lunar',
    month: 1,
    day: 15,
    targets: [
      { target: '天官大帝', items: items('元宵 / 湯圓', '三牲', '水果', '壽金') },
      { target: '祖先', items: items('元宵 / 湯圓', '水果', '日常飯菜', '刈金、銀紙') }
    ]
  },
  {
    id: 'qingming',
    name: '清明節',
    type: 'solar_term',
    term: '清明',
    targets: [
      { target: '祖先', items: items('潤餅', '菜碗 (飯菜)', '水果', '三牲', '刈金、銀紙') }
    ]
  },
  {
    id: 'duanwu',
    name: '端午節',
    type: 'lunar',
    month: 5,
    day: 5,
    targets: [
      { target: '神明', items: items('肉粽', '水果', '茶酒', '壽金') },
      { target: '祖先', items: items('肉粽', '日常飯菜', '水果', '刈金、銀紙') },
      { target: '地基主', items: items('肉粽', '日常飯菜 (或雞腿便當)', '茶水', '刈金') }
    ]
  },
  {
    id: 'zhongyuan',
    name: '中元節',
    type: 'lunar',
    month: 7,
    day: 15,
    targets: [
      { target: '祖先', items: items('日常飯菜', '水果', '茶酒', '刈金、銀紙') },
      { target: '地基主', items: items('日常飯菜 (或雞腿便當)', '茶水', '刈金') }
    ]
  },
  {
    id: 'pudu',
    name: '中元普渡',
    type: 'lunar',
    month: 7,
    day: 15,
    targets: [
      { target: '好兄弟', items: items('泡麵、罐頭、零食', '飲料', '水果 (忌香蕉、李子、梨子)', '米酒', '普渡旗', '更衣、小銀') }
    ]
  },
  {
    id: 'zhongqiu',
    name: '中秋節',
    type: 'lunar',
    month: 8,
    day: 15,
    targets: [
      { target: '神明', items: items('月餅', '柚子', '水果', '壽金') },
      { target: '祖先', items: items('月餅', '柚子', '日常飯菜', '刈金、銀紙') },
      { target: '地基主', items: items('月餅', '日常飯菜', '刈金') }
    ]
  },
  {
    id: 'chongyang',
    name: '重陽節',
    type: 'lunar',
    month: 9,
    day: 9,
    targets: [
      { target: '祖先', items: items('日常飯菜', '水果', '刈金、銀紙') }
    ]
  },
  {
    id: 'dongzhi',
    name: '冬至',
    type: 'solar_term',
    term: '冬至',
    targets: [
      { target: '神明', items: items('湯圓', '水果', '壽金') },
      { target: '祖先', items: items('湯圓', '日常飯菜', '刈金、銀紙') }
    ]
  }
];
