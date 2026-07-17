import { createContext, useContext } from "react";

export const userVar = createContext<any>(null);

export function useUserVar() {
    return useContext(userVar);
}