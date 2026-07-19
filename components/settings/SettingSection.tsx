import Card from "@/components/common/Card";

import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function SettingSection({
  title,
  description,
  children,
  className = "",
}: Props) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-zinc-500">
              {description}
            </p>
          )}
        </div>

        {children}
      </div>
    </Card>
  );
}