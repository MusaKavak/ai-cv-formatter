import clsx from "clsx";
import React from "react";

export default function Title({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={clsx("w-full text-center font-semibold", className)}><h1 className="text-5xl text-center">{children}</h1></div>
}