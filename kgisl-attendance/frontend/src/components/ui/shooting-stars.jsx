import React, { useEffect, useRef } from "react";
import clsx from "clsx";

function cn(...inputs) {
  return clsx(inputs);
}

export const ShootingStars = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = "#9E00FF",
  trailColor = "#2EB9DF",
  starWidth = 10,
  starHeight = 1,
  className,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let timeoutId;
    let star = null;

    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getRandomStartPoint = () => {
      const width = canvas.width || window.innerWidth;
      const height = canvas.height || window.innerHeight;
      const side = Math.floor(Math.random() * 4);
      const offset = Math.random() * (side % 2 === 0 ? width : height);

      switch (side) {
        case 0: return { x: offset, y: 0, angle: 45 };
        case 1: return { x: width, y: offset, angle: 135 };
        case 2: return { x: width, y: offset, angle: 135 };
        case 3: return { x: 0, y: offset, angle: 315 };
        default: return { x: 0, y: 0, angle: 45 };
      }
    };

    const createStar = () => {
      const { x, y, angle } = getRandomStartPoint();
      star = {
        x,
        y,
        angle,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        distance: 0,
        scale: 1,
      };

      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutId = setTimeout(createStar, randomDelay);
    };

    createStar();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (star) {
        const rad = (star.angle * Math.PI) / 180;
        star.x += star.speed * Math.cos(rad);
        star.y += star.speed * Math.sin(rad);
        star.distance += star.speed;
        star.scale = 1 + star.distance / 100;

        if (
          star.x < -50 ||
          star.x > canvas.width + 50 ||
          star.y < -50 ||
          star.y > canvas.height + 50
        ) {
          star = null;
        } else {
          ctx.save();
          ctx.translate(star.x, star.y);
          ctx.rotate(rad);

          const currentWidth = starWidth * star.scale;
          const gradient = ctx.createLinearGradient(0, 0, currentWidth, 0);
          gradient.addColorStop(0, trailColor);
          gradient.addColorStop(1, starColor);

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, currentWidth, starHeight);
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [minSpeed, maxSpeed, minDelay, maxDelay, starColor, trailColor, starWidth, starHeight]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-full absolute inset-0 pointer-events-none", className)}
    />
  );
};
