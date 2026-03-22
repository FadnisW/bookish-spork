import React from 'react'
import Image from 'next/image'
import { currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import NotificationBell, { NotificationItem } from './NotificationBell';

const Navbar = async () => {
  const user = await currentUser();
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // ── Build visibility filter (mirrors Phase 7 targeting logic) ───────────────
  let visibilityFilter: any = {};

  if (role === "admin") {
    // Admin sees all notifications
    visibilityFilter = {};
  } else if (role === "teacher" && userId) {
    visibilityFilter = {
      OR: [
        { teacherId: null, studentId: null, classId: null },
        { teacherId: userId },
        { class: { lessons: { some: { teacherId: userId } } } },
      ],
    };
  } else if (role === "student" && userId) {
    visibilityFilter = {
      OR: [
        { teacherId: null, studentId: null, classId: null },
        { studentId: userId },
        { class: { students: { some: { id: userId } } } },
      ],
    };
  } else if (role === "parent" && userId) {
    visibilityFilter = {
      OR: [
        { teacherId: null, studentId: null, classId: null },
        { student: { parentId: userId } },
        { class: { students: { some: { parentId: userId } } } },
      ],
    };
  }

  // ── Fetch up to 20 most recent notifications visible to this user ────────────
  let notifications: NotificationItem[] = [];
  let unreadCount = 0;

  if (userId) {
    try {
      const rawNotifications = await (prisma as any).notification.findMany({
        where: visibilityFilter,
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          reads: {
            where: { userId },
            select: { id: true },
          },
        },
      });

      notifications = rawNotifications.map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        type: n.type,
        createdAt: n.createdAt,
        isRead: n.reads.length > 0,
      }));

      unreadCount = notifications.filter((n) => !n.isRead).length;
    } catch (err) {
      // Graceful degradation — if notification table isn't ready yet
      console.warn('[Navbar] Notification fetch failed:', err);
    }
  }

  return (
    <div className='flex items-center justify-between p-4'>
      {/* Search Bar */}
      <div className='hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
        <Image src='/search.png' alt='search' width={14} height={14} className='object-contain' />
        <input type='text' placeholder='Search...' className='w-[200px] p-2 bg-transparent outline-none' />
      </div>

      {/* Right Side */}
      <div className='flex items-center gap-6 justify-end w-full'>
        {/* Messages */}
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer'>
          <Image src='/message.png' alt='message' width={20} height={20} />
        </div>

        {/* Notification Bell — dynamic, role-aware */}
        {userId ? (
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            userId={userId}
          />
        ) : (
          <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer'>
            <Image src='/announcement.png' alt='notification' width={20} height={20} />
          </div>
        )}

        {/* User Info */}
        <div className='flex flex-col'>
          <span className='text-xs leading-3 font-medium'>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.username || 'User'}
          </span>
          <span className='text-[10px] text-right text-gray-500'>
            {user?.publicMetadata?.role as string}
          </span>
        </div>

        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;