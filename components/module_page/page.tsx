"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { treeData } from "@/constant/modules";
import { usePathname } from "next/navigation";

const Autovyn = () => {
  const user = useCurrentUser();
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);

  const pathname = usePathname();

  // Filter tree data for only the "Payroll" node and its children
  const getPayrollChildren = (treeData: any[]) => {
    const payrollNode = treeData.find((item) => item.url === pathname);
    return payrollNode?.children || [];
  };

  const fetchData = () => {
    if (user?.name) {
      setCheckedKeys(user?.role || []);
      const payrollChildren = getPayrollChildren(treeData);
      setData(payrollChildren);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="w-full flex justify-center items-center p-2 mt-2">
      <div className="w-full flex flex-wrap gap-4">
        {data
          ?.filter((child) =>
            child.children?.some((subChild) => checkedKeys.includes(subChild.key))
          )
          .map((child) => (
            <div
              key={child.key}
              className="rounded flex-shrink-0 h-[450px] flex-wrap bg-white dark:bg-[#0f172a] border border-[#b5bfcb] justify-center shadow"
            >
              {/* Card Header */}
              <Link href={child.url} key={child.key} className="cursor-pointer w-full">
                <div
                  className="
                    m-2 rounded flex justify-between items-center
                    bg-white dark:bg-[#1e293b] border-[0.2px] border-[#D0D5DD]
                    dark:border-b dark:border-[#334155]
                    shadow-sm p-1.5 font-bold text-[21px] uppercase
                    text-[#1b3152] dark:text-[#37a9dd]
                    hover:text-primary hover:font-bold
                    transition-all
                  "
                >
                  {child.title?.replace(/\|/g, "")}
                  {/* <span className="text-xs text-primary dark:text-white mr-1">
                    ({child?.ShortCut})
                  </span> */}
                </div>
              </Link>

              {/* Inner Scrollable Section */}
              <div className="mt-1 w-[430px] h-96 overflow-y-scroll overflow-x-hidden">
                <ul className="text-start mx-2">
                  {child.children
                    ?.filter((subChild) => checkedKeys.includes(subChild.key))
                    .map((subChild) => (
                      <Link href={subChild.url} key={subChild.key} className="cursor-pointer">
                        <li
                          className="
                            submenu-item flex justify-between px-2 cursor-pointer my-0.5
                            text-[18px] font-normal whitespace-nowrap text-ellipsis
                            border-b border-body-color border-dashed 
                            bg-white dark:bg-[#1e293b]
                            hover:dark:bg-[#334155]
                            text-[#193A69] dark:text-[#E2E8F0] 
                            hover:text-primary hover:font-bold 
                            transition-all
                          "
                        >
                          <span>{subChild.title?.replace(/\|/g, "")}</span>
                          <span className="text-xs text-primary dark:text-white capitalize">
                            {subChild?.ShortCut}
                          </span>
                        </li>
                      </Link>
                    ))}
                </ul>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
};

export default Autovyn;