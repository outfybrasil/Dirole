import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { triggerHaptic } from '../services/mockService';
import UserAvatar from './UserAvatar';

interface StoryViewerProps {
    isOpen: boolean;
    stories: Story[];
    currentUserId: string;
    onClose: () => void;
    onStoryViewed: (storyId: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
    isOpen,
    stories,
    currentUserId,
    onClose,
    onStoryViewed
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const currentStory = stories[currentIndex];

    useEffect(() => {
        if (!isOpen || !currentStory) return;

        // Mark as viewed
        if (!currentStory.viewedBy.includes(currentUserId)) {
            onStoryViewed(currentStory.id);
        }

        // Auto-advance after 5 seconds
        const duration = 5000;
        const interval = 50;
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += interval;
            setProgress((elapsed / duration) * 100);

            if (elapsed >= duration) {
                handleNext();
            }
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, isOpen, currentStory]);

    const handleNext = () => {
        triggerHaptic();
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        triggerHaptic();
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    if (!isOpen || !currentStory) return null;

    const timeAgo = (date: Date) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (hours > 0) return `há ${hours}h`;
        return `há ${minutes}min`;
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
            {/* Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-50 p-2 flex gap-1">
                {stories.map((_, idx) => (
                    <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all"
                            style={{
                                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-4 left-0 right-0 z-50 px-4 pt-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserAvatar avatar={currentStory.userAvatar} className="!w-10 !h-10" />
                        <div>
                            <p className="text-white font-black text-sm">{currentStory.userNickname || currentStory.userName}</p>
                            <p className="text-white/60 text-xs">{timeAgo(currentStory.createdAt)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Story Image */}
            <div className="flex-1 flex items-center justify-center relative">
                <img
                    src={currentStory.photoUrl}
                    alt="Story"
                    className="max-w-full max-h-full object-contain"
                />

                {/* Navigation Areas */}
                <div className="absolute inset-0 flex">
                    <button
                        onClick={handlePrevious}
                        className="flex-1 active:bg-white/5"
                        disabled={currentIndex === 0}
                    />
                    <button
                        onClick={handleNext}
                        className="flex-1 active:bg-white/5"
                    />
                </div>
            </div>

            {/* Location Badge */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-full">
                <div className="flex items-center gap-2">
                    <i className="fas fa-map-marker-alt text-dirole-primary text-sm"></i>
                    <span className="text-white text-xs font-bold">{currentStory.locationName}</span>
                </div>
            </div>
        </div>
    );
};
