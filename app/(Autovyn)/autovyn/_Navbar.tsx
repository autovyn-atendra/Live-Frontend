"use client";
import React, { useState, useEffect, useRef } from "react";
import { treeData } from "@/constant/modules";
import Image from "next/image";
import ThemeToggler from "@/app/ThemeToggler";
import { FaToggleOn, FaToggleOff, FaUsers } from "react-icons/fa";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCurrentUser } from "@/app/hooks/use-current-user";
import { FaEllipsisH } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { TbTableShortcut } from "react-icons/tb";
import NotificationBell from "./ballComponent";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PersonIcon, ExitIcon } from "@radix-ui/react-icons";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import GlobalSearch from "@/components/globalsearch";
import AdminSection from "./_AdminSection";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { CiLock } from "react-icons/ci";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";

const Navbar = ({ children }) => {
  const user = useCurrentUser();
  const [userState, setUserState] = useState(user);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const { data: session, update } = useSession();
  const [activeFirstLevel, setActiveFirstLevel] = useState(0);
  const [activeSecondLevel, setActiveSecondLevel] = useState(null);
  const [activeThirdLevel, setActiveThirdLevel] = useState(null);
  const [firstHeaderVisible, setFirstHeaderVisible] = useState(true);
  const [submodule, setSubmodule] = useState([]);
  const [submenu, setSubmenu] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const path = usePathname();
  const segments = path.split("/").filter(Boolean); // Filter removes empty strings caused by leading/trailing slashes
  const secondSegment = segments.length > 1 ? `/${segments[1]}` : null; // Get the second segment with a leading slash
  const [ShortCut, setShortCuts] = useState([]);
  const router = useRouter();

  const filterTreeData = (data, segment) => {
    let result = [];

    for (const item of data) {
      // Check if the item's URL contains the segment and has a ShortCut
      if (
        item.ShortCut &&
        item.url.toLowerCase().includes(segment.toLowerCase())
      ) {
        result.push({
          url: item.url,
          Abbr: item.Abbr || null,
          ShortCut: item.ShortCut,
          title: item.title,
        });
      }
      // If the item has children, search recursively
      if (item.children) {
        const childResults = filterTreeData(item.children, segment);
        result = result.concat(childResults);
      }
    }
    return result;
  };

  useEffect(() => {
    if (secondSegment) {
      setShortCuts(filterTreeData(treeData, secondSegment));
    }
  }, [secondSegment]);

  useEffect(() => {
    setUserState(user); // Update state when user changes
  }, [user]);

  useEffect(() => {
    // Attach a right-click event listener to links
    const handleRightClick = (event) => {
      const link = event.target.closest("a"); // Find the closest <a> tag
      if (link && link.href) {
        event.preventDefault(); // Prevent the default context menu
        window.open(link.href, "_blank"); // Open the link in a new tab
      }
    };
    // Attach the event listener to the document
    document.addEventListener("contextmenu", handleRightClick);
    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  function getBasePath(pathname) {
    let parts = pathname.split("/").filter((part) => part !== ""); // Remove empty parts
    return parts.length >= 2 ? `/${parts[0]}/${parts[1]}` : pathname;
  }

  const findUrlByShortcut = (shortcut, data, path) => {
    // Find the parent object where path matches item.url
    const parent = data.find((item) => item.url === path);

    if (!parent || !parent.children) return null; // If no match or no children, return null

    // Recursive function to search in all children
    const searchChildren = (children) => {
      for (const child of children) {
        if (child.ShortCut?.toLowerCase() === shortcut?.toLowerCase()) {
          return child.url;
        }
        // If child has its own children, search recursively
        if (child.children) {
          const foundUrl = searchChildren(child.children);
          if (foundUrl) return foundUrl;
        }
      }
      return null;
    };

    return searchChildren(parent.children);
  };
  const findUrlByShortcutforhome = (shortcut, data) => {
    // Recursively search treeData for the matching shortcut
    for (const item of data) {
      if (item.ShortCut?.toLowerCase() === shortcut?.toLowerCase()) {
        return item.url;
      }
    }
    return null; // Return null if no match is found
  };

  useEffect(() => {
    const handleKeyDown = async (event) => {
      const combo = `${event.ctrlKey ? "Ctrl+" : ""}${event.altKey ? "Alt+" : ""
        }${event.key}`.toLowerCase();
      let url;
      if (path == "/autovyn" || path == "/branch") {
        url = findUrlByShortcutforhome(combo, treeData);
      } else {
        url = findUrlByShortcut(combo, treeData, getBasePath(path));
      }
      if (user.shortcuts && user.shortcuts[combo]) {
        event.preventDefault();
        router.push(user.shortcuts[combo]);
      }
      // Use a switch statement to handle specific key combinations
      else if (combo == "alt+s") {
        event.preventDefault(); // Prevent default browser behavior
        setIsSheetOpen(true);
      } else if (combo == "f1") {
        event.preventDefault(); // Prevent default browser behavior
        toggleHeaders();
      } else if (combo == "alt+f2") {
        event.preventDefault(); // Prevent default browser behavior
        router.push("/branch");
      } else if (combo == "ctrl+f") {
        event.preventDefault(); // Prevent default browser behavior
        setFirstHeaderVisible(true);
      } else if (combo == "alt+h") {
        event.preventDefault(); // Prevent default browser behavior
        router.push("/autovyn");
      } else if (combo == "escape") {
        // 🔒 Skip Escape key handling on this specific page
        if (path === "/autovyn/account/Api_Banking") {
          // Swal.fire({
          //   icon: 'warning',
          //   title: `User Confirmation`,
          //   text: `HELLO`,
          // });
          return; // Do nothing
        }
        if (
          path === "/autovyn/expense/viewExpense" ||
          path === "/autovyn/expense/approveExpense" ||
          path === "/autovyn/expense/ExpenseReport"
        ) {
          return; // Do nothing
        }
        event.preventDefault();

        if (path == "/autovyn") {
          const confirmed = await Swal.fire({
            icon: "warning",
            title: `User Confirmation`,
            text: `Do you want to exit the home page?`,
            confirmButtonText: "YES",
            cancelButtonText: "NO",
            showCancelButton: true,
          });
          if (confirmed.isConfirmed) {
            router.push("/branch");
          }
        } else {
          router.back();
        }
      } else if (url) {
        event.preventDefault(); // Prevent default browser behavior
        window.open(url, "_blank"); // Open the URL in a new tab
      } else {
        console.log(combo, "combo");
      }
    };
    // Add the event listener
    window.addEventListener("keydown", handleKeyDown);
    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [path]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 992) {
        // Adjust the breakpoint as needed
        setIsMobile(true);
      } else {
        setIsMobile(false);
        setFirstHeaderVisible(false);
      }
    };

    // Set initial state based on current window size
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup function to remove event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  useEffect(() => {
    const storedActiveFirstLevel = localStorage.getItem("activeFirstLevel");
    const storedActiveSecondLevel = localStorage.getItem("activeFirstSecond");
    const storedActivethirdLevel = localStorage.getItem("activeFirstThird");
    const storedSubmodule = JSON.parse(localStorage.getItem("submodule"));
    const storedSubmenu = JSON.parse(localStorage.getItem("submenu"));

    if (storedActiveFirstLevel !== null) {
      setActiveFirstLevel(parseInt(storedActiveFirstLevel));
    }
    if (storedActiveSecondLevel !== null) {
      setActiveSecondLevel(parseInt(storedActiveSecondLevel));
    }
    if (storedActiveSecondLevel !== null) {
      setActiveThirdLevel(parseInt(storedActivethirdLevel));
    }
    if (storedSubmodule) {
      setSubmodule(storedSubmodule);
    }
    if (storedSubmenu) {
      setSubmenu(storedSubmenu);
    }
  }, []);

  useEffect(() => {
    const fetchData = () => {
      if (user?.name) {
        setCheckedKeys(user?.role || []);
      }
    };
    fetchData();
  }, []);

  const toggleHeaders = () => {
    setFirstHeaderVisible((prevState) => !prevState); // Using functional form of setState
  };

  const ToggleIcon = firstHeaderVisible ? FaToggleOn : FaToggleOff;

  const handleIconClick = (index: number, item) => {
    setSubmenu([]);
    const menu2 = item.children;
    setSubmodule(menu2 || []);
    setFirstHeaderVisible(false);
    setActiveFirstLevel(index);
    localStorage.setItem("activeFirstLevel", index.toString());
    localStorage.setItem("submodule", JSON.stringify(menu2 || []));
    localStorage.setItem("submenu", JSON.stringify([]));
  };

  const multibranch = async (branch, multi) => {
    await update({
      ...session,
      user: {
        ...session?.user,
        multi: branch,
        branch: multi,
      },
    });
  };

  const handlemulti = () => {
    multibranch(user.branch, user.multi);
  };

  const handleSubMenuClick = (index, Item) => {
    const menu1 = Item.children.filter((child) =>
      checkedKeys.includes(child.key)
    );
    setSubmenu(menu1 || []);
    setActiveSecondLevel(index);
    setActiveThirdLevel(null);
    localStorage.setItem("activeFirstSecond", index.toString());
    localStorage.setItem("submenu", JSON.stringify(menu1 || []));
  };

  const handleThirdClick = (index) => {
    setActiveThirdLevel(index);
    localStorage.setItem("activeFirstThird", index.toString());
  };

  const [showFirstSet, setShowFirstSet] = useState(true); // Toggle between the first and second set of items

  const toggleItems = () => {
    setShowFirstSet(!showFirstSet);
  };

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const findTitleByUrl = (url, treeData) => {
    for (const node of treeData) {
      if (node.url === url) return node.title;
      if (node.children) {
        const foundTitle = findTitleByUrl(url, node.children);
        if (foundTitle) return foundTitle;
      }
    }
    return null; // Return null if no title is found
  };

  // CHANGED: Added hover state for aside
  const [isAsideHovered, setIsAsideHovered] = useState(false);
  const handleAsideMouseEnter = () => {
    setIsAsideHovered(true);
  };
  const handleAsideMouseLeave = () => {
    setIsAsideHovered(false);
  };
  const [showIndex, setShowIndex] = useState(0);
  const [showSubIndex, setShowSubIndex] = useState(0); // for submodule scrolling



  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const container = document.getElementById("submodule-scroll");
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollWidth > container.clientWidth + container.scrollLeft
      );
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);



  return (
    <div className="h-screen w-screen relative">


      {!isMobile && (

        <div
          className={`fixed left-0 top-0 h-full transition-all duration-150 ease-in-out z-50  ${isAsideHovered ? "w-72" : "w-16"
            }`}
          onMouseEnter={handleAsideMouseEnter}
          onMouseLeave={handleAsideMouseLeave}
        >
          <aside className="h-full w-full flex flex-col text-white relative bg-[#193a69] dark:bg-[#1e293b] shadow-lg">
            {/* Logo Section */}
            <div
              className={`flex items-center transition-none duration-0 p-3 ${isAsideHovered
                ? "justify-start gap-x-3 px-5 border-b border-white/10"
                : "justify-center flex-col"
                }`}
            >
              <div className="flex-shrink-0">
                <Image src="/logo.png" alt="Autovyn" width={50} height={50} />
              </div>
              {isAsideHovered && (
                <span className="text-[22px] font-serif font-bold whitespace-nowrap text-white tracking-wide">
                  AUTO-VYN
                </span>
              )}
            </div>

            {/* Navigation Scroll Area */}
            <div
              className={`flex-1 w-full ${isAsideHovered
                ? "overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                : "overflow-hidden"
                }`}
            >
              <div
                className={`flex flex-col ${isAsideHovered ? "space-y-1 py-3 px-2" : "py-3"
                  }`}
              >
                {isAsideHovered ? (
                  /* Expanded (hovered) layout */
                  treeData.map((item, index) => (
                    <Link
                      href={item.url}
                      key={item.key}
                      className={`group cursor-pointer flex items-center rounded-md transition-all duration-200 ${activeFirstLevel === index ? "text-primary" : "text-white"
                        } h-10 w-full px-3 hover:bg-white/20`}
                      onClick={() => handleIconClick(index, item)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-xl">{item.icon}</div>
                        <span className="text-lg font-medium truncate">
                          {item.title}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  /* Collapsed (not hovered) layout */
                  <>
                    {(showFirstSet ? treeData.slice(0, 16) : treeData.slice(16)).map(
                      (item, index) => (
                        <Link
                          href={item.url}
                          key={item.key}
                          className={`group cursor-pointer flex items-center justify-center rounded-md transition-all duration-200 ${activeFirstLevel === index ? "text-primary" : "text-white"
                            } h-12 w-full hover:bg-white/20`}
                          onClick={() => handleIconClick(index, item)}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="text-lg">{item.icon}</div>
                            {/* Hidden text for minimal clean mode */}
                          </div>
                        </Link>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer / Profile Section */}
            <div className="w-full p-2 border-t border-white/10 bg-[#193a69] dark:bg-[#1e293b] sticky bottom-0 ">
              <div className="flex items-center justify-center">
                <Sheet>
                  <SheetTrigger asChild>
                    <div className={`rounded-full uppercase text-lg font-extrabold cursor-pointer flex items-center transition-all duration-0 ${isAsideHovered ? "w-full px-4 justify-between" : "h-10 w-10 justify-center"
                      }`}>
                      <div className={`
                      flex items-center justify-center
                       transition-all duration-0
                           ${isAsideHovered
                          ? "h-10 w-10 border-2 border-blue-400 rounded-full"
                          : "h-10 w-10 border-2 border-blue-400 rounded-full"
                        }
                        `}>
                        {user?.name?.slice(0, 1) || "U"}
                      </div>

                      {isAsideHovered && (
                        <div className="flex items-center">
                          <h2 className="mr-2 text-base font-semibold">{user?.name}'s Profile</h2>
                          <ExitIcon className="ml-3 h-6 w-6 text-[#e2e8f0] dark:text-[#e2e8f0]" />
                        </div>
                      )}
                    </div>
                  </SheetTrigger>

                  <SheetContent
                    side="left"
                    className={`w-[360px] bg-[#F3F8FC] dark:bg-[#0f172a] text-start fixed top-0 h-full border-[#193a69] dark:border-[#1e293b] border-r-8 border-b-8 border-t-8 ${isAsideHovered ? "left-72" : "left-16"
                      }`}
                  >
                    <div className="h-full flex flex-col ">
                      <div className="flex-1 overflow-y-auto pb-32 p-2">
                        <SheetHeader>
                          <SheetTitle>
                            <div className=" bg-white dark:bg-[#1e293b] mb-2 px-6 py-2 rounded-lg border border-[#d0d5dd] dark:border-[#d0d5dd]">
                              <div className="flex items-center justify-between">
                                <h1 className="font-bold text-lg uppercase text-[#193a69] dark:text-[#38bdf8]">
                                  {user?.name}'s Profile
                                </h1>
                              </div>
                            </div>
                          </SheetTitle>
                        </SheetHeader>

                        <div className="grid gap-4 py-2">
                          <Command className="rounded-lg  border border-[#d0d5dd] dark:border-[#d0d5dd] bg-white dark:bg-[#1e293b]">
                            <CommandInput
                              placeholder="Type a command or search..."
                              className="bg-white dark:bg-[#1e293b]"
                            />
                          </Command>
                        </div>

                        {user?.id == 1 && <AdminSection />}

                        <SheetFooter>
                          <SheetClose asChild />
                        </SheetFooter>

                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full bg-white dark:bg-[#1e293b] border-t border-[#d0d5dd] dark:border-[#334155]">
                      <Command className="pt-2 w-full">
                        <CommandList>
                          <CommandGroup className="space-y-2 w-full">
                            <Link href={"/change"} className="w-full cursor-pointer">
                              <div className="w-full dark:hover:bg-grey/5 hover:bg-body-color/10 rounded-lg h-12 cursor-pointer transition-all duration-200">
                                <CommandItem className="w-full cursor-pointer flex items-center py-3 px-2">
                                  <CiLock className="mr-3 text-[#193a69] dark:text-[#e2e8f0]" size={30} />
                                  <span className="cursor-pointer text-lg font-semibold text-[#193a69] dark:text-[#e2e8f0]">
                                    Change Password
                                  </span>
                                </CommandItem>
                              </div>
                            </Link>

                            <Link href={"/logout"} className="w-full cursor-pointer">
                              <div className="w-full cursor-pointer flex items-center py-3 px-2">
                                <ExitIcon className="mr-4 h-6 w-6 text-[#193a69] dark:text-[#e2e8f0]" />
                                <span className="cursor-pointer text-lg font-semibold text-[#193a69] dark:text-[#e2e8f0]">
                                  Logout
                                </span>
                              </div>
                            </Link>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  </SheetContent>


                </Sheet>
              </div>
            </div>

          </aside>
        </div>
      )}





      <div className="w-full h-full top-0 fixed flex flex-col ">
        {!isMobile && (
          <header
            className={`h-14 w-full flex items-center relative justify-end px-5 space-x-2 rounded-bl-[50px] bg-[#193a69] '!fixed !z-[9999]  dark:bg-[#1e293b] shadow-sticky !transition ${firstHeaderVisible ? "" : "hidden"
              }`}
          >
            <GlobalSearch firstHeaderVisible={firstHeaderVisible} />
            <Button variant={"outline"} className="uppercase text-xs">
              {user?.DB}
            </Button>
            <Button
              variant={"outline"}
              onClick={handlemulti}
              className="uppercase text-xs"
            >
              {String(userState?.branch).includes(',')
                ? "MultiLocation"
                : ` ${userState?.branchName?.slice(0, 20)}`}

            </Button>
            <ThemeToggler />
            <div>
              <ToggleIcon
                size={24}
                onClick={toggleHeaders}
                className="h-10 w-10 rounded-full cursor-pointer text-white"
              />
            </div>

            {isSheetOpen && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen} >
                <SheetContent className="w-80 bg-[#dae0e980] mt-11 text-start ">
                  <SheetHeader>
                    <SheetTitle>
                      <div className=" bg-white dark:bg-primary dark:bg-opacity-10 mb-0 px-2 py-1 rounded ">
                        <div className="flex flex-col sm:flex-row items-center justify-between py-1">
                          <h1 className=" font-bold text-pretty sm:text-sm md:text-lg lg:text-xl uppercase flex gap-x-1">
                            Shortcuts
                            <TbTableShortcut size={30} />
                          </h1>
                        </div>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-1 py-2  ">
                    <Command className="  shadow-md dark:bg-primary dark:bg-opacity-10 ">
                      <CommandList>
                        <CommandGroup className="gap-y-2">
                          <Link href={"/autovyn"} className="w-full cursor-pointer ">
                            <div className="hover:bg-body-color  h-9 cursor-pointer">
                              <CommandItem className=" w-full  cursor-pointer border-b">
                                <span className="cursor-pointer ">
                                  Home  (ALT + H)
                                </span>
                              </CommandItem>
                            </div>
                          </Link>
                          <Link href={"/branch"} className="w-full cursor-pointer ">
                            <div className="hover:bg-body-color  h-9 cursor-pointer">
                              <CommandItem className=" w-full  cursor-pointer border-b">
                                <span className="cursor-pointer ">
                                  Branch  (ALT + F2)
                                </span>
                              </CommandItem>
                            </div>
                          </Link>
                          <div className="hover:bg-body-color  h-9 cursor-pointer" onClick={() => setFirstHeaderVisible(true)}>
                            <CommandItem className=" w-full  cursor-pointer border-b">
                              <span className="cursor-pointer">
                                Search (CTRL + F)
                              </span>
                            </CommandItem>
                          </div>

                        </CommandGroup>
                      </CommandList>
                    </Command>
                    {user?.shortcuts && (
                      <Command className="shadow-md dark:bg-primary dark:bg-opacity-10 min-h-48 max-h-48 overflow-y-scroll">
                        <CommandList className="w-full">
                          <CommandGroup className="gap-y-2">
                            {Object.entries(user?.shortcuts).slice(1).map(([short, value], index) => {
                              const title = findTitleByUrl(value, treeData);

                              return title ? ( // Only render if title exists
                                <Link key={index} href={value} className="w-full cursor-pointer">
                                  <div className="hover:bg-body-color h-9 cursor-pointer">
                                    <CommandItem className="w-full cursor-pointer border-b">
                                      <span className="cursor-pointer whitespace-nowrap text-ellipsis uppercase">
                                        {short}: {title}
                                      </span>
                                    </CommandItem>
                                  </div>
                                </Link>
                              ) : null;
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    )}
                    {ShortCut.length > 0 && (
                      <Command className="shadow-md dark:bg-primary dark:bg-opacity-10 min-h-96">
                        <CommandList className="w-full">
                          <CommandGroup className="gap-y-2">
                            {ShortCut.slice(1).map((short, index) => (
                              <Link key={index} href={short.url} className="w-full cursor-pointer">
                                <div className="hover:bg-body-color  h-9 cursor-pointer">
                                  <CommandItem className="w-full cursor-pointer border-b">
                                    <span className="cursor-pointer whitespace-nowrap text-ellipsis">{short.Abbr?.replace(/\|/g, "") || short?.title?.replace(/\|/g, "")}  ({short.ShortCut?.toUpperCase()})</span>
                                  </CommandItem>
                                </div>
                              </Link>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    )}
                  </div>
                  <SheetFooter>
                    <SheetClose
                      asChild
                      className="text-center"
                    ></SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            )}

          </header>
        )}


        {!isMobile && (

          <header
            className={`h-14 flex items-center justify-between px-5 space-x-2 text-[#FCFFFB] bg-[#193a69] dark:bg-[#1e293b]
            shadow-sticky transition-all duration-150
             ${isAsideHovered ? "ml-72 w-[calc(100%-18rem)]" : "ml-16 w-[calc(100%-4rem)]"}
             ${firstHeaderVisible ? "hidden" : ""}`}
          >
            {/* LEFT SCROLL ARROW */}
            {submodule?.length > 9 && (
              <button
                onClick={() => {
                  const container = document.getElementById("submodule-scroll");
                  container?.scrollBy({ left: -800, behavior: "smooth" });
                }}
                className="px-1 text-gray-300 hover:text-white transition"
              >
                <MdKeyboardDoubleArrowLeft size={23} />
              </button>
            )}

            {/* SCROLLABLE CONTAINER */}
            <div
              id="submodule-scroll"
              className="flex items-center justify-start overflow-hidden flex-1 mx-2"
            >
              <ul className="flex items-center space-x-1 whitespace-nowrap">
                {submodule?.map((Item, Index) => (
                  <li
                    key={Item.key}
                    className={`submenu-item uppercase text-[14px] font-bold px-1 text-center cursor-pointer 
            transition-all duration-150 whitespace-nowrap
            ${activeSecondLevel === Index
                        ? "text-primary border-b border-primary"
                        : "text-gray-100 hover:text-white"
                      }`}
                    onClick={() => handleSubMenuClick(Index, Item)}
                  >
                    {Item.title}
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT SCROLL ARROW */}
            {submodule?.length > 9 && (
              <button
                onClick={() => {
                  const container = document.getElementById("submodule-scroll");
                  container?.scrollBy({ left: 800, behavior: "smooth" });
                }}
                className="px-1  text-gray-300 hover:text-white transition"
              >
                <MdKeyboardDoubleArrowRight size={23} />
              </button>
            )}

            {/* RIGHT ACTION BUTTONS */}
            <div className="flex items-center space-x-2 ">
              <Button variant={"outline"} className="uppercase text-xs">
                {user?.EMPCODE}
              </Button>
              <Button
                variant={"outline"}
                onClick={handlemulti}
                className="uppercase text-xs"
              >
                {typeof user?.branch === "string"
                  ? "MultiLocation"
                  : `${user?.branchName?.slice(0, 20)}`}
              </Button>
              <NotificationBell />
              <ThemeToggler />
              <ToggleIcon
                size={24}
                onClick={toggleHeaders}
                className="h-10 w-10 cursor-pointer"
              />
            </div>
          </header>
        )}








        {!isMobile && (
          <header
            className={`h-12 flex items-center relative px-5 bg-white/50 dark:bg-[#334155] text-[#193A69] dark:text-white 
            '!fixed !z-[9999]' shadow-sticky transition-all duration-300
                ${isAsideHovered ? "ml-72 w-[calc(100%-18rem)]" : "ml-16 w-[calc(100%-4rem)]"}`}
          >
            {/* LEFT ARROW */}
            {submenu?.length > 8 && (
              <button
                onClick={() => {
                  const container = document.getElementById("submenu-scroll");
                  container?.scrollBy({ left: -1200, behavior: "smooth" });
                }}
                className="p-1 text-gray-500 hover:text-primary transition"
              >
                <MdKeyboardDoubleArrowLeft size={23} />
              </button>
            )}

            {/* SCROLLABLE CONTAINER */}
            <div
              id="submenu-scroll"
              className="flex items-center w-full overflow-hidden whitespace-nowrap space-x-1 mx-2"
            >
              {submenu?.map((item, index) => (
                <Link href={item.url} key={item.key}>
                  <div
                    onClick={() => handleThirdClick(index)}
                    className={`uppercase font-semibold text-xs px-2 py-1 whitespace-nowrap rounded transition-colors
                          hover:bg-gray-200 dark:hover:bg-gray-700
                        ${activeThirdLevel === index
                        ? "text-primary bg-blue-100 dark:bg-blue-900"
                        : ""
                      }`}
                  >
                    {item.Abbr || item.title}
                  </div>
                </Link>
              ))}
            </div>

            {/* RIGHT ARROW */}
            {submenu?.length > 8 && (
              <button
                onClick={() => {
                  const container = document.getElementById("submenu-scroll");
                  container?.scrollBy({ left: 1200, behavior: "smooth" });
                }}
                className="p-1 text-gray-500 hover:text-primary transition"
              >
                <MdKeyboardDoubleArrowRight size={23} />
              </button>
            )}
          </header>
        )}





        {isMobile && (
          <header
            className={`h-14 rounded-bl-[50px] w-full  flex items-center relative justify-end px-5 space-x-10 '!fixed !z-[9999] bg-[#193a69] dark:bg-[#334155] text-[#193A69] dark:text-white shadow-sticky !transition ${firstHeaderVisible ? "" : "hidden"
              }`}
          >
            <Button
              variant={"outline"}
              onClick={handlemulti}
              className="uppercase text-xs"
            >
              {typeof user?.branch === "string"
                ? "MultiLocation"
                : ` ${user?.branchName?.slice(0, 20)}`}
            </Button>
            <input
              type="text"
              placeholder="  Search..."
              className="h-8 border dark:bg-input hidden lg:block md:block border-gray-300  rounded-md "
            />

            <ThemeToggler />


            <div className="h-10 w-10 rounded-full uppercase text-3xl font-extrabold   cursor-pointer py-1 border-white border-2 border-blue-400 flex items-center justify-center overflow-hidden">
              <div className="whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                <Sheet>
                  <SheetTrigger className="text-white">{user?.name.slice(0, 1)}</SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>
                        <div className="rounded-t bg-white dark:bg-primary dark:bg-opacity-10 mb-0 px-6 py-1 rounded-lg">
                          <div className="flex flex-col sm:flex-row items-center justify-between py-1">
                            <FaUsers size={34} className="" title="Payroll" />
                            <h1 className=" font-bold text-pretty sm:text-sm md:text-lg lg:text-xl uppercase">
                              {user?.name}'s Profile
                            </h1>
                          </div>
                        </div>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <Command className="rounded-lg  shadow-md dark:bg-primary dark:bg-opacity-10">
                        <CommandInput
                          placeholder="Type a command or search..."
                          className="bg-white dark:bg-input"
                          tabIndex={-1}
                        />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup heading={`${user?.name}`}>
                            <Link href={"/change"} className="w-full hover:bg-body-color">
                              <div className="hover:bg-body-color rounded h-9">
                                <CommandItem className=" w-full ml-4">
                                  <PersonIcon className="mr-2 h-4 w-4" />
                                  <span className="cursor-pointer ">
                                    Change Password
                                  </span>
                                </CommandItem>
                              </div>
                            </Link>
                            <Link href={"/logout"} className="w-full hover:bg-body-color">
                              <div className="hover:bg-body-color rounded h-9">
                                <CommandItem className=" w-full ml-4">
                                  <ExitIcon className="mr-2 h-4 w-4" />
                                  <span className="cursor-pointer ">
                                    Logout
                                  </span>
                                </CommandItem>
                              </div>
                            </Link>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                    <SheetFooter>
                      <SheetClose
                        asChild
                        className="text-center"
                      ></SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </div>


          </header>
        )}



        <main
          className={`${isMobile ? "" : `transition-all duration-300 ease-in-out ${isAsideHovered ? "ml-72" : "ml-16"
            }`
            } h-full flex relative overflow-y-scroll no-visible-scrollbar bg-off dark:bg-black p-2 pt-0`}  //bg-[#e4ebf0]
          style={{
            width: isMobile ? "100%" : `calc(100 % - ${isAsideHovered ? "10rem" : "4rem"})`
          }}
        >
          <div className="h-full w-full m-2 mt-0 items-start justify-start rounded-tl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

};
export default Navbar;
