export function drawLine(ctx, shape) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.size;
  ctx.beginPath();
  ctx.moveTo(shape.x0, shape.y0);
  ctx.lineTo(shape.x1, shape.y1);
  ctx.stroke();
}

export function drawStar(ctx, starProps) {
  let rot = (Math.PI / 2) * 3;
  let x = starProps.cx;
  let y = starProps.cy;
  let step = Math.PI / starProps.spikes;

  ctx.beginPath();
  ctx.strokeStyle = starProps.color;
  ctx.lineWidth = starProps.size;
  ctx.moveTo(starProps.cx, starProps.cy - starProps.outerRadius);
  for (let i = 0; i < starProps.spikes; i++) {
    x = starProps.cx + Math.cos(rot) * starProps.outerRadius;
    y = starProps.cy + Math.sin(rot) * starProps.outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = starProps.cx + Math.cos(rot) * starProps.innerRadius;
    y = starProps.cy + Math.sin(rot) * starProps.innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(starProps.cx, starProps.cy - starProps.outerRadius);
  ctx.closePath();
  ctx.stroke();
}

export function drawRect(ctx, shape) {
  ctx.lineWidth = shape.size;
  ctx.strokeStyle = shape.color;
  ctx.strokeRect(
    shape.start_x,
    shape.start_y,
    shape.end_x - shape.start_x,
    shape.end_y - shape.start_y
  );
}

export function drawCircle(ctx, shape) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.size;
  const center_x = (shape.mouse_starting.x + shape.mouse.x) / 2.0;
  const center_y = (shape.mouse_starting.y + shape.mouse.y) / 2.0;
  const radius =
    Math.hypot(
      Math.abs(shape.mouse.x - shape.mouse_starting.x),
      Math.abs(shape.mouse.y - shape.mouse_starting.y)
    ) / 2.0;
  ctx.beginPath();
  ctx.arc(center_x, center_y, radius, 0, Math.PI * 2, true);
  ctx.stroke();
}

export function drawOval(ctx, shape) {
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.size;
  let x1 = shape.mouse_starting.x;
  let x2 = shape.mouse.x;
  let y1 = shape.mouse_starting.y;
  let y2 = shape.mouse.y;
  if (x1 > x2) {
    let temp = x1;
    x1 = x2;
    x2 = temp;
  }
  if (y1 > y2) {
    let temp = y1;
    y1 = y2;
    y2 = temp;
  }
  const center_x = (x2 + x1) / 2.0;
  const center_y = (y2 + y1) / 2.0;
  const radiusX = (x2 - x1) / 2.0;
  const radiusY = (y2 - y1) / 2.0;
  ctx.beginPath();
  ctx.ellipse(
    center_x,
    center_y,
    radiusX,
    radiusY,
    Math.PI * 2,
    0,
    Math.PI * 2
  );
  ctx.stroke();
}

export function drawTextArea(parent, canvas, mouse_starting, mouse) {
  let area = document.createElement("textarea");
  area.style.width = mouse.x - mouse_starting.x;
  area.style.height = mouse.y - mouse_starting.y;
  area.style.position = "fixed";
  area.style.top = canvas.offsetTop + mouse_starting.y + "px";
  area.style.left = canvas.offsetLeft + mouse_starting.x + "px";
  area.style.zIndex = 100;
  area.style.paddingLeft = "2px";
  parent.appendChild(area);
  area.onfocus = (e) => {
    area.style.outlineColor = "blue";
    area.style.backgroundColor = "white";
  };
  area.focus();
  area.onblur = () => {
    const text = area.value;
    area.remove();
    console.log(text);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.font = "20px serif"; //TODO: instead of hardcoding, provide options to users..
    ctx.fillText(text, mouse_starting.x, mouse_starting.y); //TODO: implement to draw multiple lines..
  };
}

export function loadImage(canvas, socket) {
  let input = document.createElement("input");
  input.type = "file";
  input.addEventListener("change", function (e) {
    let URL = window.URL;
    let url = URL.createObjectURL(e.target.files[0]);
    const img = new Image();
    img.src = url;
    img.onload = function () {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        window.innerWidth - canvas.width,
        window.innerHeight - canvas.height,
        500,
        300
      );
      socket.emit("canvas-data", {
        img: canvas.toDataURL("image/png"),
        id: socket.id,
      });
    };
  });
  input.click();
}

export function downloadImage(canvas) {
  const link = document.createElement("a");
  const fileName = window.prompt("Enter fileName:");
  if (!fileName || fileName === "") link.download = "download.png";
  else link.download = fileName + ".png";
  let dt = canvas.toDataURL("image/png");
  link.href = dt.replace(/^data:image\/[^;]/, "data:application/octet-stream");
  link.click();
  link.remove();
}

export function drawSelection(ctx, shape) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000000";
  ctx.setLineDash([10]);
  ctx.strokeRect(
    shape.start_x,
    shape.start_y,
    shape.end_x - shape.start_x,
    shape.end_y - shape.start_y
  );
  ctx.setLineDash([]);
}
