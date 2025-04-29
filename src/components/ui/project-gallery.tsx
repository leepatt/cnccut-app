"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

// Define project data
const projects = [
  {
    id: 1,
    src: "/20221114_153641_01-e1685692782985.jpg",
    alt: "CNC Machine cutting perforated panel",
    title: "Perforated Panels"
  },
  {
    id: 2,
    src: "/curcles.png",
    alt: "Circular pattern CNC cut",
    title: "Circular Pattern"
  },
  {
    id: 3,
    src: "/formply radius.png",
    alt: "Curved formply components",
    title: "Curved Formwork"
  },
  {
    id: 4,
    src: "/formply radius 2.png",
    alt: "Precision CNC cutting",
    title: "Precision CNC Cutting"
  }
];

export function ProjectGallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Function to scroll to next slide
  const scrollNext = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: width / 2, behavior: 'smooth' });
      setActiveSlide(prevSlide => (prevSlide + 1) % projects.length);
    }
  };
  
  // Function to scroll to previous slide
  const scrollPrev = () => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: -width / 2, behavior: 'smooth' });
      setActiveSlide(prevSlide => (prevSlide - 1 + projects.length) % projects.length);
    }
  };
  
  // Function to scroll to specific slide
  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      const slideWidth = 296; // w-72 (288px) + margin (8px)
      const scrollPosition = index * slideWidth;
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      setActiveSlide(index);
    }
  };

  return (
    <section className="py-16 bg-[#f8f8fc]">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Customer Projects</h2>
          <p className="text-lg text-gray-600">See what professionals have created with CNC Cut</p>
        </div>
        
        {/* Gallery Slider */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Arrows */}
          <button 
            onClick={scrollPrev}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-[#B80F0A] rounded-full p-2 shadow-md transition-all" 
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={scrollNext}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-[#B80F0A] rounded-full p-2 shadow-md transition-all" 
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* Slider Container */}
          <div className="overflow-hidden px-4">
            <div 
              ref={scrollRef}
              className="flex space-x-4 pb-4 pt-2 snap-x snap-mandatory overflow-x-auto scrollbar-hide" 
              style={{ scrollBehavior: 'smooth' }}
              onScroll={() => {
                if (scrollRef.current) {
                  const scrollPos = scrollRef.current.scrollLeft;
                  const slideWidth = 296; // w-72 (288px) + margin (8px)
                  const newActiveSlide = Math.round(scrollPos / slideWidth);
                  if (newActiveSlide !== activeSlide && newActiveSlide < projects.length) {
                    setActiveSlide(newActiveSlide);
                  }
                }
              }}
            >
              {/* Project Cards */}
              {projects.map((project) => (
                <div key={project.id} className="flex-shrink-0 w-72 snap-start">
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer">
                    <div className="aspect-[4/3] relative">
                      <Image 
                        src={project.src}
                        alt={project.alt}
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-base">{project.title}</h3>
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dots indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {projects.map((_, index) => (
              <button 
                key={`dot-${index}`} 
                className={`w-2 h-2 rounded-full transition-colors ${index === activeSlide ? 'bg-[#B80F0A]' : 'bg-gray-300'}`} 
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => scrollToSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 