import React from 'react';

interface UserAvatarProps {
    avatar: string | undefined | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
    avatar,
    size = 'md',
    className = '',
    onClick
}) => {
    const [hasError, setHasError] = React.useState(false);

    // Robust check for image vs emoji
    const isImage = React.useMemo(() => {
        if (!avatar) return false;
        const urlPattern = /^(https?:\/\/|data:|blob:|file:|capacitor:)/i;
        return urlPattern.test(avatar);
    }, [avatar]);

    React.useEffect(() => {
        setHasError(false);
    }, [avatar]);

    const sizeClasses = {
        'xs': 'w-6 h-6 text-[10px]',
        'sm': 'w-8 h-8 text-sm',
        'md': 'w-10 h-10 text-base',
        'lg': 'w-16 h-16 text-2xl',
        'xl': 'w-24 h-24 text-4xl'
    };

    const containerClasses = `
    rounded-full 
    overflow-hidden 
    bg-slate-900 
    flex 
    items-center 
    justify-center 
    border-2 
    border-dirole-primary/30 
    shadow-[0_0_15px_rgba(139,92,246,0.3)] 
    ${sizeClasses[size]} 
    ${className} 
    ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}
  `.replace(/\s+/g, ' ').trim();

    return (
        <div className={containerClasses} onClick={onClick}>
            {isImage && !hasError ? (
                <img
                    src={avatar!}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setHasError(true)}
                />
            ) : (
                <span className="flex items-center justify-center">
                    {(!isImage || hasError) ? (typeof avatar === 'string' && avatar.length < 5 ? avatar : '😎') : '😎'}
                </span>
            )}
        </div>
    );
};

export default UserAvatar;
