import React, { useEffect } from "react";

const HomePage = () => {
  useEffect(() => {
    window.location.href = "/login";
  }, []);

  return <p>Redirecting to login...</p>;
};

export default HomePage;
