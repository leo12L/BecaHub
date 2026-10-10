"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe, { type COBEOptions } from "cobe";
import { cn } from "@/lib/utils";

interface Marker {
  location: [number, number]; // [latitude, longitude]
  size: number;
}

interface InteractiveGlobeProps {
  className?: string;
  markers?: Marker[];
  focusLocation?: [number, number];
  onLoad?: () => void;
}

const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Coordenadas de países/regiones populares
export const GLOBE_LOCATIONS = {
  MX: [23.6345, -102.5528] as [number, number], // México
  ES: [40.4168, -3.7038] as [number, number], // España
  US: [37.0902, -95.7129] as [number, number], // Estados Unidos
  CA: [56.1304, -106.3468] as [number, number], // Canadá
  GB: [55.3781, -3.436] as [number, number], // Reino Unido
  DE: [51.1657, 10.4515] as [number, number], // Alemania
  FR: [46.2276, 2.2137] as [number, number], // Francia
  CN: [35.8617, 104.1954] as [number, number], // China
  JP: [36.2048, 138.2529] as [number, number], // Japón
  AR: [-38.4161, -63.6167] as [number, number], // Argentina
  BR: [-14.235, -51.9253] as [number, number], // Brasil
  AU: [-25.2744, 133.7751] as [number, number], // Australia
};

export function InteractiveGlobe({
  className,
  markers = [],
  focusLocation,
  onLoad,
}: InteractiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const phi = useRef(0);
  const theta = useRef(0);
  const targetPhi = useRef(0);
  const targetTheta = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (focusLocation) {
      const [lat, long] = focusLocation;
      targetPhi.current = (lat * Math.PI) / 180;
      targetTheta.current = (long * Math.PI) / 180;
    }
  }, [focusLocation]);

  useEffect(() => {
    if (!isInView || !canvasRef.current) return;

    let width = 0;
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    try {
      // WebGL validation will happen in createGlobe
      const opts = {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0.3,
        dark: 0,
        diffuse: 3,
        mapSamples: 16000,
        mapBrightness: 1.2,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [0.1, 0.8, 1],
        glowColor: [0.4, 0.8, 1],
        markers: markers.map((m) => ({
          location: m.location,
          size: m.size,
        })),
        onRender: (state: Record<string, unknown>) => {
          if (!focusLocation || PREFERS_REDUCED_MOTION) {
            state.phi = phi.current;
            phi.current += PREFERS_REDUCED_MOTION ? 0 : 0.002;
          } else {
            state.phi = phi.current += (targetPhi.current - phi.current) * 0.05;
            state.theta =
              theta.current += (targetTheta.current - theta.current) * 0.05;
          }
          state.width = width * 2;
          state.height = width * 2;
        },
      } as COBEOptions;

      globeRef.current = createGlobe(canvasRef.current, opts);
      onLoad?.();
    } catch (e) {
      // Handle WebGL or other initialization errors
      console.error("Error creating globe:", e);
      // Schedule state update after effect
      window.requestAnimationFrame(() => {
        setHasError(true);
      });
    }

    return () => {
      globeRef.current?.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [isInView, markers, focusLocation, onLoad]);

  if (hasError) {
    return (
      <div
        className={cn(
          "aspect-square w-full flex items-center justify-center",
          "bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5",
          "rounded-2xl border border-border",
          className
        )}
        style={{
          width: "100%",
          height: "auto",
          maxWidth: 600,
        }}
        role="img"
        aria-label="Globo terráqueo interactivo (fallback)"
      >
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🌍</div>
          <p className="text-sm text-muted-foreground">
            Globo interactivo no disponible
          </p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn("aspect-square w-full", className)}
      style={{
        width: "100%",
        height: "auto",
        maxWidth: 600,
        contain: "layout paint size",
      }}
      role="img"
      aria-label="Globo terráqueo interactivo"
    />
  );
}
