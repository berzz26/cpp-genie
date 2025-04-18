"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-6xl mx-auto px-4 py-4">
                {/* Back Button - Always left aligned */}
                <Link href="/">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        <span className="text-lg">Back to Chat</span>
                    </Button>
                </Link>

                <div className="flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold mb-6 text-primary text-center">Our Team</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {/* Mentor Card */}
                        <div className="bg-secondary/5 rounded-lg p-6 md:p-8 border border-secondary/20 w-full">
                            <div className="flex flex-col items-center">
                                <div className="w-40 h-40 rounded-full bg-secondary mb-6 overflow-hidden flex items-center justify-center">
                                    <img
                                        src="/PG_JPG.png"
                                        alt="Mentor"
                                        className="w-full h-full object-cover object-center"
                                        style={{ objectPosition: 'center 20%' }}
                                    />
                                </div>
                                <h2 className="text-2xl font-semibold text-primary">Dr. Parth Goel</h2>
                                <p className="text-center text-muted-foreground mt-2">Mentor | Concept Designer | LLM Engineer</p>
                                <p className="text-lg text-muted-foreground mt-1">DEPSTAR-CSE</p>
                                <div className="mt-4 text-center">
                                    
                                </div>
                            </div>
                        </div>

                        {/* Lead Developer Card */}
                        <div className="bg-secondary/5 rounded-lg p-6 md:p-8 border border-secondary/20 w-full">
                            <div className="flex flex-col items-center">
                                <div className="w-40 h-40 rounded-full bg-secondary mb-6 overflow-hidden flex items-center justify-center">
                                    <img
                                        src="/Profile_2.png"
                                        alt="Lead Developer"
                                        className="w-full h-full object-cover object-center scale-100"
                                        style={{ objectPosition: 'center 30%' }}
                                    />
                                </div>
                                <h2 className="text-2xl font-semibold text-primary">Aum Tamboli</h2>
                                <p className="text-center text-muted-foreground mt-2">Full Stack Developer | Deployment Engineer</p>
                                <p className="text-lg text-muted-foreground mt-1">DEPSTAR-CSE</p>
                                <div className=" text-center">
                                    <p className="text-base text-muted-foreground">ID: 24DCS133</p>
                                   
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="text-center mt-16 text-base text-muted-foreground px-4">
                        <p>Contact us or any Feedback: {" "}
                            <a 
                                href="mailto:parthgoel.ce@charusat.ac.in"
                                className="text-blue-500 hover:underline"
                            >
                                parthgoel.ce@charusat.ac.in
                            </a>
                        </p>
                    </div>
                    {/* Copyright */}
                    <div className="text-center text-xs text-muted-foreground mt-4">
                        © 2025 C++ Genie, CHARUSAT. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
