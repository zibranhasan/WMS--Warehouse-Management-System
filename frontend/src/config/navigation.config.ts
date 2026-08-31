import React from "react";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Tags,
  Package,
  Warehouse,
  Layers,
  Grid,
  AlignJustify,
  Box,
  Boxes,
  Truck,
  Receipt,
  ShoppingCart,
  PackageCheck,
  PackageOpen,
  Send,
  User as UserIcon,
  KeyRound,
} from "lucide-react";


export type IconComponent = React.ComponentType<{ className?: string }>;

export interface NavItem {
  title: string;
  href: string;
  icon: IconComponent;
  allowedRoles?: string[];
}

export interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    groupTitle: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupTitle: "Administration",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        allowedRoles: ["SUPER_ADMIN", "ADMIN"],
      },
    ],
  },
  {
    groupTitle: "Master Data",
    items: [
      {
        title: "Categories",
        href: "/categories",
        icon: FolderTree,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "PROCUREMENT"],
      },
      {
        title: "Brands",
        href: "/brands",
        icon: Tags,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "PROCUREMENT"],
      },
      {
        title: "Products",
        href: "/products",
        icon: Package,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "PROCUREMENT", "FINANCE", "STAFF"],
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        icon: Truck,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "PROCUREMENT", "FINANCE"],
      },
    ],
  },
  {
    groupTitle: "Warehouse",
    items: [
      {
        title: "Warehouses",
        href: "/warehouses",
        icon: Warehouse,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        title: "Zones",
        href: "/zones",
        icon: Layers,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        title: "Aisles",
        href: "/aisles",
        icon: Grid,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        title: "Shelves",
        href: "/shelves",
        icon: AlignJustify,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"],
      },
      {
        title: "Bins",
        href: "/bins",
        icon: Box,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"],
      },
    ],
  },
  {
    groupTitle: "Inventory",
    items: [
      {
        title: "Inventory Stock",
        href: "/inventory",
        icon: Boxes,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "STAFF"],
      },
    ],
  },
  {
    groupTitle: "Operations",
    items: [
      {
        title: "Purchase Orders",
        href: "/purchase-orders",
        icon: Receipt,
        allowedRoles: [
          "SUPER_ADMIN",
          "ADMIN",
          "WAREHOUSE_MANAGER",
          "PROCUREMENT",
          "FINANCE",
        ],
      },
      {
        title: "Sales Orders",
        href: "/sales-orders",
        icon: ShoppingCart,
        allowedRoles: [
          "SUPER_ADMIN",
          "ADMIN",
          "WAREHOUSE_MANAGER",
          "FINANCE",
          "STAFF",
        ],
      },
      {
        title: "Picking Tasks",
        href: "/picking",
        icon: PackageCheck,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "STAFF"],
      },
      {
        title: "Packing Tasks",
        href: "/packing",
        icon: PackageOpen,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "STAFF"],
      },
      {
        title: "Shipping",
        href: "/shipping",
        icon: Send,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "STAFF"],
      },
    ],
  },
  {
    groupTitle: "Account",
    items: [
      {
        title: "Profile",
        href: "/profile",
        icon: UserIcon,
      },
      {
        title: "Change Password",
        href: "/change-password",
        icon: KeyRound,
      },
    ],
  },

];

export function getFilteredNavigation(role?: string): NavGroup[] {
  if (!role) return [];

  return navigationConfig
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (!item.allowedRoles) return true;
        return item.allowedRoles.includes(role);
      });

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => group.items.length > 0);
}
