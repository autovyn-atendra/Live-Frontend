import { auth } from "./app/auth";
import { treeData } from "@/constant/modules";

const memoizedMatchingUrls = {};
function findMatchingUrls(userRoleKeys) {
  if (memoizedMatchingUrls[userRoleKeys]) {
    // If already memoized, return the cached result
    return memoizedMatchingUrls[userRoleKeys];
  }

  // Assuming that treeData is an array of objects with 'key' property
  const matchingUrls = [];

  for (const key of userRoleKeys) {
    const matchedNode = findNodeByKey(treeData, key);
    if (matchedNode) {
      matchingUrls.push(matchedNode.url);
    }
  }

  // Memoize the result before returning
  memoizedMatchingUrls[userRoleKeys] = matchingUrls;
  return matchingUrls;
}
function findNodeByKey(data, key) {
  for (const item of data) {
    if (item.key === key) {
      return item;
    }
    if (item.children) {
      const foundInChildren = findNodeByKey(item.children, key);
      if (foundInChildren) {
        return foundInChildren;
      }
    }
  }
  return null;
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  if ((nextUrl.pathname == "/" && !isLoggedIn))
    return null;
  if (nextUrl.pathname === "/registrationform"|| nextUrl.pathname==='/autovyn/sales/MGA_Approval/MGADetails' || nextUrl.pathname =="/autovyn/payroll/interview/zoom"||nextUrl.pathname=="/profile"|| nextUrl.pathname=="/autovyn/payroll/Recruitment_Process/Interview_QRCode"|| nextUrl.pathname=="/autovyn/payroll/Recruitment_Process/Shortlisted_Candidate"||nextUrl.pathname=="/autovyn/payroll/Recruitment_Process/Candidate_Registratio_Form"|| nextUrl.pathname=="/autovyn/preSales/quotation/De-Allot"||
    (nextUrl.pathname.split("/").filter(Boolean).length === 2 && isLoggedIn)|| nextUrl.pathname === "/privacy-policy"  || nextUrl.pathname === "/terms"  || nextUrl.pathname === "/data-deletion"  || (nextUrl.pathname.split("/").filter(Boolean).length === 3 && isLoggedIn)) {
    return; // No redirect, allow access
  }
  if (nextUrl.pathname == "/" && isLoggedIn) {
    if (req.auth?.user?.branch == "") {
      return Response.redirect(new URL("/branch", nextUrl));
    } else {
      return Response.redirect(new URL("/autovyn", nextUrl));
    }
  }
  if (!isLoggedIn && nextUrl.pathname != "/")
    return Response.redirect(new URL("/", nextUrl));
  const userRoleKeys = req.auth?.user?.role || [];

  // Assuming that treeData is an array of objects with 'key' property
  const matchingUrls = findMatchingUrls(userRoleKeys);

  // console.log('Matching URLs:', matchingUrls);
  if (
    !matchingUrls.includes(nextUrl.pathname) &&
    nextUrl.pathname !== "/autovyn" &&
    nextUrl.pathname !== "/branch" &&
    nextUrl.pathname !== "/profile" &&
    nextUrl.pathname !== "/change" &&
    nextUrl.pathname !== "/logout" 
  ) {
    return Response.redirect(new URL("/autovyn", nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$|favicon\\.ico|TDS_CALC_2023-24\\.xlsx|TDS_CALC_OLD_RATE\\(2017-2023\\)\\.xlsx).*)"
  ],
}



