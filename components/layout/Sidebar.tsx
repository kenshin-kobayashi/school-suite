import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Settings,
} from "lucide-react";

const menus = [
  {
    title: "ダッシュボード",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "生徒管理",
    href: "/students",
    icon: Users,
  },
  {
    title: "講師管理",
    href: "/teachers",
    icon: GraduationCap,
  },
  {
    title: "スケジュール",
    href: "/scheduler",
    icon: CalendarDays,
  },
  {
    title: "設定",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight">
          KOBAG2
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          School Suite
        </p>
      </div>

      <nav className="flex-1 px-3 py-6">
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <Link
              key={menu.title}
              href={menu.href}
              className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-700 transition hover:bg-zinc-100"
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{menu.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}