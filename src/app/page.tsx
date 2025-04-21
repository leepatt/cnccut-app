import Link from "next/link";
import { Button } from "@/components/ui/button";
// Placeholder for potential icons, e.g., from lucide-react
// import { CheckCircle, Zap, DraftingCompass, Users, Target, BarChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-gray-900 text-gray-100 font-sans"> {/* Changed main to div for full width background control */}
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
        <div className="max-w-4xl space-y-6">
          {/* Optional: <img src="/logo-light.svg" alt="CNC Cut Logo" className="h-16 mx-auto mb-8" /> */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
            Precision Timber Components, <span className="text-[#B80F0A]">On Demand.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Stop wasting time with emails and quoting delays. CNC Cut puts a professional CNC facility in your pocket. Design, visualise, price, and order custom timber parts instantly.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#B80F0A] hover:bg-[#a00d08] text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-lg mt-4"
          >
            <Link href="/dashboard">Start Building Now</Link>
          </Button>
          <p className="text-sm text-gray-400 pt-2">No credit card required to start designing.</p>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 md:py-24 bg-gray-800">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">Tired of the Old Way?</h2>
          <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
            Endless email chains, confusing quotes, unexpected delays... Getting custom timber components shouldn&apos;t be this hard. We streamline the entire process.
          </p>
          {/* Placeholder for comparison graphic or icons */}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-white">Get Precision Parts in 3 Simple Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="flex flex-col items-center">
              {/* <DraftingCompass className="h-12 w-12 text-[#B80F0A] mb-4" /> */}
               <div className="h-12 w-12 bg-[#B80F0A] rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Configure & Visualise</h3>
              <p className="text-gray-400">Select a template, customise dimensions & materials, and see your design instantly in 3D.</p>
            </div>
            <div className="flex flex-col items-center">
              {/* <Zap className="h-12 w-12 text-[#B80F0A] mb-4" /> */}
               <div className="h-12 w-12 bg-[#B80F0A] rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Instant Quote & Lead Time</h3>
              <p className="text-gray-400">Get transparent, real-time pricing and accurate delivery estimates immediately.</p>
            </div>
            <div className="flex flex-col items-center">
              {/* <CheckCircle className="h-12 w-12 text-[#B80F0A] mb-4" /> */}
               <div className="h-12 w-12 bg-[#B80F0A] rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Order & Track</h3>
              <p className="text-gray-400">Place your order securely and track its progress from production to delivery via your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expanded Features Section */}
      <section className="py-16 md:py-24 bg-gray-800">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12 text-white">Gain Your Competitive Edge</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card Example */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-[#B80F0A]/50 transition duration-300">
              {/* <Icon className="h-8 w-8 text-[#B80F0A] mb-3" /> */}
              <h3 className="font-semibold text-xl mb-2 text-white">Parametric Templates</h3>
              <p className="text-gray-400">Quickly start with standard shapes (panels, boxes, curves) and customise every detail.</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-[#B80F0A]/50 transition duration-300">
              {/* <Icon className="h-8 w-8 text-[#B80F0A] mb-3" /> */}
              <h3 className="font-semibold text-xl mb-2 text-white">Real-Time 3D Visualiser</h3>
              <p className="text-gray-400">Confidently approve designs with an interactive preview that updates instantly.</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-[#B80F0A]/50 transition duration-300">
              {/* <Icon className="h-8 w-8 text-[#B80F0A] mb-3" /> */}
              <h3 className="font-semibold text-xl mb-2 text-white">Instant Pricing & Lead Times</h3>
              <p className="text-gray-400">Eliminate quoting guesswork. Know your costs and timelines upfront.</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-[#B80F0A]/50 transition duration-300">
              {/* <Icon className="h-8 w-8 text-[#B80F0A] mb-3" /> */}
              <h3 className="font-semibold text-xl mb-2 text-white">Wide Material Selection</h3>
              <p className="text-gray-400">Choose from a range of stocked timber materials and thicknesses.</p>
            </div>
             <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-[#B80F0A]/50 transition duration-300">
              {/* <Icon className="h-8 w-8 text-[#B80F0A] mb-3" /> */}
              <h3 className="font-semibold text-xl mb-2 text-white">Professional Grade Output</h3>
              <p className="text-gray-400">Leverage large-format (up to 5.4m x 1.8m) 3-axis CNC capabilities for complex projects.</p>
            </div>
             <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-[#B80F0A]/50 transition duration-300">
              {/* <Icon className="h-8 w-8 text-[#B80F0A] mb-3" /> */}
              <h3 className="font-semibold text-xl mb-2 text-white">Error-Free Production Files</h3>
              <p className="text-gray-400">Orders automatically generate production-ready DXF files for maximum accuracy.</p>
            </div>
          </div>
        </div>
      </section>

       {/* Who It's For Section */}
      <section className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          {/* <Users className="h-12 w-12 text-[#B80F0A] mb-4 mx-auto" /> */}
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">Built for Professionals Like You</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto">
            CNC Cut is the essential tool for Australian builders, designers, cabinet makers, shopfitters, and manufacturers who demand precision, speed, and reliability.
          </p>
           <p className="text-md text-gray-400">(Note: Designed for professional use, not hobbyists. Minimum order costs apply.)</p>
        </div>
      </section>

      {/* Why Choose Us Section */}
       <section className="py-16 md:py-24 bg-gray-800">
        <div className="container mx-auto px-6 max-w-5xl text-center">
           {/* <Target className="h-12 w-12 text-[#B80F0A] mb-4 mx-auto" /> */}
           <h2 className="text-3xl md:text-4xl font-semibold mb-12 text-white">Why CNC Cut?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="font-semibold text-xl mb-2 text-white">Speed & Efficiency</h3>
                    <p className="text-gray-400">Go from concept to order in minutes, not days.</p>
                </div>
                 <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="font-semibold text-xl mb-2 text-white">Accuracy & Reliability</h3>
                    <p className="text-gray-400">Ensure precision with 3D previews and automated file generation.</p>
                </div>
                 <div className="bg-gray-900 p-6 rounded-lg">
                    <h3 className="font-semibold text-xl mb-2 text-white">Transparency & Control</h3>
                    <p className="text-gray-400">Instant pricing and real-time order tracking puts you in command.</p>
                </div>
            </div>
        </div>
      </section>


      {/* Final Call to Action Section */}
      <section className="py-20 md:py-32 bg-gradient-to-t from-gray-900 via-[#351210]/30 to-gray-800">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white">Ready to Revolutionise Your Workflow?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Access professional CNC capabilities today. Start designing your custom timber components now.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#B80F0A] hover:bg-[#a00d08] text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-lg"
          >
            <Link href="/dashboard">Start Building Now - It&apos;s Free to Design</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 border-t border-gray-700">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CNC Cut. All rights reserved.</p>
          {/* Optional: Add links to Terms, Privacy Policy */}
          {/* <div className="mt-2">
            <Link href="/terms" className="hover:text-gray-300 mx-2">Terms of Service</Link>|
            <Link href="/privacy" className="hover:text-gray-300 mx-2">Privacy Policy</Link>
          </div> */}
        </div>
      </footer>
    </div>
  );
}
