import { SubTaskType, TaskStatus } from './types';
import { Layout, CheckCircle, Clock, AlertCircle, Video, Image, Globe, ShoppingBag, User } from 'lucide-react';

// --- CONFIGURATION ---
// Change this to your Synology IP and Port
export const API_BASE_URL = 'http://192.168.1.230:8080'; 

export const ALL_SUB_TASK_TYPES = [
  SubTaskType.RETAIL_CN,
  SubTaskType.ALI_CN,
  SubTaskType.ALI_EN,
  SubTaskType.BOSS_EN,
  SubTaskType.CROSS_BORDER_EN,
  SubTaskType.ALIEXPRESS_01,
  SubTaskType.ALIEXPRESS_02,
  SubTaskType.ALIEXPRESS_JM,
  SubTaskType.MAIN_VIDEO,
  SubTaskType.OP_VIDEO,
];

export const STATUS_COLORS = {
  [TaskStatus.PENDING]: 'bg-gray-100 text-gray-600 border-gray-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-600 border-blue-200',
  [TaskStatus.REVIEW]: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  [TaskStatus.COMPLETED]: 'bg-green-50 text-green-600 border-green-200',
};

// Map task types to Lucide icons for visual flair
export const TASK_ICONS: Record<SubTaskType, any> = {
  [SubTaskType.RETAIL_CN]: ShoppingBag,
  [SubTaskType.ALI_CN]: ShoppingBag,
  [SubTaskType.ALI_EN]: Globe,
  [SubTaskType.BOSS_EN]: User,
  [SubTaskType.CROSS_BORDER_EN]: Globe,
  [SubTaskType.ALIEXPRESS_01]: ShoppingBag,
  [SubTaskType.ALIEXPRESS_02]: ShoppingBag,
  [SubTaskType.ALIEXPRESS_JM]: ShoppingBag,
  [SubTaskType.MAIN_VIDEO]: Video,
  [SubTaskType.OP_VIDEO]: Video,
};
