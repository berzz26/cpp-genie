'use client';

import { useState } from 'react';
import { Shield, Cpu, Bot, Code, GraduationCap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Guardrails',
    description: 'Safe, Unbiased, prevent misleading or harmful content.',
    image: '/images/guardrails.png',
    icon: Shield
  },
  {
    title: 'Free to Use',
    description: 'Unlimited access anytime, anywhere.',
    image: '/images/desktop.png',
    icon: Cpu
  },
  {
    title: 'Why Not ChatGPT?',
    description: 'Built for CEUC102 – Programming with C++. Tailored for college lectures, not corporate interviews.',
    icon: Bot
  },
  {
    title: 'C++ Only',
    description: 'Focused only on C++ – No confusion/distraction!',
    icon: Code
  },
  {
    title: 'Student-Centric',
    description: 'Made for students, not general users.',
    icon: GraduationCap
  },
];

export default function FeaturesPage() {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Chat
      </Link>

      <h1 className="text-4xl font-bold mb-8 text-center text-blue-900">
        C++ Genie Features
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="border rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              {feature.icon && <feature.icon className="h-6 w-6 text-blue-600" />}
              <h2 className="text-xl font-semibold text-blue-900">{feature.title}</h2>
            </div>
            <p className="text-gray-600 mb-4">{feature.description}</p>
            {feature.image && (
              <img
                src={feature.image}
                alt={feature.title}
                onClick={() => setActiveImage(feature.image)}
                className="w-full h-40 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
              />
            )}
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setActiveImage(null)}
        >
          <div className="max-w-4xl w-full">
            <img
              src={activeImage}
              className="w-full h-full object-contain rounded-lg"
              alt="Feature preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
