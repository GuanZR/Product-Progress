import { Project, UserIdentity, User } from "../types";
import { API_BASE_URL } from "../constants";

const API_URL = `${API_BASE_URL}/api.php`;

export const apiService = {
  async fetchProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_projects`);
      if (!res.ok) {
        console.error('API error:', await res.text());
        return [];
      }
      const data = await res.json();
      // 确保返回的是数组
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      return [];
    }
  },

  async saveProject(project: Project): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?action=save_project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      
      const data = await res.json();
      
      if (!res.ok || (data.error && data.error.includes('Database connection failed'))) {
        console.error('保存项目失败:', data.error || '未知错误');
        throw new Error(data.error || '保存项目失败');
      }
    } catch (error) {
      console.error("保存项目失败:", error);
      throw error; // 抛出错误，让前端知道保存失败
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      await fetch(`${API_URL}?action=delete_project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  },

  async uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}?action=upload_image`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.url) {
        return data.url;
      } else {
        console.error('图片上传失败:', data.error || '未知错误');
        return null;
      }
    } catch (error) {
      console.error('图片上传异常:', error);
      return null;
    }
  },

  async fetchUsers(): Promise<UserIdentity[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_users`);
      if (!res.ok) {
        console.error('API error:', await res.text());
        return [];
      }
      const data = await res.json();
      // 确保返回的是数组
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  },

  async saveUser(user: UserIdentity): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?action=save_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('保存用户失败:', data.error || '未知错误');
        throw new Error(data.error || '保存用户失败');
      }
    } catch (error) {
      console.error("保存用户失败:", error);
      throw error;
    }
  },

  // User Management APIs
  async fetchAllUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_all_users`);
      if (!res.ok) {
        console.error('API error:', await res.text());
        return [];
      }
      const data = await res.json();
      // 确保返回的是数组，并将秒级时间戳转换为毫秒级
      return Array.isArray(data) ? data.map(user => ({
        ...user,
        createdAt: typeof user.createdAt === 'number' ? user.createdAt * 1000 : user.createdAt,
        updatedAt: typeof user.updatedAt === 'number' ? user.updatedAt * 1000 : user.updatedAt
      })) : [];
    } catch (error) {
      console.error("Failed to fetch all users:", error);
      return [];
    }
  },

  async createUser(user: User): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?action=create_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('创建用户失败:', data.error || '未知错误');
        throw new Error(data.error || '创建用户失败');
      }
    } catch (error) {
      console.error("创建用户失败:", error);
      throw error;
    }
  },

  async updateUser(user: User): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?action=update_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('更新用户失败:', data.error || '未知错误');
        throw new Error(data.error || '更新用户失败');
      }
    } catch (error) {
      console.error("更新用户失败:", error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await fetch(`${API_URL}?action=delete_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
    } catch (error) {
      console.error("删除用户失败:", error);
      throw error;
    }
  },

  async verifyUserPassword(password: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_URL}?action=verify_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.user) {
        return data.user;
      } else {
        return null;
      }
    } catch (error) {
      console.error("验证密码失败:", error);
      return null;
    }
  },

  // Notification APIs
  async fetchNotifications(): Promise<Notification[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_notifications`);
      if (!res.ok) {
        console.error('API error:', await res.text());
        return [];
      }
      const data = await res.json();
      // 确保返回的是数组
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  },

  async createNotification(notification: Notification): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?action=create_notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('创建通知失败:', data.error || '未知错误');
        throw new Error(data.error || '创建通知失败');
      }
    } catch (error) {
      console.error("创建通知失败:", error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await fetch(`${API_URL}?action=mark_notification_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notificationId }),
      });
    } catch (error) {
      console.error("标记通知为已读失败:", error);
      throw error;
    }
  },

  // Activity Log APIs
  async fetchActivityLogs(): Promise<ActivityLog[]> {
    try {
      const res = await fetch(`${API_URL}?action=get_activity_logs`);
      if (!res.ok) {
        console.error('API error:', await res.text());
        return [];
      }
      const data = await res.json();
      // 确保返回的是数组
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      return [];
    }
  },

  async createActivityLog(log: ActivityLog): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?action=create_activity_log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('创建日志失败:', data.error || '未知错误');
        throw new Error(data.error || '创建日志失败');
      }
    } catch (error) {
      console.error("创建日志失败:", error);
      throw error;
    }
  },
  
  async clearActivityLogs(): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?action=clear_activity_logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('清空日志失败:', data.error || '未知错误');
        throw new Error(data.error || '清空日志失败');
      }
    } catch (error) {
      console.error("清空日志失败:", error);
      throw error;
    }
  }
};