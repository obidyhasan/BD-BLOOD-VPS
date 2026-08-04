"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { useGetOrganizationInventoryQuery } from "@/redux/features/inventory/inventoryApi";
import { Loader2 } from "lucide-react";

type BloodInventoryProps = {
  organizationId: string;
};

export const BloodInventory = ({ organizationId }: BloodInventoryProps) => {
  const { data, isLoading } = useGetOrganizationInventoryQuery(organizationId);

  const bloodGroups = (data?.data ?? []).map((row) => ({
    label: row.bloodGroup.groupName,
    count: row.availableUnits,
    available: row.availableUnits > 0,
  }));

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase">
            Blood <span className="text-primary">Inventory</span>
          </h3>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
            Real-time blood stock levels for this organization.
          </p>
        </div>
      </div>

      {bloodGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground font-medium px-2">No inventory data published yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
          {bloodGroups.map((group) => (
            <motion.div
              key={group.label}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <Card
                className={`shadow-none rounded-[2rem] border-dashed border-2 p-4 flex flex-col items-center justify-center gap-6 transition-all duration-500 overflow-hidden relative group ${group.available
                    ? "bg-white dark:bg-zinc-900 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-red-500/5 border-red-500/20 grayscale opacity-60"
                  }`}
              >
                <div
                  className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${group.available ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    }`}
                >
                  <h2 className="text-3xl font-black tracking-tighter ">{group.label}</h2>
                </div>

                <div className="space-y-1 text-center relative z-10">
                  <p className="text-[10px] font-black uppercase  opacity-40">Units</p>
                  <span
                    className={`text-xs font-black tracking-tighter ${group.available ? "text-emerald-500" : "text-red-500"
                      }`}
                  >
                    {group.available ? group.count : "Depleted"}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BloodInventory;
