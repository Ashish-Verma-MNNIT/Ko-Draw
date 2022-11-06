import React from "react";

function NavBar({ handleLoginClick }) {
  const handleClick = () => {
    handleLoginClick();
  };
  return (
    <div className="z-50 navbar">
      <div>
        <span onClick={handleClick} className="loginicon">
          Sign In
        </span>
      </div>
      <div className="dropdown">
        <button className="dropbtn">File</button>
        <div className="dropdown-content">
          <a href="#">New</a>
          <a href="#">Open</a>
          <a href="#">Save As</a>
        </div>
      </div>
      <div className="dropdown">
        <button className="dropbtn">Edit</button>
        <div className="dropdown-content">
          <a href="#">New</a>
          <a href="#">Open</a>
          <a href="#">Save As</a>
        </div>
      </div>
      <div className="dropdown">
        <button className="dropbtn">Insert</button>
        <div className="dropdown-content">
          <a href="#">Shapes</a>
          <a href="#">Images</a>
          <a href="#">Text</a>
        </div>
      </div>
      <div className="dropdown">
        <button className="dropbtn">Draw</button>
        <div className="dropdown-content">
          <a href="#">Star</a>
          <a href="#">Circle</a>
          <a href="#">Rectangle</a>
        </div>
      </div>
      <div className="dropdown">
        <button className="dropbtn">View</button>
        <div className="dropdown-content">
          <a href="#">Zoom</a>
          <a href="#">Canvas</a>
          <a href="#">Grid</a>
        </div>
      </div>
      <div className="dropdown">
        <button className="dropbtn">Help</button>
        <div className="dropdown-content">
          <a href="#">A</a>
          <a href="#">B</a>
          <a href="#">C</a>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
