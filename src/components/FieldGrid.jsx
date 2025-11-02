import React, { useEffect, useRef } from 'react';

const FieldGrid = ({ activeSector, onSectorHover, onSectorClick }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const hoveredSector = useRef(null);
  
  // Farm field grid configuration
  const rows = 6;
  const cols = 8;
  const sectors = Array(rows * cols).fill().map((_, i) => ({
    id: i + 1,
    row: Math.floor(i / cols) + 1,
    col: (i % cols) + 1,
    health: 0.7 + Math.random() * 0.3, // Random health value between 0.7 and 1.0
  }));n
  // Draw the farm field grid
  const drawField = (ctx, width, height) => {
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    // Draw grid background (subtle soil color)
    ctx.fillStyle = 'rgba(94, 70, 44, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(width, i * cellHeight);
      ctx.stroke();
    }
    
    // Draw sectors with health indicators
    sectors.forEach(sector => {
      const x = (sector.col - 1) * cellWidth;
      const y = (sector.row - 1) * cellHeight;
      
      // Health-based color (green for healthy, yellow/orange/red for issues)
      let healthColor;
      if (sector.health > 0.8) {
        healthColor = `rgba(72, 187, 120, ${sector.health * 0.7})`; // Green
      } else if (sector.health > 0.6) {
        healthColor = `rgba(234, 179, 8, ${sector.health * 0.7})`; // Yellow
      } else if (sector.health > 0.4) {
        healthColor = `rgba(249, 115, 22, ${sector.health * 0.7})`; // Orange
      } else {
        healthColor = `rgba(239, 68, 68, ${0.3 + (1 - sector.health) * 0.7})`; // Red
      }
      
      // Draw sector background with health color
      ctx.fillStyle = healthColor;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      
      // Draw sector number
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sector.id, x + cellWidth / 2, y + cellHeight / 2);
      
      // Highlight active sector
      if (activeSector === sector.id) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
      }
      
      // Highlight hovered sector
      if (hoveredSector.current === sector.id) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    });
  };
  
  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    
    // Set canvas size to match display size
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw the field
    drawField(ctx, width, height);
    
    // Continue animation
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Handle canvas click
  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    
    const col = Math.floor(x / cellWidth) + 1;
    const row = Math.floor(y / cellHeight) + 1;
    
    if (col >= 1 && col <= cols && row >= 1 && row <= rows) {
      const sectorId = (row - 1) * cols + col;
      onSectorClick && onSectorClick(sectorId);
    }
  };
  
  // Handle mouse move for hover effect
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;
    
    const col = Math.floor(x / cellWidth) + 1;
    const row = Math.floor(y / cellHeight) + 1;
    
    if (col >= 1 && col <= cols && row >= 1 && row <= rows) {
      const sectorId = (row - 1) * cols + col;
      if (hoveredSector.current !== sectorId) {
        hoveredSector.current = sectorId;
        onSectorHover && onSectorHover(sectorId);
      }
    } else if (hoveredSector.current !== null) {
      hoveredSector.current = null;
      onSectorHover && onSectorHover(null);
    }
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    if (hoveredSector.current !== null) {
      hoveredSector.current = null;
      onSectorHover && onSectorHover(null);
    }
  };
  
  // Initialize animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeSector]);
  
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Grid overlay with subtle pattern */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FieldGrid;
