export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORY_LIST: TemplateCategory[] = [
  { id: 'morning',  name: '早安打卡', icon: '🌅' },
  { id: 'holiday',  name: '节日祝福', icon: '🎉' },
  { id: 'quote',    name: '金句卡片', icon: '💎' },
  { id: 'mood',     name: '情绪语录', icon: '💭' },
  { id: 'reading',  name: '读书笔记', icon: '📚' },
  { id: 'fitness',  name: '健身打卡', icon: '💪' },
];
