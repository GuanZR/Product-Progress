
import React from 'react';
import { Project, TaskStatus } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const total = project.items.length;
  const completed = project.items.filter(i => i.status === TaskStatus.COMPLETED).length;
  const inProgress = project.items.filter(i => i.status === TaskStatus.IN_PROGRESS).length;
  const pending = project.items.filter(i => i.status === TaskStatus.PENDING).length;
  
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isCompleted = progress === 100;

  // Derive status color based on progress
  let progressColor = "bg-indigo-500";
  if (isCompleted) progressColor = "bg-green-500";
  else if (progress < 30) progressColor = "bg-orange-400";

  // Calculate display deadline based on requirements
  const calculateDisplayDeadline = () => {
    if (isCompleted) {
      // Product completed, show completion date
      const completedTasks = project.items.filter(i => i.status === TaskStatus.COMPLETED && i.completedDate);
      if (completedTasks.length > 0) {
        const latestCompletedDate = Math.max(...completedTasks.map(i => i.completedDate!));
        return new Date(latestCompletedDate).toLocaleDateString('zh-CN');
      }
      return new Date(project.items.reduce((max, item) => Math.max(max, item.lastUpdated), project.createdAt)).toLocaleDateString('zh-CN');
    }

    // Product not completed, calculate deadline based on logic
    if (!project.deadline) return null;

    // Check if all subtasks have completedDate
    const allSubTasksHaveCompletedDate = project.items.every(i => i.completedDate);
    if (allSubTasksHaveCompletedDate) {
      // Find the latest completedDate among subtasks
      const latestSubTaskDate = Math.max(...project.items.map(i => i.completedDate!));
      // If all subtasks are completed and their latest date is earlier than project deadline, show latest subtask date
      if (latestSubTaskDate < project.deadline) {
        return new Date(latestSubTaskDate).toLocaleDateString('zh-CN');
      }
    }

    // Otherwise, show project deadline
    return new Date(project.deadline).toLocaleDateString('zh-CN');
  };

  const displayDeadline = calculateDisplayDeadline();

  // Calculate last update time
  const lastUpdateTime = project.items.reduce((max, item) => Math.max(max, item.lastUpdated), project.createdAt);

  return (
    <div onClick={onClick} className="block group cursor-pointer h-full">
      <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-indigo-100 h-full flex flex-col relative overflow-hidden">
        
        {isCompleted && (
             <div className="absolute -right-12 top-3 bg-green-500 text-white text-[9px] font-bold px-12 py-1 rotate-45 shadow-sm z-10">
                已完成
             </div>
        )}
        
        {/* 只有相关负责人和管理员才显示修改标签 */}
        {project.hasChanges && (
             <div className="absolute -right-12 top-3 bg-yellow-500 text-white text-[9px] font-bold px-12 py-1 rotate-45 shadow-sm z-10">
                有修改
             </div>
        )}

        <div className="flex gap-3 mb-2 items-start">
             {/* Product Image Thumbnail */}
             <div className="w-16 h-16 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 relative group-hover:border-indigo-200 transition-colors mt-1">
                {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        无图
                    </div>
                )}
             </div>

             <div className="flex-1 min-w-0 flex flex-col">
                {/* Title & Description & Counts Flow */}
                <div className="leading-tight">
                    <div className="flex flex-wrap gap-1 items-baseline mb-1">
                        <span className="text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors align-baseline">
                            {project.name}
                        </span>
                        {project.description && (
                            <span className="text-xs text-gray-400 align-baseline inline-block truncate max-w-[100px] group-hover:max-w-full group-hover:whitespace-normal">
                                {project.description}
                            </span>
                        )}
                    </div>
                    
                    {/* Deadline Text - Moved to under product name */}
                    {displayDeadline && (
                        <div className={`text-[10px] font-medium mb-1 ${!isCompleted && project.deadline && project.deadline < Date.now() && progress < 100 ? 'text-red-500' : 'text-gray-400'}`}>
                            {isCompleted ? '完成日期：' : '预计完成时间：'}{displayDeadline}
                        </div>
                    )}
                    
                    {!isCompleted && (
                        <span className="text-[10px] text-gray-500 align-baseline whitespace-nowrap inline-block">
                            <span className="text-green-600 font-medium">已完成:{completed}</span>
                            <span className="mx-1 text-gray-300">|</span>
                            <span className="text-blue-600 font-medium">进行中:{inProgress}</span>
                            <span className="mx-1 text-gray-300">|</span>
                            <span className="text-gray-400">待开始:{pending}</span>
                        </span>
                    )}
                </div>
             </div>
        </div>

        <div className="mt-auto space-y-2">
            {isCompleted ? (
                // For completed projects: show subtask list instead of progress bar
                <div className="flex justify-end pt-1 border-t border-gray-50 mt-1">
                    <span className="text-[9px] text-gray-300">
                        {project.items.map(item => item.type).join('，')}
                    </span>
                </div>
            ) : (
                // For in-progress projects: show progress bar
                <>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`} 
                            style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] font-bold text-gray-600 w-8 text-right">
                            {progress}%
                        </div>
                    </div>
                    
                    {/* Last Update Time */}
                    <div className="flex justify-end pt-1 border-t border-gray-50 mt-1">
                         <span className="text-[9px] text-gray-300">更新时间：{new Date(lastUpdateTime).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
