import { RootState } from "../store";

export const getUserName = (userId: string, store: RootState) => {
  return store.users.otherUsers[userId].userName;
};
