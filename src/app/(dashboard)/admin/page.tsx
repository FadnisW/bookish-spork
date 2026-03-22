import UserCard from '@/components/userCard'
import FinanceChart from '@/components/financeChart'
import Announcements from "@/components/announcements";
import CountChartContainer from '@/components/countChartCountainer';
import AttendanceChartContainer from '@/components/attendanceChartContainer';
import EventCalendarContainer from '@/components/eventCalendarContainer';

const adminPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [keys: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;
    return(
      <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="student" />
          <UserCard type="teacher" />
          <UserCard type="parent" />
          <UserCard type="admin" />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChartContainer date={resolvedSearchParams?.date} />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChartContainer />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          <FinanceChart />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
         <EventCalendarContainer searchParams={resolvedSearchParams}/>
        <Announcements dateParam={resolvedSearchParams?.date} />
      </div>
    </div>
  );
};


export default adminPage
