export enum SubTaskType {
  PRODUCT_PHOTO = '产品拍照',
  PRODUCT_RETOUCH = '产品修图',
  MAIN_IMAGE = '主图设计',
  DETAIL_IMAGE = '详情页设计',
  VIDEO_SHOOT = '视频拍摄',
  VIDEO_EDIT = '视频剪辑',
  VIDEO_SPECIAL_EFFECT = '视频特效',
  VIDEO_SUBTITLE = '视频字幕',
  FILE_EXPORT = '文件导出',
  QUALITY_CHECK = '质量检查',
}

export enum TaskStatus {
  PENDING = '待开始',
  IN_PROGRESS = '进行中',
  REVIEW = '审核中',
  COMPLETED = '已完成',
}

export interface User {
  id: string;
  name: string;
  password: string;
  createdAt: number;
  updatedAt: number;
}

export interface SubTask {
  id: string;
  type: string; // Changed from enum to string to allow flexibility if needed, though we use the enum list
  assignee: string; // Name of the designer
  assigneeDeviceId?: string; // To bind to a specific user/browser
  status: TaskStatus;
  lastUpdated: number;
  expectedCompletionDate?: number; // Timestamp for specific task deadline
  completedDate?: number; // Timestamp for when the task was completed
  filePath?: string; // Path to the finished file
}

export interface Project {
  id: string;
  name: string;
  description: string;
  imageUrl?: string; // Product image
  createdAt: number;
  deadline?: number; // Overall project target date
  hasChanges?: boolean; // Whether the project has changes that need attention
  changesDescription?: string; // Description of the changes
  changesCount?: number; // Number of times the project has been marked as needing changes
  items: SubTask[];
  itemsToChange?: string[]; // IDs of items that need to be changed
}

export interface User {
  id: string;
  name: string;
  password: string;
  createdAt: number;
  updatedAt: number;
  acknowledgedChanges?: string[]; // IDs of projects the user has acknowledged changes for
}

export interface UserIdentity {
  name: string;
  deviceId: string;
}

export interface Notification {
  id: string;
  timestamp: number;
  projectId: string;
  taskId: string;
  projectName: string;
  taskName: string;
  assignee: string;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  user: string; // Name of the user who performed the action
  action: string; // Description of the action
  projectId?: string; // ID of the affected project
  taskId?: string; // ID of the affected task
  details?: string; // Additional details about the action
}
