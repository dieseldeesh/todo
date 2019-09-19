import React from "react";

export function handleStringChange(handler: (value: string) => void) {
    return (event: React.FormEvent<HTMLElement>) => handler((event.target as HTMLInputElement).value);
}

export function handleFileChange(handler: (value: FileList | null) => void) {
    return (event: React.FormEvent<HTMLElement>) => handler((event.target as HTMLInputElement).files);
}
