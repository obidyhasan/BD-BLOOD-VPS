"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface PostImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  showControls?: boolean;
}

export function PostImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  showControls = true,
}: PostImageCarouselProps) {
  if (!images.length) return null;

  if (images.length === 1) {
    return (
      <div className={cn("relative aspect-[16/9] overflow-hidden", className)}>
        <Image
          src={images[0]}
          alt={alt}
          fill
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <Carousel className={cn("relative w-full", className)}>
      <CarouselContent>
        {images.map((src, index) => (
          <CarouselItem key={`${src}-${index}`}>
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={src}
                alt={`${alt} - ${index + 1}`}
                fill
                className={cn("object-cover", imageClassName)}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {showControls && (
        <>
          <CarouselPrevious className="left-3 size-9 border-white/40 bg-black/40 text-white hover:bg-black/60" />
          <CarouselNext className="right-3 size-9 border-white/40 bg-black/40 text-white hover:bg-black/60" />
        </>
      )}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {images.map((_, index) => (
          <span
            key={index}
            className="size-1.5 rounded-full bg-white/60"
            aria-hidden
          />
        ))}
      </div>
    </Carousel>
  );
}
