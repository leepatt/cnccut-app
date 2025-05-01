import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Zap, 
  DraftingCompass, 
  Users, 
  Target, 
  BarChart, 
  Settings, 
  ScanEye, 
  Bolt, 
  Box, 
  FileText,
  ArrowRight
} from 'lucide-react';
import { Hero } from "@/components/ui/animated-hero";
import { ProjectGallery } from "@/components/ui/project-gallery";

// Define logos array at the top level or within the component scope
const logos = [
  { src: "/CNC CUT - ARDREAGH.png", alt: "Ardreagh Formwork Logo" },
  { src: "/CNC CUT - D FORM.png", alt: "D Form Logo" },
  { src: "/CNC CUT - ECOKIT.png", alt: "Ecokit Logo" },
  { src: "/CNC CUT - FRAMEWORKS.png", alt: "Frameworks Logo" },
  { src: "/CNC CUT - KANE.png", alt: "Kane Constructions Logo" },
  { src: "/CNC CUT - RMA.png", alt: "RMA Group Logo" },
  { src: "/CNC CUT - TBUILD.png", alt: "Tbuild Logo" },
  { src: "/CNC CUT - TECHNIQUE.png", alt: "Technique Construction Group Logo" },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900 font-sans">
      {/* Header - Using sticky positioning */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex-shrink-0">
            <Image src="/cnc-cut-logo-black.png" alt="CNC Cut Logo" width={170} height={55} />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-700 hover:text-[#B80F0A] font-medium transition">Features</Link>
            <Link href="#how-it-works" className="text-gray-700 hover:text-[#B80F0A] font-medium transition">How It Works</Link>
            <Link href="#solutions" className="text-gray-700 hover:text-[#B80F0A] font-medium transition">Solutions</Link>
            <Button asChild variant="outline" className="border-gray-200 hover:border-[#B80F0A] hover:text-[#B80F0A] transition">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-[#B80F0A] hover:bg-[#a00d08] text-white transition">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
          {/* Mobile menu button could be added here */}
        </div>
      </header>

      {/* New Animated Hero Section */}
      <Hero />

      {/* Company logos section (social proof) */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <p className="text-center text-gray-500 mb-6">Trusted by industry professionals across Australia</p>
          {/* Logos row - simplified approach */}
          <div className="max-w-screen-lg mx-auto overflow-hidden">
            <div className="flex space-x-16 py-4 animate-scroll">
              {logos.map((logo, index) => (
                <div key={index} className="flex-shrink-0">
                  <Image 
                    src={logo.src}
                    alt={logo.alt}
                    width={150}
                    height={40}
                    className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              ))}
              {/* Duplicate logos for continuous scrolling */}
              {logos.map((logo, index) => (
                <div key={`duplicate-${index}`} className="flex-shrink-0">
                  <Image 
                    src={logo.src}
                    alt={logo.alt}
                    width={150}
                    height={40}
                    className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Modern with hover animations */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Precision Parts in 3 Simple Steps</h2>
            <p className="text-lg text-gray-600">We&apos;ve streamlined the entire process so you can focus on what matters most—your projects.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition group">
              <div className="w-16 h-16 bg-[#ffe5e5] rounded-lg flex items-center justify-center mb-5 transition-all group-hover:bg-[#B80F0A] group-hover:rotate-6">
                <DraftingCompass className="h-8 w-8 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Design & Visualize</h3>
              <p className="text-gray-600">Select a template, customize dimensions and materials, and preview your design in real-time 3D.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition group">
              <div className="w-16 h-16 bg-[#ffe5e5] rounded-lg flex items-center justify-center mb-5 transition-all group-hover:bg-[#B80F0A] group-hover:rotate-6">
                <Zap className="h-8 w-8 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Pricing</h3>
              <p className="text-gray-600">Get transparent, real-time pricing and accurate delivery estimates with a single click.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition group">
              <div className="w-16 h-16 bg-[#ffe5e5] rounded-lg flex items-center justify-center mb-5 transition-all group-hover:bg-[#B80F0A] group-hover:rotate-6">
                <CheckCircle className="h-8 w-8 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Order & Track</h3>
              <p className="text-gray-600">Submit your order securely and monitor its journey from production to delivery in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Slider for Customer Projects - Now using the interactive component */}
      <ProjectGallery />

      {/* Features Section - Grid layout with hover effects */}
      <section id="features" className="py-16 md:py-20 bg-[#f8f8fc]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need in One Place</h2>
            <p className="text-lg text-gray-600">Professional-grade CNC capabilities in a simple, intuitive interface.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards with hover animation */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all group">
              <div className="mb-4 w-12 h-12 rounded-lg bg-[#ffe5e5] flex items-center justify-center transition-all group-hover:bg-[#B80F0A]">
                <Settings className="h-6 w-6 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Parametric Templates</h3>
              <p className="text-gray-600">Start with standard shapes and customize every detail to your exact specifications.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all group">
              <div className="mb-4 w-12 h-12 rounded-lg bg-[#ffe5e5] flex items-center justify-center transition-all group-hover:bg-[#B80F0A]">
                <ScanEye className="h-6 w-6 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">3D Visualizer</h3>
              <p className="text-gray-600">See your components from every angle before production with our interactive 3D preview.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all group">
              <div className="mb-4 w-12 h-12 rounded-lg bg-[#ffe5e5] flex items-center justify-center transition-all group-hover:bg-[#B80F0A]">
                <Bolt className="h-6 w-6 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Instant Quotes</h3>
              <p className="text-gray-600">Know your costs and timelines upfront—no more waiting for email replies or callbacks.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all group">
              <div className="mb-4 w-12 h-12 rounded-lg bg-[#ffe5e5] flex items-center justify-center transition-all group-hover:bg-[#B80F0A]">
                <Box className="h-6 w-6 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Material Selection</h3>
              <p className="text-gray-600">Choose from our range of premium timber materials and thicknesses for any project.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all group">
              <div className="mb-4 w-12 h-12 rounded-lg bg-[#ffe5e5] flex items-center justify-center transition-all group-hover:bg-[#B80F0A]">
                <BarChart className="h-6 w-6 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Professional Output</h3>
              <p className="text-gray-600">Leverage industrial CNC capabilities (up to 5.4m × 1.8m) for your most complex projects.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all group">
              <div className="mb-4 w-12 h-12 rounded-lg bg-[#ffe5e5] flex items-center justify-center transition-all group-hover:bg-[#B80F0A]">
                <FileText className="h-6 w-6 text-[#B80F0A] transition-all group-hover:text-white" />
              </div>
              <h3 className="font-bold text-xl mb-2">Error-Free Files</h3>
              <p className="text-gray-600">Production-ready DXF files are automatically generated for maximum precision.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions/Who It&apos;s For Section */}
      <section id="solutions" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="w-16 h-16 bg-[#ffe5e5] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-[#B80F0A]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Professionals Like You</h2>
            <p className="text-lg text-gray-600">
              CNC Cut is the essential tool for Australian builders, cabinet makers, shopfitters, and manufacturers who demand precision and efficiency.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-center">
            <div className="bg-[#f8f8fc] p-6 rounded-xl transition hover:bg-[#ffe5e5]">
              <h3 className="font-bold text-xl mb-2">Builders</h3>
              <p className="text-gray-600">Custom components for your construction projects, delivered when you need them.</p>
            </div>
            <div className="bg-[#f8f8fc] p-6 rounded-xl transition hover:bg-[#ffe5e5]">
              <h3 className="font-bold text-xl mb-2">Cabinet Makers</h3>
              <p className="text-gray-600">Precision panels and box components for your finest cabinet work.</p>
            </div>
            <div className="bg-[#f8f8fc] p-6 rounded-xl transition hover:bg-[#ffe5e5]">
              <h3 className="font-bold text-xl mb-2">Designers</h3>
              <p className="text-gray-600">Turn your innovative designs into reality with precision CNC cutting.</p>
            </div>
            <div className="bg-[#f8f8fc] p-6 rounded-xl transition hover:bg-[#ffe5e5]">
              <h3 className="font-bold text-xl mb-2">Manufacturers</h3>
              <p className="text-gray-600">Streamline your production process with on-demand components.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Comparison Cards */}
      <section className="py-16 md:py-20 bg-[#f8f8fc]">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="w-16 h-16 bg-[#ffe5e5] rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-[#B80F0A]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CNC Cut?</h2>
            <p className="text-lg text-gray-600">
              We&apos;ve reimagined the entire CNC ordering experience from the ground up.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg transition hover:shadow-xl">
              <div className="bg-[#B80F0A] h-2"></div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">Speed & Efficiency</h3>
                <p className="text-gray-600">Go from concept to order in minutes, not days. Skip the back-and-forth emails and phone calls.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg transition hover:shadow-xl">
              <div className="bg-[#B80F0A] h-2"></div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">Accuracy & Reliability</h3>
                <p className="text-gray-600">Ensure precision with interactive 3D previews and automated file generation.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg transition hover:shadow-xl">
              <div className="bg-[#B80F0A] h-2"></div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2">Transparency & Control</h3>
                <p className="text-gray-600">Real-time pricing and order tracking puts you in command of your projects.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20 bg-[#351210]">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Revolutionize Your Workflow?</h2>
          <p className="text-xl text-white/80 mb-8">
            Put a CNC factory in your pocket today. Start designing custom components in minutes.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#B80F0A] hover:bg-[#a00d08] text-white font-bold py-6 px-10 rounded-lg shadow-xl hover:shadow-2xl transition-all text-lg"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              Start Building Now — It&apos;s Free to Design <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2">
              <Image src="/cnc-cut-logo-black.png" alt="CNC Cut Logo" width={150} height={50} className="mb-4" />
              <p className="text-gray-500 max-w-xs">
                CNC Cut puts a full CNC production facility right in your pocket.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-500 hover:text-[#B80F0A] transition">Features</Link></li>
                <li><Link href="#how-it-works" className="text-gray-500 hover:text-[#B80F0A] transition">How It Works</Link></li>
                <li><Link href="#solutions" className="text-gray-500 hover:text-[#B80F0A] transition">Solutions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-500 hover:text-[#B80F0A] transition">About Us</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-[#B80F0A] transition">Contact</Link></li>
                <li><Link href="#" className="text-gray-500 hover:text-[#B80F0A] transition">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-100 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} CNC Cut. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
