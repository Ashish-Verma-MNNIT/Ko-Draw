import { useRef, useState, useEffect } from "react";
import { BiUndo, BiRedo, BiReset, BiDownload } from "react-icons/bi"
import io from "socket.io-client";
import { addMousePosition, drag, fillColor } from "./actions";
import {
  downloadImage,
  drawCircle,
  drawLine,
  drawOval,
  drawRect,
  drawSelection,
  drawStar,
  drawTextArea,
  loadImage,
} from "./DrawingShapes";

let mouseSending = null;
let socket = null
const userId = sessionStorage.getItem("user")
const paintId = sessionStorage.getItem("paintId")
if (userId && paintId)
  socket = io.connect("http://localhost:8080", {
    auth: {
      paintId, userId
    },
  });
export default function Board({ properties, setProperties, paintRef }) {
  // const paintRef = useRef(null);
  const sketchRef = useRef(null);
  const [drawing, setDrawing] = useState([]);
  const [receiving, setReceiving] = useState(false);
  // const [sending, setSending] = useState(null);
  const [firstStroke, setFirstStroke] = useState(true);
  const [index, setIndex] = useState(-1); //-1 indicates empty, -2 means last frame..
  const [userCursors, setUserCursors] = useState([]);

  useEffect(() => {

  }, [])
  useEffect(() => {
    //FIXME: handle dimensions (need to resize sketch too) when resizing...
    const resizeHandler = (e) => {
      // console.log("resized");
      let sketch = sketchRef.current;
      let sketch_style = getComputedStyle(sketch);
      paintRef.current.width = parseInt(
        sketch_style.getPropertyValue("width")
      );
      paintRef.current.height = parseInt(
        sketch_style.getPropertyValue("height")
      );
      const ctx = paintRef.current.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, paintRef.current.width, paintRef.current.height);
      redraw(ctx);
    };
    window.addEventListener("resize", resizeHandler);
    resizeHandler();
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  /*Redraw function*/
  const redraw = (ctx) => {
    // console.log(index, drawing.length);
    if (index === -1) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, paintRef.current.width, paintRef.current.height);
    } // -2 or >=0
    else {
      // console.log(drawing[drawing.length - 1]);
      ctx.putImageData(
        drawing[index !== -2 ? index : drawing.length - 1],
        0,
        0
      );
    }
  };
  useEffect(() => {
    const ctx = paintRef.current.getContext("2d");
    redraw(ctx);
  }, [index]);

  const reset = () => {
    const ctx = paintRef.current.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, paintRef.current.width, paintRef.current.height);
    setIndex(-1);
    setDrawing([]);
    if (socket) {
      const imgd = paintRef.current.toDataURL("image/png");
      socket.emit("canvas-data", {
        img: imgd,
        id: socket.id,
      });
    }
  };
  const undo = () => {
    if (index === -1) return;
    if (index === -2) {
      setIndex(drawing.length - 2);
    } else {
      setIndex((i) => i - 1);
    }
  };
  const redo = () => {
    if (index === -2 || index === drawing.length - 1) return;
    if (index < drawing.length - 1) {
      setIndex((i) => i + 1);
    }
  };
  useEffect(() => {
    if (drawing.length > 10) {
      const temp = drawing;
      temp.shift();
      setDrawing(temp);
    }
    const ctx = paintRef.current.getContext("2d");
    redraw(ctx);
  }, [drawing]);

  /*Connect to socket and receive*/
  useEffect(() => {
    const user = sessionStorage.getItem("user")
    if (!user) return;
    socket.on("connect", () => {
      console.log("connected: " + socket.id);
    });
    socket.on("mouse", (data) => {
      addMousePosition(data, sketchRef.current, paintRef.current);
      setUserCursors([...userCursors, data.id]);
    });
    socket.on("removeMouse", (id) => {
      console.log(id);
      const node = document.getElementById(id);
      if (node) node.remove();
    });
    socket.on("canvas-data", function (data) {
      let interval = setInterval(function () {
        if (receiving) return;
        setReceiving(true);
        clearInterval(interval);
        const ctx = paintRef.current.getContext("2d");
        const img = new Image();
        img.src = data.img;
        img.onload = function () {
          ctx.drawImage(
            img,
            0,
            0,
            paintRef.current.width,
            paintRef.current.height
          );
          const temp = drawing;
          if (index !== -2) {
            temp.splice(index + 1, drawing.length - index - 1);
            setIndex(-2);
          }
          const imgdata = ctx.getImageData(
            0,
            0,
            paintRef.current.width,
            paintRef.current.height
          );
          setReceiving(false);
          setDrawing([...temp, imgdata]);
        };
      }, 200);
    });

    return () => {
      userCursors.forEach((val, idx) => {
        const el = document.getElementById(val);
        if (el) el.remove();
      });
      setUserCursors([]);
      socket.off("connect");
      socket.off("canvas-data");
      socket.off("mouse");
      socket.off("removeMouse");
    };
  }, []);

  useEffect(() => {
    let node = paintRef.current;
    let ctx = node.getContext("2d");
    // redraw(ctx);
    ctx.strokeStyle = properties.color;
    ctx.lineWidth = properties.size;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (properties.currentTool === "eraser") {
      ctx.strokeStyle = "#FFFFFF"; //TODO: bgcolor
    } else if (properties.currentTool === "line") {
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";
    } else if (properties.currentTool === "pencil") {
      ctx.lineWidth = 1;
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
    } else if (properties.currentTool === "image") {
      loadImage(paintRef.current, socket);
      setProperties({ ...properties, currentTool: "pencil" });
      return;
    } else if (properties.currentTool === "paintBucket") {
      paintRef.current.addEventListener("click", paintPixels);
    } else if (properties.currentTool === "undo") {
      undo(ctx);
      setProperties({ ...properties, currentTool: "pencil" });
      return;
    } else if (properties.currentTool === "redo") {
      redo(ctx);
      setProperties({ ...properties, currentTool: "pencil" });
      return;
    }
    function paintPixels(e) {
      const x = e.pageX - node.offsetLeft;
      const y = e.pageY - node.offsetTop;
      fillColor(node, x, y, properties.color);
      const imgdata = ctx.getImageData(0, 0, node.width, node.height);
      if (socket) {
        const imgd = paintRef.current.toDataURL("image/png");
        socket.emit("canvas-data", {
          img: imgd,
          id: socket.id,
        });
      }
      const temp = drawing;
      if (index !== -2) {
        temp.splice(index + 1, drawing.length - index - 1);
        setIndex(-2);
      }
      setDrawing([...temp, imgdata]);
    }
    /*Mouse Capturing with Event listeners*/
    let mouse = { x: 0, y: 0 };
    let last_mouse = { x: 0, y: 0 };
    let mouse_starting = { x: 0, y: 0 };
    let mouse_points = [];
    function mouseMove(e) {
      last_mouse.x = mouse.x;
      last_mouse.y = mouse.y;
      mouse.x = e.pageX - node.offsetLeft;
      mouse.y = e.pageY - node.offsetTop;
    }
    const MouseMove = function (event) {
      return mouseMove(event);
    };

    function mouseDown(e) {
      mouse_starting.x = e.pageX - node.offsetLeft;
      mouse_starting.y = e.pageY - node.offsetTop;
      node.addEventListener("mousemove", onPaint, false);
    }
    const MouseDown = function (event) {
      return mouseDown(event);
    };

    function mouseUp(e) {
      setFirstStroke(true);
      if (properties.currentTool === "text") {
        redraw(ctx);
        drawTextArea(
          sketchRef.current,
          paintRef.current,
          mouse_starting,
          mouse
        );
      }
      if (properties.currentTool === "select") {
        node.removeEventListener("mousedown", MouseDown, false);
        node.removeEventListener("mousemove", onPaint, false);
        redraw(ctx);
        drag(
          sketchRef.current,
          paintRef.current,
          mouse_starting,
          mouse,
          setProperties,
          setDrawing
        );
        return;
      }
      if (socket) {
        const imgd = paintRef.current.toDataURL("image/png");
        socket.emit("canvas-data", {
          img: imgd,
          id: socket.id,
        });
      }
      const imgdata = ctx.getImageData(0, 0, node.width, node.height);
      const temp = drawing;
      if (index !== -2) {
        temp.splice(index + 1, drawing.length - index - 1);
        setIndex(-2);
      }
      setDrawing([...temp, imgdata]);
      node.removeEventListener("mousemove", onPaint, false);
      if (
        ["rectangle", "circle", "line", "star", "oval", "text"].includes(
          properties.currentTool
        )
      ) {
        setProperties({ ...properties, currentTool: "pencil" });
      }
    }

    const MouseUp = function (event) {
      return mouseUp(event);
    };
    if (properties.currentTool !== "paintBucket") {
      node.addEventListener("mousemove", MouseMove, false);
      node.addEventListener("mousedown", MouseDown, false);
      node.addEventListener("mouseup", MouseUp, false);
    }

    /*Main paint function*/
    let onPaint = function () {
      mouse_points = [
        ...mouse_points,
        {
          title: properties.currentTool,
          color: ctx.strokeStyle,
          size: ctx.lineWidth,
          x0: last_mouse.x,
          y0: last_mouse.y,
          x1: mouse.x,
          y1: mouse.y,
        },
      ];
      if (properties.currentTool === "rectangle") {
        const temp = {
          title: "rectangle",
          color: ctx.strokeStyle,
          size: ctx.lineWidth,
          start_x: mouse_starting.x,
          start_y: mouse_starting.y,
          end_x: mouse.x,
          end_y: mouse.y,
        };
        redraw(ctx);
        drawRect(ctx, temp);
      } else if (
        properties.currentTool === "text" ||
        properties.currentTool === "select"
      ) {
        const temp = {
          title: "text",
          start_x: mouse_starting.x,
          start_y: mouse_starting.y,
          end_x: mouse.x,
          end_y: mouse.y,
        };
        redraw(ctx);
        drawSelection(ctx, temp);
      } else if (properties.currentTool === "star") {
        const cx = (mouse_starting.x + mouse.x) / 2.0;
        const cy = (mouse_starting.y + mouse.y) / 2.0;
        const temp = {
          title: "star",
          color: ctx.strokeStyle,
          size: ctx.lineWidth,
          cx: cx,
          cy: cy,
          spikes: 5,
          outerRadius: mouse.x - mouse_starting.x,
          innerRadius: (mouse.x - mouse_starting.x) / 2.0,
        };
        redraw(ctx);
        drawStar(ctx, temp);
      } else if (properties.currentTool === "line") {
        const temp = {
          title: "line",
          color: ctx.strokeStyle,
          size: ctx.lineWidth,
          x0: mouse_starting.x,
          y0: mouse_starting.y,
          x1: mouse.x,
          y1: mouse.y,
        };
        redraw(ctx);
        drawLine(ctx, temp);
      } else if (properties.currentTool === "circle") {
        const temp = {
          title: "circle",
          color: ctx.strokeStyle,
          size: ctx.lineWidth,
          mouse_starting,
          mouse,
        };
        redraw(ctx);
        drawCircle(ctx, temp);
      } else if (properties.currentTool === "oval") {
        const temp = {
          title: "oval",
          color: ctx.strokeStyle,
          size: ctx.lineWidth,
          mouse_starting,
          mouse,
        };
        redraw(ctx);
        drawOval(ctx, temp);
      } else {
        ctx.beginPath();
        ctx.moveTo(last_mouse.x, last_mouse.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.closePath();
        ctx.stroke();
      }
    };
    if (mouseSending) {
      clearInterval(mouseSending);
    }
    if (socket)
      mouseSending = setInterval(() => {
        socket.emit("mouse", { mouse, id: socket.id, name: sessionStorage.getItem("name") || "anonymous" });
      }, 100);

    /*Cleanup function*/
    return () => {
      node.removeEventListener("click", paintPixels);
      node.removeEventListener("mousemove", MouseMove, false);
      node.removeEventListener("mousedown", MouseDown, false);
      node.removeEventListener("mouseup", MouseUp, false);
    };
  }, [properties, socket]);

  return (
    <div className="w-full h-full" ref={sketchRef}>
      <div className="absolute flex justify-between w-1/5 py-1 bg-white right-10 top-14">
        <span
          title="reset"
          className="text-3xl border border-white rounded-md hover:cursor-pointer"
          onClick={reset}
        >
          <BiReset />
        </span>
        <span
          title="undo"
          className="text-3xl border border-white rounded-md hover:cursor-pointer"
          onClick={undo}
        >
          <BiUndo />
        </span>
        <span
          title="redo"
          className="text-3xl border border-white rounded-md hover:cursor-pointer"
          onClick={redo}
        >
          <BiRedo />
        </span>
        <span
          title="download"
          className="text-3xl border border-white rounded-md hover:cursor-pointer"
          onClick={() => {
            downloadImage(paintRef.current);
            setProperties({ ...properties, currentTool: "pencil" });
          }}
        >
          <BiDownload />
        </span>
      </div>
      {
        //TODO: make dialog box for text options...
      }
      <canvas ref={paintRef} className=""></canvas>
    </div>
  );
}
