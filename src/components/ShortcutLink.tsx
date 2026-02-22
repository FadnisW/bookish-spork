"use client";

import Link from "next/link";
import { toast } from "react-toastify";

type ShortcutLinkProps = {
  href: string;
  label: string;
  count: number;
  className: string;
};

const ShortcutLink = ({ href, label, count, className }: ShortcutLinkProps) => {
  if (count === 0) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => toast(`No ${label.toLowerCase().replace("'", "")} found for this teacher.`, { type: "info" })}
      >
        {label}
      </button>
    );
  }

  return (
    <Link className={className} href={href}>
      {label}
    </Link>
  );
};

export default ShortcutLink;
