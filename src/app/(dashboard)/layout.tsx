import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex">
      {/* LEFT */}
      <div className="w-[16%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-2 sm:p-4 border-r border-gray-100 flex flex-col items-center lg:items-stretch overflow-hidden">
        <Link
          href="/"
          className="flex items-center justify-center lg:justify-start gap-2 mb-2"
        >
          <Image src="/logo.png" alt="logo" width={32} height={32} className="flex-shrink-0" />
          <span className="hidden lg:block font-bold truncate">Bookish-spork</span>
        </Link>
        <div className="w-full flex-1 overflow-y-auto no-scrollbar">
          <Menu />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-[84%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-y-scroll overflow-x-hidden flex flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
// import Menu from "@/components/Menu";
// import Navbar from "@/components/Navbar";
// import Link from "next/link";
// import Image from "next/image";

// export default function DashboardLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//       <div className="h-screen flex">
//         {/* left */}
//         <div className="h-full w-[21%] md:w-[15%] lg:w-[20%] xl:w-[18%] p-4 overflow-hidden flex flex-col">
//           <Link href="/" className="flex items-center justify-center lg:justify-start gap-2">
//             <Image src='/logo.png' alt='logo' width={32} height={32}/>
//             <span className="hidden lg:block">bookish-spork</span>
//           </Link>
//           <Menu />
//         </div>
//         {/* right */}
//         <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
//           <Navbar />
//           {children}
//         </div>
//       </div>
//   );
// }
