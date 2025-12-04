import React from 'react';
import { LayoutDashboard, PlusCircle, Settings, Palette } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50";
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Palette className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">ArtFlow</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/')}`}>
          <LayoutDashboard className="w-5 h-5" />
          工作台
        </Link>
        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          管理
        </div>
        <Link to="/new" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive('/new')}`}>
          <PlusCircle className="w-5 h-5" />
          新建产品项目
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
             <Settings className="w-4 h-4" />
          </div>
          <span>美工部 v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;