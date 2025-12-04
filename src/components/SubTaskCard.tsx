
import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { SubTask, TaskStatus, UserIdentity, User } from '../types';
import { UserCircle2, Copy, Check, AlertCircle, Edit2, X, Calendar as CalendarIcon, ChevronDown, CircleDashed, Timer, CheckCircle2, Trash2, Pencil, ExternalLink } from 'lucide-react';

interface SubTaskCardProps {
  task: SubTask;
  isAdmin: boolean;
  currentUser: UserIdentity | null;
  knownUsers: UserIdentity[];
  allUsers: User[];
  onUpdate: (updatedTask: SubTask) => void;
  onDelete: () => void;
  onRegisterUser: (name: string) => void;
}

const SubTaskCard: React.FC<SubTaskCardProps> = ({ 
  task, 
  isAdmin, 
  currentUser, 
  knownUsers, 
  allUsers,
  onUpdate,
  onDelete,
  onRegisterUser 
}) => {
  const [localFilePath, setLocalFilePath] = useState(task.filePath || '');
  const [showPathModal, setShowPathModal] = useState(false);
  
  // Assignment Logic
  const [claimName, setClaimName] = useState(''); // 未认领时显示空字符串，而不是当前用户姓名
  const [showNameHistory, setShowNameHistory] = useState(false);
  const [showAdminAssign, setShowAdminAssign] = useState(false);
  const [adminNewUserName, setAdminNewUserName] = useState('');

  // Status Logic
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Date Picker Logic
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Toast Logic
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  // Edit Name Logic
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(task.type);

  // Card width tracking for responsive status text
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);

  // Completed Date Picker Logic
  const [showCompletedDatePicker, setShowCompletedDatePicker] = useState(false);
  const completedDatePickerRef = useRef<HTMLDivElement>(null);

  // Permission Check
  const isClaimed = !!task.assignee;
  const isMyTask = currentUser && task.assignee === currentUser.name;
  const isLoggedIn = !!currentUser;
  const canEdit = isAdmin || (isLoggedIn && (!isClaimed || isMyTask));
  const canClaim = isAdmin || isLoggedIn; // 管理员或登录用户都能认领任务

  // History filtering for current user - 登录用户只能看到自己的姓名
  const myHistoryNames: string[] = isAdmin 
    ? allUsers.map(u => u.name) 
    : currentUser ? [currentUser.name] : [];
  const uniqueHistoryNames: string[] = Array.from(new Set(myHistoryNames));
  
  // For admin, show all admin-created users
  const adminUsers = allUsers;

  // Track card width for responsive status text
  useLayoutEffect(() => {
    const updateWidth = () => {
      if (cardRef.current) {
        setCardWidth(cardRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (completedDatePickerRef.current && !completedDatePickerRef.current.contains(event.target as Node)) {
        setShowCompletedDatePicker(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!canEdit) return;
    const updatedTask = {
      ...task,
      status: newStatus,
      lastUpdated: Date.now()
    };
    // Set completed date if status is completed and not already set
    if (newStatus === TaskStatus.COMPLETED && !updatedTask.completedDate) {
      updatedTask.completedDate = Date.now();
    }
    onUpdate(updatedTask);
    setShowStatusMenu(false);
  };

  const handleClaim = () => {
    // 管理员可以指定任何用户，普通用户必须输入自己的用户名
    let finalClaimName = '';
    if (isAdmin) {
      finalClaimName = claimName.trim();
      
      // 管理员可以直接指派给任何用户，不需要验证是否存在
      // 去掉了基于MAC/IP地址的身份绑定验证
    } else if (currentUser) {
      // 普通用户必须输入当前登录的用户名
      const inputName = claimName.trim();
      if (inputName === currentUser.name) {
        finalClaimName = inputName;
      } else {
        // 输入错误，提示用户
        alert('请输入您的登录用户名才能认领任务');
        return;
      }
    }
    
    if (!finalClaimName) return;
    
    onRegisterUser(finalClaimName);
    onUpdate({
      ...task,
      assignee: finalClaimName,
      status: TaskStatus.IN_PROGRESS, 
      lastUpdated: Date.now()
    });
    setClaimName(finalClaimName);
    setShowNameHistory(false);
  };

  const handleQuickClaim = (name: string) => {
      // 登录用户只能使用自己的用户名认领任务，管理员可以选择任何用户
      const finalClaimName = isAdmin ? name : (currentUser?.name || '');
      
      if (!finalClaimName) return;
      
      onRegisterUser(finalClaimName);
      onUpdate({
        ...task,
        assignee: finalClaimName,
        status: TaskStatus.IN_PROGRESS, 
        lastUpdated: Date.now()
      });
      setShowNameHistory(false);
  };

  const handleAdminAssign = (userIdentity: UserIdentity) => {
    const updatedTask = {
        ...task,
        assignee: userIdentity.name,
        assigneeDeviceId: userIdentity.deviceId,
        status: TaskStatus.IN_PROGRESS,
        lastUpdated: Date.now()
    };
    onUpdate(updatedTask);
    setShowAdminAssign(false);
  };

  const saveTaskName = () => {
      if(editedName.trim() && editedName !== task.type) {
          onUpdate({ ...task, type: editedName, lastUpdated: Date.now() });
      }
      setIsEditingName(false);
  };

  const setExpectedDate = (dateTimestamp: number) => {
    onUpdate({
      ...task,
      expectedCompletionDate: dateTimestamp,
      lastUpdated: Date.now()
    });
    setShowDatePicker(false);
  };

  const setCompletedDate = (dateTimestamp: number) => {
    onUpdate({
      ...task,
      completedDate: dateTimestamp,
      lastUpdated: Date.now()
    });
    setShowCompletedDatePicker(false);
  };

  const setExpectedDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setExpectedDate(date.getTime());
  };

  const saveFilePath = () => {
    onUpdate({
      ...task,
      filePath: localFilePath,
      lastUpdated: Date.now()
    });
    setShowPathModal(false);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.filePath) {
      try {
        // 尝试使用现代浏览器 API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(task.filePath);
          setShowCopyToast(true);
          setTimeout(() => setShowCopyToast(false), 2000);
        } else {
          // 回退方案：创建临时文本区域
          const textArea = document.createElement('textarea');
          textArea.value = task.filePath;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setShowCopyToast(true);
          setTimeout(() => setShowCopyToast(false), 2000);
        }
      } catch (error) {
        console.error('复制失败:', error);
        // 可以添加一个错误提示
      }
    }
  };

  // Status Styling
  const getStatusConfig = (s: TaskStatus) => {
    switch (s) {
      case TaskStatus.PENDING: return { 
        icon: CircleDashed, 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        border: 'border-gray-200', 
        label: '待',
        fullLabel: '待开始'
      };
      case TaskStatus.IN_PROGRESS: return { 
        icon: Timer, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200', 
        label: '进',
        fullLabel: '进行中'
      };
      case TaskStatus.COMPLETED: return { 
        icon: CheckCircle2, 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        border: 'border-green-200', 
        label: '已',
        fullLabel: '已完成'
      };
      default: return { 
        icon: CircleDashed, 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        border: 'border-gray-200', 
        label: '?',
        fullLabel: '未知'
      };
    }
  };
  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  // Determine status display based on card width
  const getStatusDisplay = useMemo(() => {
    // 根据用户要求，优先显示图标+3字符，确保不遮挡负责人姓名
    return { 
      showIcon: true, 
      showText: true, 
      text: statusConfig.fullLabel.substring(0, 3) 
    };
  }, [cardWidth, statusConfig]);

  // Main Card Border
  let cardBorder = 'border-gray-200';
  if (task.status === TaskStatus.IN_PROGRESS) cardBorder = 'border-blue-300 ring-1 ring-blue-50';
  if (task.status === TaskStatus.COMPLETED) cardBorder = 'border-green-300 bg-green-50/20';

  const hoverEffect = canEdit ? 'hover:shadow-md transition-shadow' : '';

  return (
    <>
      <div 
        ref={cardRef}
        className={`bg-white rounded-lg p-3 border ${cardBorder} ${hoverEffect} flex flex-col h-full relative group`}>
        
        {/* Admin Controls */}
        {isAdmin && (
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                className="absolute top-1 right-1 p-1 text-red-300 hover:text-red-600 bg-white rounded-full hover:bg-red-50 transition-all z-20"
                title="删除任务"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        )}

        {/* Header: Title */}
        <div className="mb-3 pr-4"> 
            {isEditingName ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    <input 
                        value={editedName}
                        onChange={e => setEditedName(e.target.value)}
                        className="w-full text-sm font-bold border rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                        onBlur={saveTaskName}
                        onKeyDown={e => e.key === 'Enter' && saveTaskName()}
                    />
                    <button onClick={saveTaskName} className="text-green-600 hover:text-green-800"><Check className="w-3 h-3" /></button>
                </div>
            ) : (
                <div className="flex items-start gap-1 flex-1 min-w-0 group/title">
                    <h4 
                        className="font-bold text-gray-800 break-words text-wrap text-left leading-tight"
                        style={{ 
                            fontSize: 'clamp(0.65rem, 2vw, 0.9rem)', // 缩小字体范围，优先单行显示
                            wordBreak: 'break-word',
                            hyphens: 'auto',
                            overflowWrap: 'anywhere', // 更智能的换行
                            whiteSpace: 'nowrap', // 优先单行显示
                            maxWidth: '100%'
                        }}
                        title={task.type}
                    >
                        {task.type}
                    </h4>
                    {isAdmin && (
                        <button onClick={() => { setIsEditingName(true); setEditedName(task.type); }} className="opacity-0 group-hover/title:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity mt-1">
                            <Pencil className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Row 2: Status and Assignee Section */}
        <div className="mb-2 w-full">
            {/* Status and Assignee in same row */}
            <div className="flex items-center justify-between mb-1">
                {/* Assignee Section */}
                {isClaimed ? (
                    <div className="flex items-center gap-1.5">
                        <UserCircle2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-gray-700 truncate">{task.assignee}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <UserCircle2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-gray-500 truncate">未认领</span>
                    </div>
                )}
                
                {/* Always Show Status */}
                <div className="relative flex-shrink-0" ref={statusMenuRef}>
                    <button 
                        disabled={!(isAdmin || (canEdit && isClaimed))}
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold transition-all ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}
                    >
                        {getStatusDisplay.showIcon && <StatusIcon className="w-3.5 h-3.5" />}
                        {getStatusDisplay.showText && <span>{getStatusDisplay.text}</span>}
                    </button>
                    
                    {showStatusMenu && (
                        <div className="absolute top-full right-0 mt-1 w-24 bg-white border border-gray-100 shadow-xl rounded-lg z-20 overflow-hidden animate-in fade-in zoom-in-95">
                            {[TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].map(s => {
                                const conf = getStatusConfig(s);
                                const Icon = conf.icon;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Icon className={`w-3.5 h-3.5 ${conf.color}`} />
                                        {conf.fullLabel}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Assignee Section - Only show claim interface for unclaimed tasks */}
            {isClaimed ? (
                <div className="w-full">
                    
                    {/* Completed Date - Now below assignee */}
                    {task.status === TaskStatus.COMPLETED && (
                        <div className="mt-1 flex items-center justify-between px-1">
                            <div className="relative flex items-center gap-1" ref={completedDatePickerRef}>
                                <span className="text-[10px] text-gray-500">完成日期：</span>
                                <span className="text-[10px] text-gray-600 font-medium">
                                    {task.completedDate ? new Date(task.completedDate).toLocaleDateString() : '未设置'}
                                </span>
                                {canEdit && (
                                    <button 
                                        onClick={() => setShowCompletedDatePicker(!showCompletedDatePicker)}
                                        className="p-0.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                        title="修改完成日期"
                                    >
                                        <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                )}
                                
                                {/* Completed Date Popover */}
                                {showCompletedDatePicker && (
                                    <div className="absolute top-full right-0 w-48 bg-white shadow-xl border border-gray-200 rounded-lg p-2 z-30 mt-1 animate-in slide-in-from-bottom-2 fade-in">
                                        <input 
                                            type="date" 
                                            className="w-full text-xs border border-gray-200 rounded p-1 outline-none focus:border-indigo-500"
                                            defaultValue={task.completedDate ? new Date(task.completedDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                                if(e.target.value) setCompletedDate(new Date(e.target.value).getTime());
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    

                    
                    {/* Admin Controls - Only show if task is not completed */}
                    {isAdmin && task.status !== TaskStatus.COMPLETED && (
                        <div className="flex gap-2 mt-1">
                            {/* Reassign Button */}
                            <div className="relative flex-1">
                                <button onClick={() => setShowAdminAssign(!showAdminAssign)} className="w-full text-[10px] text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 py-1 px-2 rounded border border-dashed border-transparent hover:border-indigo-200 transition-all flex items-center justify-center gap-1">
                                    <Edit2 className="w-2.5 h-2.5" /> 重新指派
                                </button>
                                {showAdminAssign && (
                                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg z-20 w-48 max-h-64 overflow-y-auto p-2">
                                        {/* Input for new user name */}
                                        <div className="mb-2">
                                            <input
                                                type="text"
                                                placeholder="输入新用户名"
                                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none"
                                                value={adminNewUserName}
                                                onChange={e => setAdminNewUserName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && adminNewUserName.trim()) {
                                                        // Create a new user identity with random deviceId for new users
                                                        const newUser: UserIdentity = {
                                                            deviceId: `admin_${Date.now()}`,
                                                            name: adminNewUserName.trim()
                                                        };
                                                        handleAdminAssign(newUser);
                                                        setAdminNewUserName('');
                                                    }
                                                }}
                                            />
                                        </div>
                                        
                                        {/* Divider */}
                                        <div className="border-t border-gray-100 my-1"></div>
                                        
                                        {/* List of existing users - filtered by input */}
                                        <div className="text-xs font-bold text-gray-500 mb-1">现有用户</div>
                                        {allUsers.length > 0 ? (
                                            allUsers
                                                .filter(u => 
                                                    adminNewUserName.trim() === '' || 
                                                    u.name.toLowerCase().includes(adminNewUserName.toLowerCase().trim())
                                                )
                                                .map(u => (
                                                    <div 
                                                    key={u.id} 
                                                    className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer text-gray-700 rounded"
                                                    onClick={() => handleAdminAssign({ name: u.name, deviceId: `admin_${u.id}` })}
                                                    >
                                                        {u.name}
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400">暂无用户</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Remove Assignee Button */}
                            {isClaimed && (
                                <button 
                                    onClick={() => {
                                        onUpdate({
                                            ...task,
                                            assignee: '',
                                            assigneeDeviceId: '',
                                            expectedCompletionDate: undefined,
                                            status: TaskStatus.PENDING,
                                            lastUpdated: Date.now()
                                        });
                                    }}
                                    className="text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 py-1 px-2 rounded border border-dashed border-transparent hover:border-red-200 transition-all flex items-center justify-center gap-1"
                                    title="移除负责人"
                                >
                                    <X className="w-2.5 h-2.5" /> 移除
                                </button>
                            )}
                        </div>
                    )}
                </div>
             ) : (
                 canClaim ? (
                             <div className="flex items-center gap-1 w-full">
                                 {isAdmin ? (
                                     // 管理员可以选择任何用户
                                     <div className="relative flex-1">
                                         <input
                                             type="text"
                                             placeholder="输入或选择姓名"
                                             className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none transition-all"
                                             value={claimName}
                                             onChange={e => setClaimName(e.target.value)}
                                             onFocus={() => setShowNameHistory(true)}
                                             onKeyDown={(e) => { if (e.key === 'Enter') handleClaim(); }}
                                         />
                                         {/* Admin User List Dropdown */}
                                         {showNameHistory && (
                                             <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded mt-1 z-20 max-h-32 overflow-y-auto">
                                                 {adminUsers
                                                    .filter(user => user.name.toLowerCase().includes(claimName.toLowerCase()))
                                                    .map(user => (
                                                        <div 
                                                            key={user.name}
                                                            className="px-2 py-1.5 text-xs hover:bg-indigo-50 cursor-pointer text-gray-700"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setClaimName(user.name);
                                                                handleClaim();
                                                            }}
                                                         >
                                                             {user.name}
                                                         </div>
                                                     ))}
                                                 <div 
                                                    className="px-2 py-1 text-[10px] text-gray-400 border-t border-gray-100 text-center cursor-pointer hover:bg-gray-50"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => setShowNameHistory(false)}
                                                >
                                                    关闭
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 ) : (
                                     // 普通用户显示输入框，必须输入姓名才能认领
                                     <div className="relative flex-1">
                                         <input
                                             type="text"
                                             placeholder="输入姓名认领任务"
                                             className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none transition-all"
                                             value={claimName}
                                             onChange={e => setClaimName(e.target.value)}
                                             onKeyDown={(e) => { if (e.key === 'Enter') handleClaim(); }}
                                         />
                                     </div>
                                 )}
                                 <button 
                                    onClick={handleClaim}
                                    className="p-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors shadow-sm flex-shrink-0"
                                    title="确认"
                                 >
                                     <Check className="w-4 h-4" />
                                 </button>
                             </div>
                         ) : (
                     // 未登录用户留空，不显示提示
                     <div className="w-full py-2"></div>
                 )
             )}
        </div>

        {/* Footer: Date or File */}
        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center min-h-[26px] relative">
          {task.status === TaskStatus.COMPLETED ? (
               !task.filePath ? (
                   (isAdmin || (isLoggedIn && isMyTask)) ? (
                       <button 
                            onClick={() => setShowPathModal(true)}
                            className="w-full text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 py-1 rounded border border-dashed border-transparent hover:border-red-200 transition-all flex items-center justify-center gap-1"
                       >
                           <AlertCircle className="w-3 h-3" /> 无文件路径
                       </button>
                   ) : (
                       <div className="w-full text-[10px] text-gray-400 py-1 text-center">
                           无文件路径
                       </div>
                   )
               ) : (
                   <div className="flex w-full items-center gap-1">
                       <button 
                            onClick={copyToClipboard}
                            className="flex-1 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                       >
                           <Copy className="w-3 h-3" /> 复制路径
                       </button>
                       {(isAdmin || (isLoggedIn && isMyTask)) && (
                           <button 
                            onClick={() => { setLocalFilePath(task.filePath || ''); setShowPathModal(true); }}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                           >
                               <Edit2 className="w-3 h-3" />
                           </button>
                       )}
                   </div>
               )
          ) : (
              // Date Picker Section
            <div className="w-full relative" ref={datePickerRef}>
                {task.expectedCompletionDate ? (
                    <button 
                      onClick={() => canEdit && setShowDatePicker(!showDatePicker)}
                      className={`w-full flex items-center justify-center gap-1 text-[10px] py-1 rounded border ${task.expectedCompletionDate < Date.now() ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'} hover:opacity-80 transition-opacity`}
                    >
                        <CalendarIcon className="w-3 h-3" />
                        <span className="font-bold">预计完成时间：{new Date(task.expectedCompletionDate).toLocaleDateString()}</span>
                    </button>
                ) : (
                    isClaimed && (
                      <button 
                          onClick={() => canEdit && setShowDatePicker(!showDatePicker)}
                          className="w-full text-[10px] text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 py-1 rounded transition-colors text-center"
                      >
                          预计完成时间
                      </button>
                    )
                )}

                  {/* Date Popover */}
                  {showDatePicker && (
                      <div className="absolute bottom-full left-0 w-48 bg-white shadow-xl border border-gray-200 rounded-lg p-2 z-30 mb-1 animate-in slide-in-from-bottom-2 fade-in">
                          <div className="flex gap-1 mb-2">
                              {[4, 5, 6].map(d => (
                                  <button key={d} onClick={() => setExpectedDays(d)} className="flex-1 bg-indigo-50 text-indigo-600 text-xs py-1 rounded hover:bg-indigo-100 font-bold border border-indigo-100">{d}天</button>
                              ))}
                          </div>
                          <input 
                            type="date" 
                            className="w-full text-xs border border-gray-200 rounded p-1 outline-none focus:border-indigo-500"
                            onChange={(e) => {
                                if(e.target.value) setExpectedDate(new Date(e.target.value).getTime());
                            }}
                          />
                      </div>
                  )}
              </div>
          )}

          {/* Copy Feedback Toast */}
          {showCopyToast && (
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 z-50">
                 已复制到剪切板
             </div>
          )}
        </div>
      </div>

      {/* Path Input Modal */}
      {showPathModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowPathModal(false)}></div>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">填写文件路径</h3>
                  <input 
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none mb-4"
                    placeholder="例如: \\Server\Product\Video..."
                    value={localFilePath}
                    onChange={e => setLocalFilePath(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowPathModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium">取消</button>
                      <button onClick={saveFilePath} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-lg shadow-indigo-200">保存</button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default SubTaskCard;
