import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Card from './Card';
import Button from './Button';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    confirmButtonVariant = 'danger', 
    Icon = AlertTriangle, 
    iconColor = 'text-red-600', 
    iconBgColor = 'bg-red-50' 
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-md bg-white border border-black/08 shadow-xl rounded-2xl animate-fade-in-up">
                <div className="text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-2xl ${iconBgColor}`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-[#111118] tracking-tight">{title}</h3>
                    <div className="mt-2 px-4 py-2">
                        <p className="text-sm text-[#4A4A65] leading-relaxed">{message}</p>
                    </div>
                    <div className="flex justify-center gap-3 mt-5">
                        <Button 
                            variant="secondary" 
                            onClick={onClose} 
                            className="!py-2 !px-5 text-xs font-semibold !bg-[#F5F3E7] hover:!bg-black/05 text-[#111118]"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant={confirmButtonVariant} 
                            onClick={onConfirm} 
                            className="!py-2 !px-5 text-xs font-semibold"
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ConfirmationModal;