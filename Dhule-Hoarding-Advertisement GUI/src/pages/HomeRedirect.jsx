import { Navigate } from "react-router-dom";

const HomeRedirect = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const designation = user?.designation;

  switch (designation) {
    case "Supervisor":
      return <Navigate to="/advertisementPanchnama-form" replace />;

    case "Sanitary Inspector":
      return <Navigate to="/advertisementPanchnama-form" replace />;

    default:
      return <Navigate to="/advertisementPanchnama-form" replace />;
  }
};

export default HomeRedirect;