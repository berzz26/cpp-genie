'use client';

import { useState } from 'react';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    title: 'Why Genie',
    description: 'Genie focuses on simple, lecture and syllabus-aligned responses tailored specifically for CEUC102 – Programming with C++ and teaching style',
    image: '/images/gptvsgenie.jpg',
  },
  {
    title: 'C++ Only',
    description: 'Focused only on C++ – No confusion/distraction!',
    image: '/images/CPP_FOCUS.png',
  },
  {
    title: 'Student-Centric',
    description: 'Made for students, not general users.',
    video: '/video/student.mp4',
    type: 'video',
    thumbnail: '/images/thumbnail1.png' // Add thumbnail path
  },
  {
    title: 'Practice Questions',
    description: 'Generates problem-based questions across Bloom’s Taxonomy levels –Understand, Apply, Analyze, Evaluate, and Create.Great for practice, self- assessment, and concept clarity',
    video: '/video/questions.mp4',
    type: 'video',
    thumbnail: '/images/questions.png' // Add thumbnail path
  },
];

export default function FeaturesPage() {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-8 bg-white text-blue-900">
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="text-lg">Back to Chat</span>
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-center">Features</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="border rounded-xl p-4 shadow hover:shadow-lg transition duration-300 bg-blue-50"
          >
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="mb-4">{feature.description}</p>
            {feature.type === 'video' ? (
              <video
                controls
                className="w-full rounded-lg"
                poster={feature.thumbnail}
              >
                <source src={feature.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : feature.image && (
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
      {/* Copyright */}
      <div className="text-center text-xs text-muted-foreground mt-8">
        © 2025 C++ Genie, CHARUSAT. All rights reserved.
      </div>

      {/* Fullscreen image overlay */}
      {activeImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative w-full h-full flex justify-center items-center">
            <img
              src={activeImage}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              alt="Zoomed feature"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );

}
