import { ReactNode } from "react";
import { userCan } from "../hooks/userCan";

interface CanProps {
    children: ReactNode;
    permissions?: string[];
    roles?: string[];
}

export function Can({ children, permissions, roles }: CanProps) {
    const userCanSeeComponent = userCan({ permissions, roles });

    if (!userCanSeeComponent) {
        return null;
    }

    return (
        <>
            {children}
        </>
    );
}