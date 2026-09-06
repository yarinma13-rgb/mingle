export function isNavHrefActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/conversations" && pathname.startsWith("/conversations/")) {
    return true;
  }
  if (
    href === "/company-profile/build" &&
    pathname.startsWith("/company-profile/")
  ) {
    return true;
  }
  if (href === "/profile/build" && pathname.startsWith("/profile/build")) {
    return true;
  }
  return false;
}
