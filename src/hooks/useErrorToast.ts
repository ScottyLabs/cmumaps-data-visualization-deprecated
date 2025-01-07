import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { useEffect } from "react";
import { toast } from "react-toastify";

import {
  FULL_FLOOR,
  INVALID_BUILDING_CODE,
  INVALID_FLOOR_LEVEL,
  NO_DEFAULT_FLOOR,
} from "../components/shared/types";

// Toast the error message based on search params
const useErrorToast = (baseUrl: string) => {
  const router = useRouter();
  const searchParam = useSearchParams();

  useEffect(() => {
    const error = searchParam.get("error");
    switch (error) {
      case INVALID_BUILDING_CODE:
        toast.error("The building code is invalid!");
        break;

      case NO_DEFAULT_FLOOR:
        toast.error("Please add a default floor for this building!");
        break;

      case FULL_FLOOR:
        toast.error("Too many people on the floor!");
        break;

      case INVALID_FLOOR_LEVEL:
        toast.error("The floor level is invalid!");
        break;
    }

    // use window history instead of router to prevent refreshing the page
    // and getting rid of the error toast
    window.history.pushState({}, "", baseUrl);
  }, [baseUrl, router, searchParam]);
};

export default useErrorToast;
