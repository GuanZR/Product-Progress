import React, { useState, useEffect, useRef } from 'react';
import ProjectCard from './components/ProjectCard';
import SubTaskCard from './components/SubTaskCard';
import { Project, TaskStatus, SubTask, UserIdentity, User, Notification } from './types';
import { ALL_SUB_TASK_TYPES } from './constants';
import { Plus, Search, X, Image as ImageIcon, Sparkles, Trash2, GitBranch, KeyRound, Unlock, Lock, Upload, Maximize2, CheckCircle2, Check, Edit, Users, RefreshCw, Bell, BellOff, ChevronDown } from 'lucide-react';
import { checkPassword, generatePassword, isPasswordUnique } from './services/authService';
import { apiService } from './services/apiService';

// --- Constants ---
const STORAGE_DEVICE_ID_KEY = 'artflow_device_id';
const STORAGE_USER_NAME_KEY = 'artflow_user_name';
const STORAGE_LOGGED_IN_USER_KEY = 'artflow_logged_in_user';
const STORAGE_ADMIN_PASSWORD_KEY = 'artflow_admin_password';

// --- Helper Functions ---
const generateId = () => {
  // Simple fallback ID generator safe for all environments
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const getDeviceIdentity = (): UserIdentity => {
  let deviceId = localStorage.getItem(STORAGE_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateId();
    localStorage.setItem(STORAGE_DEVICE_ID_KEY, deviceId);
  }
  const name = localStorage.getItem(STORAGE_USER_NAME_KEY) || '';
  return { deviceId, name };
};

const saveUserIdentity = (name: string) => {
  localStorage.setItem(STORAGE_USER_NAME_KEY, name);
};

// --- Helper Components ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode, title?: React.ReactNode, maxWidth?: string }> = ({ isOpen, onClose, children, title, maxWidth = "max-w-6xl" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[95vh] overflow-y-auto shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-20">
                    <div className="text-xl font-bold text-gray-800">{title}</div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-[#F8F9FC]">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FC] font-sans text-gray-700 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-4">出错了</h1>
            <p className="text-gray-600 mb-4">页面加载过程中出现了错误</p>
            <pre className="bg-gray-100 p-4 rounded-lg text-left text-sm mb-4 overflow-auto max-w-md mx-auto">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Toast Component ---
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const Toast: React.FC<{ message: ToastMessage; onClose: (id: string) => void }> = ({ message, onClose }) => {
  return (
    <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg animate-in slide-in-from-right-5 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : message.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
      {message.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
      <span className="text-sm font-medium">{message.message}</span>
      <button onClick={() => onClose(message.id)} className="ml-auto text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'PENDING' | 'COMPLETED'>('ALL');
  
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [identity, setIdentity] = useState<UserIdentity>(getDeviceIdentity());
  const [knownUsers, setKnownUsers] = useState<UserIdentity[]>([]);
  
  // User Management State
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  
  // User Login State
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [userPasswordInput, setUserPasswordInput] = useState('');
  const [loginErrorMessage, setLoginErrorMessage] = useState<string>('');
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  
  // Activity Log Filter State
  const [logFilters, setLogFilters] = useState({
    startDate: '',
    endDate: '',
    user: '',
    action: '',
    project: '',
    includeAdmin: false // 是否包含管理员操作日志
  });
  
  // Admin login input
  const [adminInput, setAdminInput] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // 添加登录状态持久化
  useEffect(() => {
    const savedIsAdmin = localStorage.getItem('artflow_is_admin');
    if (savedIsAdmin === 'true') {
      setIsAdmin(true);
    }
    
    // 恢复用户登录状态
    const savedUser = localStorage.getItem(STORAGE_LOGGED_IN_USER_KEY);
    if (savedUser) {
      setLoggedInUser(JSON.parse(savedUser));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('artflow_is_admin', isAdmin.toString());
  }, [isAdmin]);
  
  // 保存登录用户到本地存储
  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem(STORAGE_LOGGED_IN_USER_KEY, JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem(STORAGE_LOGGED_IN_USER_KEY);
    }
  }, [loggedInUser]);
  
  // Load all users for admin management
  useEffect(() => {
    if (isAdmin) {
      const loadAllUsers = async () => {
        try {
          const users = await apiService.fetchAllUsers();
          setAllUsers(users);
        } catch (error) {
          console.error('Failed to load all users:', error);
        }
      };
      loadAllUsers();
    }
  }, [isAdmin]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const fetchedNotifications = await apiService.fetchNotifications();
        setNotifications(fetchedNotifications);
        // Calculate unread count
        const count = fetchedNotifications.filter(n => !n.read && n.assignee === loggedInUser?.name).length;
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loggedInUser]);

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read && n.assignee === loggedInUser?.name).length;
    setUnreadCount(count);
  }, [notifications, loggedInUser]);

  // Load activity logs
  useEffect(() => {
    const loadActivityLogs = async () => {
      try {
        const fetchedLogs = await apiService.fetchActivityLogs();
        setActivityLogs(fetchedLogs);
      } catch (error) {
        console.error('Failed to load activity logs:', error);
      }
    };

    if (isAdmin) {
      loadActivityLogs();
      // Poll for new logs every 60 seconds
      const interval = setInterval(loadActivityLogs, 60000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // New Project Form State
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjImage, setNewProjImage] = useState('');
  const [newProjDate, setNewProjDate] = useState('');
  const [selectedSubTasks, setSelectedSubTasks] = useState<string[]>(ALL_SUB_TASK_TYPES);
  const [customSubTaskName, setCustomSubTaskName] = useState('');
  const [customTaskFeedback, setCustomTaskFeedback] = useState('');
  
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Editing State (For Product Details Modal)
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editHasChanges, setEditHasChanges] = useState(false);
  const [editChangesDescription, setEditChangesDescription] = useState('');

  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // Toast Functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Load Data from Server
  useEffect(() => {
    const loadData = async () => {
        try {
            const loaded = await apiService.fetchProjects();
            // 确保 loaded 是数组
            const projects = Array.isArray(loaded) ? loaded : [];
            setProjects(projects);
        } catch (error) {
            console.error("Failed to load projects:", error);
            setProjects([]);
        }
    };
    
    const loadUsers = async () => {
        try {
            const users = await apiService.fetchUsers();
            setKnownUsers(users);
        } catch (error) {
            console.error("Failed to load users:", error);
            setKnownUsers([]);
        }
    };
    
    loadData();
    loadUsers();
    // Optional: Poll every 10 seconds to keep data fresh across clients
    const interval = setInterval(() => {
        loadData();
        loadUsers();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- Image Handling ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            // 显示上传中提示
            const loadingMsg = isEditMode ? "图片更新中..." : "图片上传中...";
            showToast(loadingMsg, 'info');
            
            const url = await apiService.uploadImage(file);
            if (url) {
                if (isEditMode) {
                    if (activeProject) {
                        const updated = { ...activeProject, imageUrl: url };
                        updateProject(updated);
                        showToast("图片更新成功", 'success');
                    }
                } else {
                    setNewProjImage(url);
                    showToast("图片上传成功", 'success');
                }
            } else {
                showToast("图片上传失败，请检查服务器配置", 'error');
            }
        } catch (error) {
            console.error("图片上传失败:", error);
            showToast("图片上传失败: " + (error instanceof Error ? error.message : "未知错误"), 'error');
        }
    }
  };

  // --- Actions ---

  const handleAdminLogin = async () => {
    // 从本地存储获取管理员密码，如果没有则使用默认密码
    const adminPassword = localStorage.getItem(STORAGE_ADMIN_PASSWORD_KEY) || 'admin';
    if (adminInput === adminPassword) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminInput('');
        showToast('登录成功', 'success');
    } else {
        showToast('密码错误', 'error');
    }
  };

  // 合并登录处理
  const handleUserLogin = async () => {
    try {
      // 清除之前的错误信息
      setLoginErrorMessage('');
      
      // 先检查是否是管理员密码
      const adminPassword = localStorage.getItem(STORAGE_ADMIN_PASSWORD_KEY) || 'admin';
      if (userPasswordInput === adminPassword) {
        // 管理员登录
        setIsAdmin(true);
        setShowUserLogin(false);
        setUserPasswordInput('');
        showToast('管理员登录成功', 'success');
        return;
      }
      
      // 再检查是否是普通用户密码
      const user = await apiService.verifyUserPassword(userPasswordInput);
      if (user) {
        // 用户登录
        setLoggedInUser(user);
        setShowUserLogin(false);
        setUserPasswordInput('');
        showToast('登录成功', 'success');
      } else {
        // 显示密码错误信息
        setLoginErrorMessage('密码错误，请重试');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setLoginErrorMessage('登录失败，请重试');
    }
  };

  // 用户退出登录
  const handleUserLogout = () => {
    setLoggedInUser(null);
    showToast('已退出登录', 'info');
  };

  // 生成随机密码
  const handleGeneratePassword = () => {
    let password;
    do {
      password = generatePassword();
    } while (!isPasswordUnique(password, allUsers));
    setNewUserPassword(password);
  };

  // 创建用户
  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      showToast('请输入用户名和密码', 'warning');
      return;
    }

    try {
      const newUser: User = {
        id: generateId(),
        name: newUserName.trim(),
        password: newUserPassword.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await apiService.createUser(newUser);
      const updatedUsers = [...allUsers, newUser];
      setAllUsers(updatedUsers);
      setNewUserName('');
      setNewUserPassword('');
      showToast('用户创建成功', 'success');
    } catch (error) {
      console.error('创建用户失败:', error);
      showToast('创建用户失败，请重试', 'error');
    }
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (confirm('确定要删除此用户吗？')) {
      try {
        await apiService.deleteUser(userId);
        const updatedUsers = allUsers.filter(user => user.id !== userId);
        setAllUsers(updatedUsers);
        showToast('用户删除成功', 'success');
      } catch (error) {
        console.error('删除用户失败:', error);
        showToast('删除用户失败，请重试', 'error');
      }
    }
  };

  // 更新用户密码
  const handleUpdateUserPassword = async (user: User, newPassword: string) => {
    try {
      const updatedUser = { ...user, password: newPassword, updatedAt: Date.now() };
      await apiService.updateUser(updatedUser);
      const updatedUsers = allUsers.map(u => u.id === user.id ? updatedUser : u);
      setAllUsers(updatedUsers);
      showToast('密码更新成功', 'success');
    } catch (error) {
      console.error('更新密码失败:', error);
      showToast('更新密码失败，请重试', 'error');
    }
  };

  // 修改管理员密码
  const handleChangeAdminPassword = async (newPassword: string) => {
    localStorage.setItem(STORAGE_ADMIN_PASSWORD_KEY, newPassword);
    showToast('管理员密码已更新', 'success');
  };

  // 创建通知
  const createNotification = async (project: Project, task: SubTask) => {
    if (!task.assignee) return;

    try {
      const notification: Notification = {
        id: generateId(),
        timestamp: Date.now(),
        projectId: project.id,
        taskId: task.id,
        projectName: project.name,
        taskName: task.type,
        assignee: task.assignee,
        read: false
      };

      await apiService.createNotification(notification);
      // 更新本地通知列表
      setNotifications(prev => [...prev, notification]);
    } catch (error) {
      console.error('创建通知失败:', error);
    }
  };

  // 标记通知为已读
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      // 更新本地通知列表
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error('标记通知为已读失败:', error);
    }
  };

  // 查看通知详情
  const handleViewNotification = (notification: Notification) => {
    // 标记为已读
    markNotificationAsRead(notification.id);
    // 查找并打开相关产品
    const project = projects.find(p => p.id === notification.projectId);
    if (project) {
      openProjectModal(project);
      setShowNotifications(false);
    }
  };

  // 处理任务指派时创建通知
  const handleTaskAssignment = async (project: Project, task: SubTask, assignee: string) => {
    // 创建通知
    await createNotification(project, { ...task, assignee });
  };

  // 创建活动日志
  const createActivityLog = async (log: ActivityLog) => {
    try {
      await apiService.createActivityLog(log);
      // 更新本地日志列表
      setActivityLogs(prev => [...prev, log]);
    } catch (error) {
      console.error('创建日志失败:', error);
    }
  };

  const handleRegisterUser = async (name: string) => {
    saveUserIdentity(name);
    const newIdentity = { ...identity, name };
    setIdentity(newIdentity);
    
    try {
        // 保存到服务器
        await apiService.saveUser(newIdentity);
        
        // 更新本地用户列表
        const updatedUsers = [...knownUsers];
        const existingIndex = updatedUsers.findIndex(u => u.deviceId === newIdentity.deviceId);
        if (existingIndex !== -1) {
            // 更新现有用户
            updatedUsers[existingIndex] = newIdentity;
        } else {
            // 添加新用户
            updatedUsers.push(newIdentity);
        }
        setKnownUsers(updatedUsers);
    } catch (error) {
        console.error("Failed to save user:", error);
    }
  };

  const createProject = async () => {
    if (!newProjName.trim()) return showToast('请输入产品名称', 'warning');
    if (projects.some(p => p.name === newProjName.trim())) return showToast('产品名称已存在，请勿重复', 'warning');

    try {
        const newProject: Project = {
          id: generateId(),
          name: newProjName,
          description: newProjDesc,
          imageUrl: newProjImage,
          createdAt: Date.now(),
          deadline: newProjDate ? new Date(newProjDate).getTime() : undefined,
          items: selectedSubTasks.map(type => ({
            id: generateId(),
            type,
            assignee: '',
            status: TaskStatus.PENDING,
            lastUpdated: Date.now()
          }))
        };
        
        // 先显示创建中提示
        showToast('产品创建中...', 'info');
        
        // 先保存到服务器，成功后再更新UI
        await apiService.saveProject(newProject);
        
        // 保存成功后更新UI
        const updated = [newProject, ...projects];
        setProjects(updated);
        setIsCreating(false);
        resetForm();
        
        showToast('产品创建成功', 'success');
        
        // 创建日志
        await createActivityLog({
          id: generateId(),
          timestamp: Date.now(),
          user: isAdmin ? '管理员' : loggedInUser?.name || '未知用户',
          action: '创建产品',
          projectId: newProject.id,
          details: `创建了产品: ${newProject.name}`
        });
    } catch (e) {
        console.error('产品创建失败:', e);
        showToast('创建失败，请重试: ' + (e instanceof Error ? e.message : '未知错误'), 'error');
    }
  };

  const updateProject = async (updated: Project) => {
    // Optimistic Update
    setProjects(prevProjects => {
        return prevProjects.map(p => p.id === updated.id ? updated : p);
    });
    setActiveProject(updated); 
    
    // Server Save
    await apiService.saveProject(updated);
    
    // 创建日志
    await createActivityLog({
      id: generateId(),
      timestamp: Date.now(),
      user: isAdmin ? '管理员' : loggedInUser?.name || '未知用户',
      action: '更新产品',
      projectId: updated.id,
      details: `更新了产品: ${updated.name}`
    });
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm('确定要删除此产品吗？此操作无法撤销。')) return;

    try {
        // 先查找要删除的产品名称，用于日志
        const projectToDelete = projects.find(p => p.id === id);
        const projectName = projectToDelete?.name || '未知产品';
        
        setProjects(prevProjects => prevProjects.filter(p => p.id !== id));
        setActiveProject(null);
        await apiService.deleteProject(id);
        showToast("删除成功", 'success');
        
        // 创建日志
        await createActivityLog({
          id: generateId(),
          timestamp: Date.now(),
          user: isAdmin ? '管理员' : loggedInUser?.name || '未知用户',
          action: '删除产品',
          projectId: id,
          details: `删除了产品: ${projectName}`
        });
    } catch (e) {
        console.error("Delete failed", e);
        showToast("删除失败，请重试", 'error');
    }
  };

  const handleAddCustomSubTask = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
      const name = customSubTaskName.trim();
      if (name && !list.includes(name)) {
          setter([...list, name]);
          setCustomSubTaskName('');
          setCustomTaskFeedback(`已添加: ${name}`);
          setTimeout(() => setCustomTaskFeedback(''), 2000);
      }
  };

  const handleAdminAddSubTaskInEdit = () => {
      if (!activeProject || !customSubTaskName.trim()) return;
      const newTask: SubTask = {
          id: generateId(),
          type: customSubTaskName.trim(),
          assignee: '',
          status: TaskStatus.PENDING,
          lastUpdated: Date.now()
      };
      const updated = {
          ...activeProject,
          items: [...activeProject.items, newTask]
      };
      updateProject(updated);
      setCustomSubTaskName('');
  };

  const resetForm = () => {
    setNewProjName('');
    setNewProjDesc('');
    setNewProjImage('');
    setNewProjDate('');
    setSelectedSubTasks(ALL_SUB_TASK_TYPES);
    setCustomSubTaskName('');
  };

  // 添加产品修改标记相关状态
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [selectedItemsToChange, setSelectedItemsToChange] = useState<string[]>([]);
  const [userAcknowledgedChanges, setUserAcknowledgedChanges] = useState<string[]>(() => {
      // 从本地存储加载已确认的修改
      const saved = localStorage.getItem('artflow_acknowledged_changes');
      return saved ? JSON.parse(saved) : [];
  });
  
  // 保存已确认的修改到本地存储
  useEffect(() => {
      localStorage.setItem('artflow_acknowledged_changes', JSON.stringify(userAcknowledgedChanges));
  }, [userAcknowledgedChanges]);
  
  const openProjectModal = (p: Project) => {
      setActiveProject(p);
      setEditName(p.name);
      setEditDesc(p.description);
      setEditDate(p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '');
      setEditHasChanges(p.hasChanges || false);
      setEditChangesDescription(p.changesDescription || '');
      setSelectedItemsToChange(p.itemsToChange || p.items.map(item => item.id));
      setIsEditingProject(false);
  };

  const saveProjectEdits = () => {
      if (!activeProject) return;
      
      if (editHasChanges && !activeProject.hasChanges) {
          // 如果是首次标记为需要修改，显示选择子任务的模态框
          setShowChangesModal(true);
      } else {
          // 否则直接保存
          const updated = {
              ...activeProject,
              name: editName,
              description: editDesc,
              deadline: editDate ? new Date(editDate).getTime() : undefined,
              hasChanges: editHasChanges,
              changesDescription: editChangesDescription,
              changesCount: editHasChanges ? (activeProject.changesCount || 0) + 1 : activeProject.changesCount,
              itemsToChange: editHasChanges ? selectedItemsToChange : undefined
          };
          updateProject(updated);
          setIsEditingProject(false);
      }
  };
  
  // 保存修改标记
  const saveChangesMark = () => {
      if (!activeProject) return;
      
      const updated = {
          ...activeProject,
          name: editName,
          description: editDesc,
          deadline: editDate ? new Date(editDate).getTime() : undefined,
          hasChanges: editHasChanges,
          changesDescription: editChangesDescription,
          changesCount: (activeProject.changesCount || 0) + 1,
          itemsToChange: selectedItemsToChange
      };
      updateProject(updated);
      setIsEditingProject(false);
      setShowChangesModal(false);
  };

  // --- Filtering & Sorting Logic ---
  const getProjectStatus = (p: Project) => {
      const completed = p.items.filter(i => i.status === TaskStatus.COMPLETED).length;
      if (completed === p.items.length && p.items.length > 0) return 'COMPLETED';
      
      const isAnyActive = p.items.some(i => i.status !== TaskStatus.PENDING);
      if (!isAnyActive) return 'PENDING';
      
      return 'IN_PROGRESS';
  };

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()))
    .filter(p => statusFilter === 'ALL' || getProjectStatus(p) === statusFilter)
    .sort((a, b) => {
        const aStatus = getProjectStatus(a);
        const bStatus = getProjectStatus(b);
        
        const rank = { 'PENDING': 0, 'IN_PROGRESS': 1, 'COMPLETED': 2 };
        
        if (rank[aStatus] !== rank[bStatus]) {
            return rank[aStatus] - rank[bStatus];
        }

        const aProgress = a.items.length ? (a.items.filter(i => i.status === TaskStatus.COMPLETED).length / a.items.length) : 0;
        const bProgress = b.items.length ? (b.items.filter(i => i.status === TaskStatus.COMPLETED).length / b.items.length) : 0;
        
        if (aProgress !== bProgress) return aProgress - bProgress;

        const getLastUpdate = (p: Project) => p.items.reduce((max, i) => Math.max(max, i.lastUpdated), p.createdAt);
        return getLastUpdate(b) - getLastUpdate(a);
    });
    
  const counts = {
      ALL: projects.length,
      PENDING: projects.filter(p => getProjectStatus(p) === 'PENDING').length,
      IN_PROGRESS: projects.filter(p => getProjectStatus(p) === 'IN_PROGRESS').length,
      COMPLETED: projects.filter(p => getProjectStatus(p) === 'COMPLETED').length,
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8F9FC] font-sans text-gray-700 pb-20">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-2 min-w-[120px]">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">产品图片视频制作进度</h1>
         </div>

         <div className="flex-1 flex justify-center mx-4 min-w-[200px]">
             <div className="relative group w-full max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500" />
                <input 
                    type="text" 
                    placeholder="搜索产品名称..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all shadow-sm"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                />
             </div>
         </div>

         <div className="flex justify-end items-center gap-2 min-w-[150px]">
             {isAdmin && (
                 <>
                     {/* 新建产品按钮 */}
                     <button 
                         onClick={() => { resetForm(); setIsCreating(true); }} 
                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 transition-all shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95"
                         title="新建产品"
                     >
                         <Plus className="w-4 h-4" />
                         <span className="hidden sm:inline">新建产品</span>
                     </button>
                     
                     {/* 管理用户按钮 */}
                     <button 
                         onClick={() => setShowUserManagement(true)} 
                         className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 transition-all shadow-lg shadow-gray-200 hover:scale-105 active:scale-95"
                         title="管理用户"
                     >
                         <Users className="w-4 h-4" />
                         <span className="hidden sm:inline">用户管理</span>
                     </button>
                     
                     {/* 日志中心按钮 */}
                     <button 
                        onClick={() => setShowActivityLogs(true)} 
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-1 transition-all shadow-lg shadow-green-200 hover:scale-105 active:scale-95"
                        title="日志中心"
                     >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">日志中心</span>
                     </button>
                 </>
             )}

             {/* 通知中心 */}
             {loggedInUser && (
                 <div className="relative">
                     <button 
                        onClick={() => setShowNotifications(!showNotifications)} 
                        className="p-2 rounded-full transition-colors border bg-white border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-indigo-600 relative"
                        title="通知中心"
                     >
                         {unreadCount > 0 ? (
                             <>
                                 <Bell className="w-4 h-4" />
                                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                     {unreadCount}
                                 </span>
                             </>
                         ) : (
                             <BellOff className="w-4 h-4" />
                         )}
                     </button>
                     
                     {/* 通知列表 */}
                     {showNotifications && (
                         <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 w-72 max-h-96 overflow-y-auto z-50 animate-in slide-in-from-top-2">
                             <div className="p-3 border-b border-gray-100">
                                 <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                     <Bell className="w-4 h-4" />
                                     通知中心
                                 </h4>
                                 <p className="text-xs text-gray-500 mt-1">
                                     您有 {unreadCount} 条未读通知
                                 </p>
                             </div>
                             
                             <div className="divide-y divide-gray-100">
                                 {notifications
                                     .filter(n => n.assignee === loggedInUser.name)
                                     .sort((a, b) => b.timestamp - a.timestamp)
                                     .map(notification => (
                                         <div 
                                             key={notification.id}
                                             onClick={() => handleViewNotification(notification)}
                                             className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-indigo-50' : ''}`}
                                         >
                                             <div className="flex items-start gap-3">
                                                 <div className={`w-2 h-2 rounded-full mt-1.5 ${!notification.read ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                                 <div className="flex-1">
                                                     <p className="text-sm font-medium text-gray-800">
                                                         您被指派了新任务
                                                     </p>
                                                     <p className="text-xs text-gray-600 mt-1">
                                                         产品：{notification.projectName}
                                                     </p>
                                                     <p className="text-xs text-gray-600">
                                                         任务：{notification.taskName}
                                                     </p>
                                                     <p className="text-xs text-gray-400 mt-1">
                                                         {new Date(notification.timestamp).toLocaleString('zh-CN')}
                                                     </p>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                             </div>
                             
                             {notifications.filter(n => n.assignee === loggedInUser.name).length === 0 && (
                                 <div className="p-8 text-center">
                                     <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                     <p className="text-sm text-gray-500">暂无通知</p>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             )}

             {/* 合并登录/退出按钮 */}
            {(loggedInUser || isAdmin) ? (
                <div className="flex items-center gap-2">
                    {loggedInUser && (
                        <span className="text-sm font-medium text-gray-700">{loggedInUser.name}</span>
                    )}
                    {isAdmin && (
                        <span className="text-sm font-medium text-indigo-600">管理员</span>
                    )}
                    <button 
                       onClick={() => {
                           setLoggedInUser(null);
                           setIsAdmin(false);
                           showToast('已退出登录', 'info');
                       }} 
                       className="p-2.5 rounded-full transition-colors border bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                       title="退出登录"
                    >
                        <Lock className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <button 
                   onClick={() => setShowUserLogin(!showUserLogin)} 
                   className="p-2.5 rounded-full transition-colors border bg-white border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-indigo-600"
                   title="登录"
                >
                    <Unlock className="w-5 h-5" />
                </button>
            )}


         </div>
      </nav>

      {/* 合并登录弹窗 */}
      {showUserLogin && !(loggedInUser || isAdmin) && (
         <div className="absolute top-20 right-6 z-40 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 animate-in slide-in-from-top-2 w-72">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><KeyRound className="w-4 h-4" /> 登录</h4>
            <div className="flex gap-2 mb-2">
                <input 
                    type="password" 
                    placeholder="输入密码"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
                    value={userPasswordInput}
                    onChange={e => setUserPasswordInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUserLogin()}
                />
                <button onClick={handleUserLogin} className="bg-gray-800 text-white text-sm font-bold px-4 rounded-lg hover:bg-black transition-colors">Go</button>
            </div>
            {loginErrorMessage && (
                <p className="text-xs text-red-500 mt-1">{loginErrorMessage}</p>
            )}
         </div>
      )}

      {/* User Management Modal */}
      <Modal isOpen={showUserManagement} onClose={() => setShowUserManagement(false)} title="用户管理" maxWidth="max-w-4xl">
         <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Create New User */}
            <div className="col-span-5 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">创建新用户</h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1">用户名 <span className="text-red-500">*</span></label>
                        <input 
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                            placeholder="输入同事姓名"
                            value={newUserName}
                            onChange={e => setNewUserName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1">密码 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                                placeholder="输入密码或点击生成"
                                value={newUserPassword}
                                onChange={e => setNewUserPassword(e.target.value)}
                            />
                            <button 
                                onClick={handleGeneratePassword}
                                className="px-3 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center gap-1"
                            >
                                <RefreshCw className="w-4 h-4" /> 生成
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={handleCreateUser}
                        className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md text-sm"
                    >
                        创建用户
                    </button>
                </div>

                {/* Change Admin Password */}
                <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-bold text-gray-800">修改管理员密码</h4>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            placeholder="输入新密码"
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none"
                            id="adminNewPassword"
                        />
                        <button 
                            onClick={() => {
                                const newPassword = (document.getElementById('adminNewPassword') as HTMLInputElement).value;
                                if (newPassword.trim()) {
                                    handleChangeAdminPassword(newPassword.trim());
                                    (document.getElementById('adminNewPassword') as HTMLInputElement).value = '';
                                } else {
                                    showToast('请输入新密码', 'warning');
                                }
                            }}
                            className="bg-gray-800 text-white text-sm font-bold px-4 rounded-lg hover:bg-black transition-colors"
                        >
                            更新
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: User List */}
            <div className="col-span-7 bg-white rounded-xl border border-gray-100 p-4">
                <h4 className="text-sm font-bold text-gray-800 mb-3">用户列表</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-bold text-gray-700">姓名</th>
                                <th className="text-left py-2 px-3 font-bold text-gray-700">创建时间</th>
                                <th className="text-right py-2 px-3 font-bold text-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map(user => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium text-gray-800">{user.name}</td>
                                    <td className="py-2 px-3 text-gray-500">{new Date(user.createdAt).toLocaleString('zh-CN')}</td>
                                    <td className="py-2 px-3 text-right">
                                        <button 
                                            onClick={() => {
                                                // 弹出自定义修改密码对话框
                                                const container = document.createElement('div');
                                                container.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
                                                
                                                const dialog = document.createElement('div');
                                                dialog.className = 'bg-white rounded-lg p-4 shadow-lg w-80';
                                                
                                                const title = document.createElement('h3');
                                                title.className = 'text-lg font-bold mb-3';
                                                title.textContent = `修改 ${user.name} 的密码`;
                                                dialog.appendChild(title);
                                                
                                                const passwordInput = document.createElement('input');
                                                passwordInput.type = 'text'; // 默认显示明文
                                                passwordInput.placeholder = '输入新密码或点击生成';
                                                passwordInput.className = 'w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500';
                                                dialog.appendChild(passwordInput);
                                                
                                                const buttonContainer = document.createElement('div');
                                                buttonContainer.className = 'flex gap-2 mb-2';
                                                
                                                const generateBtn = document.createElement('button');
                                                generateBtn.textContent = '生成密码';
                                                generateBtn.className = 'flex-1 bg-gray-100 hover:bg-gray-200 rounded px-3 py-1.5 text-sm';
                                                generateBtn.onclick = () => {
                                                    let password;
                                                    do {
                                                        password = generatePassword();
                                                    } while (!isPasswordUnique(password, allUsers));
                                                    passwordInput.value = password;
                                                };
                                                buttonContainer.appendChild(generateBtn);
                                                
                                                dialog.appendChild(buttonContainer);
                                                
                                                const actionContainer = document.createElement('div');
                                                actionContainer.className = 'flex justify-end gap-2';
                                                
                                                const cancelBtn = document.createElement('button');
                                                cancelBtn.textContent = '取消';
                                                cancelBtn.className = 'px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm';
                                                cancelBtn.onclick = () => {
                                                    document.body.removeChild(container);
                                                };
                                                actionContainer.appendChild(cancelBtn);
                                                
                                                const saveBtn = document.createElement('button');
                                                saveBtn.textContent = '保存';
                                                saveBtn.className = 'px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm';
                                                saveBtn.onclick = () => {
                                                    const newPassword = passwordInput.value.trim();
                                                    if (newPassword) {
                                                        handleUpdateUserPassword(user, newPassword);
                                                        document.body.removeChild(container);
                                                    }
                                                };
                                                actionContainer.appendChild(saveBtn);
                                                
                                                dialog.appendChild(actionContainer);
                                                
                                                container.appendChild(dialog);
                                                document.body.appendChild(container);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 mr-3"
                                        >
                                            修改密码
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {allUsers.length === 0 && (
                    <div className="py-8 text-center text-gray-400">
                        暂无用户
                    </div>
                )}
            </div>
         </div>
      </Modal>

      {/* Activity Logs Modal */}
      <Modal isOpen={showActivityLogs} onClose={() => setShowActivityLogs(false)} title="日志中心" maxWidth="max-w-5xl">
         <div className="space-y-4">
            <div className="flex flex-col gap-3">
                {/* 管理员日志显示开关和清空日志按钮 */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={async () => {
                            if (confirm('确定要清空所有日志吗？此操作不可恢复。')) {
                                try {
                                    await apiService.clearActivityLogs();
                                    setActivityLogs([]);
                                    showToast('日志已清空', 'success');
                                } catch (error) {
                                    console.error('清空日志失败:', error);
                                    showToast('清空日志失败', 'error');
                                }
                            }
                        }}
                        className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                    >
                        清空日志
                    </button>
                    <label className="text-xs flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={logFilters.includeAdmin}
                            onChange={(e) => setLogFilters(prev => ({ ...prev, includeAdmin: e.target.checked }))}
                            className="text-indigo-600"
                        />
                        <span className="text-gray-600">显示管理员操作日志</span>
                    </label>
                </div>
                
                {/* 筛选条件 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                    {/* 第一行：时间范围 */}
                    <div className="md:col-span-3 flex flex-wrap gap-2">
                        <input
                            type="date"
                            placeholder="开始日期"
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none min-w-[140px]"
                            value={logFilters.startDate}
                            onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <input
                            type="date"
                            placeholder="结束日期"
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none min-w-[140px]"
                            value={logFilters.endDate}
                            onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    
                    {/* 第二行：用户、操作类型 */}
                    <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none"
                        value={logFilters.user}
                        onChange={(e) => setLogFilters(prev => ({ ...prev, user: e.target.value }))}
                    >
                        <option value="">所有用户</option>
                        {Array.from(new Set(activityLogs.map(log => log.user))).map(user => (
                            <option key={user} value={user}>{user}</option>
                        ))}
                    </select>
                    
                    <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none"
                        value={logFilters.action}
                        onChange={(e) => setLogFilters(prev => ({ ...prev, action: e.target.value }))}
                    >
                        <option value="">所有操作</option>
                        {Array.from(new Set(activityLogs.map(log => log.action))).map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                    
                    {/* 第三行：产品筛选 */}
                    <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-indigo-500 outline-none"
                        value={logFilters.project}
                        onChange={(e) => setLogFilters(prev => ({ ...prev, project: e.target.value }))}
                    >
                        <option value="">所有产品</option>
                        {projects
                            .sort((a, b) => {
                                // 按进行中产品排在前面，然后按名称排序
                                const aIsInProgress = a.items.some(item => item.status === '进行中' || item.status === '待开始');
                                const bIsInProgress = b.items.some(item => item.status === '进行中' || item.status === '待开始');
                                if (aIsInProgress && !bIsInProgress) return -1;
                                if (!aIsInProgress && bIsInProgress) return 1;
                                return a.name.localeCompare(b.name);
                            })
                            .map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                    </select>
                    
                    {/* 重置筛选 */}
                    <button
                        onClick={() => setLogFilters({ startDate: '', endDate: '', user: '', action: '', project: '', includeAdmin: false })}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1 transition-colors ml-auto"
                    >
                        重置筛选
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-3 px-4 font-bold text-gray-700">时间</th>
                            <th className="text-left py-3 px-4 font-bold text-gray-700">用户</th>
                            <th className="text-left py-3 px-4 font-bold text-gray-700">操作</th>
                            <th className="text-left py-3 px-4 font-bold text-gray-700">相关产品</th>
                            <th className="text-left py-3 px-4 font-bold text-gray-700">相关任务</th>
                            <th className="text-left py-3 px-4 font-bold text-gray-700">详情</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activityLogs
                            .filter(log => {
                                // 管理员日志筛选
                                if (!logFilters.includeAdmin && log.user === '管理员') return false;
                                
                                // 时间范围筛选
                                if (logFilters.startDate) {
                                    const logDate = new Date(log.timestamp);
                                    const startDate = new Date(logFilters.startDate);
                                    if (logDate < startDate) return false;
                                }
                                if (logFilters.endDate) {
                                    const logDate = new Date(log.timestamp);
                                    const endDate = new Date(logFilters.endDate);
                                    endDate.setHours(23, 59, 59, 999);
                                    if (logDate > endDate) return false;
                                }
                                
                                // 用户筛选
                                if (logFilters.user && log.user !== logFilters.user) return false;
                                
                                // 操作类型筛选
                                if (logFilters.action && log.action !== logFilters.action) return false;
                                
                                // 产品筛选
                                if (logFilters.project && log.projectId !== logFilters.project) return false;
                                
                                return true;
                            })
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .map(log => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-gray-600">{new Date(log.timestamp).toLocaleString('zh-CN')}</td>
                                    <td className="py-3 px-4 font-medium text-gray-800">{log.user}</td>
                                    <td className="py-3 px-4 text-gray-700">{log.action}</td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {log.projectId ? (
                                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                                {projects.find(p => p.id === log.projectId)?.name || '未知产品'}
                                            </span>
                                        ) : (
                                            '-' 
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {log.taskId ? (
                                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                                                {projects
                                                    .find(p => p.id === log.projectId)
                                                    ?.items.find(t => t.id === log.taskId)?.type || '未知任务'}
                                            </span>
                                        ) : (
                                            '-' 
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{log.details}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            
            {activityLogs.filter(log => {
                // 时间范围筛选
                if (logFilters.startDate) {
                    const logDate = new Date(log.timestamp);
                    const startDate = new Date(logFilters.startDate);
                    if (logDate < startDate) return false;
                }
                if (logFilters.endDate) {
                    const logDate = new Date(log.timestamp);
                    const endDate = new Date(logFilters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    if (logDate > endDate) return false;
                }
                
                // 用户筛选
                if (logFilters.user && log.user !== logFilters.user) return false;
                
                // 操作类型筛选
                if (logFilters.action && log.action !== logFilters.action) return false;
                
                // 产品筛选
                if (logFilters.project && log.projectId !== logFilters.project) return false;
                
                return true;
            }).length === 0 && (
                <div className="py-12 text-center">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">暂无符合条件的日志记录</p>
                </div>
            )}
         </div>
      </Modal>

      {/* Filter Tabs */}
      <div className="container mx-auto px-4 mt-8 mb-10">
         <div className="flex justify-center gap-4 md:gap-8">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => {
                const isSelected = statusFilter === status;
                const labels: any = {'ALL': '全部', 'PENDING': '待开始', 'IN_PROGRESS': '进行中', 'COMPLETED': '已完成'};
                return (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={`flex flex-col items-center justify-center w-28 h-24 md:w-36 md:h-28 rounded-2xl border-2 transition-all duration-200 ${
                            isSelected 
                            ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 scale-105 z-10' 
                            : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50 shadow-sm text-gray-400'
                        }`}
                    >
                        <span className={`text-3xl md:text-4xl font-black mb-1 ${isSelected ? 'text-indigo-600' : 'text-gray-300'}`}>
                            {counts[status as keyof typeof counts]}
                        </span>
                        <span className={`text-xs md:text-sm font-bold ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                            {labels[status]}
                        </span>
                    </button>
                )
            })}
         </div>
      </div>

      {/* Main Grid */}
      <div className="px-6 max-w-[1900px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
           {filteredProjects.map(project => (
             <ProjectCard key={project.id} project={project} onClick={() => openProjectModal(project)} />
           ))}
           {filteredProjects.length === 0 && (
              <div className="col-span-full py-32 text-center flex flex-col items-center text-gray-400">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 opacity-20" />
                  </div>
                  <p>没有找到符合条件的产品</p>
              </div>
           )}
        </div>
      </div>

      {/* --- CREATE PROJECT MODAL --- */}
      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="新建产品项目" maxWidth="max-w-4xl">
         <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5 space-y-4">
                <div className="flex gap-4">
                    <div 
                        className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-indigo-400 transition-colors group overflow-hidden relative"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {newProjImage ? (
                            <img src={newProjImage} className="w-full h-full object-contain p-1" alt="Preview" />
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 mb-1" />
                                <span className="text-[10px] text-gray-400">上传图片</span>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e)} />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">产品名称 <span className="text-red-500">*</span></label>
                            <input 
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                                placeholder="输入名称..."
                                value={newProjName}
                                onChange={e => setNewProjName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">预计日期 (可选)</label>
                            <input 
                                type="date"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
                                value={newProjDate}
                                onChange={e => setNewProjDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">备注</label>
                    <textarea 
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none h-20 resize-none text-sm"
                        placeholder="选填..."
                        value={newProjDesc}
                        onChange={e => setNewProjDesc(e.target.value)}
                    ></textarea>
                </div>
            </div>

            <div className="col-span-7 bg-white rounded-xl border border-gray-100 p-4 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-gray-800">配置子任务</label>
                    <div className="space-x-2">
                        <button onClick={() => setSelectedSubTasks(ALL_SUB_TASK_TYPES)} className="text-[10px] font-bold text-indigo-600 hover:underline">全选</button>
                        <button onClick={() => setSelectedSubTasks([])} className="text-[10px] font-bold text-gray-400 hover:underline">清空</button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-60 mb-3 pr-1">
                    {ALL_SUB_TASK_TYPES.map(type => (
                        <label key={type} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${selectedSubTasks.includes(type) ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${selectedSubTasks.includes(type) ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300'}`}>
                                {selectedSubTasks.includes(type) && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <input 
                                type="checkbox"
                                className="hidden"
                                checked={selectedSubTasks.includes(type)}
                                onChange={e => {
                                    if(e.target.checked) setSelectedSubTasks([...selectedSubTasks, type]);
                                    else setSelectedSubTasks(selectedSubTasks.filter(t => t !== type));
                                }}
                            />
                            <span className={`text-xs font-medium ${selectedSubTasks.includes(type) ? 'text-indigo-900' : 'text-gray-600'}`}>{type}</span>
                        </label>
                    ))}
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-800 mb-1">添加自定义任务</label>
                    <div className="flex gap-2 relative">
                        <input 
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                            placeholder="输入任务名"
                            value={customSubTaskName}
                            onChange={e => setCustomSubTaskName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddCustomSubTask(setSelectedSubTasks, selectedSubTasks)}
                        />
                        <button 
                            onClick={() => handleAddCustomSubTask(setSelectedSubTasks, selectedSubTasks)}
                            className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-black"
                        >
                            添加
                        </button>
                        {customTaskFeedback && (
                            <div className="absolute top-full left-0 mt-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded animate-in fade-in slide-in-from-top-1">
                                {customTaskFeedback}
                            </div>
                        )}
                    </div>
                </div>
            </div>
         </div>
         <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => setIsCreating(false)} className="px-6 py-2 rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-colors text-sm">取消</button>
            <button onClick={createProject} className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md text-sm">创建</button>
         </div>
      </Modal>

      {/* --- PROJECT DETAILS MODAL --- */}
      <Modal 
        isOpen={!!activeProject} 
        onClose={() => setActiveProject(null)} 
        title={
            activeProject ? (
                isAdmin && isEditingProject ? (
                    <input 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="text-xl font-bold text-gray-800 border-b-2 border-indigo-500 outline-none bg-transparent"
                        autoFocus
                    />
                ) : (activeProject.name)
            ) : ''
        }
      >
        {activeProject && (
            <div className="flex gap-6 items-start">
                {/* Left Column: Image & Info */}
                <div className="w-64 flex-shrink-0 flex flex-col gap-4">
                    <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden group border border-gray-200">
                            {activeProject.imageUrl ? (
                            <>
                                <img 
                                    src={activeProject.imageUrl} 
                                    className="w-full h-full object-contain cursor-zoom-in" 
                                    alt="product" 
                                    onClick={() => setLightboxImage(activeProject.imageUrl || '')}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
                                    <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                            </>
                            ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                <ImageIcon className="w-10 h-10 mb-2" />
                                <span className="text-xs">无图片</span>
                            </div>
                            )}
                            
                            {isAdmin && (
                            <div className="absolute top-2 right-2">
                                    <button 
                                    onClick={() => editFileInputRef.current?.click()}
                                    className="p-1.5 bg-white/90 backdrop-blur rounded-full shadow text-gray-600 hover:text-indigo-600"
                                    title="修改图片"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                    </button>
                                    <input 
                                    type="file" 
                                    ref={editFileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, true)}
                                    />
                            </div>
                            )}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 relative">
                        {isEditingProject ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">备注</label>
                                    <textarea 
                                        value={editDesc}
                                        onChange={e => setEditDesc(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded text-xs mt-1 outline-none"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">日期</label>
                                    <input 
                                        type="date"
                                        value={editDate}
                                        onChange={e => setEditDate(e.target.value)}
                                        className="w-full p-1.5 border border-gray-200 rounded text-xs outline-none mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">产品修改标记</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input 
                                            type="checkbox"
                                            checked={editHasChanges}
                                            onChange={e => setEditHasChanges(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <span className="text-xs text-gray-600">标记为需要修改</span>
                                    </div>
                                </div>
                                {editHasChanges && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase">修改描述</label>
                                        <textarea 
                                            value={editChangesDescription}
                                            onChange={e => setEditChangesDescription(e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded text-xs mt-1 outline-none"
                                            rows={3}
                                            placeholder="请描述需要修改的内容..."
                                        />
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end pt-1">
                                    <button onClick={() => setIsEditingProject(false)} className="text-xs px-2 py-1 rounded border">取消</button>
                                    <button onClick={saveProjectEdits} className="text-xs px-2 py-1 rounded bg-indigo-600 text-white">保存</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeProject.description && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">备注</h4>
                                        <p className="text-gray-700 text-xs leading-relaxed">{activeProject.description}</p>
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">预计完成</h4>
                                    <p className="text-gray-700 text-xs font-bold">{activeProject.deadline ? new Date(activeProject.deadline).toLocaleDateString() : '未设置'}</p>
                                </div>
                                {activeProject.hasChanges && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="text-yellow-500 mt-0.5">⚠️</div>
                                            <div className="flex-1">
                                                <h4 className="text-[10px] font-bold text-yellow-700 uppercase mb-1">产品修改</h4>
                                                <p className="text-yellow-700 text-xs leading-relaxed">{activeProject.changesDescription || '此产品需要修改'}</p>
                                                {loggedInUser && !userAcknowledgedChanges.includes(activeProject.id) && (
                                                    <button 
                                                        onClick={async () => {
                                                            setUserAcknowledgedChanges(prev => [...prev, activeProject.id]);
                                                            showToast('已标记为已读', 'success');
                                                            
                                                            // 创建日志
                                                            await createActivityLog({
                                                              id: generateId(),
                                                              timestamp: Date.now(),
                                                              user: loggedInUser.name,
                                                              action: '确认修改',
                                                              projectId: activeProject.id,
                                                              details: `${loggedInUser.name} 确认了产品修改`
                                                            });
                                                        }}
                                                        className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 font-bold"
                                                    >
                                                        知道了
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {isAdmin && (
                        <div className="flex flex-col gap-2 mt-2">
                             {!isEditingProject && (
                                 <button 
                                     onClick={() => {
                                         setIsEditingProject(true);
                                         setEditName(activeProject.name);
                                         setEditDesc(activeProject.description);
                                         setEditDate(activeProject.deadline ? new Date(activeProject.deadline).toISOString().split('T')[0] : '');
                                     }}
                                     className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-2 rounded-lg text-xs font-bold border border-indigo-200 flex items-center justify-center gap-2 transition-colors"
                                 >
                                     <Edit className="w-4 h-4" /> 编辑产品
                                 </button>
                             )}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault(); // Safety check
                                    e.stopPropagation();
                                    deleteProject(activeProject.id); // Call delete
                                }}
                                className="w-full text-red-500 hover:bg-red-50 py-2 rounded-lg text-xs font-bold border border-red-200 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> 删除产品
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Tasks */}
                <div className="flex-1">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-lg">任务看板</h3>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <input 
                                    className="px-2 py-1 border border-gray-200 rounded text-xs outline-none"
                                    placeholder="新增子任务..."
                                    value={customSubTaskName}
                                    onChange={e => setCustomSubTaskName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAdminAddSubTaskInEdit()}
                                />
                                <button onClick={handleAdminAddSubTaskInEdit} className="bg-gray-800 text-white p-1 rounded hover:bg-black"><Plus className="w-4 h-4"/></button>
                            </div>
                        )}
                     </div>

                     {/* Tasks Grid */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {activeProject.items.map((task) => (
                            <div
                                key={task.id}
                                className="hover:shadow-lg transition-shadow"
                            >
                                <SubTaskCard 
                                    task={task} 
                                    isAdmin={isAdmin}
                                    currentUser={loggedInUser}
                                    knownUsers={knownUsers}
                                    allUsers={allUsers}
                                    onUpdate={(updatedTask) => {
                                        const updatedItems = activeProject.items.map(t => t.id === updatedTask.id ? updatedTask : t);
                                        updateProject({ ...activeProject, items: updatedItems });
                                        
                                        // 如果任务被指派了新的负责人，创建通知
                                        if (updatedTask.assignee && updatedTask.assignee !== task.assignee) {
                                            // 只有管理员指派的任务才创建通知，用户自己认领的任务不创建通知
                                            if (isAdmin || (loggedInUser && updatedTask.assignee !== loggedInUser.name)) {
                                                createNotification(activeProject, updatedTask);
                                            }
                                            
                                            // 创建日志
                                            createActivityLog({
                                              id: generateId(),
                                              timestamp: Date.now(),
                                              user: isAdmin ? '管理员' : loggedInUser?.name || '未知用户',
                                              action: '指派任务',
                                              projectId: activeProject.id,
                                              taskId: updatedTask.id,
                                              details: `将任务 "${updatedTask.type}" 指派给 ${updatedTask.assignee}`
                                            });
                                        }
                                        
                                        // 如果任务状态发生变化，创建日志
                                        if (updatedTask.status !== task.status) {
                                            createActivityLog({
                                              id: generateId(),
                                              timestamp: Date.now(),
                                              user: isAdmin ? '管理员' : loggedInUser?.name || '未知用户',
                                              action: '更新任务状态',
                                              projectId: activeProject.id,
                                              taskId: updatedTask.id,
                                              details: `将任务 "${updatedTask.type}" 的状态从 "${task.status}" 改为 "${updatedTask.status}"`
                                            });
                                        }
                                        
                                        // 如果任务添加了文件路径，创建日志
                                        if (updatedTask.filePath && updatedTask.filePath !== task.filePath) {
                                            createActivityLog({
                                              id: generateId(),
                                              timestamp: Date.now(),
                                              user: isAdmin ? '管理员' : loggedInUser?.name || '未知用户',
                                              action: '添加文件路径',
                                              projectId: activeProject.id,
                                              taskId: updatedTask.id,
                                              details: `为任务 "${updatedTask.type}" 添加了文件路径`
                                            });
                                        }
                                    }}
                                    onDelete={() => {
                                         // No confirm needed here if admin just wants to click trash
                                         // But safety is good. SubTaskCard handles the confirm or we do it here.
                                         // Let's rely on SubTaskCard's delete call triggering this.
                                         if(confirm('确定删除此子任务?')) {
                                            const updatedItems = activeProject.items.filter(t => t.id !== task.id);
                                            updateProject({ ...activeProject, items: updatedItems });
                                            
                                            // 创建日志
                                            createActivityLog({
                                              id: generateId(),
                                              timestamp: Date.now(),
                                              user: isAdmin ? '管理员' : loggedInUser?.name || '未知用户',
                                              action: '删除子任务',
                                              projectId: activeProject.id,
                                              taskId: task.id,
                                              details: `删除了任务 "${task.type}"`
                                            });
                                         }
                                    }}
                                    onRegisterUser={handleRegisterUser}
                                />
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        )}
      </Modal>

      {/* Lightbox */}
      {lightboxImage && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setLightboxImage(null)}>
              <button className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors">
                  <X className="w-8 h-8" />
              </button>
              <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} alt="full view" />
          </div>
      )}
      
      {/* 产品修改子任务选择模态框 */}
      {showChangesModal && activeProject && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative z-10 animate-in slide-in-from-bottom-2 zoom-in-95">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">选择需要修改的子任务</h3>
                  <p className="text-sm text-gray-600 mb-4">默认全部选择，取消勾选不需要修改的子任务</p>
                  
                  <div className="max-h-60 overflow-y-auto mb-4">
                      {activeProject.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 mb-2">
                              <input
                                  type="checkbox"
                                  id={`change-item-${item.id}`}
                                  checked={selectedItemsToChange.includes(item.id)}
                                  onChange={(e) => {
                                      if (e.target.checked) {
                                          setSelectedItemsToChange(prev => [...prev, item.id]);
                                      } else {
                                          setSelectedItemsToChange(prev => prev.filter(id => id !== item.id));
                                      }
                                  }}
                                  className="w-4 h-4 text-indigo-600 rounded"
                              />
                              <label htmlFor={`change-item-${item.id}`} className="text-sm text-gray-700 cursor-pointer">
                                  {item.type}
                              </label>
                          </div>
                      ))}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowChangesModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium">取消</button>
                      <button onClick={saveChangesMark} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-lg shadow-indigo-200">保存</button>
                  </div>
              </div>
          </div>
      )}

    </div>
    </ErrorBoundary>
  );
};

export default App;
