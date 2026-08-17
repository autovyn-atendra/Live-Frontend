import axios from "axios";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { treeData } from "@/constant/modules";

const getAllKeysFromTree = (treeData) => {
  const keys = [];

  const traverseTree = (nodes) => {
    nodes.forEach((node) => {
      keys.push(node.key); // Add the current node's key
      if (node.children) {
        traverseTree(node.children); // Recursively traverse the children
      }
    });
  };

  traverseTree(treeData);
  return keys;
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      async authorize(credentials) {
        try {


          if (!credentials || !credentials.username || !credentials.password)
            return null;
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_URL}/users/login`,
            {
              User_Name: credentials?.username,
              Password: credentials?.password,
              Year: credentials.Year,
              Comp_Code: credentials.Comp_Code,
            },
            {
              headers: {
                compcode: `${credentials.Comp_Code}-${credentials.Year}`,
              },
            }
          );
          const user = await res.data;
          if (user.email) {
            return user;
          } else {
            return null;
          }
        } catch (err) {
          return null;
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.DB = user.DB;
        token.Comp_Code = user.Comp_Code || null;
        token.emp_dms_code = user.emp_dms_code || null;
        token.role = user?.id == 1 ? getAllKeysFromTree(treeData) : user.role as any;
        token.role1 = user.role1 as any;
        token.id = user.id;
        token.multi = user.multi as any;
        token.branch = (user.branch as any) || "";
        token.EMPCODE = (user.EMPCODE as any) || null;
        token.Phy_Loc = (user.Phy_Loc as any) || null;
        token.SRNO = (user.SRNO as any) || null;
        token.branchName = user?.branchName || null;
        token.AutoVynRights = user?.AutoVynRights || null;
        token.Deal = user?.Deal || [];
        token.Primary_Branch = user?.Primary_Branch;
        token.exp_mng_dept_wise = user?.exp_mng_dept_wise;
         token.expense_template_master = user?.expense_template_master;
             token.Expense_Financial_Posting = user?.Expense_Financial_Posting;
        token.Year = user?.Year;
        token.shortcuts = user?.shortcuts;
         
      }
      if (trigger === "update") {
        return { ...token, ...session.user };
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.branchName = token?.branchName;
        session.user.DB = token.DB;
        session.user.Comp_Code = token.Comp_Code || null;
        session.user.role = token.role;
        session.user.role1 = token.role1;
        session.user.id = token.id;
        session.user.multi = token.multi;
        session.user.branch = token.branch || 0;
        session.user.Phy_Loc = token.Phy_Loc || 0;
        session.user.EMPCODE = token.EMPCODE || 0;
        session.user.SRNO = token.SRNO || 0;
        session.user.emp_dms_code = token.emp_dms_code || 0;
        session.user.AutoVynRights = token.AutoVynRights || 0;
        session.user.Deal = token.Deal || [];
        session.user.Primary_Branch = token.Primary_Branch;
        session.user.exp_mng_dept_wise = token.exp_mng_dept_wise;
        session.user.expense_template_master = token.expense_template_master;
         session.user.Expense_Financial_Posting = token.Expense_Financial_Posting;
        session.user.Year = token.Year;
        session.user.shortcuts = token.shortcuts; 
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 28800,
  },
});
