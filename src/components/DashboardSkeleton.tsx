import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
      {/* Profile Card & Navigation Desk (Col 4) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Profile Card Skeleton */}
        <div className="dark:bg-zinc-950/85 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            {/* Avatar Circle with moving gradient */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1">
              {/* Name box */}
              <div className="h-5 w-2/3 rounded-md bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
              {/* Phone box */}
              <div className="h-3.5 w-1/2 rounded-md bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
            </div>
          </div>

          {/* Tier Badge Skeleton */}
          <div className="mt-5 h-10 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />

          {/* Status Allocation Banner Skeleton */}
          <div className="mt-6 pt-6 border-t dark:border-zinc-900 border-zinc-200 space-y-3">
            <div className="h-3 w-1/3 rounded-md bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
            <div className="h-14 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>

        {/* Real-time Stats & Credit Points Card Skeleton */}
        <div className="dark:bg-zinc-950/85 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="h-4 w-1/2 rounded-md bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer mb-5" />
          
          {/* Shimmering points big box */}
          <div className="h-24 rounded-2xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer mb-6" />

          {/* Three small stats blocks */}
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border dark:border-zinc-900 border-zinc-200/60 flex flex-col items-center gap-2">
              <div className="h-2 w-2/3 rounded bg-zinc-250 dark:bg-zinc-850" />
              <div className="h-4 w-1/2 rounded bg-zinc-300 dark:bg-zinc-800" />
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border dark:border-zinc-900 border-zinc-200/60 flex flex-col items-center gap-2">
              <div className="h-2 w-2/3 rounded bg-zinc-250 dark:bg-zinc-850" />
              <div className="h-4 w-1/2 rounded bg-zinc-300 dark:bg-zinc-800" />
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border dark:border-zinc-900 border-zinc-200/60 flex flex-col items-center gap-2">
              <div className="h-2 w-2/3 rounded bg-zinc-250 dark:bg-zinc-850" />
              <div className="h-4 w-1/2 rounded bg-zinc-300 dark:bg-zinc-800" />
            </div>
          </div>
        </div>

        {/* Profile Settings Card Skeleton */}
        <div className="dark:bg-zinc-950/85 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="h-4 w-1/3 rounded-md bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer mb-4" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-3.5 w-1/4 rounded bg-zinc-200 dark:bg-zinc-900" />
              <div className="h-3.5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-900" />
            </div>
            <div className="flex justify-between">
              <div className="h-3.5 w-1/4 rounded bg-zinc-200 dark:bg-zinc-900" />
              <div className="h-3.5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-900" />
            </div>
            <div className="h-10 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer mt-4" />
          </div>
        </div>

      </div>

      {/* Primary Functional Panel (Col 8) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Promotion Desk Skeleton */}
        <div className="dark:bg-zinc-950/85 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-1/4 rounded bg-zinc-200 dark:bg-zinc-900" />
                <div className="h-7 w-3/4 rounded bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            </div>
            <div className="h-12 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
            
            {/* Input link box */}
            <div className="space-y-2 mt-4">
              <div className="h-3 w-1/5 rounded bg-zinc-200 dark:bg-zinc-900" />
              <div className="flex gap-2">
                <div className="h-11 flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-11 w-28 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Display / Receipt Form Box Skeleton */}
        <div className="dark:bg-zinc-950/85 bg-white border dark:border-zinc-900 border-zinc-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-1/5 rounded bg-zinc-200 dark:bg-zinc-900" />
              <div className="h-6 w-1/2 rounded bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
          </div>

          {/* Large certificate representation with fine lines / layout */}
          <div className="h-[400px] rounded-2xl border dark:border-zinc-900 border-zinc-200 bg-zinc-50 dark:bg-zinc-950/40 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100/10 to-transparent bg-[length:200%_100%] animate-shimmer" />
            
            {/* Certificate Header wireframe */}
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-900" />
                <div className="h-5 w-40 rounded bg-zinc-300 dark:bg-zinc-850" />
              </div>
              <div className="w-16 h-16 rounded-full border border-dashed dark:border-zinc-800 border-zinc-300" />
            </div>

            {/* Certificate Core details */}
            <div className="space-y-4 my-auto">
              <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-900 mx-auto" />
              <div className="h-8 w-2/3 rounded bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 bg-[length:200%_100%] animate-shimmer mx-auto" />
              <div className="h-3.5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-900 mx-auto" />
            </div>

            {/* Certificate Footer signatures */}
            <div className="flex justify-between items-end border-t dark:border-zinc-900 border-zinc-200 pt-6">
              <div className="space-y-1.5">
                <div className="h-2.5 w-16 rounded bg-zinc-200 dark:bg-zinc-900" />
                <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-900" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-2.5 w-16 rounded bg-zinc-200 dark:bg-zinc-900 ml-auto" />
                <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-900 ml-auto" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
