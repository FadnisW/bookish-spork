import React from "react";
import Image from "next/image";

type ProfileIdentityCardProps = {
  data: any;
  role: string;
};

const ProfileIdentityCard = ({ data, role }: ProfileIdentityCardProps) => {
  return (
    <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex flex-col sm:flex-row gap-4 w-full items-center sm:items-start">
      <div className="flex-shrink-0">
        <Image
          src={data?.img || "/noAvatar.png"}
          alt="Profile Avatar"
          width={144}
          height={144}
          className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <h1 className="text-xl font-semibold">
            {role === "admin" ? data?.username : `${data?.name || ""} ${data?.surname || ""}`.trim() || data?.username || "Unknown"}
          </h1>
          <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600 capitalize">
            {role}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit.
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
          {data?.bloodType && (
            <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
              <Image src="/blood.png" alt="" width={14} height={14} />
              <span>{data.bloodType}</span>
            </div>
          )}
          {data?.birthday && (
            <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
              <Image src="/date.png" alt="" width={14} height={14} />
              <span>
                {new Intl.DateTimeFormat("en-IN").format(new Date(data.birthday))}
              </span>
            </div>
          )}
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Image src="/mail.png" alt="" width={14} height={14} />
            <span>{data?.email || "-"}</span>
          </div>
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Image src="/phone.png" alt="" width={14} height={14} />
            <span>{data?.phone || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileIdentityCard;
