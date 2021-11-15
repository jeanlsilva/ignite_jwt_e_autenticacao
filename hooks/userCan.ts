import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { validateUserPermissions } from "../utils/validateUserPermissions";

type UserCanParams = {
    permissions?: string[];
    roles?: string[];
}

export function userCan({ permissions = [], roles = [] }: UserCanParams) {
    const { user, isAuthenticated } = useContext(AuthContext);    

    if (!isAuthenticated) {
        return false;
    }

    if (user) {
        const userHasValidPermissions = validateUserPermissions({ user, permissions, roles });
        
        return userHasValidPermissions;
    }        
}