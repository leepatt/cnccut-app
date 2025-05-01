'use client';

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["In your pocket.", "At the Jobsite.", "From the site office.", "In the ute.", "When the plan changes."],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col gap-8 py-16 md:py-20 items-center justify-center text-center">
          <div className="flex flex-col gap-4 items-center">
            <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter font-bold">
              <span className="text-[#B80F0A]">A CNC Factory</span>
              <span className="relative flex w-full justify-center h-16 md:h-24 items-center">
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold whitespace-nowrap"
                    initial={{ opacity: 0, y: -50 }}
                    animate={
                      titleNumber === index
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: titleNumber > index ? -50 : 50 }
                    }
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-600 max-w-4xl">
            Sick of chasing quotes and waiting days? CNC Cut gives you instant pricing. 
            Configure, visualise, and order custom CNC parts online. Anytime, anywhere.
            </p>
          </div>
          
          <div className="flex justify-center mt-4 mb-8">
            <Button asChild size="lg" className="gap-4 bg-[#B80F0A] hover:bg-[#a00d08] text-white font-bold py-5 px-10 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg">
              <Link href="/dashboard">
                Start Building Now <MoveRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          <div className="w-full max-w-5xl border-4 border-gray-100 rounded-xl shadow-2xl overflow-hidden bg-white relative mt-6">
            <Image 
              src="/dashboard-prefiew.png"
              alt="CNC Cut Dashboard Preview" 
              width={1920} 
              height={1080} 
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero }; 