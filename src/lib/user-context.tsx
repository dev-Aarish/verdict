import { createContext, useContext } from "react";

export const UserContext = createContext<{ user: any; setUser: (user: any) => void }>({
  user: null,
  setUser: () => {},
});
export const useUser = () => useContext(UserContext);
