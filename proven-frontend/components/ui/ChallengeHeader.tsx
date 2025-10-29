import React from 'react';
import Image from 'next/image';
import { IoArrowBack } from 'react-icons/io5';

export interface ChallengeHeaderProps {
  title: string;
  image: string;
  metrics?: string;
  hostType?: string;
  sponsor?: string;
  creator?: string;
  onBack: () => void;
}

export const ChallengeHeader: React.FC<ChallengeHeaderProps> = ({
  title,
  image,
  metrics,
  hostType,
  sponsor,
  creator,
  onBack,
}) => {
  return (
    <div className="relative h-64">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80" />
      
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50"
      >
        <IoArrowBack size={24} />
      </button>
      
      <div className="absolute bottom-4 left-4 right-4">
        <h1 className="text-3xl font-bold mb-1">{title}</h1>
        {metrics && (
          <div className="flex items-center space-x-2 text-sm opacity-80">
            <span>{metrics}</span>
            {(hostType && (sponsor || creator)) && (
              <>
                <span>•</span>
                <span>
                  {hostType === 'ORG' 
                    ? `Sponsored by ${sponsor}` 
                    : `Created by ${creator}`}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeHeader;
