import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { triggerHaptic, uploadFile, createStory, getUserProfile } from '../services/mockService';

interface StoryCameraProps {
    isOpen: boolean;
    locationId: string;
    locationName: string;
    onClose: () => void;
    onStoryPosted: () => void;
}

export const StoryCamera: React.FC<StoryCameraProps> = ({
    isOpen,
    locationId,
    locationName,
    onClose,
    onStoryPosted
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    if (!isOpen) return null;

    const takePhoto = async () => {
        try {
            triggerHaptic();

            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera
            });

            if (photo.webPath) {
                setPreviewUrl(photo.webPath);
            }
        } catch (e) {
            console.warn('Camera failed:', e);
        }
    };

    const pickFromGallery = async () => {
        try {
            triggerHaptic();

            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.Uri,
                source: CameraSource.Photos
            });

            if (photo.webPath) {
                setPreviewUrl(photo.webPath);
            }
        } catch (e) {
            console.warn('Gallery pick failed:', e);
        }
    };

    const postStory = async () => {
        if (!previewUrl) return;

        setIsUploading(true);
        triggerHaptic();

        try {
            // Get current user
            const currentUser = getUserProfile();
            if (!currentUser) {
                alert('Você precisa estar logado para postar stories.');
                setIsUploading(false);
                return;
            }

            // Convert webPath to File for upload
            const response = await fetch(previewUrl);
            const blob = await response.blob();
            const file = new File([blob], `story_${Date.now()}.jpg`, { type: 'image/jpeg' });

            // Upload to Appwrite Storage
            const photoUrl = await uploadFile(file);

            // Save story metadata to database
            const success = await createStory(
                currentUser.id,
                currentUser.name,
                currentUser.nickname || currentUser.name,
                currentUser.avatar,
                locationId,
                locationName,
                photoUrl
            );

            if (success) {
                onStoryPosted();
                handleClose();
            } else {
                alert('Erro ao postar story. Tente novamente.');
            }
        } catch (e) {
            console.error('Failed to post story:', e);
            alert('Erro ao postar story. Tente novamente.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setPreviewUrl(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                    <div className="text-center">
                        <p className="text-white font-black text-sm">{locationName}</p>
                        <p className="text-white/60 text-xs">Story • Expira em 6h</p>
                    </div>
                    <div className="w-10"></div>
                </div>
            </div>

            {/* Preview or Camera Placeholder */}
            <div className="flex-1 flex items-center justify-center relative">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                    />
                ) : (
                    <div className="text-center">
                        <i className="fas fa-camera text-white/30 text-6xl mb-4"></i>
                        <p className="text-white/60 text-sm">Tire uma foto do rolê</p>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                {previewUrl ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPreviewUrl(null)}
                            className="flex-1 bg-white/10 backdrop-blur text-white font-black py-4 rounded-2xl"
                        >
                            Refazer
                        </button>
                        <button
                            onClick={postStory}
                            disabled={isUploading}
                            className="flex-1 bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-black py-4 rounded-2xl disabled:opacity-50"
                        >
                            {isUploading ? (
                                <><i className="fas fa-circle-notch fa-spin mr-2"></i>Postando...</>
                            ) : (
                                'Postar Story'
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={pickFromGallery}
                            className="flex-1 bg-white/10 backdrop-blur text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-images"></i>
                            Galeria
                        </button>
                        <button
                            onClick={takePhoto}
                            className="flex-1 bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-camera"></i>
                            Câmera
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
