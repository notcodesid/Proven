import React from 'react';
import Image from "next/image";
import Link from 'next/link';

interface ProfileGreetingProps {
  name?: string;
  avatarSrc?: string;
}

export const ProfileGreeting: React.FC<ProfileGreetingProps> = ({ 
  name = "Siddharth", 
  avatarSrc = "https://pbs.twimg.com/profile_images/1931974310488616960/zPA35qLx_400x400.jpg" 
}) => {
  return (
  
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full overflow-hidden">
        <Link href="/profile">
        <Image 
          src={avatarSrc} 
          alt="Profile" 
          width={48} 
          height={48}
          className="object-cover"
        />
        </Link>
      </div>
      <div>
        <div className="text-sm">
          👋 Hey
        </div>
        <div className="">
          {name}
        </div>
      </div>
    </div>
  );
};

export default ProfileGreeting; 