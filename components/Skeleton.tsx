import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'rect' | 'circle' | 'text';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rect',
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-white/5 rounded";
    const variantClasses = {
        rect: "rounded-2xl",
        circle: "rounded-full",
        text: "rounded h-4"
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={{ width, height }}
        />
    );
};

export const LocationCardSkeleton = () => {
    return (
        <div className="w-full bg-[#1a0b2e] rounded-[2rem] p-4 flex gap-4 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />

            {/* Image Skeleton */}
            <Skeleton variant="rect" className="w-24 h-24 shrink-0 rounded-2xl" />

            {/* Content Skeleton */}
            <div className="flex-1 space-y-3 py-1">
                <div className="flex justify-between items-start">
                    <Skeleton variant="text" width="60%" className="h-5" />
                    <Skeleton variant="circle" width={24} height={24} />
                </div>

                <Skeleton variant="text" width="40%" className="h-3" />

                <div className="flex gap-2 pt-2">
                    <Skeleton variant="rect" width={60} height={24} className="rounded-full" />
                    <Skeleton variant="rect" width={40} height={24} className="rounded-full" />
                </div>
            </div>
        </div>
    );
};
