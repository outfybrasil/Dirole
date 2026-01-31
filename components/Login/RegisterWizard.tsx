import React, { useState } from 'react';
import { StepCredentials } from './StepCredentials';
import { StepPersonal } from './StepPersonal';
import { StepIdentity } from './StepIdentity';

interface RegisterWizardProps {
    onBack: () => void;
    onComplete: (data: any) => Promise<void>;
    onOpenPrivacy: () => void;
    isLoading: boolean;
    errorMsg: string | null;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({ onBack, onComplete, onOpenPrivacy, isLoading, errorMsg }) => {
    const [step, setStep] = useState(1);

    // Form Data
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [name, setName] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [gender, setGender] = useState('Outro');
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState('😎');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleNext = () => {
        if (step === 1 && !acceptedTerms) return;
        setStep(prev => prev + 1);
    };

    const handleBackStep = () => {
        setStep(prev => prev - 1);
    };

    const handleFinalSubmit = () => {
        // Just verify passwords match again for safety, though Step 1 should catch logic
        if (pass !== confirmPass) return;

        onComplete({
            email,
            pass,
            confirmPass,
            name,
            age: birthYear, // Mapping birthYear to age param for compatibility, or change logic upstream
            gender,
            nickname,
            avatar,
            avatarFile // Pass the file up
        });
    };

    return (
        <div className="w-full">
            {/* Progress Indicator */}
            <div className="flex justify-between mb-8 px-4">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${step >= s ? 'bg-dirole-primary text-white scale-110 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-white/10 text-slate-500'}`}>
                            {step > s ? <i className="fas fa-check"></i> : s}
                        </div>
                    </div>
                ))}
            </div>

            {/* Error Message Global */}
            {errorMsg && <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2 rounded mb-4 animate-shake">{errorMsg}</p>}

            {/* Steps */}
            {step === 1 && (
                <StepCredentials
                    email={email} setEmail={setEmail}
                    pass={pass} setPass={setPass}
                    confirmPass={confirmPass} setConfirmPass={setConfirmPass}
                    acceptedTerms={acceptedTerms} setAcceptedTerms={setAcceptedTerms}
                    onOpenPrivacy={onOpenPrivacy}
                    onNext={handleNext}
                    onBack={onBack}
                />
            )}

            {step === 2 && (
                <StepPersonal
                    name={name} setName={setName}
                    birthYear={birthYear} setBirthYear={setBirthYear}
                    gender={gender} setGender={setGender}
                    onNext={handleNext}
                    onBack={handleBackStep}
                />
            )}

            {step === 3 && (
                <StepIdentity
                    nickname={nickname} setNickname={setNickname}
                    avatar={avatar} setAvatar={setAvatar}
                    setAvatarFile={setAvatarFile}
                    onSubmit={handleFinalSubmit}
                    onBack={handleBackStep}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};
