'use client';

import GoogleLoginButton from "../src/components/ui/googlebutton";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// import logo from "../public/lockin_logo.png"

export default function Home() {
  const { signInWithGoogle, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div
      className="absolute inset-0 bg-cover bg-center text-white px-6 flex flex-col "
      style={{ backgroundImage: "url('/onboard.png')" }}
    >
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full w-full justify-center items-center px-6">
        <div className="space-y-5 mb-12 w-full">

          {/* Proven logo */}
          {/* <Image src={logo} alt="logo" width={200} /> */}
          <h1 className="text-lg font-semibold tracking-wide">PROVEN</h1>


          <h2 className="text-3xl font-bold leading-tight">
            Bet on yourself, Get <br /> Rewarded
          </h2>
          <p className="text-base text-white/90">
            Put your goals to the test with real stakes. Join challenges, track your progress, and get rewarded for staying accountable.
          </p>
        </div>
        
        {/* Google button */}
        <div className="w-full">
          <GoogleLoginButton onClick={signInWithGoogle} />
        </div>

        {/* <p className="text-xs text-white/80 text-center pb-6">
          By continuing, you agree to our{" "}
          <a href="#" className="underline text-red-400">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline text-red-400">
            Privacy Policy
          </a>
        </p> */}
      </div>
    </div>
  );
}
