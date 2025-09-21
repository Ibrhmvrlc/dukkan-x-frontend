// src/components/AppSidebar.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom"; // ✅ doğru paket
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  PencilIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../context/AuthContext";

/* ------------------------------- Types ------------------------------- */
type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  badge?: number;
};
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

/* ------------------------------ Main ------------------------------- */
const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Ana Sayfa", path: "/" },
  {
    icon: <GroupIcon />,
    name: "Firmalar",
    subItems: [
      { name: "Müşteriler", path: "/musteriler" },
      { name: "Tedarikçiler", path: "/tedarikciler" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Ürünler",
    subItems: [
      { name: "Ürün Yönetimi", path: "/urunler" },
      { name: "Fiyat Güncelle", path: "/fiyat-guncelle" },
    ],
  },
  { icon: <DollarLineIcon />, name: "Tahsilat Ekle", path: "/tahsilat-ekle" },
];

/* ------------------------- Role helpers -------------------------- */
const hasRole = (user: { roles?: string[] } | null | undefined, role: string) =>
  !!user && Array.isArray(user.roles) && user.roles.includes(role);

/* ----------------------------- Component ---------------------------- */
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = hasRole(user, "admin");

  const [inboxUnread] = useState(0); // ileride API bağlayınca set edersin

  // othersItems artık STABLE: useMemo
  const othersItems = useMemo<NavItem[]>(() => {
    if (isAdmin) {
      return [
        { icon: <CalenderIcon />, name: "Takvim", path: "/calendar" },
        {
          icon: <PencilIcon />,
          name: "Destek",
          subItems: [
            { name: "Destek Kutusu", path: "/admin/support", badge: inboxUnread },
            { name: "Kullanıcı Görünümü", path: "/support" },
          ],
        },
      ];
    }
    return [
      { icon: <CalenderIcon />, name: "Takvim", path: "/calendar" },
      { icon: <PencilIcon />, name: "Destek", path: "/support" },
    ];
  }, [isAdmin, inboxUnread]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Aktif rota kontrolü
  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  // ✅ Route değişince sadece EŞLEŞME varsa otomatik aç; eşleşme yoksa KAPATMA
  useEffect(() => {
    // main + others üstünden aktiv alt rota var mı bak
    const candidates: Array<{ type: "main" | "others"; items: NavItem[] }> = [
      { type: "main", items: navItems },
      { type: "others", items: othersItems },
    ];

    for (const group of candidates) {
      for (let i = 0; i < group.items.length; i++) {
        const nav = group.items[i];
        if (!nav.subItems) continue;
        const match = nav.subItems.some((s) => isActive(s.path));
        if (match) {
          setOpenSubmenu({ type: group.type, index: i });
          return; // ilk bulduğunda aç ve çık
        }
      }
    }
    // Not: Hiçbir submenu eşleşmiyorsa MANUEL açılmış olanı kapatmıyoruz.
  }, [location.pathname, isActive, othersItems]);

  // Submenu ölç
  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const node = subMenuRefs.current[key];
      // ölçümü microtask sonrasına bırak ki DOM hazır olsun
      queueMicrotask(() => {
        if (node) {
          const h = node.scrollHeight || 0;
          setSubMenuHeight((prev) => ({ ...prev, [key]: h }));
        }
      });
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const submenuKey = `${menuType}-${index}`;
        const opened =
          openSubmenu?.type === menuType && openSubmenu?.index === index;

        return (
          <li key={`${menuType}-${nav.name}`}>
            {nav.subItems ? (
              <button
                type="button" // ✅ önemli
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  opened ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    opened ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      opened ? "rotate-180 text-brand-500" : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {/* SubItems */}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[submenuKey] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: opened ? `${subMenuHeight[submenuKey] ?? 0}px` : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={`${menuType}-${nav.name}-${subItem.name}`}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {typeof subItem.badge === "number" && subItem.badge > 0 && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              {subItem.badge}
                            </span>
                          )}
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Menu */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "İşlemler"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Diğer"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>

        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;