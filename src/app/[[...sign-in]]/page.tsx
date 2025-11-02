"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LoginPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const role = user?.publicMetadata.role;
    if (role) {
      router.push(`/${role}`);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-lamaSkyLight to-white">
      {/* Left side with illustration and welcome text */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-8">
        <div className="max-w-md">
          <div className="flex justify-center mb-8">
            <Image 
              src="/education-illustration.svg" 
              alt="Education Illustration" 
              width={300} 
              height={300} 
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Bookish-Spork</h1>
          <p className="text-gray-600 mb-6">
            Your comprehensive education management system designed for students, teachers, and administrators.
          </p>
          <div className="bg-lamaPurpleLight p-4 rounded-lg border-l-4 border-lamaPurple">
            <h3 className="font-medium text-gray-800 mb-2">Streamlined Education Management</h3>
            <p className="text-gray-600 text-sm">
              Access schedules, assignments, grades, and communication tools all in one place.
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side with login form */}
      <div className="w-full md:w-1/2 flex justify-center">
        <SignIn.Root>
          <SignIn.Step
            name="start"
            className="bg-white p-8 md:p-12 rounded-lg shadow-xl flex flex-col gap-4 w-full max-w-md m-4"
          >
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <Image src="/logo.png" alt="Logo" width={32} height={32} />
              <h1 className="text-2xl font-bold text-gray-800">Bookish-Spork</h1>
            </div>
            <h2 className="text-gray-500 text-center md:text-left mb-4">Sign in to your account</h2>
            
            <Clerk.GlobalError className="text-sm text-red-400 bg-red-50 p-3 rounded-md" />
            
            <Clerk.Field name="identifier" className="flex flex-col gap-2">
              <Clerk.Label className="text-sm font-medium text-gray-700">
                Username
              </Clerk.Label>
              <Clerk.Input
                type="text"
                required
                className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-lamaSky focus:border-transparent transition-all"
              />
              <Clerk.FieldError className="text-xs text-red-400" />
            </Clerk.Field>
            
            <Clerk.Field name="password" className="flex flex-col gap-2">
              <Clerk.Label className="text-sm font-medium text-gray-700">
                Password
              </Clerk.Label>
              <Clerk.Input
                type="password"
                required
                className="p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-lamaSky focus:border-transparent transition-all"
              />
              <Clerk.FieldError className="text-xs text-red-400" />
            </Clerk.Field>
            
            <div className="flex justify-end mb-2">
              <a href="#" className="text-xs text-blue-500 hover:underline">Forgot password?</a>
            </div>
            
            <SignIn.Action
              submit
              className="bg-gradient-to-r from-lamaSky to-blue-500 text-white font-medium py-3 rounded-md hover:opacity-90 transition-all shadow-md"
            >
              Sign In
            </SignIn.Action>
            
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
            </div>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
};

export default LoginPage;