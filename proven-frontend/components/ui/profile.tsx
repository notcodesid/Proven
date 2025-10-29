import Image from "next/image";

export default function Profile() {
  return (
    <div>
        <div>
            <Image src="/profile.png" alt="Profile" width={100} height={100} />
        </div>
    </div>
  );
}