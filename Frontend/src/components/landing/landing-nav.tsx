"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDollarSign,
  Menu,
  TrendingUp,
  DollarSign,
  HelpCircle,
  Briefcase,
  Target,
  Search,
  Filter,
  FileText,
  MessageCircle,
  Plus,
  PlayCircle,
  MessageSquare,
  Mail,
  CreditCard,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import MessageIcon from "@/components/layout/MessageIcon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNavItems } from "@/lib/constants";
import { useAuthUser } from "@/hooks/auth/useAuthUser";
import { useLogout } from "@/lib/auth-utils";
import { Skeleton } from "../ui/skeleton";

// Icon mapping
const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } =
  {
    TrendingUp,
    DollarSign,
    HelpCircle,
    Briefcase,
    Target,
    Search,
    Filter,
    FileText,
    MessageCircle,
    Plus,
    PlayCircle,
    MessageSquare,
    Mail,
    CreditCard,
    Info,
  };

export default function LandingNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useAuthUser();
  const { logout } = useLogout();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <header
      className={cn("sticky top-0 z-50 w-full transition-all duration-300", {
        "bg-background/80 backdrop-blur-md shadow-sm border-b":
          isScrolled || pathname !== "/",
        "bg-transparent": !isScrolled && pathname === "/",
      })}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 z-50">
          <CircleDollarSign className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">
            Konnect<span className="text-primary">Sphere</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between flex-1 ml-6">
          <NavigationMenu>
            <NavigationMenuList>
              {mainNavItems
                .filter((item) => {
                  // Always show Help Center
                  if (item.title === "Help Center" || item.title === "About Us")
                    return true;

                  // If not authenticated, show all items
                  if (!isAuthenticated) return true;

                  // If authenticated, show based on user role
                  if (user?.role === "Investor") {
                    return (
                      item.title === "Invest" || item.title === "Help Center"
                    );
                  } else {
                    return (
                      item.title === "Fundraise" || item.title === "Help Center"
                    );
                  }
                })
                .map((item) => (
                  <NavigationMenuItem key={item.title}>
                    {item.submenu ? (
                      <>
                        <NavigationMenuTrigger className="text-sm font-medium flex items-center gap-2">
                          {getIcon(item.icon)}
                          {item.title}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="w-[220px] p-2 mb-4 space-y-1">
                            {item.submenu
                              .filter((subitem) => {
                                // If not authenticated, show limited items
                                if (!isAuthenticated) {
                                  // For Invest menu - only show public routes
                                  if (item.title === "Invest") {
                                    return (
                                      subitem.title === "Explore Pitches" ||
                                      subitem.title === "Search Pitches"
                                    );
                                  }
                                  // For Fundraise menu - only show public routes
                                  if (item.title === "Fundraise") {
                                    return (
                                      subitem.title === "Investor Search" ||
                                      subitem.title === "Add Pitch"
                                    );
                                  }
                                }
                                // If authenticated, show all items for the user's role
                                return true;
                              })
                              .map((subitem) => (
                                <li key={subitem.title}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href={subitem.href}
                                      className="flex flex-row items-center gap-2  rounded-md  transition-colors hover:bg-accent hover:text-accent-foreground  "
                                    >
                                      <div className="flex h-6 w-6 items-center justify-center text-muted-foreground shrink-0 ">
                                        {getIcon(subitem.icon)}
                                      </div>
                                      <p className="text-sm font-medium  ">
                                        {subitem.title}
                                      </p>
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "flex items-center gap-2"
                          )}
                        >
                          {getIcon(item.icon)}
                          {item.title}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden md:flex items-center space-x-3">
            <div className="h-6 w-6 flex justify-center items-center">
              <MessageIcon />
            </div>
            <div className="h-6 w-6 flex justify-center items-center">
              <ModeToggle />
            </div>

            {loading ? (
              <Skeleton className="w-12 h-12 rounded-full" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full w-12 h-12 p-0 hover:cursor-pointer"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={user?.avatarImage?.url || "/images/avatar.png"}
                        alt={user?.fullName || "User"}
                      />
                      <AvatarFallback>
                        {user?.fullName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="flex flex-col gap-2 p-2 mb-4">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">Account Settings</Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => logout()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center space-x-3">
          <div className="h-6 w-6">
            <MessageIcon />
          </div>
          <div className="h-6 w-6">
            <ModeToggle />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
              <div className="flex flex-col gap-6 p-6">
                <Link href="/" className="flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">KonnectSphere</span>
                </Link>

                <nav className="flex flex-col gap-4">
                  {mainNavItems.map((item) => (
                    <div key={item.title} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-base font-medium">
                        {getIcon(item.icon)}
                        <span>{item.title}</span>
                      </div>
                      {item.submenu && (
                        <div className="ml-6 flex flex-col gap-3 border-l pl-3">
                          {item.submenu
                            .filter((subitem) => {
                              // Filter mobile menu items based on authentication status
                              if (!isAuthenticated) {
                                // For Invest menu - only show public routes
                                if (item.title === "Invest") {
                                  return (
                                    subitem.title === "Explore Pitches" ||
                                    subitem.title === "Search Pitches"
                                  );
                                }
                                // For Fundraise menu - only show public routes
                                if (item.title === "Fundraise") {
                                  return (
                                    subitem.title === "Investor Search" ||
                                    subitem.title === "Add Pitch"
                                  );
                                }
                                // Help Center is always visible
                                return true;
                              }
                              // If authenticated, show all items
                              return true;
                            })
                            .map((subitem) => (
                              <SheetClose asChild key={subitem.title}>
                                <Link
                                  href={subitem.href}
                                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                  {getIcon(subitem.icon)}
                                  {subitem.title}
                                </Link>
                              </SheetClose>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                <div className="space-y-3">
                  {loading ? (
                    <Skeleton className="w-full h-10 rounded-md" />
                  ) : isAuthenticated ? (
                    <>
                      <SheetClose asChild>
                        <Link href="/account">
                          <Button className="w-full">Account Settings</Button>
                        </Link>
                      </SheetClose>

                      <Button
                        onClick={() => logout()}
                        className="w-full"
                        variant="outline"
                      >
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full">
                          Log In
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full">Get Started</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
