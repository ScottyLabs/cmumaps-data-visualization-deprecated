import React, { Dispatch, SetStateAction, createContext } from "react";
import { ID } from "../shared/types";
import { DefaultIdSelected, IdSelectedInfo } from "./IdEventsTypes";

export interface IdEventsData {
  idSelected: IdSelectedInfo;
  setIdSelected: Dispatch<SetStateAction<IdSelectedInfo>>;

  nodeIdHovered: ID;
  setNodeIdHovered: Dispatch<SetStateAction<ID>>;
}

export const IdEventsContext = createContext<IdEventsData>({
  idSelected: DefaultIdSelected,
  setIdSelected: () => {},

  nodeIdHovered: "",
  setNodeIdHovered: () => {},
});

interface Props {
  children: React.ReactNode;
  idEventsData: IdEventsData;
}

export const IdEventsProvider = ({
  children,
  idEventsData: idEventsData,
}: Props) => {
  return (
    <IdEventsContext.Provider value={idEventsData}>
      {children}
    </IdEventsContext.Provider>
  );
};

export default IdEventsProvider;
