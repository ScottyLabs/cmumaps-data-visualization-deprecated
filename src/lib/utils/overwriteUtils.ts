import { toast } from "react-toastify";

import { ID } from "../../components/shared/types";
import { RootState } from "../store";

export const getUserName = (userId: string, store: RootState) => {
  return store.users.otherUsers[userId].userName;
};

export const toastOverwriteOnNode = (name: string, nodeId: ID) => {
  toast.warn(`You overwrote ${name}'s change on node ${nodeId}`, {
    autoClose: false,
  });
};
