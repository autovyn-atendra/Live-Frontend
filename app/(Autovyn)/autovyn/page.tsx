"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "../../hooks/use-current-user";
import { treeData } from "@/constant/modules";
import DateRangeSelector from "@/components/DateRange";

const Autovyn = () => {
  const user: any = useCurrentUser();
  const [data, setData] = useState<any>([]);

  // Function to filter the tree data based on checkedKeys
  const filterTreeData = (treeData: any[], checkedKeys: any[]) => {
    return treeData
      .map((item: any) => {
        const filteredChildren = item.children
          ?.map((child: any) => {
            const filteredSubChildren = child?.children?.filter((subChild: any) =>
              checkedKeys.includes(subChild.key)
            );

            if (filteredSubChildren?.length > 0 || checkedKeys.includes(child.key)) {
              return { ...child, children: filteredSubChildren };
            }
            return null;
          })
          .filter((child: any) => child !== null);

        if (filteredChildren.length > 0 || checkedKeys.includes(item.key)) {
          return { ...item, children: filteredChildren };
        }
        return null;
      })
      .filter((item) => item !== null);
  };

  // Function to fetch data and set the filtered tree
  const fetchData = () => {
    if (user?.name) {
      const userRoles = user?.role || [];
      setData(filterTreeData(treeData, userRoles));
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="w-full">
      <DateRangeSelector />
      <main className="w-full flex relative justify-center items-center p-2 mt-2">
        <div className="h-screen w-full flex flex-wrap gap-4">
          {data?.map((item: any, index: number) => (
            <div
              key={index}
              className="rounded flex-shrink-0 h-[450px] flex-wrap bg-white dark:bg-[#0f172a] border border-[#b5bfcb] justify-center shadow"
            >
              <Link href={item.url} key={item.key} className="cursor-pointer">
                <div
                  className="
                     m-2 rounded  flex justify-between items-center
                    bg-white dark:bg-[#1e293b] border-[0.2px] border-[#D0D5DD]
                    dark:border-b dark:border-[#334155]
                    shadow-sm p-1.5 font-bold text-[21px] uppercase
                    text-[#1b3152] dark:text-[#37a9dd]
                  "
                >

                  {/* <div className="w-full rounded flex justify-between bg-white dark:bg-primary dark:bg-opacity-30 shadow p-1.5 font-bold text-[21px] uppercase"> */}
                  {item.title}
                  <span className="text-xs text-primary dark:text-white mr-1">
                    ({item?.ShortCut})
                  </span>
                </div>
              </Link>
              <div className="mt-1  w-[430px] h-96 overflow-y-scroll overflow-x-hidden">
                <ul className="text-start mx-2">
                  {item.children?.map((child: any) => (
                    <li
                      key={child.key}
                      className="submenu-item  cursor-pointer font-semibold my-0.5 text-[19px] whitespace-nowrap text-ellipsis  w-full"
                    >

                      <div className=" bg-white dark:bg-[#1e293b] 
                          border-b border-[#e2e8f0] dark:border-[#334155] 
                          mb-0 px-2 py-1 w-full 
                          hover:dark:bg-[#334155] text-[#193A69] dark:text-[#E2E8F0]  hover:dark:text-[#3b82f6] 
                          transition-all">
                        {/* <div className="bg-white bg-opacity-70 dark:bg-primary dark:bg-opacity-20 mb-0 px-2 py-0.5 items-center w-full "> */}
                        <div className="flex flex-col sm:flex-row justify-between ">
                          <Link href={child.url} key={child.key} className="cursor-pointer w-full">
                            <h1 className="text-pretty font-medium uppercase  ">
                              {child.title?.replace(/\|/g, "")}
                            </h1>
                          </Link>
                        </div>

                      </div>

                      <ul className="text-start">
                        {child.children?.map((subChild: any) => (
                          <Link href={subChild.url} key={subChild.key}>
                            {subChild.Home_Visible === 1 ? (
                              <div className="text-[18px] font-normal border-b border-body-color border-dashed dark:border-white flex justify-between ">
                                <span className="px-2 whitespace-nowrap text-[#193A69] dark:text-[#E2E8F0]    hover:text-primary hover:font-bold ">
                                  {subChild.title?.replace(/\|/g, "")}
                                </span>
                                <span className="text-xs text-primary dark:text-white capitalize">
                                  {subChild?.ShortCut}
                                </span>
                              </div>
                            ) : subChild.Home_Visible === 0 ? (
                              <></> // Render nothing if Home_Visible is 0
                            ) : (
                              <div className="text-[18px] font-normal border-b border-body-color border-dashed dark:border-white flex justify-between">
                                <span className="px-2 whitespace-nowrap text-[#193A69] dark:text-[#E2E8F0]    hover:text-primary hover:font-bold">
                                  {subChild.title?.replace(/\|/g, "")}
                                </span>
                                <span className="text-xs text-primary dark:text-white capitalize">
                                  {subChild?.ShortCut}
                                </span>
                              </div>
                            )}

                          </Link>
                        ))}
                      </ul>
                      {/* <hr className="text-body-color" /> */}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>
    </main >
  );
};

export default Autovyn;
