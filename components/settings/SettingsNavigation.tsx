import Card from "@/components/common/Card";

import type { SettingsMenu } from "./SettingsPage";

type Props = {
  selectedMenu: SettingsMenu;
  onSelect: (menu: SettingsMenu) => void;
};

type SettingsNavigationItem = {
  id: SettingsMenu;
  label: string;
  description: string;
};

const menus: SettingsNavigationItem[] = [
  {
    id: "regular",
    label: "通常授業設定",
    description: "曜日・授業ルール・時限",
  },
  {
    id: "courses",
    label: "講習設定",
    description: "春期・夏期・冬期講習",
  },
  {
    id: "classrooms",
    label: "教室設定",
    description: "授業で使用する教室",
  },
  {
    id: "academic-year",
    label: "年度更新",
    description: "新年度への更新処理",
  },
];

export default function SettingsNavigation({
  selectedMenu,
  onSelect,
}: Props) {
  return (
    <Card className="h-fit p-3">
      <div className="px-3 pb-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Settings
        </p>
      </div>

      <nav
        aria-label="設定メニュー"
        className="space-y-1"
      >
        {menus.map((menu) => {
          const isSelected =
            selectedMenu === menu.id;

          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => onSelect(menu.id)}
              aria-current={
                isSelected ? "page" : undefined
              }
              className={[
                "w-full rounded-xl px-4 py-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
                isSelected
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
              ].join(" ")}
            >
              <span className="block text-sm font-semibold">
                {menu.label}
              </span>

              <span
                className={[
                  "mt-1 block text-xs leading-5",
                  isSelected
                    ? "text-zinc-300"
                    : "text-zinc-500",
                ].join(" ")}
              >
                {menu.description}
              </span>
            </button>
          );
        })}
      </nav>
    </Card>
  );
}