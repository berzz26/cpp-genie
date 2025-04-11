'use client';

import { useState } from 'react';

const features = [
  {
    title: 'Guardrails',
    description: 'Safe, Unbiased, prevent misleading or harmful content.',
    image: '/images/guardrails.png',
  },
  {
    title: 'Free to Use',
    description: 'Unlimited access anytime, anywhere.',
    image: '/images/desktop.png', 
  },
  {
    title: 'Why Not ChatGPT?',
    description: 'Built for CEUC102, not CS PhDs.” “Tailored for college lectures, not corporate interviews.',
    image: '',
  },
  {
    title: 'C++ Only',
    description: 'Focused only on C++ – No confusion/distraction!',
    image: '',
  },
  {
    title: 'Student-Centric',
    description: 'Made for students, not general users.',
    image: '',
  },
];

export default function FeaturesPage() {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-8 bg-white text-blue-900">
      <h1 className="text-3xl font-bold mb-6 text-center">Features</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="border rounded-xl p-4 shadow hover:shadow-lg transition duration-300 bg-blue-50"
          >
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="mb-4">{feature.description}</p>
            {feature.image && (
              <img
                src={feature.image}
                alt={feature.title}
                onClick={() => setActiveImage(feature.image)}
                className="cursor-pointer rounded-lg transition-transform hover:scale-105"
              />
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen image overlay */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={() => setActiveImage(null)}
        >
          <div className="max-w-[80%] max-h-[80vh] p-4">
            <img
              src={activeImage}
              className="w-full h-full object-contain rounded-lg transition-transform scale-100 hover:scale-105"
              alt="Zoomed feature"
            />
          </div>
        </div>
      )}
    </div>
  );
}
