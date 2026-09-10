import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-md animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
};

export const SkeletonCard = () => (
  <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xs animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-5 w-24 bg-slate-200 rounded-md" />
      <div className="h-5 w-16 bg-slate-200 rounded-full" />
    </div>
    <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
    <div className="space-y-2">
      <div className="h-3.5 w-full bg-slate-100 rounded-md" />
      <div className="h-3.5 w-4/5 bg-slate-100 rounded-md" />
    </div>
    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
      <div className="h-4 w-20 bg-slate-200 rounded-md" />
      <div className="h-8 w-24 bg-slate-200 rounded-lg" />
    </div>
  </div>
);
