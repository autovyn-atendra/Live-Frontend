// import * as React from "react";
// import { Slot } from "@radix-ui/react-slot";
// import { cva, type VariantProps } from "class-variance-authority";

// import { cn } from "@/lib/utils";

// const buttonVariants = cva(
//   "inline-flex items-center text-md justify-center whitespace-nowrap rounded-md  font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300",
//   {
//     variants: {
//       variant: {
//         save: "uppercase bg-primary  font-bold text-white shadow hover:bg-slate-900/90 transition-transform transform  hover:scale-105 dark:bg-slate-50 dark:bg-primary dark:hover:bg-slate-50/90",
//         update:
//           "uppercase bg-save text-white  font-bold  shadow-sm transition-transform transform  hover:scale-105 hover:bg-red-500/90 dark:bg-red-900 dark: dark:hover:bg-red-900/90",
//         outline:
//           "uppercase border  font-bold  border-primary text-primary  hover:scale-105 dark:bg-primary dark:bg-opacity-10 bg-white transition-transform transform dark:",
//         print:
//           "uppercase bg-exit text-white font-bold    transition-transform transform  hover:scale-105 shadow-sm hover:bg-slate-100/80 dark:bg-slate-800 dark: dark:hover:bg-slate-800/80",
//         ghost:
//           "uppercase font-bold  hover:bg-slate-100 transition-transform transform  hover:scale-105 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:",
//         link: "uppercase text-primary underline-offset-4 hover:underline dark: transition-transform transform  hover:scale-105",
//         input:
//           "border-0 px-1.5 py-1.5 dark:bg-input rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150",
//       },
//       size: {
//         default: "h-9 px-4 py-2",
//         sm: "h-8 rounded-md px-3 text-xs",
//         lg: "h-10 rounded-md px-8",
//         icon: "h-9 w-9",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//       size: "default",
//     },
//   }
// );

// export interface ButtonProps
//   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
//     VariantProps<typeof buttonVariants> {
//   asChild?: boolean;
// }

// const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
//   ({ className, variant, size, asChild = false, ...props }, ref) => {
//     const Comp = asChild ? Slot : "button";
//     return (
//       <Comp
//         className={cn(buttonVariants({ variant, size, className }))}
//         ref={ref}
//         {...props}
//       />
//     );
//   }
// );
// Button.displayName = "Button";

// export { Button, buttonVariants };



import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { CgSpinner } from "react-icons/cg";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-slate-300",
  {
    variants: {
      variant: {
        save: "capitalize bg-primary font-bold text-white shadow hover:bg-slate-900/90 transition-transform transform  hover:scale-105 dark:bg-slate-50 dark:bg-primary dark:hover:bg-slate-50/90",
        update:
          "capitalize bg-save text-white font-bold shadow-sm transition-transform transform  hover:scale-105 hover:bg-red-500/90 dark:bg-red-900 dark:hover:bg-red-900/90",
        outline:
          "capitalize border font-bold border-primary text-primary  hover:scale-105 dark:bg-primary dark:bg-opacity-10 bg-white transition-transform transform",
        print:
          "capitalize bg-exit text-white font-bold transition-transform transform  hover:scale-105 shadow-sm hover:bg-slate-100/80 dark:bg-slate-800 dark:hover:bg-slate-800/80",
        ghost:
          "capitalize font-bold hover:bg-slate-100 transition-transform transform  hover:scale-105 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:",
        link: "capitalize text-primary underline-offset-4 hover:underline transition-transform transform  hover:scale-105",
        input:
          "border-0 px-1.5 py-1.5 dark:bg-input rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "input",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean; // Add a loading prop
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <div className="relative flex items-center justify-center">
          {/* Spinner */}
          {loading && (
            <span className="absolute">
              <CgSpinner className="animate-spin text-xl text-white" />
            </span>
          )}
          {/* Button Text */}
          <span className={loading ? "invisible" : "flex"}>{children}</span>
        </div>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

