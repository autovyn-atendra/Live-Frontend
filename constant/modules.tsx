import { MdAccountCircle, MdFileUpload } from "react-icons/md";
import { AiOutlineAudit } from "react-icons/ai";
import { IoIdCard, IoCart } from "react-icons/io5";
import { GiCarWheel } from "react-icons/gi";
import { FaFolderOpen, FaHandshake, FaTag } from "react-icons/fa";
import {
  FaUsers,
  FaShieldAlt,
  FaBoxOpen,
  FaTools,
  FaClipboardCheck,
} from "react-icons/fa";
import { MdDashboard, MdAutoMode } from "react-icons/md";
import { GrUserAdmin } from "react-icons/gr";
import { FaBalanceScale } from "react-icons/fa";
import { Car, BadgeCheck, Wallet } from "lucide-react";
import { RiBankFill } from "react-icons/ri";
import Image from "next/image";

export const treeData = [

  {
    title: "Admin",
    url: "/autovyn/admin",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "8",
    children: [

      {
        title: "Query Analyzer |",
        key: "8.7",
        url: "/autovyn/admin/QueryAnalyzer",
        children: [
          {
            title: "Query Analyzer |",
            key: "8.7.1",
            url: "/autovyn/admin/QueryAnalyzer/QueryAnalyzer",
          },
        ],
      },


    ],
  },
  {
    title: "Employee Master",
    url: "/autovyn/admin",
    ShortCut: "alt+e",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "9",
    children: [
      {
        title: "Employee master|",
        key: "9.1",
        url: "/autovyn/employee-master",
        children: [
          {
            title: "Employee Add |",
            key: "9.1.1",
            url: "/autovyn/employee-master/employee_mini",
          },
          {
            title: "Employee Detail |",
            key: "9.1.2",
            url: "/autovyn/employee-master/employee_view",
          },
          {
            title: "Wish Well |",
            key: "9.1.3",
            url: "/autovyn/employee-master/wish_well"
          },
          {
            title: "Employee Face Data |",
            key: "9.1.4",
            url: "/autovyn/employee-master/face_data"
          },
        ],
      },
    ]
  },
  {
    title: "DEMO GATEPASS",
    url: "/autovyn/admin",
    ShortCut: "alt+d",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "10",
    children: [
      {
        title: "Demo Gatepass|",
        key: "10.1",
        url: "/autovyn/demo-gatepass",
        children: [
          {
            title: "Test Drive Appointment |",
            key: "10.1.1",
            url: "/autovyn/demo-gatepass/test-drive-appointment",
          },
          //   {
          //     title: "Employee Detail |",
          //     key: "9.1.2",
          //     url: "/autovyn/employee-master/employee_view",
          //   },
          //   {
          //   title: "Wish Well |",
          //   key: "9.1.3",
          //   url: "/autovyn/employee-master/wish_well"
          // },
        ],
      },
    ]
  },
  //   {
  //   title: "Service Reminder",
  //   url: "/autovyn/admin",
  //   ShortCut: "alt+s",
  //   icon: (
  //     <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
  //       <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
  //     </div>
  //   ),
  //   key: "11",
  //   children: [
  //      {
  //       title: "Service Reminder|",
  //       key: "11.1",
  //       url: "/autovyn/CRM",
  //       children: [
  //         {
  //           title: "Customer Vehicle Dashboard |",
  //           key: "11.1.1",
  //           url: "/autovyn/CRM/customer_vehicle/dashboard",
  //         },
  //         {
  //           title: "Customer Vehicle Import |",
  //           key: "11.1.2",
  //           url: "/autovyn/CRM/customer_vehicle/import",
  //         },
  //         {
  //           title: "Customer Vehicle View |",
  //           key: "11.1.3",
  //           url: "/autovyn/CRM/customer_vehicle/view",
  //         },
  //         {
  //         title: "Service Reminder View |",
  //         key: "11.1.4",
  //         url: "/autovyn/CRM/customer_vehicle/reminders"
  //       },
  //       {
  //         title: "Service Reminder Rules |",
  //         key: "11.1.5",
  //         url: "/autovyn/CRM/customer_vehicle/Service_Rules"
  //       },
  //       {
  //         title: "Vehicle Service Reminder History |",
  //         key: "11.1.6",
  //         url: "/autovyn/CRM/customer_vehicle/reminder_history"
  //       },
  //       {
  //         title: "Service Reminder Config From |",
  //         key: "11.1.7",
  //         url: "/autovyn/CRM/customer_vehicle/ReminderConfig"
  //       },
  //        {
  //         title: "Service Reminder Work Transfer  |",
  //         key: "11.1.8",
  //         url: "/autovyn/CRM/customer_vehicle/Transfer_work"
  //       },
  //       ],
  //     },
  //   ]
  // },

  {
    title: "EXPENSE DIVISION",
    url: "/autovyn/admin",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "12",
    children: [
      {
        title: "Expense Division|",
        key: "12.1",
        url: "/autovyn/expense-division",
        children: [
          {
            title: "MIS-PL-REPORT |",
            key: "12.1.1",
            url: "/autovyn/expense-division/Expense_Division/MIS-PL-REPORT",
          },
          {
            title: "Save_Insu_Dtl |",
            key: "12.1.2",
            url: "/autovyn/expense-division/Expense_Division/Save_Insu_Dtl",
          },
          {
            title: "InsuranceRenewalPage |",
            key: "12.1.3",
            url: "/autovyn/Save_Insu_Dtl/InsuranceRenewalPage",
          },


        ],
      },
    ]
  },
  {
    title: "CRM",
    url: "/autovyn/CRM",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <FaHandshake size={22} />,
      </div>
    ),
    key: "23",
    children: [
      {
        title: "service reminder|",
        key: "23.1",
        url: "/autovyn/CRM/customer_vehicle",
        children: [
          {
            title: "Dashboard |",
            key: "23.1.1",
            url: "/autovyn/CRM/customer_vehicle/dashboard",
          },
          {
            title: "Customer Vehicle Import |",
            key: "23.1.2",
            url: "/autovyn/CRM/customer_vehicle/import",
          },
          {
            title: "Customer Vehicle View |",
            key: "23.1.3",
            url: "/autovyn/CRM/customer_vehicle/view",
          },
          {
            title: "Service Reminder View |",
            key: "23.1.4",
            url: "/autovyn/CRM/customer_vehicle/reminders"
          },
          {
            title: "service |",
            key: "23.1.5",
            url: "/autovyn/CRM/customer_vehicle/service",
          },
          {
            title: "service Rule |",
            key: "23.1.6",
            url: "/autovyn/CRM/customer_vehicle/Service_Rules",
          },
          {
            title: "Reminder Config |",
            key: "23.1.7",
            url: "/autovyn/CRM/customer_vehicle/ReminderConfig",
          },
          {
            title: "service reminder history |",
            key: "23.1.8",
            url: "/autovyn/CRM/customer_vehicle/reminder_history",
          },
          {
            title: "Service Reminder Transfer Work |",
            key: "23.1.9",
            url: "/autovyn/CRM/customer_vehicle/Transfer_work",
          },
        ]
      },
      {
        title: "Insurance Renewal |",
        key: "23.2",
        url: "/autovyn/CRM/Insu_Renewal",
        children: [
          {
            title: "Insurance Excel Import|",
            key: "23.2.1",
            url: "/autovyn/CRM/Insu_Renewal/insu_excel_import",
          },
          {
            title: "Insurance Reminder |",
            key: "23.2.2",
            url: "/autovyn/CRM/Insu_Renewal/insu_reminder",
          },
          {
            title: "Insurance Details View |",
            key: "23.2.3",
            url: "/autovyn/CRM/Insu_Renewal/insu_view",
          },
          {
            title: "payment |",
            key: "23.2.4",
            url: "/autovyn/CRM/Insu_Renewal/payment",
          },
          {
            title: "Account Approval |",
            key: "23.2.5",
            url: "/autovyn/CRM/Insu_Renewal/accountapproval",
          },
          {
            title: "Insurance Renewal Page |",
            key: "23.2.6",
            url: "/autovyn/CRM/Insu_Renewal/accountview",
          },
          {
            title: "Insurance Calling Config |",
            key: "23.2.7",
            url: "/autovyn/CRM/Insu_Renewal/insucallingconfig",
          },
          {
            title: "Insurance Calling View |",
            key: "23.2.8",
            url: "/autovyn/CRM/Insu_Renewal/insucallingview",
          },
          {
            title: "Insurance dashboard |",
            key: "23.2.9",
            url: "/autovyn/CRM/Insu_Renewal/insu-dashboard",
          },


        ],
      },
    ]
  },
  {
    title: "AI",
    url: "/autovyn/admin",
    ShortCut: "alt+u",
    icon: (
      <div className="h-10 w-10 flex items-center justify-center rounded-lg cursor-pointer hover:text-gray-800 hover:duration-300 hover:ease-linear ">
        <Image src="/sidebaricon/Admin.png" alt="Autovyn" width={25} height={25} />
      </div>
    ),
    key: "13`",
    children: [
      {
        title: "AI Assistant|",
        key: "13.1",
        url: "/autovyn/ai-assistant",
        children: [
          {
            title: "AI Assistant |",
            key: "13.1.1",
            url: "/autovyn/ai/ai-assistant",
          },
          {
            title: "AI Knowledge Management |",
            key: "13.1.2",
            url: "/autovyn/ai/knowledge",
          }
        ],
      },
    ]
  },
];
