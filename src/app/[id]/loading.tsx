"use client";

import React from "react";

import Loader from "../../components/common/Loader";
import NavBar from "../../components/layouts/NavBar";

const Loading = () => {
  return (
    <>
      <NavBar buildingCode={""} />
      <Loader loadingText="Loading" />
    </>
  );
};

export default Loading;
