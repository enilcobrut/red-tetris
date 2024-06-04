import React from 'react';
import hotToast, { Toaster as HotToaster } from 'react-hot-toast';
import Paragraph from './Paragraph';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Toaster = HotToaster;

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

function Toast({ visible, className, ...props }) {
    return (
        <div
            className={cn(
                'min-h-16 mb-2 flex w-[350px] flex-col items-start gap-1 rounded-md bg-white px-6 py-4 shadow-lg',
                visible && 'animate-in slide-in-from-bottom-5',
                className
            )}
            {...props}
        />
    );
}


Toast.Title = function ToastTitle({ className, ...props }) {
    return <p className={cn('text-sm font-medium', className)} {...props} />;
}

Toast.Description = function ToastDescription({ className, ...props }) {
    return <p className={cn('text-sm opacity-80', className)} {...props} />;
}

export function toast(opts) {
    const { title, message, type = 'default', duration = 3000 } = opts;

    return hotToast.custom(
        ({ visible }) => (
            <Toast
                visible={visible}
                className={cn({
                    'bg-red-600 text-white': type === 'error',
                    'bg-black text-white': type === 'success',
                })}
            >
                <div className="toast-title">
                    <Paragraph>{title}</Paragraph>
                </div>
                {message && (
                    <div className="toast-description">
                        <Paragraph size="small">{message}</Paragraph>
                    </div>
                )}
            </Toast>
        ),
        { duration }
    );
}
