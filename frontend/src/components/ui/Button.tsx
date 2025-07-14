"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition duration-200 ease-in-out bg-[#FF4D00] hover:bg-[#cc3c00] text-white border border-[#FF4D00] hover:border-[#cc3c00] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/40 focus:ring-offset-2 ${className}`}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";
