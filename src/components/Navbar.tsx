import React from 'react'
import Image from 'next/image'
import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
const Navbar = async () => {

   const user = await currentUser();
  return (
    <div className='flex items-center justify-between p-4'>
        {/* Search Bar */}
        <div className='hidden md:flex itmes-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
            <Image src='/search.png' alt='search' width={14} height={14} className='object-contain'/>
            <input type='text' placeholder='Search...' className='w-[200px] p-2 bg-transparent outline-none'/>
        </div>
        {/* User Profile */}
        <div className='flex items-center gap-6 justify-end w-full'>
            <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer'>
                <Image src='/message.png' alt='message' width={20} height={20}/>
            </div>
            <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative'>
                <Image src='/announcement.png' alt='announcement' width={20} height={20}/>
                <div className='absolute -top-3 left-4 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs'>1</div>
            </div>
            <div className='flex flex-col'>
                <span className='text-xs leading-3 font-medium'>John Doe</span>
                <span className='text-[10px] text-right text-gray-500'>{user?.publicMetadata?.role as string}</span>
            </div>
            <UserButton  />
                {/* <Image src='/profile.png' alt='profile' width={36} height={36} className='rounded-full cursor-pointer'/> */}
            </div>
    </div>
  )
}

export default Navbar