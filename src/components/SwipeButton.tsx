import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeButtonProps {
  onConfirm: () => void;
  label?: string;
  confirmedLabel?: string;
  className?: string;
  resetDelay?: number; // ms to reset after confirmation. 0 means it stays confirmed.
}

export function SwipeButton({
  onConfirm,
  label = 'Deslize para Confirmar',
  confirmedLabel = 'Confirmado',
  className,
  resetDelay = 0,
}: SwipeButtonProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [handleWidth, setHandleWidth] = useState(0);

  const x = useMotionValue(0);
  const controls = useAnimation();

  useEffect(() => {
    if (containerRef.current && handleRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      setHandleWidth(handleRef.current.offsetWidth);
    }
    
    const handleResize = () => {
      if (containerRef.current && handleRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setHandleWidth(handleRef.current.offsetWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = containerWidth - handleWidth - 10;
    if (info.offset.x >= threshold * 0.8) {
      // Confirmed!
      controls.start({ x: containerWidth - handleWidth - 4 });
      setIsConfirmed(true);
      onConfirm();
      
      if (resetDelay > 0) {
        setTimeout(() => {
          setIsConfirmed(false);
          controls.start({ x: 0 });
        }, resetDelay);
      }
    } else {
      // Revert
      controls.start({ x: 0 });
    }
  };

  const bgOpacity = useTransform(x, [0, containerWidth - handleWidth], [0, 1]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-[52px] bg-secondary/80 rounded-full flex items-center overflow-hidden touch-none",
        isConfirmed && "bg-success/10",
        className
      )}
    >
      <motion.div 
        className="absolute inset-0 bg-success/20"
        style={{ opacity: isConfirmed ? 1 : bgOpacity }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={cn(
          "text-[15px] font-semibold transition-all duration-300",
          isConfirmed ? "text-success opacity-100 scale-110 ml-8" : "text-muted-foreground opacity-100 ml-8"
        )}>
          {isConfirmed ? confirmedLabel : label}
        </span>
      </div>

      <motion.div
        ref={handleRef}
        drag={isConfirmed ? false : "x"}
        dragConstraints={{ left: 0, right: containerWidth - handleWidth - 4 }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className={cn(
          "absolute left-[2px] w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-sm cursor-grab active:cursor-grabbing z-10 transition-colors duration-300",
          isConfirmed ? "bg-success text-white" : "bg-white text-foreground"
        )}
      >
        {isConfirmed ? (
          <CheckCircle2 className="h-6 w-6" />
        ) : (
          <ChevronRight className="h-6 w-6" />
        )}
      </motion.div>
    </div>
  );
}
