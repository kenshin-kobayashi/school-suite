import Card from "@/components/common/Card";

import type { SettingsMenu } from "./SettingsPage";

type Props = {
  selectedMenu: SettingsMenu;
  onSelect: (menu: SettingsMenu) => void;
};

const menus: {
  id: SettingsMenu;
  label: string;
}[] = [
  {
    id: "regular",
    label: "通常授業設定",
  },
  {
    id: "courses",
    label: "講習設定",
  },
  {
    id: "classrooms",
    label: "教室設定",
  },
  {
    id: "academic-year",
    label: "年度更新",
  },
];

export default function SettingsNavigation({
  selectedMenu,
  onSelect,
}: Props) {
  return (
    <Card className="h-fit p-2">
      <nav className="space-y-1">
        {menus.map((menu) => {
          const isSelected =
            selectedMenu === menu.id;

          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => onSelect(menu.id)}
              className={[
                "flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors",
                isSelected
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >
              {menu.label}
            </button>
          );
        })}
      </nav>
    </Card>
  );
}