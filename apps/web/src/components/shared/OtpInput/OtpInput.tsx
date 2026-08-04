"use client";

import { ChangeEvent, KeyboardEvent, useId } from "react";
import { Input } from "@/components/ui/input";

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
}

export default function OtpInput({
    value,
    onChange,
    disabled = false,
    error = false,
}: OtpInputProps) {
    const id = useId();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value.replace(/\D/g, "").slice(0, 6));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") event.preventDefault();
    };

    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-[10px] font-black uppercase  text-muted-foreground"
            >
                6-digit verification code
            </label>
            <Input
                id={id}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={disabled}
                aria-invalid={error}
                aria-describedby={`${id}-hint`}
                placeholder="000000"
                className="h-16 rounded-2xl border-border/40 bg-white text-center text-2xl font-black tracking-[0.65em] focus:border-primary dark:bg-zinc-900/50"
            />
            <p id={`${id}-hint`} className="text-center text-xs text-muted-foreground">
                Enter the code sent to your email.
            </p>
        </div>
    );
}
