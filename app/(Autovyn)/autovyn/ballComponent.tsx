import React, { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { useRouter } from "next/navigation";

const NotificationBell = () => {
    const user = useCurrentUser();
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [list, setList] = useState([]);

    const router = useRouter()
    // ============================================
    //  GET NOTIFICATIONS
    // ============================================
    const getNotifications = async () => {
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/EmpDed/getNotifications`,
                {
                    EMPCODE: user?.EMPCODE,
                    USER_ID: user?.id,
                },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            console.log(response, "/EmpDed/getNotifications")
            return response.data;
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return null;
        }
    };

    // ============================================
    //  POLLING + FIRST LOAD
    // ============================================
    useEffect(() => {
        const load = async () => {
            const data = await getNotifications();
            if (data) {
                setCount(data.count || 0);
                setList(data.notifications || []);
            }
        };

        load(); // First load

        const interval = setInterval(load, 3600000); // Poll every 5 sec
        return () => clearInterval(interval);
    }, []);

    const toggleOpen = () => {
        setOpen(!open);
    };

    // ============================================
    //  MARK AS READ
    // ============================================
    const markAsRead = async (UTD) => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_URL}/EmpDed/markAsRead`,
                { UTD: UTD },
                {
                    headers: {
                        compcode: user?.Comp_Code,
                        name: user?.name,
                    },
                }
            );

            // Refresh after marking
            const data = await getNotifications();
            if (data) {
                setCount(data.count || 0);
                setList(data.notifications || []);
            }
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };



    const handleNotificationClick = async (item) => {
        // 1️⃣ Mark it as read
        await markAsRead(item.UTD);

        console.log(item, "item")
        // 2️⃣ Navigate if type is LEAVE
        if (item.Type == "LEAVE") {
            router.push("/autovyn/payroll/Attendance_Punch/Leave_Approval_Grid");
            setOpen(!open);
        }
        else if (item.Type == "Misspunch" || "Misspunch") {
            router.push("/autovyn/payroll/Attendance_Punch/Mispunch_Approval_Grid");
            setOpen(!open);
        }
        else if (item.Type == "Attendance") {
            router.push("/autovyn/payroll/Attendance_Punch/Attendance_Punching_Approval");
            setOpen(!open);
        } else {
            router.push("/autovyn");
        }
    };

    const getTimeAgo = (utcDate) => {
        if (!utcDate) return "Just now";

        const past = new Date(utcDate).getTime();
        const now = Date.now();

        let diffMs = now - past;

        // prevent negative values due to server time mismatch
        diffMs = Math.max(0, diffMs);

        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffSec < 60) return "Just now";
        if (diffMin < 60) return `${diffMin} mins ago`;
        if (diffHour < 24) return `${diffHour} hours ago`;
        if (diffDay === 1) return "Yesterday";
        if (diffDay < 7) return `${diffDay} days ago`;
        if (diffWeek < 4) return `${diffWeek} weeks ago`;
        if (diffMonth < 12) return `${diffMonth} months ago`;

        return `${diffYear} years ago`;
    };







    return (
        <div className="relative">
            {/* Bell Icon */}


            <div onClick={toggleOpen} className="cursor-pointer text-white text-2xl relative">
                <FaBell />

                {/* Count Badge */}
                {count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white  bg-save
                            text-xs h-5 w-5 flex items-center justify-center rounded-full font-semibold">
                        {count}
                    </span>
                )}

                {/* Blue dot to show new notifications (even without count) */}
                {count > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-blue-500 rounded-full"></span>
                )}
            </div>


            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-3 bg-white dark:bg-black w-96 shadow-lg rounded-b p-2 z-50 border border-borderColor dark:border-borderColor-dark">
                    {list.length === 0 && (
                        <p className="text-gray-600 text-sm p-2  text-black dark:text-[#37a9dd]">
                            No new notifications
                        </p>
                    )}

                    <div className="flex items-center justify-between px-4 py-1 border-b border-borderColor dark:border-borderColor-dark">
                        <h2 className="text-xl font-semibold text-black dark:text-[#37a9dd]">
                            Notifications
                        </h2>

                        <button onClick={() => setOpen(false)} className="text-black dark:text-white text-xl">
                            ×
                        </button>
                    </div>


                    <div className="max-h-[450px] min-h-[300px] overflow-y-auto custom-scroll">
                        {list.map((item) => (
                            <div
                                key={item.UTD}
                                className={`
    border-borderColor dark:border-borderColor-dark 
    border-b py-2 px-2 text-sm cursor-pointer transition-all dark:text-gray-200

    ${item.IsRead == 0
                                        ? "bg-[#f3f8fc] hover:bg-body-color dark:bg-[#1E293B] dark:hover:bg-[#334155]"
                                        : "bg-white hover:bg-grey dark:bg-[#0F172A] dark:hover:bg-[#1E293B]"
                                    }
`}
                                onClick={() => handleNotificationClick(item)}
                            >
                                <div className="flex items-start gap-2 ">



                                    {/* Message text */}
                                    <span className="text-black dark:text-white">
                                        <div dangerouslySetInnerHTML={{ __html: item?.Message }} />
                                    </span>
                                </div>

                                {/* RIGHT SIDE TIME + MENU */}
                                <div className="flex flex-col justify-between items-end">
                                    <span className="flex space-x-2 text-xs text-black dark:text-white">
                                        {/* {item.TimeAgo || "10 mins ago"} */}
                                        {getTimeAgo(item?.CreatedAt)}
                                        {/* Blue dot for unread */}
                                        {item.IsRead == 0 && (<span className="h-2 w-2 bg-save rounded-full mt-1.5 ml-1.5"></span>)}
                                    </span>
                                </div>
                            </div>
                        ))}

                    </div>


                </div>
            )}
        </div>
    );
};

export default NotificationBell;
