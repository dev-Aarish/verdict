import { createContext, useContext } from "react";
import type { UserSafe } from "./types";

export const UserContext = createContext<{
  user: UserSafe | null;
  setUser: (user: UserSafe | null) => void;
}>({
  user: null,
  setUser: () => {},
});
export const useUser = () => useContext(UserContext);
