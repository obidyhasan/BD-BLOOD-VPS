"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import type { Settings } from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CarouselSlide = {
  id: string;
  title: string;
  description?: string;
  phone?: string;
  address?: string;
  bannerImage?: string;
  ctaText?: string;
  medicalSlug?: string;
};

const Carousel = ({
  carouselData,
  height,
  showDots = true,
  className = "",
}: {
  carouselData: CarouselSlide[];
  height?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  showDots?: boolean;
  className?: string;
}) => {
  const [Slider, setSlider] = useState<ComponentType<
    Settings & { children?: ReactNode }
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultHeight = {
    mobile: "h-[550px]",
    tablet: "md:h-[650px]",
    desktop: "lg:h-[800px]",
  };

  const heightClasses = {
    mobile: height?.mobile || defaultHeight.mobile,
    tablet: height?.tablet || defaultHeight.tablet,
    desktop: height?.desktop || defaultHeight.desktop,
  };

  const settings = {
    dots: showDots,
    infinite: true,
    speed: 1200,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 6000,
    pauseOnHover: false,
    fade: true,
    beforeChange: (_current: number, next: number) => {
      setCurrentSlide(next);
    },
    appendDots: (dots: React.ReactNode) => (
      <div className="absolute bottom-32 left-0 right-0 z-20">
        <ul className="m-0 p-0 flex justify-center items-center space-x-3">
          {dots}
        </ul>
      </div>
    ),
    customPaging: (i: number) => (
      <div
        className={`transition-all duration-500 cursor-pointer ${i === currentSlide
          ? "w-10 h-2.5 bg-primary rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          : "w-2.5 h-2.5 bg-foreground/20 hover:bg-foreground/40 rounded-full"
          }`}
      />
    ),
  };

  useEffect(() => {
    import("react-slick").then((module) => {
      setSlider(
        () =>
          module.default as ComponentType<Settings & { children?: ReactNode }>,
      );
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !Slider) {
    return (
      <div
        className={`w-full ${className} animate-pulse bg-zinc-100 dark:bg-zinc-900 ${heightClasses.mobile} ${heightClasses.tablet} ${heightClasses.desktop}`}
      />
    );
  }

  const SlickSlider = Slider;

  return (
    <div
      className={`w-full relative group overflow-hidden border border-primary/20 ${className}`}
    >
      <SlickSlider {...settings}>
        {carouselData.map((slide, index) => (
          <div key={slide.id} className="outline-none relative">
            <div
              className={`relative overflow-hidden bg-white ${heightClasses.mobile} ${heightClasses.tablet} ${heightClasses.desktop} w-full flex items-center`}
            >
              {/* Background Layer */}
              <div className="absolute inset-0 z-0 text-foreground">
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                {slide.bannerImage && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={slide.bannerImage}
                      alt={slide.title}
                      fill
                      className="object-cover opacity-10 grayscale group-hover:grayscale-0 transition-all duration-1000"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/5 mix-blend-multiply opacity-30" />
                <div className="absolute top-0 right-0 w-2/3 h-full overflow-hidden opacity-20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.2),transparent_60%)]" />
                </div>
              </div>

              {/* Dynamic Particles/Shapes */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.05, 0.1, 0.05],
                  rotate: [0, 45, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-24 -right-24 size-[600px] border border-primary/20 rounded-full blur-2xl"
              />

              <div className="px-8 relative z-20 ">
                <AnimatePresence mode="wait">
                  {currentSlide === index && (
                    <div className="max-w-md space-y-2">
                      <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter text-foreground leading-[0.95] uppercase "
                      >
                        {slide.title.split(",").map((text, i) => (
                          <span key={i} className="block overflow-hidden pb-2">
                            <span
                              className={i === 1 ? "text-primary " : ""}
                            >
                              {text}
                            </span>
                          </span>
                        ))}
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-md md:text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl"
                      >
                        {slide.description}
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="space-y-1 text-sm font-semibold text-foreground/80"
                      >
                        {slide.phone && (
                          <p className="break-words">
                            <span className="font-black text-primary">Phone:</span>{" "}
                            {slide.phone}
                          </p>
                        )}
                        {slide.address && (
                          <p className="line-clamp-2 break-words">
                            <span className="font-black text-primary">Address:</span>{" "}
                            {slide.address}
                          </p>
                        )}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                      >
                        <Link
                          href={
                            slide.medicalSlug
                              ? `/medical/${slide.medicalSlug}`
                              : "/medical"
                          }
                        >
                          <Button
                            size="lg"
                            className="mt-2 w-full sm:w-auto h-12 px-6 text-xs rounded-lg bg-primary hover:bg-emerald-600 shadow-2xl shadow-primary/30 transition-all duration-300 font-black uppercase up"
                          >
                            {slide.ctaText || "Visit Medical"}
                            <ArrowRight className="ml-3 size-5 group-hover:translate-x-2 transition-transform" />
                          </Button>
                        </Link>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ))}
      </SlickSlider>
    </div>
  );
};

export default Carousel;
