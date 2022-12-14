import Board from "../board/Board";
import Toolbar from "../toolbar/Toolbar";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import NavBar from "../Navbar/NavBar";
export default function Container({ paintRef }) {
  const sizeRef = useRef(null);
  const [properties, setProperties] = useState({
    currentTool: "pencil",
    color: "#000000",
    bgcolor: "#FFFFFF",
    size: 5,
  });
  useEffect(() => {
    //FIXME: handle resize correctly
    const handleResize = (e) => {
      // console.log("resized");
      sizeRef.current.width = window.innerWidth;
      sizeRef.current.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });
  return (
    <><NavBar />
      <div className="fixed flex w-screen h-screen pt-12 bg-black" ref={sizeRef}>
        <div className="z-20 h-auto mx-1 my-2 bg-white rounded-md w-fit">
          <Toolbar properties={properties} setProperties={setProperties} />
        </div>
        <div className="z-20 w-full h-auto mx-1 my-2 rounded-md">
          <Board properties={properties} setProperties={setProperties} paintRef={paintRef} />
        </div>
      </div>
    </>
  );
}
