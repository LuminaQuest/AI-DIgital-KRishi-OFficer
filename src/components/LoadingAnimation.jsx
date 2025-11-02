import React, { useEffect, useRef } from 'react';
import { Leaf, Sprout } from 'lucide-react';

const LoadingAnimation = ({ isDiagnosing = false }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  
  // Particle class for the animation
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 2 - 1;
      this.speedY = Math.random() * 2 - 1;
      this.color = color || `hsl(${Math.random() * 60 + 100}, 80%, 60%)`;
      this.life = 100;
      this.decay = Math.random() * 2 + 1;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
      this.size *= 0.98;
      return this.life > 0;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life / 100;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  // Initialize canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;
    
    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    // Initial resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create particles
    const createParticles = (x, y, count = 5, color) => {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(new Particle(x, y, color));
      }
    };
    
    // Animation loop
    const animate = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      
      if (deltaTime > interval) {
        lastTime = timestamp - (deltaTime % interval);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particlesRef.current = particlesRef.current.filter(particle => {
          const isAlive = particle.update();
          if (isAlive) {
            particle.draw(ctx);
          }
          return isAlive;
        });
        
        // Draw the main icon
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = Math.min(canvas.width, canvas.height) * 0.3;
        
        // Draw pulsing circle
        const pulseSize = size * 1.5 + Math.sin(Date.now() * 0.005) * 5;
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = '#4ade80';
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Draw the icon
        ctx.save();
        ctx.translate(centerX - size / 2, centerY - size / 2);
        
        if (isDiagnosing) {
          // Draw a magnifying glass for diagnosis
          const glassSize = size * 0.6;
          const handleLength = size * 0.4;
          const handleWidth = size * 0.15;
          
          // Glass part
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, glassSize / 2, 0, Math.PI * 2);
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = size * 0.08;
          ctx.stroke();
          
          // Handle
          const handleX = size / 2 + (glassSize / 2) * Math.cos(Math.PI / 4);
          const handleY = size / 2 + (glassSize / 2) * Math.sin(Math.PI / 4);
          
          ctx.beginPath();
          ctx.moveTo(handleX, handleY);
          ctx.lineTo(handleX + handleLength, handleY + handleLength);
          ctx.lineTo(handleX + handleLength + handleWidth, handleY + handleLength - handleWidth);
          ctx.lineTo(handleX + handleWidth, handleY - handleWidth);
          ctx.closePath();
          ctx.fillStyle = '#4ade80';
          ctx.fill();
          
          // Plus sign
          const plusSize = size * 0.5;
          const plusThickness = size * 0.1;
          
          ctx.fillStyle = '#4ade80';
          // Horizontal
          ctx.fillRect(
            size / 2 - plusSize / 2,
            size / 2 - plusThickness / 2,
            plusSize,
            plusThickness
          );
          // Vertical
          ctx.fillRect(
            size / 2 - plusThickness / 2,
            size / 2 - plusSize / 2,
            plusThickness,
            plusSize
          );
        } else {
          // Draw a growing plant for regular loading
          const leafSize = size * 0.8;
          const stemHeight = size * 0.7;
          const stemWidth = size * 0.08;
          const leafWidth = size * 0.5;
          const leafHeight = size * 0.3;
          
          // Stem
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(
            size / 2 - stemWidth / 2,
            size / 2,
            stemWidth,
            stemHeight
          );
          
          // Leaves (animated)
          const time = Date.now() * 0.001;
          const leaf1Rotation = Math.sin(time * 0.5) * 0.2 - 0.3;
          const leaf2Rotation = Math.sin(time * 0.5 + Math.PI) * 0.2 + 0.3;
          
          // Left leaf
          ctx.save();
          ctx.translate(size / 2, size / 2 + stemHeight * 0.3);
          ctx.rotate(leaf1Rotation);
          drawLeaf(ctx, -leafWidth / 2, 0, leafWidth, leafHeight, '#4ade80');
          ctx.restore();
          
          // Right leaf
          ctx.save();
          ctx.translate(size / 2, size / 2 + stemHeight * 0.6);
          ctx.rotate(leaf2Rotation);
          drawLeaf(ctx, -leafWidth / 2, 0, leafWidth, leafHeight, '#4ade80');
          ctx.restore();
          
          // Bud at the top
          ctx.beginPath();
          ctx.ellipse(
            size / 2,
            size / 2 - size * 0.05,
            size * 0.15,
            size * 0.2,
            Math.PI / 4,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = '#4ade80';
          ctx.fill();
          
          // Add some particles occasionally
          if (Math.random() < 0.1) {
            createParticles(
              size / 2 + (Math.random() - 0.5) * size * 0.3,
              size / 2 - size * 0.3 + (Math.random() - 0.5) * size * 0.2,
              2,
              `hsl(${Math.random() * 40 + 100}, 80%, 60%)`
            );
          }
        }
        
        ctx.restore();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationId = requestAnimationFrame(animate);
    
    // Add initial particles
    const addInitialParticles = () => {
      for (let i = 0; i < 20; i++) {
        createParticles(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          1,
          `hsl(${Math.random() * 60 + 100}, 80%, 60%)`
        );
      }
      
      if (particlesRef.current.length < 10) {
        setTimeout(addInitialParticles, 500);
      }
    };
    
    addInitialParticles();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isDiagnosing]);
  
  // Helper function to draw a leaf
  const drawLeaf = (ctx, x, y, width, height, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y, width / 2, height, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some veins
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x, y + height / 2);
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 4, y + height);
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width * 0.75, y + height);
    ctx.stroke();
  };
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
      />
      <div className="relative z-10 text-center px-4">
        {isDiagnosing ? (
          <div className="text-green-400 text-sm sm:text-base font-medium">
            Analyzing crop health...
          </div>
        ) : (
          <div className="text-green-400 text-sm sm:text-base font-medium">
            Your Krishi Officer is working on it...
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingAnimation;
